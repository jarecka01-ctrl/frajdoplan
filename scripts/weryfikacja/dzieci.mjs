// Sprawdza, czy miejsca z arkusza „Miejsca" (flaga „do weryfikacji (dzieci?)") prowadzą zajęcia dla dzieci.
// Uruchomienie: node scripts/weryfikacja/dzieci.mjs <plik.csv> [--dyscyplina=Taniec] [--wynik=docs/weryfikacja-dzieci.csv]
//   bez --dyscyplina bierze wszystkie wiersze z flagą (z pominięciem sekcji „archiwum"); wiersze już obecne w pliku wyniku
//   (ten sam place_id) są nadpisywane, pozostałe zostają.
// Zasady: najpierw robots.txt (zakaz albo błąd = „nie sprawdzono"), strona główna + maks. 6 podstron z tej samej domeny
// (oferta, zajęcia, grupy, dzieci, dorośli, kursy, cennik, grafik, kontakt, o nas), 1 zapytanie na sekundę, bez logowania,
// bez Facebooka i Instagrama, bez ponawiania po błędzie (błąd techniczny = „nie sprawdzono"). Bez Claude API: sygnały to
// proste wyrażenia w tekście strony. Do raportu trafiają tylko krótkie własne opisy, nie cytaty.
// WERYFIKACJA_CACHE=<katalog>: zapisuje teksty pobranych stron, żeby zmieniać reguły bez ponownego pobierania.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import Papa from 'papaparse';
import * as cheerio from 'cheerio';
import { USER_AGENT, spacje, reguly, dozwolone } from '../repertuar/wspolne.mjs';

const MAKS_PODSTRON = 6;
const SLOWA_PODSTRON = /oferta|zaj[eę]cia|zajecia|grup[ay]|dzieci|dla-?doros|doros[łl]|kursy|cennik|grafik|kontakt|o[-_ ]?nas|o[-_ ]?klubie|klub|sekcj|trening|akademi|szk[óo][łl]k|junior|m[łl]odzie|harmonogram|plan[-_ ]zaj/i;
const POMIN_ADRES = /\.(pdf|jpe?g|png|gif|webp|zip|docx?|xlsx?)(\?|$)|^(mailto|tel|javascript):|\/(wp-admin|login|koszyk|cart|regulamin|polityka|rodo|cookies)/i;
const SPOLECZNOSCIOWE = /(^|\.)(facebook|instagram|fb|tiktok|youtube|linktr)\./i;

