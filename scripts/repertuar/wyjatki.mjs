// Wyjątki „zawsze pokaż / zawsze ukryj" z zakładki „Wyjątki" w Arkuszu Google (CSV pod adresem SHEET_WYJATKI_CSV_URL),
// łączone z plikiem data/wyjatki.json (plik zostaje jako zapas i dla wpisów, których nie ma w arkuszu).
// Kolumny zakładki: tytul (początek tytułu, wielkość liter bez znaczenia), akcja (pokaż / ukryj),
// zrodlo (puste = wszystkie źródła, albo id źródła, np. ludowy, filharmonia), uwaga (notatka, nie jest czytana).
import Papa from 'papaparse';

const bezOgonkow = (t) => String(t || '').trim().toLocaleLowerCase('pl').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');
const AKCJE = { pokaz: 'wymus', wymus: 'wymus', ukryj: 'ukryj' };

// Zwraca { wymus: [], ukryj: [], zrodla: { id: { wymus: [], ukryj: [] } }, pominiete: [opis…] }.
export function wyjatkiZCsv(csv) {
  const wynik = { wymus: [], ukryj: [], zrodla: {}, pominiete: [] };
  const wiersze = Papa.parse(csv, { header: true, skipEmptyLines: true, transformHeader: bezOgonkow }).data;
  wiersze.forEach((r, i) => {
    const tytul = String(r.tytul || '').trim();
    const akcja = AKCJE[bezOgonkow(r.akcja)];
    if (!tytul && !r.akcja) return; // pusty wiersz
    if (!tytul || !akcja) { wynik.pominiete.push(`wiersz ${i + 2}: „${tytul}" / „${r.akcja || ''}" (potrzebny tytuł i akcja pokaż albo ukryj)`); return; }
    const zrodlo = bezOgonkow(r.zrodlo);
    const cel = zrodlo ? (wynik.zrodla[zrodlo] = wynik.zrodla[zrodlo] || { wymus: [], ukryj: [] }) : wynik;
    cel[akcja].push(tytul);
  });
  return wynik;
}

// Scala wyjątki z pliku i z arkusza (sumuje listy, bez powtórzeń); wpisy `_opis`, `_uwaga` itp. z pliku zostają.
export function polaczWyjatki(plik, arkusz) {
  const suma = (a = [], b = []) => [...new Set([...a, ...b])];
  const wynik = { ...plik, wymus: suma(plik.wymus, arkusz.wymus), ukryj: suma(plik.ukryj, arkusz.ukryj), zrodla: { ...(plik.zrodla || {}) } };
  for (const [id, w] of Object.entries(arkusz.zrodla)) {
    const stare = wynik.zrodla[id] || {};
    wynik.zrodla[id] = { ...stare, wymus: suma(stare.wymus, w.wymus), ukryj: suma(stare.ukryj, w.ukryj) };
  }
  return wynik;
}

export async function wyjatkiZArkusza(adresCsv) {
  const res = await fetch(adresCsv, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`Arkusz Wyjątki: HTTP ${res.status}`);
  return wyjatkiZCsv(await res.text());
}
