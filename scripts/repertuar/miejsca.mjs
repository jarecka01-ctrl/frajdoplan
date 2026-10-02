// place_id kin z arkusza „Miejsca" (CSV pod adresem SHEET_CSV_URL, podkategoria „Kino").
// Kino dopasowujemy po nazwie; Kino Mikro i Kino Mikro Bronowice to różne miejsca.
import Papa from 'papaparse';

const KINA = [
  ['Kino Mikro Bronowice', /mikro.*bronowic|bronowic.*mikro/i],
  ['Kino Mikro', /\bmikro\b/i, /bronowic/i],
  ['Kino Kijów', /kij[oó]w/i],
  ['Kino Agrafka', /agrafk/i],
  ['Kino Pod Baranami', /pod baranami/i],
  ['Kino Paradox', /paradox/i],
  ['Kino Sfinks', /sfinks/i],
];

// Zwraca { 'Kino Kijów': place_id, … } (tylko znalezione kina).
export async function idKin(adresCsv) {
  const res = await fetch(adresCsv, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`Arkusz Miejsca: HTTP ${res.status}`);
  return idKinZCsv(await res.text());
}

export function idKinZCsv(csv) {
  const wiersze = Papa.parse(csv, { header: true, skipEmptyLines: true }).data
    .filter((r) => r.place_id && r.name && r.podkategoria === 'Kino');
  const wynik = {};
  for (const [nazwa, wzor, wyklucz] of KINA) {
    const trafione = wiersze
      .filter((r) => wzor.test(r.name) && !(wyklucz && wyklucz.test(r.name)))
      .sort((a, b) => (parseFloat(b.reviews) || 0) - (parseFloat(a.reviews) || 0));
    if (trafione[0]) wynik[nazwa] = trafione[0].place_id;
  }
  return wynik;
}