// --- sygnały w tekście strony (małymi literami) ---
// Mocne: wyraźna oferta dla dzieci. „junior" i „akademia" bez wieku są za słabe na „tak" (patrz ocen).
const MOCNE = [
  ['dla dzieci', /(?<![\p{L}])dla\s+dzieci(?![\p{L}])|(?<![\p{L}])dzieciom(?![\p{L}])/u],
  ['grupa dziecięca', /grup[ayę]\s+dzieci[ęe]c|zaj[eę]cia\s+dzieci[ęe]c|dzieci[ęe]ce\s+(grup|zaj|kurs)|kurs\s+dla\s+dzieci|sekcj\w*\s+dzieci[ęe]c/],
  ['dzieci od N lat', /dzieci\s+(?:w\s+wieku\s+)?od\s+\d{1,2}/],
  ['kids', /(?<![\p{L}])kids(?![\p{L}])|(?<![\p{L}])baby(?![\p{L}])/u],
  ['maluchy', /malucz|(?<![\p{L}])maluch|maluszk/u],
  ['przedszkolaki', /przedszkol/],
  ['dzieci i młodzież', /dzieci\s+i\s+m[łl]odzie[żz]|m[łl]odzie[żz]\s+i\s+dzieci/],
  // kategorie wiekowe w sporcie
  ['żak / orlik / trampkarz / młodzik', /(?<![\p{L}])(żak|żaki|żaków|żacy|orlik|orliki|orlików|trampkarz|trampkarze|trampkarzy|młodzik|młodzicy|młodzików)(?![\p{L}])/u],
  ['junior młodszy', /junior(?:zy|ów)?\s+m[łl]odsz/],
  ['sekcja / grupy młodzieżowe', /sekcj\w*\s+m[łl]odzie[żz]|grup\w*\s+m[łl]odzie[żz]|zespo[łl]\w*\s+m[łl]odzie[żz]owe|m[łl]odzie[żz]owe\s+(grup|zespo|dru[żz]yn)/],
  ['kategorie U-8…U-19', /(?<![\p{L}\d])u[-\s]?(?:8|9|1[0-9])(?![\p{L}\d])/u],
  ['szkółka', /szk[óo][łl](?:k|ce|ek|ka|ki)/],
  ['mini (grupa)', /(?<![\p{L}])mini[-\s]+(?:grup|akadem|pi[łl]k|zaj|trening|liga|[żz]ak|turniej|kids)/u],
  ['mali (zawodnicy)', /(?<![\p{L}])mali\s+(?:zawodnic|pi[łl]karz|sportow|mistrz|adept|wojown|ninja|taneczn)/u],
];
// „junior" i „akademia" liczymy osobno: bez podanego wieku dają tylko „prawdopodobnie".
const POMOCNICZE = [
  ['junior', /(?<![\p{L}])junior/u],
  ['akademia', /(?<![\p{L}])akademi/u],
];
// Słabe: może dotyczyć dzieci, ale nic nie przesądza. Pierwsze trzy blokują „tylko dorośli".
const SLABE = [
  ['dzieci', /(?<![\p{L}])dzieci(?![\p{L}])|(?<![\p{L}])dziecko(?![\p{L}])/u],
  ['młodzież', /m[łl]odzie[żz]/],
  ['nastolatki', /nastolat/],
  ['uczniowie', /uczni(?:ow|ó)w|szkoln/],
  ['rodzice', /rodzic/],
];
const SLABE_DZIECIECE = new Set(['dzieci', 'młodzież', 'nastolatki']);
// Wyraźne sygnały dorosłych (sam „kurs dla par" to za mało: bywa obok oferty dla dzieci).
const DOROSLI_WYRAZNE = [
  ['pierwszy taniec', /pierwszy\s+taniec|taniec\s+weselny/],
  ['ślub / wesele', /ślub|wesel/],
  ['18+', /(?<![\d])18\s*\+|powyżej\s+18|pe[łl]noletni/],
  ['dla dorosłych', /(?<![\p{L}])dla\s+doros[łl]ych|kursy?\s+dla\s+doros/u],
  ['liga amatorska', /liga\s+amatorsk|amatorsk\w+\s+lig/],
  ['seniorzy', /(?<![\p{L}])senior/u],
];
const DOROSLI_SLABE = [['kurs dla par', /kurs(?:y)?\s+dla\s+par|(?<![\p{L}])dla\s+par(?![\p{L}])/u]];
const WYLACZNIE_DOROSLI = /(tylko|wy[łl][aą]cznie|jedynie)\s+(?:dla\s+)?doros[łl]|nie\s+(?:prowadzimy|organizujemy|mamy|oferujemy)[^.]{0,50}dzieci|bez\s+dzieci/;

export const tekstStrony = (html) => {
  const $ = cheerio.load(html);
  $('script, style, noscript, svg, iframe').remove();
  return spacje($('body').text() || $.root().text()).toLowerCase();
};

// Wiek („od 4 lat", „3-6 lat", „dzieci od 5", „U-10") — tylko wartości dziecięce (do 14 lat).
export function wiekZTekstu(tekst) {
  const znalezione = [];
  for (const m of tekst.matchAll(/(?:od|dzieci\s+od|dla\s+dzieci\s+od)\s+(\d{1,2})\s*(?:lat|r\.?\s*ż|roku\s+życia|latek)/g)) znalezione.push({ od: Number(m[1]), tekst: `od ${m[1]} lat` });
  for (const m of tekst.matchAll(/(\d{1,2})\s*[-–]\s*(\d{1,2})\s*(?:lat|latek|r\.?\s*ż)/g)) znalezione.push({ od: Number(m[1]), tekst: `${m[1]}–${m[2]} lat` });
  for (const m of tekst.matchAll(/dzieci\s+od\s+(\d{1,2})(?!\d)/g)) znalezione.push({ od: Number(m[1]), tekst: `od ${m[1]} lat` });
  for (const m of tekst.matchAll(/(?<![\p{L}\d])u[-\s]?(\d{1,2})(?![\p{L}\d])/gu)) if (Number(m[1]) >= 8 && Number(m[1]) <= 14) znalezione.push({ od: Number(m[1]), tekst: `U-${m[1]}` });
  const dzieciece = znalezione.filter((z) => z.od >= 1 && z.od <= 14);
  dzieciece.sort((a, b) => a.od - b.od);
  return dzieciece[0] ? dzieciece[0].tekst : '';
}

