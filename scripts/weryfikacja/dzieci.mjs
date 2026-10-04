// Sprawdza, czy miejsca z arkusza „Miejsca" (flaga „do weryfikacji (dzieci?)") prowadzą zajęcia dla dzieci.
// Uruchomienie: node scripts/weryfikacja/dzieci.mjs <plik.csv> [--dyscyplina=Taniec] [--wynik=docs/weryfikacja-dzieci.csv]
//   bez --dyscyplina bierze wszystkie wiersze z flagą (z pominięciem sekcji „archiwum"); wiersze już obecne w pliku wyniku
//   (ten sam place_id) są nadpisywane, pozostałe zostają — można więc robić kolejne dyscypliny do jednego pliku.
// Zasady: najpierw robots.txt (zakaz albo błąd = „nie sprawdzono"), strona główna + maks. 3 podstrony z tej samej domeny
// (oferta, zajęcia, grupy, dzieci, kursy, cennik, grafik), 1 zapytanie na sekundę, bez logowania, bez Facebooka i Instagrama.
// Bez Claude API: sygnały to proste wyrażenia w tekście strony. Do raportu trafiają tylko krótkie własne opisy, nie cytaty.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import Papa from 'papaparse';
import * as cheerio from 'cheerio';
import { pobierz, spacje } from '../repertuar/wspolne.mjs';

const MAKS_PODSTRON = 3;
const SLOWA_PODSTRON = /oferta|zaj[eę]cia|zajecia|grup[ay]|dzieci|kursy|cennik|grafik/i;
const POMIN_ADRES = /\.(pdf|jpe?g|png|gif|webp|zip|docx?|xlsx?)(\?|$)|^(mailto|tel|javascript):|\/(wp-admin|login|koszyk|cart|regulamin|polityka)/i;
const SPOLECZNOSCIOWE = /(^|\.)(facebook|instagram|fb|tiktok|youtube|linktr)\./i;

// --- sygnały (na tekście bez wielkich liter i bez polskich znaków diakrytycznych w wyrażeniach nie polegamy) ---
// Mocne: wyraźna oferta dla dzieci.
const MOCNE = [
  ['dla dzieci', /\bdla\s+dzieci\b|\bdzieciom\b/],
  ['grupy dziecięce', /grup[ayę]\s+dzieci[ęe]c|zaj[eę]cia\s+dzieci[ęe]c|dzieci[ęe]ce\s+(grup|zaj|kurs)|kurs\s+dla\s+dzieci/],
  ['dzieci od N lat', /dzieci\s+(?:w\s+wieku\s+)?od\s+\d{1,2}/],
  ['junior', /\bjunior|\bjuniorz|\bmini\s*kids|\bkids\b|\bbaby\b/],
  ['maluchy', /\bmalucz|\bmaluch|\bmaluszk/],
  ['przedszkolaki', /przedszkol/],
  ['dzieci i młodzież', /dzieci\s+i\s+m[łl]odzie[żz]|m[łl]odzie[żz]\s+i\s+dzieci/],
];
// Słabe: może dotyczyć dzieci, ale nic nie przesądza.
const SLABE = [
  ['dzieci', /\bdzieci\b|\bdziecko\b/],
  ['młodzież', /m[łl]odzie[żz]/],
  ['nastolatki', /nastolat/],
  ['uczniowie', /uczni(?:ow|ó)w|szkoln/],
  ['rodzice z dziećmi', /rodzic/],
];
// Tylko dorośli.
const DOROSLI = [
  ['dla dorosłych', /\bdla\s+doros[łl]ych|\bkursy?\s+dla\s+doros/],
  ['dla par', /kurs(?:y)?\s+dla\s+par|\bdla\s+par\b|pierwszy\s+taniec|taniec\s+weselny|ślub|wesel/],
  ['18+', /\b18\s*\+|powyżej\s+18|pe[łl]noletni/],
];
const WYLACZNIE_DOROSLI = /(tylko|wy[łl][aą]cznie|jedynie)\s+(?:dla\s+)?doros[łl]|nie\s+(?:prowadzimy|organizujemy|mamy|oferujemy)[^.]{0,50}dzieci|bez\s+dzieci/;

export const tekstStrony = (html) => {
  const $ = cheerio.load(html);
  $('script, style, noscript, svg, iframe').remove();
  return spacje($('body').text() || $.root().text()).toLowerCase();
};

// Wiek („od 4 lat", „3-6 lat", „dzieci od 5") — tylko wartości dziecięce (do 14 lat).
export function wiekZTekstu(tekst) {
  const znalezione = [];
  for (const m of tekst.matchAll(/(?:od|dzieci\s+od|dla\s+dzieci\s+od)\s+(\d{1,2})\s*(?:lat|r\.?\s*ż|roku\s+życia|latek)/g)) znalezione.push({ od: Number(m[1]), tekst: `od ${m[1]} lat` });
  for (const m of tekst.matchAll(/(\d{1,2})\s*[-–]\s*(\d{1,2})\s*(?:lat|latek|r\.?\s*ż)/g)) znalezione.push({ od: Number(m[1]), tekst: `${m[1]}–${m[2]} lat` });
  for (const m of tekst.matchAll(/dzieci\s+od\s+(\d{1,2})(?!\d)/g)) znalezione.push({ od: Number(m[1]), tekst: `od ${m[1]} lat` });
  const dzieciece = znalezione.filter((z) => z.od >= 1 && z.od <= 14);
  dzieciece.sort((a, b) => a.od - b.od);
  return dzieciece[0] ? dzieciece[0].tekst : '';
}

