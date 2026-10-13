// Wspólne dla kafelków „Najbliższe …" i stron /koncerty, /spektakle: łączenie terminów i daty.
// Bez zależności od Reacta, więc działa i na serwerze (getStaticProps), i w przeglądarce.

const DNI_SKROT = ['niedz.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.'];
const MIESIACE_MIANOWNIK = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
const DNI_TYG = [
  [/niedziel/, 0], [/poniedzia/, 1], [/wtor/, 2], [/środ|sród|srod/, 3],
  [/czwart/, 4], [/piąt|piat/, 5], [/sobot/, 6],
];

export const dzienTygodniaISO = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay();
export const plusDniISO = (iso, n) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// „2026-10-17" → „sob. 17.10"
export const krotkaData = (iso) => {
  const [, m, d] = iso.split('-').map(Number);
  return `${DNI_SKROT[dzienTygodniaISO(iso)]} ${d}.${String(m).padStart(2, '0')}`;
};

// To samo, ale „ndz." zamiast „niedz.": na ciasnych biletach (odcinek 70 px) data musi zmieścić się w jednej linii
export const krotkaDataBilet = (iso) => krotkaData(iso).replace('niedz.', 'ndz.');

// „2026-10-17" → „październik 2026" (klucz i nagłówek miesiąca na stronach list)
export const miesiacZDaty = (iso) => {
  const [r, m] = iso.split('-').map(Number);
  return { klucz: iso.slice(0, 7), nazwa: `${MIESIACE_MIANOWNIK[m - 1]} ${r}` };
};

// Czy `regula` z `data_regula` trwa danego dnia (jak trwaW w components/Wydarzenia.js, tu bez Reacta).
export function trwaDnia(regula, iso) {
  const r = String(regula || '').toLowerCase().trim();
  if (!r) return false;
  const daty = r.match(/\d{4}-\d{2}-\d{2}/g);
  if (daty && daty.length >= 2) return iso >= daty[0] && iso <= daty[1];
  if (daty && daty.length === 1) return iso === daty[0];
  if (/codziennie|każdego dnia|kazdego dnia/.test(r)) return true;
  const dz = dzienTygodniaISO(iso);
  return DNI_TYG.some(([wzor, nr]) => wzor.test(r) && nr === dz);
}

// Najbliższy dzień wydarzenia nie wcześniejszy niż `dzis`: dla daty i zakresu liczymy wprost, dla reguł
// („co sobotę") szukamy do 400 dni do przodu. Brak = wydarzenie już minęło.
export function najblizszyDzien(regula, dzis, maksDni = 400) {
  const daty = String(regula || '').match(/\d{4}-\d{2}-\d{2}/g);
  if (daty) {
    const od = daty[0];
    const doo = daty[1] || daty[0];
    if (doo < dzis) return '';
    return od > dzis ? od : dzis;
  }
  for (let i = 0; i <= maksDni; i += 1) {
    const d = plusDniISO(dzis, i);
    if (trwaDnia(regula, d)) return d;
  }
  return '';
}

// Wydarzenia o tym samym tytule, w tym samym dniu i miejscu → jeden wiersz z wieloma godzinami.
// Wejście: [{ id, nazwa, miejsce, dzien, godzina, link, wiek, cena }]; wynik posortowany po dniu i pierwszej godzinie.
export function grupujTerminy(zdarzenia) {
  const mapa = new Map();
  zdarzenia.forEach((z) => {
    const klucz = `${z.nazwa}|${z.miejsce || ''}|${z.dzien}`;
    const g = mapa.get(klucz) || { ...z, godziny: [] };
    if (z.godzina && !g.godziny.some((x) => x.godzina === z.godzina)) g.godziny.push({ godzina: z.godzina, link: z.link || '', id: z.id });
    if (!g.link && z.link) g.link = z.link;
    if (!g.wiek && z.wiek) g.wiek = z.wiek;
    if (!g.cena && z.cena) g.cena = z.cena;
    mapa.set(klucz, g);
  });
  return [...mapa.values()]
    .map((g) => ({ ...g, godziny: [...g.godziny].sort((a, b) => a.godzina.localeCompare(b.godzina)) }))
    .sort((a, b) => a.dzien.localeCompare(b.dzien) || ((a.godziny[0] || {}).godzina || '99').localeCompare((b.godziny[0] || {}).godzina || '99'));
}

// To samo wydarzenie (tytuł) w tym samym dniu w kilku miejscach (np. akcja w wielu filiach biblioteki) → jeden wiersz z listą lokalizacji.
// Wejście: wiersze po grupujTerminy z polami godz[], miejsce, miejsceId, adres, link, planId. Wiersz z jednym miejscem zostaje bez zmian.
// Wynik dla wielu miejsc: pierwszy wiersz bez miejsca i linku + `lokalizacje` [{ miejsce, nazwaMiejsca, miejsceId, adres, link, godz, planId }],
// `wspolneMiejsce` (np. „Biblioteka Kraków", gdy wszystkie miejsca zaczynają się tak samo) i `godz` = suma godzin ze wszystkich miejsc.
export function scalLokalizacje(wiersze) {
  const klucz = (w) => `${w.nazwa}|${w.dzien}`;
  const grupy = new Map();
  wiersze.forEach((w) => { const k = klucz(w); grupy.set(k, [...(grupy.get(k) || []), w]); });
  const wynik = [];
  const zrobione = new Set();
  wiersze.forEach((w) => {
    const k = klucz(w);
    if (zrobione.has(k)) return;
    zrobione.add(k);
    const g = grupy.get(k);
    if (new Set(g.map((x) => x.miejsce || '')).size < 2) { wynik.push(...g); return; }
    const czesci = g.map((x) => String(x.miejsce || '').split(', '));
    const wspolne = czesci.every((c) => c.length > 1 && c[0] === czesci[0][0]) ? czesci[0][0] : '';
    const lokalizacje = g.map((x) => ({
      miejsce: x.miejsce || '',
      nazwaMiejsca: wspolne ? String(x.miejsce).slice(wspolne.length + 2) : (x.miejsce || ''),
      miejsceId: x.miejsceId || '',
      adres: x.adres || '',
      link: x.link || '',
      godz: x.godz || [],
      planId: x.planId,
    })).sort((a, b) => a.nazwaMiejsca.localeCompare(b.nazwaMiejsca, 'pl', { numeric: true }));
    const pierwszy = g[0];
    wynik.push({
      ...pierwszy,
      miejsce: '', miejsceId: '', adres: '', link: '',
      godz: [...new Set(lokalizacje.flatMap((l) => l.godz))].sort(),
      wiek: (g.find((x) => x.wiek) || {}).wiek || '',
      cena: (g.find((x) => x.cena) || {}).cena || '',
      lokalizacje,
      wspolneMiejsce: wspolne,
    });
  });
  return wynik;
}