const trafienia = (lista, tekst) => lista.filter(([, wzor]) => wzor.test(tekst)).map(([nazwa]) => nazwa);

// Ocena z tekstów kilku stron: [{ adres, tekst }] → { wynik, wiek, dowod, adres }
export function ocen(strony) {
  const w = strony.map((s) => ({
    ...s,
    mocne: trafienia(MOCNE, s.tekst),
    pomocnicze: trafienia(POMOCNICZE, s.tekst),
    slabe: trafienia(SLABE, s.tekst),
    dorosli: trafienia(DOROSLI_WYRAZNE, s.tekst),
    dorosliSlabe: trafienia(DOROSLI_SLABE, s.tekst),
    wylacznie: WYLACZNIE_DOROSLI.test(s.tekst),
    wiek: wiekZTekstu(s.tekst),
  }));
  const uniq = (klucz) => [...new Set(w.flatMap((s) => s[klucz]))];
  const mocne = uniq('mocne');
  const pomocnicze = uniq('pomocnicze');
  const slabe = uniq('slabe');
  const dorosli = uniq('dorosli');
  const wiek = w.map((s) => s.wiek).filter(Boolean).sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10))[0] || '';
  const adres = (warunek) => (w.find(warunek) || w[0] || {}).adres || '';
  const dziecieceSlabe = slabe.filter((x) => SLABE_DZIECIECE.has(x));
  const jakiekolwiekDzieci = Boolean(mocne.length || pomocnicze.length || wiek || dziecieceSlabe.length);

  if (w.some((s) => s.wylacznie) && !wiek && !mocne.length) {
    return { wynik: 'tylko dorośli', wiek: '', dowod: 'strona mówi, że zajęcia są wyłącznie dla dorosłych', adres: adres((s) => s.wylacznie) };
  }
  if (mocne.length) {
    const opis = [wiek ? `podany wiek ${wiek}` : '', `sygnały: ${mocne.slice(0, 3).join(', ')}`].filter(Boolean).join('; ');
    return { wynik: 'tak', wiek, dowod: `${opis}${dorosli.length ? ' (oferta także dla dorosłych)' : ''}`, adres: adres((s) => s.mocne.length) };
  }
  // samo „junior" / „akademia" bez wyraźnego „dla dzieci" (nawet z wiekiem) to tylko „prawdopodobnie"
  if (pomocnicze.length) {
    return { wynik: 'prawdopodobnie', wiek, dowod: `${wiek ? `podany wiek ${wiek}; ` : ''}tylko słowa: ${pomocnicze.join(', ')}, bez „dla dzieci”`, adres: adres((s) => s.pomocnicze.length) };
  }
  if (wiek) return { wynik: 'prawdopodobnie', wiek, dowod: `podany wiek ${wiek}, bez wyraźnego „dla dzieci”`, adres: adres((s) => s.wiek) };
  if (dziecieceSlabe.length) {
    if (dorosli.length) return { wynik: 'nie wiadomo', wiek: '', dowod: `wzmianki (${dziecieceSlabe.slice(0, 2).join(', ')}) obok oferty dla dorosłych (${dorosli.slice(0, 2).join(', ')})`, adres: adres((s) => s.slabe.length) };
    return { wynik: 'prawdopodobnie', wiek: '', dowod: `tylko wzmianki: ${dziecieceSlabe.slice(0, 3).join(', ')}`, adres: adres((s) => s.slabe.some((x) => SLABE_DZIECIECE.has(x))) };
  }
  // do „tylko dorośli" trzeba wyraźnego sygnału dorosłych i braku jakichkolwiek sygnałów dla dzieci na wszystkich stronach
  if (dorosli.length && !jakiekolwiekDzieci) {
    return { wynik: 'tylko dorośli', wiek: '', dowod: `wyraźne sygnały dorosłych: ${dorosli.slice(0, 3).join(', ')}; o dzieciach ani słowa`, adres: adres((s) => s.dorosli.length) };
  }
  const drobne = [...slabe, ...uniq('dorosliSlabe')];
  if (drobne.length) return { wynik: 'nie wiadomo', wiek: '', dowod: `tylko słabe wzmianki (${drobne.slice(0, 3).join(', ')})`, adres: adres((s) => s.slabe.length || s.dorosliSlabe.length) };
  return { wynik: 'nie wiadomo', wiek: '', dowod: 'brak wzmianek o dzieciach i o dorosłych w przejrzanych stronach', adres: w[0]?.adres || '' };
}