const trafienia = (lista, tekst) => lista.filter(([, wzor]) => wzor.test(tekst)).map(([nazwa]) => nazwa);

// Ocena z tekstów kilku stron: [{ adres, tekst }] → { wynik, wiek, dowod, adres }
export function ocen(strony) {
  const wiersz = (s) => ({ ...s, mocne: trafienia(MOCNE, s.tekst), slabe: trafienia(SLABE, s.tekst), doroslych: trafienia(DOROSLI, s.tekst), wylacznie: WYLACZNIE_DOROSLI.test(s.tekst), wiek: wiekZTekstu(s.tekst) });
  const w = strony.map(wiersz);
  const mocne = [...new Set(w.flatMap((s) => s.mocne))];
  const slabe = [...new Set(w.flatMap((s) => s.slabe))];
  const dorosli = [...new Set(w.flatMap((s) => s.doroslych))];
  const wiek = w.map((s) => s.wiek).filter(Boolean).sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10))[0] || '';
  const stronaDowodu = (lista) => (w.find((s) => lista(s)) || w[0] || {}).adres || '';
  const wylacznie = w.some((s) => s.wylacznie);

  if (wylacznie && !wiek) return { wynik: 'tylko dorośli', wiek: '', dowod: 'strona mówi, że zajęcia są wyłącznie dla dorosłych', adres: stronaDowodu((s) => s.wylacznie) };
  if (mocne.length) {
    const opis = [wiek ? `podany wiek ${wiek}` : '', `słowa: ${mocne.slice(0, 3).join(', ')}`].filter(Boolean).join('; ');
    // oferta dla dzieci razem z ofertą dla dorosłych to wciąż oferta dla dzieci
    return { wynik: 'tak', wiek, dowod: `${opis}${dorosli.length ? ' (oferta także dla dorosłych)' : ''}`, adres: stronaDowodu((s) => s.mocne.length) };
  }
  if (wiek) return { wynik: 'prawdopodobnie', wiek, dowod: `podany wiek ${wiek}, bez wyraźnego „dla dzieci”`, adres: stronaDowodu((s) => s.wiek) };
  if (slabe.length && !dorosli.length) return { wynik: 'prawdopodobnie', wiek: '', dowod: `tylko wzmianki: ${slabe.slice(0, 3).join(', ')}`, adres: stronaDowodu((s) => s.slabe.length) };
  if (dorosli.length && !slabe.length) return { wynik: 'tylko dorośli', wiek: '', dowod: `oferta dla: ${dorosli.slice(0, 3).join(', ')}; dzieci nie wspomniano`, adres: stronaDowodu((s) => s.doroslych.length) };
  if (slabe.length) return { wynik: 'nie wiadomo', wiek: '', dowod: `słabe wzmianki (${slabe.slice(0, 2).join(', ')}) razem z ofertą dla dorosłych`, adres: stronaDowodu((s) => s.slabe.length) };
  return { wynik: 'nie wiadomo', wiek: '', dowod: 'brak wzmianek o dzieciach i o dorosłych w przejrzanych stronach', adres: w[0]?.adres || '' };
}

// Podstrony z tej samej domeny, których adres lub tekst linku pasuje do słów (najpierw te z „dzieci"), maks. 3.
export function podstrony(html, adresGlowny) {
  const baza = new URL(adresGlowny);
  const $ = cheerio.load(html);
  const kandydaci = new Map();
  $('a[href]').each((_, a) => {
    const href = ($(a).attr('href') || '').trim();
    if (!href || href.startsWith('#') || POMIN_ADRES.test(href)) return;
    let adres;
    try { adres = new URL(href, baza); } catch (e) { return; }
    if (!/^https?:$/.test(adres.protocol)) return;
    if (adres.hostname.replace(/^www\./, '') !== baza.hostname.replace(/^www\./, '')) return;
    adres.hash = '';
    const klucz = adres.href.replace(/\/$/, '');
    if (klucz === baza.href.replace(/\/$/, '')) return;
    const tekst = spacje($(a).text());
    const dopasowanie = `${adres.pathname} ${tekst}`;
    if (!SLOWA_PODSTRON.test(dopasowanie)) return;
    const punkty = (/dzieci|dzieci[ęe]c|junior|kids/i.test(dopasowanie) ? 3 : 0) + (/zaj[eę]cia|grup|oferta|kursy/i.test(dopasowanie) ? 2 : 0) + (/cennik|grafik/i.test(dopasowanie) ? 1 : 0);
    if (!kandydaci.has(klucz) || kandydaci.get(klucz) < punkty) kandydaci.set(klucz, punkty);
  });
  return [...kandydaci].sort((a, b) => b[1] - a[1]).slice(0, MAKS_PODSTRON).map(([adres]) => adres);
}

