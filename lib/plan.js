// „Mój plan": czysta logika (bez Reacta i bez przeglądarki), wspólna dla magazynu planu, panelu i późniejszych etapów.
// Plan jest zapisany tylko w przeglądarce użytkownika. W pozycjach trzymamy wyłącznie identyfikatory i dane użytkownika
// (dzień, godzina); treść (tytuł, godzina, adres, cena) pobieramy z aktualnych danych strony po ID, żeby nic się nie starzało.
import { trwaDnia } from './grupowanie';

export const KLUCZ_PLANU = 'frajdoplan.plan.v1';
export const MAKS_POZYCJI = 30;
export const MAKS_NAZWA = 60;
export const DOMYSLNA_NAZWA = 'Mój plan';
const ISO = /^\d{4}-\d{2}-\d{2}$/;

// Pozycja: { typ: 'wydarzenie' | 'miejsce', id, dzien?: 'RRRR-MM-DD', godz?: string }.
// Wydarzenie wyróżnia dzień (to samo wydarzenie „co sobotę" może być w planie w kilku dniach) i, gdy jedno wydarzenie w arkuszu ma kilka godzin
// w jednej komórce, wybrana godzina (`godz`, np. „12:00"); miejsce tylko ID (dzień to jego atrybut).
export const kluczPozycji = (p) => (p.typ === 'miejsce' ? `miejsce|${p.id}` : `wydarzenie|${p.id}|${p.dzien || ''}|${p.godz || ''}`);

const tekst = (v, maks) => (typeof v === 'string' ? v.slice(0, maks) : '');
const GODZ = /^\d{1,2}:\d{2}(\s*[–—-]\s*\d{1,2}:\d{2})?$/;

// Zawartość localStorage to dane z zewnątrz (stara wersja, ręczna edycja): odrzucamy wszystko, co nie ma poprawnego kształtu.
export function oczyscPlan(surowy) {
  const s = surowy && typeof surowy === 'object' ? surowy : {};
  const widziane = new Set();
  const pozycje = [];
  (Array.isArray(s.pozycje) ? s.pozycje : []).forEach((p) => {
    if (!p || typeof p !== 'object' || (p.typ !== 'wydarzenie' && p.typ !== 'miejsce')) return;
    const id = typeof p.id === 'string' || typeof p.id === 'number' ? String(p.id).slice(0, 200) : '';
    if (!id) return;
    const dzien = typeof p.dzien === 'string' && ISO.test(p.dzien) ? p.dzien : '';
    if (p.typ === 'wydarzenie' && !dzien) return; // bez dnia nie wiadomo, o który termin chodzi
    const poz = { typ: p.typ, id };
    if (dzien) poz.dzien = dzien;
    if (p.typ === 'wydarzenie' && typeof p.godz === 'string' && GODZ.test(p.godz.trim())) poz.godz = p.godz.trim();
    const klucz = kluczPozycji(poz);
    if (widziane.has(klucz) || pozycje.length >= MAKS_POZYCJI) return;
    widziane.add(klucz);
    pozycje.push(poz);
  });
  return { nazwa: tekst(s.nazwa, MAKS_NAZWA).trim() || DOMYSLNA_NAZWA, pozycje };
}

export const planPusty = (p) => !p.pozycje.length && p.nazwa === DOMYSLNA_NAZWA;

// ---- godziny ----

const naMinuty = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
export const GODZINA = /\d{1,2}:\d{2}/g;
export const pierwszaGodzina = (godzina) => (String(godzina || '').match(GODZINA) || [''])[0];

// Przedziały czasowe wydarzenia tylko do sprawdzania kolizji. Zakres „10:00–12:00" liczymy wprost, a samą godzinę startu
// jako 60 minut (to założenie służy wyłącznie do porównania i nie jest pokazywane użytkownikowi jako fakt).
export function przedzialy(godzina) {
  const t = String(godzina || '');
  const zakres = t.match(/(\d{1,2}:\d{2})\s*[–—-]\s*(\d{1,2}:\d{2})/);
  if (zakres && naMinuty(zakres[2]) > naMinuty(zakres[1])) return [{ od: naMinuty(zakres[1]), do: naMinuty(zakres[2]) }];
  return (t.match(GODZINA) || []).map((g) => ({ od: naMinuty(g), do: naMinuty(g) + 60 }));
}

// Kolizje w obrębie jednego dnia: [{ a, b }] dla par pozycji z godzinami, które się nakładają.
export function znajdzKolizje(elementy) {
  const poDniach = new Map();
  elementy.filter((e) => e.dzien && przedzialy(e.godzina).length).forEach((e) => {
    poDniach.set(e.dzien, [...(poDniach.get(e.dzien) || []), e]);
  });
  const pary = [];
  poDniach.forEach((lista) => {
    for (let i = 0; i < lista.length; i += 1) {
      for (let j = i + 1; j < lista.length; j += 1) {
        const nakladaja = przedzialy(lista[i].godzina).some((x) => przedzialy(lista[j].godzina).some((y) => x.od < y.do && y.od < x.do));
        if (nakladaja) pary.push({ a: lista[i], b: lista[j] });
      }
    }
  });
  return pary;
}

// ---- treść pozycji z aktualnych danych ----

