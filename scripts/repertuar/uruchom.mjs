// Pobiera repertuar kin studyjnych oraz wydarzenia dla dzieci (teatry, koncerty, domy kultury, biblioteki…),
// wybiera te dla dzieci i zapisuje data/repertuar.json.
// Uruchomienie: node scripts/repertuar/uruchom.mjs   (bez Claude API, bez logowania, 1 zapytanie/s,
// przed pobraniem czegokolwiek z serwisu czyta jego robots.txt)
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
import okn from './zrodla/okn.mjs';
import ludowy from './zrodla/ludowy.mjs';
import kultureska from './zrodla/kultureska.mjs';
import wspolczesny from './zrodla/wspolczesny.mjs';
import szczescie from './zrodla/szczescie.mjs';
import filharmonia from './zrodla/filharmonia.mjs';
import sinfonietta from './zrodla/sinfonietta.mjs';
import biblioteka from './zrodla/biblioteka.mjs';
import ckpodgorza from './zrodla/ckpodgorza.mjs';
import zis from './zrodla/zis.mjs';
import krakowPl from './zrodla/krakow-pl.mjs';
import tauronArena from './zrodla/tauron-arena.mjs';
import iceKrakow from './zrodla/ice-krakow.mjs';
import klubStudio from './zrodla/klub-studio.mjs';
import variete from './zrodla/variete.mjs';
import groteska from './zrodla/groteska.mjs';
import figurki from './zrodla/figurki.mjs';
import slowacki from './zrodla/slowacki.mjs';
import operaKrakowska from './zrodla/opera-krakowska.mjs';
import kbf from './zrodla/kbf.mjs';
import kfk from './zrodla/kfk.mjs';
import dworek from './zrodla/dworek.mjs';
import { naprawLinki } from './linki.mjs';
import { dopracujKategorie } from './kategorie.mjs';
import { idKin, idKinZCsv, wierszeMiejsc, wierszeZCsv, idMiejsca } from './miejsca.mjs';
import { wyjatkiZCsv, wyjatkiZArkusza, polaczWyjatki } from './wyjatki.mjs';

const ZRODLA_KIN = [kijow, mikro, agrafka, podBaranami, paradox, sfinks];
// Źródła wydarzeń (nie kina). Moduł z `wlaczone: false` jest gotowy, ale pomijany.
const ZRODLA_WYDARZEN = [okn, ludowy, kultureska, wspolczesny, szczescie, filharmonia, sinfonietta, biblioteka, ckpodgorza, zis, krakowPl, tauronArena, iceKrakow, klubStudio, variete, groteska, figurki, slowacki, operaKrakowska, kbf, kfk, dworek]
  .filter((z) => z.wlaczone !== false);
const WYPRZEDZENIE_DNI = { spektakl: 60, koncert: 180, widowisko: 180, domyslnie: 60 }; // jak daleko do przodu zapisujemy wydarzenia (źródło może mieć własne `wyprzedzenieDni`)
const KATALOG = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data');
const PLIK = process.env.REPERTUAR_PLIK || join(KATALOG, 'repertuar.json'); // REPERTUAR_PLIK: do prób, bez ruszania prawdziwego pliku
const WYJATKI = join(KATALOG, 'wyjatki.json');
const MIEJSCA_ZAPAS = join(KATALOG, 'miejsca-poprawione.csv'); // kopia arkusza „Miejsca" w repozytorium: zapas, gdy arkusz nie ma miejsca

const czytajJson = async (plik, domyslnie) => {
  try { return JSON.parse(await readFile(plik, 'utf8')); } catch (e) { return domyslnie; }
};
const naListe = (lista, tytul) => {
  const t = tytul.toLocaleLowerCase('pl');
  return (lista || []).some((x) => t.startsWith(String(x).toLocaleLowerCase('pl').trim()));
};
// Ostatni dzień wydarzenia z `data_regula` („2026-10-03" albo „2026-10-01 do 2026-10-05").
const koniecWydarzenia = (w) => (String(w.data_regula).match(/\d{4}-\d{2}-\d{2}/g) || ['']).pop();

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

