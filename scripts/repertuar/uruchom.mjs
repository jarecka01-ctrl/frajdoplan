// Pobiera repertuar kin studyjnych, wybiera seanse dla dzieci i zapisuje data/repertuar.json.
// Uruchomienie: node scripts/repertuar/uruchom.mjs   (bez Claude API, bez logowania, 1 zapytanie/s)
// Kod wyjścia 1 = któreś źródło zawiodło (jego poprzednie dane zostają w pliku, ok: false).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dzisWarszawa, terazWarszawa, slugZ } from './wspolne.mjs';
import kijow from './zrodla/kijow.mjs';
import mikro from './zrodla/mikro.mjs';
import agrafka from './zrodla/agrafka.mjs';
import podBaranami from './zrodla/pod-baranami.mjs';
import paradox from './zrodla/paradox.mjs';
import sfinks from './zrodla/sfinks.mjs';

const ZRODLA = [kijow, mikro, agrafka, podBaranami, paradox, sfinks];
const KATALOG = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data');
const PLIK = join(KATALOG, 'repertuar.json');
const WYJATKI = join(KATALOG, 'wyjatki.json');

const czytajJson = async (plik, domyslnie) => {
  try { return JSON.parse(await readFile(plik, 'utf8')); } catch (e) { return domyslnie; }
};
const naListe = (lista, tytul) => {
  const t = tytul.toLocaleLowerCase('pl');
  return (lista || []).some((x) => t.startsWith(String(x).toLocaleLowerCase('pl').trim()));
};

// Wiek 0–7 („bez ograniczeń", „3+", „od 6 lat") — jeśli źródło go podaje.
const wiekDlaMalych = (wiek) => {
  const w = String(wiek || '').toLowerCase();
  if (!w) return false;
  if (/bez ogranicze|^b\.?o\.?$|^0\+?$/.test(w)) return true;
  const n = parseInt((w.match(/\d+/) || [])[0], 10);
  return Number.isFinite(n) && n <= 7;
};

export function dlaDzieci(s, wyjatki) {
  if (naListe(wyjatki.ukryj, s.tytul)) return false;
  if (naListe(wyjatki.wymus, s.tytul)) return true;
  return Boolean(s.dlaDzieci) || wiekDlaMalych(s.wiek) || /animac|animowan|familijn/i.test(s.gatunek || '');
}

const naWydarzenie = (zrodlo, s) => ({
  id: `${zrodlo.id}-${slugZ(s.miejsce)}-${slugZ(s.tytul)}-${s.data}T${s.godzina}`,
  typ: 'seans',
  kino: true,
  nazwa: s.wersja === 'dubbing' ? `${s.tytul} (dubbing)` : s.tytul,
  data_regula: s.data,
  godzina: s.godzina,
  miejsce: s.miejsce,
  powiazane_miejsce_id: '',
  grupa_wiekowa: s.wiek || '',
  cena: '',
  link_biletow: s.link || '',
  zrodlo: zrodlo.id,
  status: 'zatwierdzone',
});

async function main() {
  const dzis = dzisWarszawa();
  const teraz = terazWarszawa();
  const poprzedni = await czytajJson(PLIK, { zrodla: {}, wydarzenia: [] });
  const wyjatki = await czytajJson(WYJATKI, { wymus: [], ukryj: [] });

  const zrodla = {};
  const wydarzenia = [];
  const bledy = [];

  for (const zrodlo of ZRODLA) {
    const stare = poprzedni.zrodla?.[zrodlo.id] || {};
    const stareWydarzenia = (poprzedni.wydarzenia || []).filter((w) => w.zrodlo === zrodlo.id && w.data_regula >= dzis);
    let seanse = null;
    let blad = '';
    try {
      seanse = (await zrodlo.pobierz()).filter((s) => s.tytul && /^\d{4}-\d{2}-\d{2}$/.test(s.data) && s.data >= dzis);
    } catch (e) {
      blad = e.message;
    }
    // 0 seansów tam, gdzie wcześniej były, traktujemy jak awarię (zmiana strony, blokada).
    if (!blad && seanse.length === 0 && (stare.wszystkich || 0) > 0) blad = 'źródło zwróciło 0 seansów, a wcześniej zwracało dane';

    if (blad) {
      bledy.push(`${zrodlo.id}: ${blad}`);
      zrodla[zrodlo.id] = { ...stare, nazwa: zrodlo.nazwa, url: zrodlo.url, ok: false, blad, sprawdzono: teraz };
      wydarzenia.push(...stareWydarzenia); // zostaw poprzednie dane
      continue;
    }
    const dzieciece = seanse.filter((s) => dlaDzieci(s, wyjatki)).map((s) => naWydarzenie(zrodlo, s));
    zrodla[zrodlo.id] = {
      nazwa: zrodlo.nazwa,
      url: zrodlo.url,
      ok: true,
      pobrano: teraz,
      wszystkich: seanse.length,
      dla_dzieci: dzieciece.length,
    };
    wydarzenia.push(...dzieciece);
    console.log(`${zrodlo.id}: ${seanse.length} seansów, dla dzieci ${dzieciece.length}`);
  }

  // duplikaty (ten sam film, kino i godzina)
  const unikalne = [...new Map(wydarzenia.map((w) => [w.id, w])).values()]
    .sort((a, b) => `${a.data_regula}${a.godzina}${a.miejsce}`.localeCompare(`${b.data_regula}${b.godzina}${b.miejsce}`));

  if (unikalne.length === 0 && (poprzedni.wydarzenia || []).length > 0) {
    console.error('Wynik jest pusty, a poprzedni plik miał dane. Nie zapisuję.');
    process.exit(1);
  }

  const wynik = { zaktualizowano: teraz, zrodla, wydarzenia: unikalne };
  await mkdir(KATALOG, { recursive: true });
  await writeFile(PLIK, `${JSON.stringify(wynik, null, 2)}\n`);
  console.log(`Zapisano ${unikalne.length} seansów dla dzieci do data/repertuar.json`);

  if (bledy.length) {
    console.error(`Błędy źródeł:\n- ${bledy.join('\n- ')}`);
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
