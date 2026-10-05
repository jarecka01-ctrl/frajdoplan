// Uzupełnia `powiazane_miejsce_id` w data/repertuar.json z pliku CSV zakładki „Miejsca" (bez pobierania z sieci).
// Uruchomienie: node scripts/repertuar/uzupelnij-miejsca.mjs <plik.csv>
// Kina dopasowujemy po nazwie (miejsca.mjs → idKinZCsv), pozostałe źródła według `miejsca` / `dopasujMiejsce` w ich module.
// Wpisy, które już mają place_id, zostają bez zmian.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { idKinZCsv, wierszeZCsv, idMiejsca } from './miejsca.mjs';

const KATALOG = dirname(fileURLToPath(import.meta.url));
const PLIK = join(KATALOG, '..', '..', 'data', 'repertuar.json');
const csvPlik = process.argv[2];
if (!csvPlik) { console.error('Użycie: node scripts/repertuar/uzupelnij-miejsca.mjs <plik.csv>'); process.exit(1); }

const csv = await readFile(csvPlik, 'utf8');
const wiersze = wierszeZCsv(csv.replace(/^﻿/, ''));
const idKin = idKinZCsv(csv.replace(/^﻿/, ''));
const dane = JSON.parse(await readFile(PLIK, 'utf8'));
const moduly = {};
const modul = async (id) => (moduly[id] ??= (await import(`./zrodla/${id}.mjs`).catch(() => ({ default: {} }))).default);

const licznik = {};
for (const w of dane.wydarzenia) {
  if (w.powiazane_miejsce_id) continue;
  const id = w.kino ? idKin[w.miejsce] || '' : idMiejsca(await modul(w.zrodlo), { miejsce: w.miejsce, nazwa: w.nazwa }, wiersze);
  const klucz = `${w.zrodlo}${id ? '' : ' (bez dopasowania)'}`;
  licznik[klucz] = (licznik[klucz] || 0) + 1;
  if (id) w.powiazane_miejsce_id = id;
}
await writeFile(PLIK, `${JSON.stringify(dane, null, 2)}\n`);
console.table(Object.entries(licznik).map(([zrodlo, liczba]) => ({ zrodlo, liczba })));
