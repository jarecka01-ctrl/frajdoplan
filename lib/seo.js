import Papa from 'papaparse';

// Tylko na serwerze (w getStaticProps): teksty stron z zakładki „Strony_SEO".
const SHEET_SEO_CSV_URL = process.env.SHEET_SEO_CSV_URL;
export const SITE_URL = (process.env.SITE_URL || 'https://frajdoplan.pl').replace(/\/+$/, '');

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
export async function seoStrony(adres, domyslne, liczba) {
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
    canonical: SITE_URL + (sciezka === '/' ? '/' : sciezka),
    obrazek: `${SITE_URL}/brand/og-image.png`,
  };
}