const naWydarzenie = (zrodlo, s, idMiejsc = {}) => ({
  id: `${zrodlo.id}-${slugZ(s.miejsce)}-${slugZ(s.tytul)}-${s.data}T${s.godzina}`,
  typ: 'seans',
  kino: true,
  nazwa: s.wersja === 'dubbing' ? `${s.tytul} (dubbing)` : s.tytul,
  data_regula: s.data,
  godzina: s.godzina,
  miejsce: s.miejsce,
  powiazane_miejsce_id: idMiejsc[s.miejsce] || '',
  grupa_wiekowa: s.wiek || '', // tylko gdy źródło ją podaje
  cena: s.cena || '', // tylko gdy źródło ją podaje
  link_biletow: s.link || '',
  zrodlo: zrodlo.id,
  status: 'zatwierdzone',
});

const naWydarzenieInne = (zrodlo, s, idMiejsc = '') => ({
  id: `${zrodlo.id}-${slugZ(s.miejsce)}-${slugZ(s.tytul)}-${s.data}T${s.godzina}`,
  typ: s.typ || 'wydarzenie',
  kino: false,
  kategoria: dopracujKategorie(s.kategoria, s.tytul), // planszówki przed sportem, sport tylko przy sportowych słowach
  nazwa: s.tytul,
  data_regula: s.dataDo ? `${s.data} do ${s.dataDo}` : s.data,
  godzina: s.godzina,
  miejsce: s.miejsce,
  powiazane_miejsce_id: idMiejsc,
  grupa_wiekowa: s.wiek || '', // tylko gdy źródło ją podaje
  cena: s.cena || '', // tylko gdy źródło ją podaje
  link_biletow: s.link || '',
  zrodlo: zrodlo.id,
  status: 'zatwierdzone',
  ...(s.dlaGrup ? { dla_grup: true } : {}), // poranki dla szkół: zostają w pliku, strona ich nie pokazuje
  ...(s.kandydatBanera ? { kandydat_banera: true } : {}), // duże widowisko rodzinne: o banerze (`wyrozniony`) decyduje właścicielka
});

// wymus / ukryj: ogólne (kina i wszystkie źródła) oraz własne źródła (`zrodla.<id>`)
const wyjatkiZrodla = (wyjatki, id) => ({
  wymus: [...(wyjatki.wymus || []), ...(wyjatki.zrodla?.[id]?.wymus || [])],
  ukryj: [...(wyjatki.ukryj || []), ...(wyjatki.zrodla?.[id]?.ukryj || [])],
});

// true = dla dzieci, false = nie, null = nie wiadomo (trafia do `do_weryfikacji`)
export function ocenaDlaDzieci(s, wyjatki) {
  if (naListe(wyjatki.ukryj, s.tytul)) return false;
  if (naListe(wyjatki.wymus, s.tytul)) return true;
  return s.dlaDzieci === undefined ? null : s.dlaDzieci;
}

