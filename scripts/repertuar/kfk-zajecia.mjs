// Zajęcia stałe dla dzieci z Krakowskiego Forum Kultury → data/kfk-zajecia.csv
// (kolumny: nazwa, klub, adres, dzień_tygodnia, godzina, wiek, cena, link).
// Uruchomienie: node scripts/repertuar/kfk-zajecia.mjs [liczba_dni=56]
// To osobny plik do ręcznego wklejenia do arkusza: skrypt niczego nie zapisuje w arkuszu ani w data/miejsca-poprawione.csv
// i nie jest częścią cotygodniowego workflow. Zajęcia cykliczne rozpoznajemy w kalendarium: ta sama seria (numer w adresie
// wydarzenia) z 3 i więcej terminami, z wiekiem dolna granica < 12 lat albo słowami „dla dzieci", „Klub Rodziców" itp.
// Jedno zapytanie na sekundę, robots.txt sprawdzany przed pobraniem.
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';
import { pobierz, dzisWarszawa } from './wspolne.mjs';
import { pobierzTerminy, podziel, parsujSzczegoly, wiekZTytulu, nazwaMiejsca } from './zrodla/kfk.mjs';

const DNI_TYGODNIA = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];
const dzienTygodnia = (iso) => DNI_TYGODNIA[new Date(`${iso}T12:00:00Z`).getUTCDay()];
const PLIK = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data', 'kfk-zajecia.csv');

const dni = Number(process.argv[2]) || 56;
const terminy = await pobierzTerminy(dzisWarszawa(), dni, (t) => console.log(t));
const { serie } = podziel(terminy);

const wiersze = [];
for (const [, t] of serie) {
  const pierwszy = t[0];
  const s = parsujSzczegoly(await pobierz(pierwszy.adres, { robots: true }));
  const wiek = wiekZTytulu(`${pierwszy.tytul} ${pierwszy.podtytul}`);
  // grupy tej samej serii w różne dni tygodnia / o różnych godzinach to osobne wiersze
  const grupy = new Map();
  const ile = new Map();
  for (const x of t) { const k = `${dzienTygodnia(x.data)}|${x.godzina}`; grupy.set(k, x); ile.set(k, (ile.get(k) || 0) + 1); }
  for (const k of [...grupy.keys()]) if (ile.get(k) < 2) grupy.delete(k); // pojedyncze terminy w innym dniu to nie zajęcia stałe
  for (const [klucz, x] of grupy) {
    const [dzien, godz] = klucz.split('|');
    const koniec = (s.godzina.match(/(\d{1,2}:\d{2})\s*[—–-]\s*(\d{1,2}:\d{2})/) || []);
    wiersze.push({
      nazwa: pierwszy.tytul,
      klub: nazwaMiejsca(pierwszy.miejsce || s.organizator),
      adres: [s.ulica, s.kod].filter(Boolean).join(', '),
      'dzień_tygodnia': dzien,
      godzina: godz && koniec[1] === godz ? `${godz}–${koniec[2]}` : godz,
      wiek: wiek ? wiek.tekst : '',
      cena: s.cena,
      link: x.adres,
    });
  }
}
const kolejnosc = Object.fromEntries(DNI_TYGODNIA.map((d, i) => [d, (i + 6) % 7])); // poniedziałek pierwszy
wiersze.sort((a, b) => a.klub.localeCompare(b.klub, 'pl') || kolejnosc[a['dzień_tygodnia']] - kolejnosc[b['dzień_tygodnia']] || a.godzina.localeCompare(b.godzina) || a.nazwa.localeCompare(b.nazwa, 'pl'));
await mkdir(dirname(PLIK), { recursive: true });
await writeFile(PLIK, `${Papa.unparse(wiersze, { columns: ['nazwa', 'klub', 'adres', 'dzień_tygodnia', 'godzina', 'wiek', 'cena', 'link'] })}\n`);
console.log(`Zapisano ${wiersze.length} zajęć stałych (z ${serie.size} serii) do data/kfk-zajecia.csv`);
