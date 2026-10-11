// Scalanie wydarzeń wpisanych ręcznie w arkuszu („Wydarzenia") z wydarzeniami, które pobrał skrypt (data/repertuar.json).
// To samo wydarzenie bywa w obu miejscach (np. koncert wpisany ręcznie, a potem pojawia się w kupbilecik.pl), a wtedy lista pokazywała
// je dwa razy, jedno z nich bez linku. Skrypt scala duplikaty tylko między własnymi źródłami, więc to robimy tutaj, przy budowie strony.
//
// Zasada: wiersz z arkusza ZOSTAJE (to ręcznie wpisane dane właścicielki: godziny, baner, obrazek, opis), a duplikat ze skryptu znika.
// Brakujący link, cenę i wiek wiersz z arkusza przejmuje z usuniętego duplikatu. Przeciwna strona (wiersz z arkusza ma już link) też
// jest duplikatem: zostaje jeden wiersz, ten z arkusza.
//
// Duplikat to wydarzenie ze skryptu, które spełnia WSZYSTKIE warunki:
//  1. ten sam, jeden dzień (zakresy dat i reguły typu „co sobotę" pomijamy);
//  2. podobne miejsce (równe po normalizacji albo jedno zawiera drugie: „Forum Horyzonty (do potwierdzenia)", „ICE Kraków Congress Centre"
//     i „ICE Kraków"; albo to samo powiązane miejsce z bazy);
//  3. podobna nazwa (znaczące słowa jednej zawierają się w drugiej: „Spoko Loko" i „Spoko Loko - koncert dla dzieci");
//  4. godzina z skryptu jest na liście godzin wiersza z arkusza (gdy któraś ze stron nie ma godzin, ten warunek pomijamy).
// Samo to samo miejsce i ta sama godzina, ale zupełnie inna nazwa, NIE wystarcza: wolimy pokazać dubel niż dopisać obce wydarzenie
// albo podpiąć link do innego spektaklu. Wydarzenia, które różnią się godziną, zostają oba (widać wtedy rozbieżność do poprawienia w arkuszu).

const bezOgonkow = (t) => String(t || '').toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[̀-ͯ]/g, '');
const POJEDYNCZY_DZIEN = /^\d{4}-\d{2}-\d{2}$/;

// Słowa, które niczego nie rozróżniają w nazwie wydarzenia.
const NIEZNACZACE = new Set(['dla', 'dzieci', 'dzieciom', 'na', 'w', 'z', 'ze', 'i', 'o', 'a', 'do', 'od', 'the', 'koncert', 'spektakl', 'widowisko', 'pokaz', 'warsztaty', 'rodzinny', 'rodzinne', 'lat', 'krakow']);

const zbiorSlow = (tekst, odfiltruj = false) => {
  const slowa = bezOgonkow(tekst).replace(/[^a-z0-9]+/g, ' ').split(' ').filter(Boolean);
  return new Set(odfiltruj ? slowa.filter((s) => !NIEZNACZACE.has(s) && !/^\d+$/.test(s)) : slowa);
};

// Znaczące słowa jednej nazwy zawierają się w drugiej (krótsza ma co najmniej jedno znaczące słowo).
export function podobneNazwy(a, b) {
  const x = zbiorSlow(a, true);
  const y = zbiorSlow(b, true);
  const [mniejszy, wiekszy] = x.size <= y.size ? [x, y] : [y, x];
  if (!mniejszy.size) return false;
  const wspolne = [...mniejszy].filter((s) => wiekszy.has(s)).length;
  return wspolne === mniejszy.size || (mniejszy.size >= 3 && wspolne / mniejszy.size >= 0.75);
}

// Miejsce: bez nawiasów („(do potwierdzenia)"), bez ogonków i znaków; równe albo jedno zawiera drugie (krótsze ma 2+ słowa albo 8+ znaków).
const nazwaMiejsca = (m) => bezOgonkow(String(m || '').replace(/\([^)]*\)/g, ' ')).replace(/[^a-z0-9]+/g, ' ').trim();
export function podobneMiejsca(a, b, idA, idB) {
  if (idA && idB && idA === idB) return true;
  const x = nazwaMiejsca(a);
  const y = nazwaMiejsca(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const [krotszy, dluzszy] = x.length <= y.length ? [x, y] : [y, x];
  if (krotszy.split(' ').length < 2 && krotszy.length < 8) return false;
  return ` ${dluzszy} `.includes(` ${krotszy} `);
}

// Godziny z tekstu („14:00, 16:00", „10:00–12:00") jako zbiór „HH:MM"; zakres liczymy jako godzinę startu.
export function godzinyZTekstu(tekst) {
  const t = String(tekst || '');
  const zakres = t.match(/^\s*(\d{1,2}:\d{2})\s*[–—-]\s*\d{1,2}:\d{2}\s*$/);
  const lista = zakres ? [zakres[1]] : t.match(/\d{1,2}:\d{2}/g) || [];
  return new Set(lista.map((g) => g.padStart(5, '0')));
}

const jedenDzien = (w) => (POJEDYNCZY_DZIEN.test(String(w.data_regula || '').trim()) ? String(w.data_regula).trim() : '');

// Czy `s` (ze skryptu) jest duplikatem `r` (z arkusza).
export function toSamoWydarzenie(r, s) {
  const dzien = jedenDzien(r);
  if (!dzien || dzien !== jedenDzien(s)) return false;
  if (!podobneMiejsca(r.miejsce, s.miejsce, r.miejsceId, s.miejsceId)) return false;
  if (!podobneNazwy(r.nazwa, s.nazwa)) return false;
  const gr = godzinyZTekstu(r.godzina);
  const gs = godzinyZTekstu(s.godzina);
  if (gr.size && gs.size && ![...gs].every((g) => gr.has(g))) return false;
  return true;
}

// `zArkusza` i `zeSkryptu`: wydarzenia w kształcie z lib/dane.js ({ id, nazwa, data_regula, godzina, miejsce, miejsceId, wiek, cena, link, kino }).
// Zwraca wszystkie wiersze z arkusza (uzupełnione) i te wiersze ze skryptu, które nie są ich duplikatami.
export function scalZArkuszem(zArkusza, zeSkryptu) {
  const usuniete = new Set();
  const uzupelnione = zArkusza.map((r) => {
    if (r.kino || !jedenDzien(r)) return r;
    const dubletyR = zeSkryptu.filter((s) => !s.kino && !usuniete.has(s) && toSamoWydarzenie(r, s));
    if (!dubletyR.length) return r;
    dubletyR.forEach((s) => usuniete.add(s));
    const pierwszy = [...dubletyR].sort((a, b) => String(a.godzina).localeCompare(String(b.godzina)))[0];
    const zLinkiem = dubletyR.find((s) => s.link);
    return {
      ...r,
      link: r.link || (zLinkiem ? zLinkiem.link : ''),
      cena: r.cena || pierwszy.cena || '',
      wiek: r.wiek || pierwszy.wiek || '',
    };
  });
  return [...uzupelnione, ...zeSkryptu.filter((s) => !usuniete.has(s))];
}