const doKiedy = (dzis, s, zrodlo = {}) => {
  const dni = zrodlo.wyprzedzenieDni || WYPRZEDZENIE_DNI[s.typ] || WYPRZEDZENIE_DNI.domyslnie;
  const d = new Date(`${dzis}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dni);
  return d.toISOString().slice(0, 10);
};

async function main() {
  const dzis = dzisWarszawa();
  const teraz = terazWarszawa();
  const poprzedni = await czytajJson(PLIK, { zrodla: {}, wydarzenia: [] });
  let wyjatki = await czytajJson(WYJATKI, { wymus: [], ukryj: [] });

  // Wyjątki z zakładki „Wyjątki" (SHEET_WYJATKI_CSV_URL) dochodzą do tych z pliku data/wyjatki.json. Błąd arkusza to tylko ostrzeżenie.
  try {
    let zArkusza = null;
    if (process.env.WYJATKI_PLIK) zArkusza = wyjatkiZCsv(await readFile(process.env.WYJATKI_PLIK, 'utf8')); // do prób: lokalny plik CSV zamiast arkusza
    else if (process.env.SHEET_WYJATKI_CSV_URL) zArkusza = await wyjatkiZArkusza(process.env.SHEET_WYJATKI_CSV_URL);
    if (zArkusza) {
      wyjatki = polaczWyjatki(wyjatki, zArkusza);
      const ile = zArkusza.wymus.length + zArkusza.ukryj.length + Object.values(zArkusza.zrodla).reduce((n, z) => n + z.wymus.length + z.ukryj.length, 0);
      console.log(`Wyjątki z arkusza: ${ile} wpisów.`);
      zArkusza.pominiete.forEach((o) => console.warn(`Uwaga: pominięto wyjątek z arkusza, ${o}.`));
    }
  } catch (e) {
    console.warn(`Uwaga: nie pobrano wyjątków z arkusza (${e.message}); działają tylko te z pliku data/wyjatki.json.`);
  }

  // place_id kin z arkusza „Miejsca" (SHEET_CSV_URL). Bez arkusza zostają wartości z poprzedniego pliku.
  const idMiejsc = {};
  for (const w of poprzedni.wydarzenia || []) if (w.powiazane_miejsce_id) idMiejsc[w.miejsce] = w.powiazane_miejsce_id;
  if (process.env.MIEJSCA_PLIK) { // do prób: lokalny plik CSV zamiast arkusza
    Object.assign(idMiejsc, idKinZCsv(await readFile(process.env.MIEJSCA_PLIK, 'utf8')));
  } else if (process.env.SHEET_CSV_URL) {
    try {
      Object.assign(idMiejsc, await idKin(process.env.SHEET_CSV_URL));
    } catch (e) {
      console.warn(`Uwaga: nie pobrano place_id kin z arkusza (${e.message}); zostają wartości z poprzedniego pliku.`);
    }
  } else {
    console.warn('Uwaga: brak SHEET_CSV_URL — powiazane_miejsce_id zostaje takie jak w poprzednim pliku (puste, jeśli go nie było).');
  }

  // wszystkie wiersze arkusza „Miejsca" (do powiazane_miejsce_id wydarzeń z innych źródeł)
  let wiersze = [];
  if (process.env.MIEJSCA_PLIK) { // do prób: lokalny plik CSV zamiast arkusza
    wiersze = wierszeZCsv(await readFile(process.env.MIEJSCA_PLIK, 'utf8'));
  } else if (process.env.SHEET_CSV_URL) {
    try { wiersze = await wierszeMiejsc(process.env.SHEET_CSV_URL); } catch (e) { console.warn(`Uwaga: nie pobrano arkusza „Miejsca" (${e.message}); powiazane_miejsce_id wydarzeń zostaje takie jak w poprzednim pliku.`); }
  }
  // Główne źródło to arkusz (SHEET_CSV_URL, ten sam co na stronie). Miejsca, których w nim nie ma, a są w pliku
  // data/miejsca-poprawione.csv (bez archiwum), dopasowujemy z pliku. Służy to tylko do powiazane_miejsce_id; wypisujemy,
  // które miejsca wzięto z zapasu, bo to znak, że arkusz w SHEET_CSV_URL jest nieaktualny albo niepełny.
  let zapas = [];
  try { zapas = wierszeZCsv(await readFile(MIEJSCA_ZAPAS, 'utf8')).filter((r) => r.sekcja !== 'archiwum'); } catch (e) { /* brak pliku = brak zapasu */ }
  const idArkusza = new Set(wiersze.map((r) => r.place_id));
  const zZapasu = new Map(zapas.filter((r) => !idArkusza.has(r.place_id)).map((r) => [r.place_id, r]));
  const wierszeArkusza = wiersze.length;
  wiersze = [...wiersze, ...zZapasu.values()];
  console.log(`Arkusz „Miejsca": ${wierszeArkusza} wierszy${wierszeArkusza === 0 ? ' (PUSTY albo nie pobrano — sprawdź SHEET_CSV_URL)' : ''}; plik zapasowy dokłada ${zZapasu.size} miejsc, których nie ma w arkuszu.`);
  const uzyteZZapasu = new Map(); // place_id → nazwa miejsca, które dopasowano dopiero z zapasu
  const brakMiejsc = new Map(); // „źródło: miejsce" → liczba wydarzeń bez place_id
  const miejsceId = (zrodlo, s) => {
    const z = idMiejsca(zrodlo, s, wiersze);
    if (z && zZapasu.has(z)) uzyteZZapasu.set(z, zZapasu.get(z).name);
    const id = z || idZPoprzedniego[`${zrodlo.id}|${s.miejsce}`] || '';
    if (!id) { const k = `${zrodlo.nazwa}: ${s.miejsce}`; brakMiejsc.set(k, (brakMiejsc.get(k) || 0) + 1); }
    return id;
  };
  const idZPoprzedniego = Object.fromEntries((poprzedni.wydarzenia || []).filter((w) => w.powiazane_miejsce_id).map((w) => [`${w.zrodlo}|${w.miejsce}`, w.powiazane_miejsce_id]));

  const zrodla = {};
  const wydarzenia = [];
  const bledy = [];
  const tabela = [];
  const tabelaInne = [];
  const doWeryfikacji = [];

  for (const zrodlo of ZRODLA_KIN) {
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
    const wybrane = seanse.filter((s) => dlaDzieci(s, wyjatki));
    // wiek ze strony filmu (jeśli źródło go tam podaje) i sprawdzenie linków tylko dla seansów, które zostają
    try { if (zrodlo.uzupelnij) await zrodlo.uzupelnij(wybrane); } catch (e) { console.warn(`${zrodlo.id}: nie uzupełniono danych seansów (${e.message})`); }
    const { zastapione, niesprawdzone, uwagi } = await naprawLinki(zrodlo, wybrane);
    uwagi.forEach((u) => console.log(`  link: ${u}`));
    if (niesprawdzone) console.warn(`  ${zrodlo.id}: ${niesprawdzone} linków nie udało się sprawdzić (zostają bez zmian)`);
    const dzieciece = wybrane.map((s) => naWydarzenie(zrodlo, s, idMiejsc));
    tabela.push({ kino: zrodlo.nazwa, seansow: dzieciece.length, zastapione, niesprawdzone });
    zrodla[zrodlo.id] = {
      nazwa: zrodlo.nazwa,
      url: zrodlo.url,
      ok: true,
      pobrano: teraz,
      wszystkich: seanse.length,
      dla_dzieci: dzieciece.length,
      linki_zastapione: zastapione,
    };
    wydarzenia.push(...dzieciece);
    console.log(`${zrodlo.id}: ${seanse.length} seansów, dla dzieci ${dzieciece.length}`);
  }

  // --- wydarzenia z pozostałych źródeł ---
  for (const zrodlo of ZRODLA_WYDARZEN) {
    const stare = poprzedni.zrodla?.[zrodlo.id] || {};
    const stareWydarzenia = (poprzedni.wydarzenia || []).filter((w) => w.zrodlo === zrodlo.id && koniecWydarzenia(w) >= dzis);
    const stareDoWeryfikacji = (poprzedni.do_weryfikacji || []).filter((w) => w.zrodlo === zrodlo.id && w.data >= dzis);
    let surowe = null;
    let blad = '';
    try {
      surowe = (await zrodlo.pobierz()).filter((s) => s.tytul && /^\d{4}-\d{2}-\d{2}$/.test(s.data) && (s.dataDo || s.data) >= dzis && s.data <= doKiedy(dzis, s, zrodlo));
    } catch (e) {
      blad = e.message;
    }
    if (!blad && surowe.length === 0 && (stare.wszystkich || 0) > 0 && !zrodlo.moznaPusto) blad = 'źródło zwróciło 0 wydarzeń, a wcześniej zwracało dane';
    if (blad) {
      // źródło z `lagodny: true`: awaria to ostrzeżenie (poprzednie dane zostają), workflow nie kończy się „failed"
      if (zrodlo.lagodny) console.warn(`::warning::${zrodlo.id}: ${blad} (poprzednie dane zostają)`);
      else bledy.push(`${zrodlo.id}: ${blad}`);
      // łagodny błąd nie ustawia `ok: false` (strona pokazuje ostrzeżenie o nieaktualnych danych dla każdego źródła z ok: false)
      zrodla[zrodlo.id] = { ...stare, nazwa: zrodlo.nazwa, url: zrodlo.url, rodzaj: 'wydarzenia', ...(zrodlo.lagodny ? { ostrzezenie: blad } : { ok: false, blad }), sprawdzono: teraz };
      wydarzenia.push(...stareWydarzenia);
      doWeryfikacji.push(...stareDoWeryfikacji);
      continue;
    }
    const wz = wyjatkiZrodla(wyjatki, zrodlo.id);
    const wybrane = [];
    let pominiete = 0;
    for (const s of surowe) {
      const ocena = ocenaDlaDzieci(s, wz);
      if (ocena === true) wybrane.push(s);
      else if (ocena === null) doWeryfikacji.push({ zrodlo: zrodlo.id, tytul: s.tytul, data: s.data, godzina: s.godzina, miejsce: s.miejsce, wiek: s.wiek || '', strona: s.strona || '' });
      else pominiete += 1;
    }
    // link biletów: sprawdzamy bez sesji; niedziałający (albo brak) zastępuje strona wydarzenia, a w ostateczności kalendarz źródła.
    // Poranki dla grup nie są nigdzie pokazywane, więc ich linków nie sprawdzamy.
    const dlaLudzi = wybrane.filter((s) => !s.dlaGrup);
    dlaLudzi.forEach((s) => { s.film = s.strona; });
    const { zastapione, niesprawdzone, uwagi } = await naprawLinki(zrodlo, dlaLudzi);
    uwagi.forEach((u) => console.log(`  link: ${u}`));
    if (niesprawdzone) console.warn(`  ${zrodlo.id}: ${niesprawdzone} linków nie udało się sprawdzić (zostają bez zmian)`);
    const gotowe = wybrane.map((s) => naWydarzenieInne(zrodlo, s, miejsceId(zrodlo, s)));
    const dlaGrup = gotowe.filter((w) => w.dla_grup).length;
    const wWeryfikacji = doWeryfikacji.filter((w) => w.zrodlo === zrodlo.id).length;
    tabelaInne.push({ źródło: zrodlo.nazwa, 'dla dzieci': gotowe.length - dlaGrup, 'dla grup (ukryte)': dlaGrup, 'do weryfikacji': wWeryfikacji, 'zastąpione linki': zastapione });
    zrodla[zrodlo.id] = {
      nazwa: zrodlo.nazwa,
      url: zrodlo.url,
      rodzaj: 'wydarzenia',
      ok: true,
      pobrano: teraz,
      wszystkich: surowe.length,
      dla_dzieci: gotowe.length - dlaGrup,
      dla_grup: dlaGrup,
      do_weryfikacji: wWeryfikacji,
      pominiete,
      linki_zastapione: zastapione,
    };
    wydarzenia.push(...gotowe);
    console.log(`${zrodlo.id}: ${surowe.length} wydarzeń, dla dzieci ${gotowe.length - dlaGrup} (+${dlaGrup} dla grup), do weryfikacji ${wWeryfikacji}`);
  }

  // duplikaty (ten sam film, kino i godzina), a dla wydarzeń z różnych źródeł: ten sam tytuł, dzień i miejsce
  // (zostaje wydarzenie ze źródła wcześniejszego na liście)
  const widziane = new Map();
  const bezDubli = [...new Map(wydarzenia.map((w) => [w.id, w])).values()].filter((w) => {
    const klucz = `${slugZ(w.miejsce)}|${slugZ(w.nazwa)}|${w.data_regula}`;
    const pierwsze = widziane.get(klucz);
    if (pierwsze && pierwsze !== w.zrodlo) return false;
    widziane.set(klucz, w.zrodlo);
    return true;
  });
  const unikalne = bezDubli
    .sort((a, b) => `${a.data_regula}${a.godzina}${a.miejsce}`.localeCompare(`${b.data_regula}${b.godzina}${b.miejsce}`));

  if (unikalne.length === 0 && (poprzedni.wydarzenia || []).length > 0) {
    console.error('Wynik jest pusty, a poprzedni plik miał dane. Nie zapisuję.');
    process.exit(1);
  }

  const weryfikacja = [...new Map(doWeryfikacji.map((w) => [`${w.zrodlo}|${w.tytul}`, w])).values()]
    .sort((a, b) => `${a.zrodlo}${a.tytul}`.localeCompare(`${b.zrodlo}${b.tytul}`, 'pl'));
  const wynik = { zaktualizowano: teraz, zrodla, wydarzenia: unikalne, do_weryfikacji: weryfikacja };
  // Lokalny przebieg z błędem źródła nie nadpisuje pliku (inaczej na stronie zostaje komunikat o niedziałającym odświeżeniu).
  // W GitHub Actions plik zapisujemy zawsze (źródło z błędem ma poprzednie dane i ok: false), lokalnie: ZAPISZ_MIMO_BLEDOW=1.
  if (bledy.length && !process.env.GITHUB_ACTIONS && !process.env.ZAPISZ_MIMO_BLEDOW && !process.env.REPERTUAR_PLIK) {
    console.error(`Błędy źródeł, więc nie zapisuję ${PLIK}:\n- ${bledy.join('\n- ')}\n(Wymuś zapis: ZAPISZ_MIMO_BLEDOW=1; do prób użyj REPERTUAR_PLIK=…)`);
    process.exit(1);
  }
  await mkdir(KATALOG, { recursive: true });
  await writeFile(PLIK, `${JSON.stringify(wynik, null, 2)}\n`);
  console.table(tabela.map((t) => ({ kino: t.kino, 'liczba seansów': t.seansow, 'zastąpione linki': t.zastapione, 'niesprawdzone linki': t.niesprawdzone })));
  if (tabelaInne.length) console.table(tabelaInne);
  console.log(`Zapisano ${unikalne.length} wydarzeń (seansów i innych) do data/repertuar.json; do weryfikacji: ${weryfikacja.length}`);
  const brakujaceMiejsca = [...brakMiejsc].map(([k, n]) => `${k} (${n})`).sort((a, b) => a.localeCompare(b, 'pl'));
  if (brakujaceMiejsca.length) console.log(`Miejsca bez place_id (źródło: miejsce, liczba wydarzeń):\n- ${brakujaceMiejsca.join('\n- ')}`);
  if (uzyteZZapasu.size) console.log(`Dopasowano z pliku zapasowego (brak w arkuszu „Miejsca" z SHEET_CSV_URL): ${[...uzyteZZapasu.values()].join(', ')}`);
  const kandydaci = [...new Set(unikalne.filter((w) => w.kandydat_banera).map((w) => `${w.nazwa} (${w.data_regula})`))];
  if (kandydaci.length) console.log(`Kandydaci na baner (decyduje właścicielka, kolumna wyrozniony): ${kandydaci.join('; ')}`);
  await podsumowanieGithub(tabela, tabelaInne, weryfikacja, brakujaceMiejsca, kandydaci, [...uzyteZZapasu.values()]);

  if (bledy.length) {
    console.error(`Błędy źródeł:\n- ${bledy.join('\n- ')}`);
    process.exit(1);
  }
}