// Podstrony z tej samej domeny, których adres lub tekst linku pasuje do słów (najpierw „dzieci"), maks. 6.
export function podstrony(html, adresGlowny) {
  const baza = new URL(adresGlowny);
  const $ = cheerio.load(html);
  const kandydaci = new Map();
  $('a[href]').each((_, a) => {
    const href = ($(a).attr('href') || '').trim();
    if (!href || href.startsWith('#') || POMIN_ADRES.test(href)) return;
    let url;
    try { url = new URL(href, baza); } catch (e) { return; }
    if (!/^https?:$/.test(url.protocol)) return;
    if (url.hostname.replace(/^www\./, '') !== baza.hostname.replace(/^www\./, '')) return;
    url.hash = '';
    const klucz = url.href.replace(/\/$/, '');
    if (klucz === baza.href.replace(/\/$/, '')) return;
    const dopasowanie = `${url.pathname} ${spacje($(a).text())}`;
    if (!SLOWA_PODSTRON.test(dopasowanie)) return;
    const punkty = (/dzieci|dzieci[ęe]c|junior|kids|m[łl]odzie|szk[óo][łl]k|akademi|[żz]ak|orlik/i.test(dopasowanie) ? 4 : 0)
      + (/zaj[eę]cia|grup|oferta|kursy|sekcj|trening/i.test(dopasowanie) ? 3 : 0)
      + (/doros|senior/i.test(dopasowanie) ? 2 : 0)
      + (/cennik|grafik|harmonogram|plan/i.test(dopasowanie) ? 2 : 0)
      + (/o[-_ ]?nas|o[-_ ]?klubie|klub/i.test(dopasowanie) ? 1 : 0)
      + (/kontakt/i.test(dopasowanie) ? 1 : 0);
    if (!kandydaci.has(klucz) || kandydaci.get(klucz) < punkty) kandydaci.set(klucz, punkty);
  });
  return [...kandydaci].sort((a, b) => b[1] - a[1]).slice(0, MAKS_PODSTRON).map(([adres]) => adres);
}

