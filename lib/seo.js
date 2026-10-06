import Papa from 'papaparse';

// Tylko na serwerze (w getStaticProps): teksty stron z zakładki „Strony_SEO".
const SHEET_SEO_CSV_URL = process.env.SHEET_SEO_CSV_URL;
export const SITE_URL = (process.env.SITE_URL || 'https://frajdoplan.pl').replace(/\/+$/, '');

// Host z SITE_URL (np. „frajdoplan.pl"): tylko na nim wolno indeksować, i to tylko na produkcji Vercela.
export const hostSerwisu = () => { try { return new URL(SITE_URL).host.toLowerCase(); } catch (e) { return 'frajdoplan.pl'; } };
export const czyProdukcja = () => process.env.VERCEL_ENV === 'production';
// Host żądania (po stronie serwera: z nagłówków) może się indeksować tylko wtedy, gdy to host z SITE_URL na produkcji.
export const czyIndeksowalnyHost = (host) => czyProdukcja() && String(host || '').toLowerCase() === hostSerwisu();

// „https://frajdoplan.pl/Sport/" → „/sport"
const normalizuj = (adres) => {
  let a = String(adres || '').trim();
  try { a = new URL(a, 'https://frajdoplan.pl').pathname; } catch (e) { /* zostaw jak jest */ }
  a = a.toLowerCase().replace(/\/+$/, '');
  return a || '/';
};

let pamiec = null;
async function pobierzTeksty() {
  if (!SHEET_SEO_CSV_URL) return {};
  if (pamiec && Date.now() - pamiec.czas < 5 * 60 * 1000) return pamiec.dane;
  try {
    const res = await fetch(SHEET_SEO_CSV_URL);
    if (!res.ok) throw new Error(`Strony_SEO: ${res.status}`);
    const rows = Papa.parse(await res.text(), { header: true, skipEmptyLines: true }).data;
    const dane = Object.fromEntries(rows.filter((r) => r.adres).map((r) => [normalizuj(r.adres), r]));
    pamiec = { czas: Date.now(), dane };
    return dane;
  } catch (e) {
    return pamiec ? pamiec.dane : {}; // arkusz SEO niedostępny: zostają teksty domyślne
  }
}

// Teksty strony: najpierw z arkusza, a gdy pola brak — domyślne. {liczba} = liczba miejsc.
// `noindex: true` = ta konkretna strona (np. karta miejsca) nie ma się indeksować nawet na produkcji.
// Strony są statyczne, więc w HTML meta robots zależy od środowiska budowy (VERCEL_ENV); host sprawdza dodatkowo
// middleware.js i wysyła nagłówek X-Robots-Tag (podgląd Vercela, frajdoplan.vercel.app, inne hosty).
export async function seoStrony(adres, domyslne, liczba, { noindex = false } = {}) {
  const sciezka = normalizuj(adres);
  const wiersz = (await pobierzTeksty())[sciezka] || {};
  const tekst = (pole, zArkusza) => String((zArkusza || '').trim() || domyslne[pole] || '').replace(/\{liczba\}/g, liczba ?? '');
  return {
    adres: sciezka,
    tytul: tekst('tytul', wiersz.tytul_seo),
    opis: tekst('opis', wiersz.opis_meta),
    h1: tekst('h1', wiersz.h1),
    wstep: tekst('wstep', wiersz.wstep),
    siteUrl: SITE_URL,
    noindex: noindex || !czyProdukcja(),
    weryfikacjaGoogle: process.env.GOOGLE_SITE_VERIFICATION || '',
    canonical: SITE_URL + (sciezka === '/' ? '/' : sciezka),
    obrazek: `${SITE_URL}/brand/og-image.png`,
  };
}