// `dane`: { wydarzenia: Map(id → wydarzenie), miejsca: Map(id → miejsce) } z /api/plan-dane; `teraz`: { dzien: 'RRRR-MM-DD', godzina: 'GG:MM' }.
// status: 'ok' | 'odbylo' (wydarzenie już się zaczęło) | 'niedostepne' (nie ma go już w danych albo nie ma go w tym dniu)
// | 'zmieniono' (tylko dla pozycji z udostępnionego linku: dane różnią się od tych z chwili tworzenia linku).
export function rozwiazPozycje(poz, dane, teraz, odciskLinku = '') {
  const wynik = rozwiaz(poz, dane, teraz);
  // zmieniono: pozycja z udostępnionego linku ma inny odcisk (godzina, miejsce, tytuł) niż w aktualnych danych
  if (odciskLinku && wynik.status === 'ok' && odciskLinku !== odciskPozycji(wynik)) return { ...wynik, status: 'zmieniono' };
  return wynik;
}

function rozwiaz(poz, dane, teraz) {
  const klucz = kluczPozycji(poz);
  if (poz.typ === 'miejsce') {
    const m = dane.miejsca.get(poz.id);
    if (!m) return { poz, klucz, status: 'niedostepne', tytul: 'Miejsce' };
    return { poz, klucz, status: 'ok', tytul: m.nazwa, adres: m.adres || '', rodzaj: m.rodzaj || '', href: m.href || '', dzien: poz.dzien || '' };
  }
  const w = dane.wydarzenia.get(poz.id);
  const godzina = poz.godz || (w && w.godzina) || '';
  if (!w || !trwaDnia(w.data_regula, poz.dzien) || (poz.godz && !String(w.godzina || '').includes(poz.godz))) return { poz, klucz, status: 'niedostepne', tytul: w ? w.nazwa : 'Wydarzenie', dzien: poz.dzien };
  const starty = przedzialy(godzina).map((x) => x.od);
  const teraz_ = naMinuty(teraz.godzina);
  const odbylo = poz.dzien < teraz.dzien || (poz.dzien === teraz.dzien && starty.length > 0 && starty.every((s) => s <= teraz_));
  return {
    poz, klucz, status: odbylo ? 'odbylo' : 'ok', tytul: w.nazwa, godzina, miejsce: w.miejsce || '', wiek: w.wiek || '',
    cena: w.cena || '', href: w.link || '', dzien: poz.dzien, adres: ((w.miejsceId && dane.miejsca.get(w.miejsceId)) || {}).adres || '',
  };
}

// Grupy do panelu: dni od najwcześniejszego (w dniu: po godzinie, „cały dzień" i miejsca na końcu) i osobno pozycje bez dnia.
export function grupujPoDniach(rozwiazane) {
  const start = (r) => (r.godzina ? przedzialy(r.godzina)[0]?.od ?? 9999 : 9999);
  const poDniach = new Map();
  const bezDnia = [];
  rozwiazane.forEach((r) => {
    if (!r.dzien) { bezDnia.push(r); return; }
    poDniach.set(r.dzien, [...(poDniach.get(r.dzien) || []), r]);
  });
  const dni = [...poDniach.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dzien, pozycje]) => ({ dzien, pozycje: pozycje.sort((a, b) => start(a) - start(b)) }));
  return { dni, bezDnia };
}

// ---- udostępnianie planu linkiem (etap 2) ----

// Krótki odcisk treści pozycji (5 znaków), zapisywany w linku: pozwala wykryć, że od utworzenia linku zmieniła się godzina, miejsce albo tytuł.
export function odciskPozycji(r) {
  const tresc = r.poz.typ === 'miejsce' ? `${r.tytul}|${r.adres || ''}` : `${r.godzina || ''}|${r.miejsce || ''}|${r.tytul}`;
  let h = 5381;
  for (let i = 0; i < tresc.length; i += 1) h = ((h * 33) ^ tresc.charCodeAt(i)) >>> 0;
  return h.toString(36).slice(-5);
}

// Plan do zwartego obiektu w linku: { v, n: nazwa, d: dzień utworzenia, p: [[typ (0 wydarzenie, 1 miejsce), id, dzień, godz, odcisk], …] }.
export function planDoPayloadu(plan, odciski = {}, dzienUtworzenia = '') {
  return {
    v: 1,
    n: plan.nazwa,
    d: dzienUtworzenia,
    p: plan.pozycje.map((p) => [p.typ === 'miejsce' ? 1 : 0, p.id, p.dzien || '', p.godz || '', odciski[kluczPozycji(p)] || '']),
  };
}

// Obiekt z linku na { nazwa, utworzono, pozycje, odciski } albo null, gdy to nie jest plan. Dane z linku są z zewnątrz,
// więc przechodzą to samo czyszczenie co zapis w przeglądarce (poprawny kształt, limity długości i liczby pozycji).
export function payloadDoPlanu(obj) {
  if (!obj || typeof obj !== 'object' || obj.v !== 1 || !Array.isArray(obj.p)) return null;
  const odciski = {};
  const kandydaci = [];
  obj.p.slice(0, MAKS_POZYCJI * 2).forEach((w) => {
    if (!Array.isArray(w)) return;
    const poz = { typ: w[0] === 1 ? 'miejsce' : 'wydarzenie', id: w[1], dzien: w[2] || undefined, godz: w[3] || undefined };
    const czysta = oczyscPlan({ pozycje: [poz] }).pozycje[0];
    if (!czysta) return;
    kandydaci.push(czysta);
    if (typeof w[4] === 'string' && /^[0-9a-z]{1,8}$/.test(w[4])) odciski[kluczPozycji(czysta)] = w[4];
  });
  const plan = oczyscPlan({ nazwa: obj.n, pozycje: kandydaci });
  return {
    nazwa: plan.nazwa,
    utworzono: typeof obj.d === 'string' && ISO.test(obj.d) ? obj.d : '',
    pozycje: plan.pozycje,
    odciski,
  };
}