const domena = (adres) => { try { return new URL(adres).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const NIE = (powod) => ({ wynik: 'nie sprawdzono (robots / błąd strony)', wiek: '', dowod: powod, adres: '' });

// Strona w https (wiele wpisów w arkuszu ma http); gdy się nie uda, próbujemy adresu z arkusza.
async function pobierzStrone(adres) {
  const warianty = adres.startsWith('http://') ? [adres.replace(/^http:/, 'https:'), adres] : [adres];
  let ostatni;
  for (const w of warianty) {
    try { return { adres: w, html: await pobierz(w, { robots: true }) }; } catch (e) { ostatni = e; if (/robots/.test(e.message)) throw e; }
  }
  throw ostatni;
}

export async function sprawdzDomene(adres) {
  if (SPOLECZNOSCIOWE.test(domena(adres))) return NIE('adres to Facebook, Instagram lub podobny portal; pominięto zgodnie z zasadami');
  let glowna;
  try { glowna = await pobierzStrone(adres); } catch (e) {
    return NIE(/robots/.test(e.message) ? `robots.txt: ${/zabroni/.test(e.message) ? 'zakaz pobierania' : 'plik niedostępny lub błąd serwera'}` : `strona główna nie odpowiada (${spacje(e.message).slice(0, 60)})`);
  }
  const strony = [{ adres: glowna.adres, tekst: tekstStrony(glowna.html) }];
  for (const p of podstrony(glowna.html, glowna.adres)) {
    try { strony.push({ adres: p, tekst: tekstStrony(await pobierz(p, { robots: true })) }); } catch (e) { /* podstrona niedostępna albo zakazana — oceniamy po reszcie */ }
  }
  return ocen(strony);
}

const KOLUMNY = ['place_id', 'nazwa', 'domena', 'wynik', 'wiek', 'dowod', 'adres_dowodu'];

async function main() {
  const [plik, ...opcje] = process.argv.slice(2);
  if (!plik) { console.error('Użycie: node scripts/weryfikacja/dzieci.mjs <plik.csv> [--dyscyplina=Taniec] [--wynik=docs/weryfikacja-dzieci.csv]'); process.exit(1); }
  const arg = (nazwa) => (opcje.find((o) => o.startsWith(`--${nazwa}=`)) || '').split('=').slice(1).join('=');
  const wynikPlik = arg('wynik') || 'docs/weryfikacja-dzieci.csv';
  const dyscyplina = arg('dyscyplina');

  const wiersze = Papa.parse((await readFile(plik, 'utf8')).replace(/^﻿/, ''), { header: true, skipEmptyLines: true }).data
    .filter((r) => (r.flag || '').includes('do weryfikacji (dzieci?)') && r.sekcja !== 'archiwum' && (!dyscyplina || r.dyscyplina === dyscyplina));
  const zWww = wiersze.filter((r) => (r.website || '').trim());
  console.log(`Wiersze z flagą${dyscyplina ? ` (${dyscyplina})` : ''}: ${wiersze.length}, ze stroną www: ${zWww.length}`);

  const wDomenach = new Map(); // domena → wynik (jedna oceniamy raz, nawet gdy ma kilka miejsc)
  const wyniki = [];
  for (const r of zWww) {
    const adres = r.website.trim();
    const d = domena(adres) || adres;
    if (!wDomenach.has(d)) {
      wDomenach.set(d, await sprawdzDomene(adres));
      const o = wDomenach.get(d);
      console.log(`${o.wynik.padEnd(40)} ${d}${o.wiek ? ` (${o.wiek})` : ''}`);
    }
    const o = wDomenach.get(d);
    wyniki.push({ place_id: r.place_id, nazwa: r.name, domena: d, wynik: o.wynik, wiek: o.wiek, dowod: o.dowod.slice(0, 120), adres_dowodu: o.adres });
  }

  // połączenie z poprzednimi wynikami (kolejne dyscypliny dopisują się do tego samego pliku)
  let poprzednie = [];
  try { poprzednie = Papa.parse(await readFile(wynikPlik, 'utf8'), { header: true, skipEmptyLines: true }).data; } catch (e) { /* pierwszy raz */ }
  const nowe = new Map(wyniki.map((w) => [w.place_id, w]));
  const wszystkie = [...poprzednie.filter((p) => !nowe.has(p.place_id)), ...wyniki];
  await mkdir(dirname(wynikPlik), { recursive: true });
  await writeFile(wynikPlik, `${Papa.unparse({ fields: KOLUMNY, data: wszystkie.map((w) => KOLUMNY.map((k) => w[k] ?? '')) }, { newline: '\n' })}\n`);

  const licz = {};
  for (const w of wyniki) licz[w.wynik] = (licz[w.wynik] || 0) + 1;
  console.log('Liczby (w tym uruchomieniu):', licz, `| zapisano ${wszystkie.length} wierszy do ${wynikPlik}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e); process.exit(1); });