// Podsumowanie w GitHub Actions (zakładka „Summary" uruchomienia): tabela źródeł i lista „do weryfikacji".
async function podsumowanieGithub(kina, inne, weryfikacja, brakujaceMiejsca = [], kandydaci = [], zZapasu = []) {
  if (!process.env.GITHUB_STEP_SUMMARY) return;
  const wiersz = (...k) => `| ${k.join(' | ')} |`;
  const linie = ['## Repertuar: wynik', ''];
  if (kina.length) linie.push('### Kina', wiersz('kino', 'seansów', 'zastąpione linki'), wiersz('---', '---', '---'), ...kina.map((t) => wiersz(t.kino, t.seansow, t.zastapione)), '');
  if (inne.length) linie.push('### Teatry, koncerty i inne wydarzenia', wiersz('źródło', 'dla dzieci', 'dla grup (ukryte)', 'do weryfikacji', 'zastąpione linki'), wiersz('---', '---', '---', '---', '---'), ...inne.map((t) => wiersz(t['źródło'], t['dla dzieci'], t['dla grup (ukryte)'], t['do weryfikacji'], t['zastąpione linki'])), '');
  if (weryfikacja.length) {
    linie.push('### Do weryfikacji (nie wiadomo, czy dla dzieci)', 'Jeśli tytuł jest dla dzieci, dopisz go do `wymus` w `data/wyjatki.json` (ogólnie albo w `zrodla.<źródło>`); jeśli nie, do `ukryj`.', '',
      wiersz('źródło', 'tytuł', 'pierwszy termin', 'wiek'), wiersz('---', '---', '---', '---'),
      ...[...new Map(weryfikacja.map((w) => [`${w.zrodlo}|${w.tytul}`, w])).values()].map((w) => wiersz(w.zrodlo, w.tytul, w.data, w.wiek || '—')), '');
  }
  if (brakujaceMiejsca.length) linie.push('### Miejsca bez place_id', 'Wydarzenia z tych miejsc nie mają `powiazane_miejsce_id` (źródło: miejsce, w nawiasie liczba wydarzeń). Dodaj miejsce do arkusza „Miejsca" (potem `uzupelnij-miejsca.mjs`):', '', ...brakujaceMiejsca.map((m) => `- ${m}`), '');
  if (zZapasu.length) linie.push('### Miejsca dopasowane z pliku zapasowego', 'Tych miejsc nie ma w arkuszu „Miejsca" z `SHEET_CSV_URL` (sekret repozytorium), a są w `data/miejsca-poprawione.csv`. Sprawdź, czy sekret wskazuje aktualny arkusz:', '', ...zZapasu.map((m) => `- ${m}`), '');
  if (kandydaci.length) linie.push('### Kandydaci na baner (duże widowiska rodzinne)', 'O banerze decyduje właścicielka: w arkuszu „Wydarzenia" wpisz `tak` w kolumnie `wyrozniony`.', '', ...kandydaci.map((k) => `- ${k}`), '');
  const { appendFile } = await import('node:fs/promises');
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `${linie.join('\n')}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