const domena = (adres) => { try { return new URL(adres).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const NIE = (powod) => ({ wynik: 'nie sprawdzono (robots / błąd strony)', wiek: '', dowod: powod, adres: '' });

// --- pobieranie: 1 zapytanie na sekundę, najpierw robots.txt, bez ponawiania po błędzie ---
let ostatnieZapytanie = 0;
const czekaj = (ms) => new Promise((r) => setTimeout(r, ms));
async function odstep() {
  const dolega = ostatnieZapytanie + 1100 - Date.now();
  if (dolega > 0) await czekaj(dolega);
  ostatnieZapytanie = Date.now();
}
const robotsPamiec = new Map(); // serwis → lista reguł albo { blad }
class BladRobots extends Error {}

async function upewnijSie(url) {
  const u = new URL(url);
  if (!robotsPamiec.has(u.origin)) {
    await odstep();
    try {
      const res = await fetch(`${u.origin}/robots.txt`, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
      if (res.status >= 500) robotsPamiec.set(u.origin, { blad: `HTTP ${res.status}` });
      else if (!res.ok) robotsPamiec.set(u.origin, []); // brak pliku = brak zakazów
      else { const tekst = await res.text(); robotsPamiec.set(u.origin, /^\s*</.test(tekst) ? [] : reguly(tekst)); }
    } catch (e) { robotsPamiec.set(u.origin, { blad: 'brak połączenia' }); }
  }
  const lista = robotsPamiec.get(u.origin);
  if (lista.blad) throw new BladRobots(`robots.txt niedostępny (${lista.blad})`);
  if (!dozwolone(lista, u.pathname + u.search)) throw new BladRobots('zakaz w robots.txt');
}

async function pobierzTekst(url) {
  await upewnijSie(url);
  await odstep();
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,*/*' }, redirect: 'follow', signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (!/html|text/i.test(res.headers.get('content-type') || 'text/html')) throw new Error('to nie jest strona html');
  return res.text();
}

// Strona w https (wiele wpisów w arkuszu ma http); gdy się nie uda, próbujemy adresu z arkusza.
async function pobierzGlowna(adres) {
  const warianty = adres.startsWith('http://') ? [adres.replace(/^http:/, 'https:'), adres] : [adres];
  let ostatni;
  for (const w of warianty) {
    try { return { adres: w, html: await pobierzTekst(w) }; } catch (e) { ostatni = e; if (e instanceof BladRobots) throw e; }
  }
  throw ostatni;
}

export async function sprawdzDomene(adres, pamiec) {
  const plik = pamiec ? join(pamiec, `${domena(adres).replace(/[^a-z0-9.-]/gi, '_')}.json`) : '';
  if (plik) { try { const z = JSON.parse(await readFile(plik, 'utf8')); return z.blad ? NIE(z.blad) : ocen(z.strony); } catch (e) { /* nie ma w pamięci */ } }
  const zapisz = async (dane) => { if (plik) { await mkdir(pamiec, { recursive: true }); await writeFile(plik, JSON.stringify(dane)); } };

  if (SPOLECZNOSCIOWE.test(domena(adres))) return NIE('adres to Facebook, Instagram lub podobny portal; pominięto zgodnie z zasadami');
  let glowna;
  try { glowna = await pobierzGlowna(adres); } catch (e) {
    const blad = e instanceof BladRobots ? e.message : `strona główna nie odpowiada (${spacje(e.message).slice(0, 60)})`;
    await zapisz({ blad });
    return NIE(blad);
  }
  const strony = [{ adres: glowna.adres, tekst: tekstStrony(glowna.html) }];
  for (const p of podstrony(glowna.html, glowna.adres)) {
    try { strony.push({ adres: p, tekst: tekstStrony(await pobierzTekst(p)) }); } catch (e) { /* podstrona niedostępna albo zakazana: oceniamy po reszcie, bez ponawiania */ }
  }
  await zapisz({ strony });
  return ocen(strony);
}

// --- uwaga: domena wskazuje inne miasto niż w arkuszu ---
const MIASTA = ['warszawa', 'gliwice', 'katowice', 'wroclaw', 'poznan', 'gdansk', 'gdynia', 'sopot', 'lodz', 'lublin', 'szczecin', 'bydgoszcz', 'torun', 'rzeszow', 'bialystok', 'opole', 'kielce', 'czestochowa', 'zabrze', 'bytom', 'sosnowiec', 'tychy', 'rybnik', 'bielsko', 'tarnow', 'nowysacz', 'zakopane', 'olsztyn', 'radom', 'plock', 'zielonagora', 'koszalin', 'slupsk', 'legnica', 'walbrzych', 'kalisz', 'elblag', 'chorzow', 'dabrowagornicza', 'gorzow', 'krosno', 'przemysl', 'oswiecim', 'wadowice', 'chrzanow', 'myslenice', 'wieliczka', 'bochnia', 'skawina'];
const bezOgonkow = (t) => String(t || '').toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
export function uwagaMiasto(domenaStrony, miastaWiersza) {
  const d = String(domenaStrony).toLowerCase().replace(/[^a-z0-9.-]/g, '');
  const swoje = bezOgonkow(miastaWiersza.join(''));
  const trafione = MIASTA.filter((m) => {
    if (swoje.includes(m)) return false; // to miasto (albo gmina) wiersza
    if (m.length >= 6) return d.includes(m);
    return new RegExp(`(^|[.-])${m}($|[.-])`).test(d);
  });
  return trafione.length ? 'domena z innego miasta?' : '';
}

const KOLUMNY = ['place_id', 'nazwa', 'domena', 'wynik', 'wiek', 'dowod', 'adres_dowodu', 'uwaga'];

async function main() {
  const [plik, ...opcje] = process.argv.slice(2);
  if (!plik) { console.error('Użycie: node scripts/weryfikacja/dzieci.mjs <plik.csv> [--dyscyplina=Taniec] [--wynik=docs/weryfikacja-dzieci.csv]'); process.exit(1); }
  const arg = (nazwa) => (opcje.find((o) => o.startsWith(`--${nazwa}=`)) || '').split('=').slice(1).join('=');
  const wynikPlik = arg('wynik') || 'docs/weryfikacja-dzieci.csv';
  const dyscyplina = arg('dyscyplina');
  const pamiec = process.env.WERYFIKACJA_CACHE || '';

  const wiersze = Papa.parse((await readFile(plik, 'utf8')).replace(/^﻿/, ''), { header: true, skipEmptyLines: true }).data
    .filter((r) => (r.flag || '').includes('do weryfikacji (dzieci?)') && r.sekcja !== 'archiwum' && (!dyscyplina || r.dyscyplina === dyscyplina));
  const zWww = wiersze.filter((r) => (r.website || '').trim());
  console.log(`Wiersze z flagą${dyscyplina ? ` (${dyscyplina})` : ''}: ${wiersze.length}, ze stroną www: ${zWww.length}, bez strony: ${wiersze.length - zWww.length}`);

  const wDomenach = new Map(); // domena → wynik (jedną domenę oceniamy raz, nawet gdy ma kilka miejsc)
  const wyniki = [];
  for (const r of zWww) {
    const adres = r.website.trim();
    const d = domena(adres) || adres;
    if (!wDomenach.has(d)) {
      wDomenach.set(d, await sprawdzDomene(adres, pamiec));
      const o = wDomenach.get(d);
      console.log(`${o.wynik.padEnd(40)} ${d}${o.wiek ? ` (${o.wiek})` : ''}`);
    }
    const o = wDomenach.get(d);
    wyniki.push({ place_id: r.place_id, nazwa: r.name, domena: d, wynik: o.wynik, wiek: o.wiek, dowod: o.dowod.slice(0, 120), adres_dowodu: o.adres, uwaga: uwagaMiasto(d, [r.city, r.gmina_aglomeracja]) });
  }

  // połączenie z poprzednimi wynikami (te same place_id są nadpisywane)
  let poprzednie = [];
  try { poprzednie = Papa.parse(await readFile(wynikPlik, 'utf8'), { header: true, skipEmptyLines: true }).data; } catch (e) { /* pierwszy raz */ }
  const nowe = new Map(wyniki.map((w) => [w.place_id, w]));
  const wszystkie = [...poprzednie.filter((p) => !nowe.has(p.place_id)), ...wyniki];
  await mkdir(dirname(wynikPlik), { recursive: true });
  await writeFile(wynikPlik, `${Papa.unparse({ fields: KOLUMNY, data: wszystkie.map((w) => KOLUMNY.map((k) => w[k] ?? '')) }, { newline: '\n' })}\n`);

  const licz = {};
  for (const w of wyniki) licz[w.wynik] = (licz[w.wynik] || 0) + 1;
  console.log('Liczby (w tym uruchomieniu):', licz, `| uwaga „domena z innego miasta?”: ${wyniki.filter((w) => w.uwaga).length} | zapisano ${wszystkie.length} wierszy do ${wynikPlik}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e); process.exit(1); });
