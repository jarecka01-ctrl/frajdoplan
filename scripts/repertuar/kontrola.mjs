// Kontrola danych: tabela źródeł z data/repertuar.json (liczba wydarzeń dla dzieci na 60 i 180 dni, ukryte poranki
// dla grup, „do weryfikacji", wydarzenia bez powiazane_miejsce_id) i lista źródeł, które zwracają 0 mimo wcześniejszych wyników.
// Uruchomienie: node scripts/repertuar/kontrola.mjs [poprzedni-plik.json]   (poprzedni plik: do porównania „0 mimo wcześniejszych")
// Format wyjścia: tabela Markdown (do wklejenia do raportu).
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dzisWarszawa, plusDni } from './wspolne.mjs';

const KATALOG = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data');
const plik = process.env.REPERTUAR_PLIK || join(KATALOG, 'repertuar.json');
const dane = JSON.parse(await readFile(plik, 'utf8'));
const poprzedni = process.argv[2] ? JSON.parse(await readFile(process.argv[2], 'utf8')) : null;
const dzis = dzisWarszawa();

// pierwszy i ostatni dzień wydarzenia z `data_regula` (reguły typu „co sobotę" liczymy jak jedno wydarzenie od dziś)
const zakres = (w) => {
  const daty = String(w.data_regula).match(/\d{4}-\d{2}-\d{2}/g);
  return daty ? [daty[0], daty[daty.length - 1]] : [dzis, dzis];
};
const wOknie = (w, dni) => { const [od, doo] = zakres(w); return doo >= dzis && od <= plusDni(dzis, dni); };

const zrodla = Object.entries(dane.zrodla);
const wiersze = zrodla.map(([id, z]) => {
  const swoje = dane.wydarzenia.filter((w) => w.zrodlo === id);
  const publiczne = swoje.filter((w) => !w.dla_grup);
  const ukryte = swoje.filter((w) => w.dla_grup);
  const wer = (dane.do_weryfikacji || []).filter((w) => w.zrodlo === id);
  return {
    id,
    nazwa: z.nazwa,
    ok: z.ok !== false,
    dni60: publiczne.filter((w) => wOknie(w, 60)).length,
    dni180: publiczne.filter((w) => wOknie(w, 180)).length,
    ukryte: ukryte.filter((w) => wOknie(w, 180)).length,
    weryfikacja: new Set(wer.map((w) => w.tytul)).size,
    bezMiejsca: publiczne.filter((w) => !w.powiazane_miejsce_id).length,
    razem: publiczne.length,
  };
});

// źródła, które zwracają 0 dla dzieci, choć wcześniej (w poprzednim pliku) miały wyniki albo błąd
const zero = wiersze.filter((w) => {
  const stare = poprzedni?.zrodla?.[w.id];
  return (w.razem === 0 && (stare?.dla_dzieci || 0) > 0) || !w.ok;
});

const wiersz = (...k) => `| ${k.join(' | ')} |`;
console.log(`Kontrola danych z dnia ${dzis} (plik zaktualizowany ${dane.zaktualizowano})\n`);
console.log(wiersz('źródło', 'dla dzieci 60 dni', 'dla dzieci 180 dni', 'ukryte (poranki dla grup)', 'do weryfikacji (tytuły)', 'bez powiazane_miejsce_id', 'status'));
console.log(wiersz('---', '---:', '---:', '---:', '---:', '---:', '---'));
for (const w of wiersze) console.log(wiersz(w.nazwa, w.dni60, w.dni180, w.ukryte, w.weryfikacja, w.bezMiejsca, w.ok ? 'ok' : 'BŁĄD (stare dane)'));
const suma = (k) => wiersze.reduce((s, w) => s + w[k], 0);
console.log(wiersz('**razem**', suma('dni60'), suma('dni180'), suma('ukryte'), suma('weryfikacja'), suma('bezMiejsca'), ''));
console.log(`\nŹródła z 0 wydarzeń dla dzieci mimo wcześniejszych wyników albo z błędem: ${zero.length ? zero.map((w) => `${w.nazwa}${w.ok ? '' : ' (błąd)'}`).join(', ') : 'brak'}`);
