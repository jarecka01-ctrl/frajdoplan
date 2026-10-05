// Przeklasyfikowuje wydarzenia (nie seanse kinowe) w data/repertuar.json według scripts/repertuar/kategorie.mjs
// i wypisuje tabelę: kategoria, liczba wydarzeń, pięć przykładowych tytułów.
// Uruchomienie: node scripts/repertuar/przeklasyfikuj.mjs   (nic nie pobiera z sieci)
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dopracujKategorie } from './kategorie.mjs';

const PLIK = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data', 'repertuar.json');
const dane = JSON.parse(await readFile(PLIK, 'utf8'));
let zmienione = 0;
const zmiany = [];
for (const w of dane.wydarzenia) {
  if (w.kino) continue;
  const nowa = dopracujKategorie(w.kategoria, w.nazwa);
  if (nowa !== w.kategoria) { zmiany.push(`${w.kategoria || '(brak)'} → ${nowa}: ${w.nazwa}`); w.kategoria = nowa; zmienione += 1; }
}
await writeFile(PLIK, `${JSON.stringify(dane, null, 2)}\n`);

const po = new Map();
for (const w of dane.wydarzenia.filter((x) => !x.kino)) {
  if (!po.has(w.kategoria)) po.set(w.kategoria, []);
  po.get(w.kategoria).push(w.nazwa);
}
console.log(`Zmieniono kategorię: ${zmienione}`);
[...new Set(zmiany)].forEach((z) => console.log(`  ${z}`));
console.table([...po].sort((a, b) => b[1].length - a[1].length).map(([k, t]) => ({ kategoria: k, liczba: t.length, przyklady: [...new Set(t)].slice(0, 5).join(' | ') })));
