// Konwersatorium Muzyczne (konwersatoriummuzyczne.pl): koncerty dla maluszków i bajki baletowe w Krakowie (CKF13, ul. Fabryczna 13).
// Serwis jest renderowany po stronie serwera (zwykły HTML, bez API i bez JSON-LD). Dwie listy kategorii z filtrem miasta
// (`/pl/koncerty-dla-maluszkow?city=Kraków`, `/pl/bajki-baletowe?city=Kraków`) dają adresy wydarzeń (`.../KRAKOW...`); strona
// wydarzenia ma tabelę `#bilety` ze wszystkimi terminami: wiersze `tr.event` pod nagłówkami `h3` z grupą wiekową
// („Koncert dla dzieci 4-6 lat", „Koncert OPEN dla dzieci 0-12 lat"), a wyprzedane terminy są w osobnej sekcji
// „Koncerty wyprzedane" z napisem „Wyprzedane" i bez przycisku zakupu. Wyprzedane pomijamy; gdy wyprzedane są wszystkie terminy,
// wydarzenie nie trafia do wyniku. Bilety są tylko pod wspólnym adresem sekcji (`#bilety`), bez linków do pojedynczych terminów.
// Koncerty dla dorosłych („Koncert w Ciemności") są na innej domenie i nie są pobierane; adresy spoza tego serwisu odrzucamy.
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina, dzisWarszawa, wiekZTekstu, zdaniowo } from '../wspolne.mjs';

const BAZA = 'https://konwersatoriummuzyczne.pl';
const KATEGORIE = ['koncerty-dla-maluszkow', 'bajki-baletowe'];
const MIEJSCE = 'CKF13 Centrum Konferencyjne Fabryczna';
const adresListy = (kategoria) => `${BAZA}/pl/${kategoria}?city=${encodeURIComponent('Kraków')}`;

// Lista kategorii → adresy wydarzeń w Krakowie (bez powtórzeń, tylko ten serwis i tylko wydarzenia krakowskie).
export function adresyWydarzen(html) {
  const $ = cheerio.load(html);
  const adresy = new Set();
  $('a[href]').each((_, a) => {
    let u;
    try { u = new URL($(a).attr('href'), BAZA); } catch (e) { return; }
    if (u.origin !== BAZA) return;
    const m = u.pathname.match(/^\/pl\/(koncerty-dla-maluszkow|bajki-baletowe)\/([^/]+)$/);
    if (m && /KRAKOW/.test(m[2])) adresy.add(`${BAZA}${u.pathname}`);
  });
  return [...adresy];
}

// „KONCERT BAJKA BALETOWA / ŚPIĄCA KRÓLEWNA" → „Koncert bajka baletowa: Śpiąca królewna"; „ŚWIĄTECZNY KONCERT / DLA MALUSZKÓW" → „Świąteczny koncert dla maluszków".
// Tytuł wydarzenia jest drugą linią tylko wtedy, gdy pierwsza jest nazwą cyklu („Koncert dla maluszków #7", „Koncert bajka baletowa").
export function tytulWydarzenia(linie) {
  const [pierwsza, ...reszta] = linie.map((l) => zdaniowo(l)).filter(Boolean);
  if (!reszta.length) return pierwsza || '';
  return /^koncert (dla maluszków|bajka baletowa)/i.test(pierwsza) ? `${pierwsza}: ${reszta.join(' ')}` : `${pierwsza} ${reszta.join(' ').replace(/^./u, (c) => c.toLowerCase())}`;
}

// Strona wydarzenia → terminy (tylko te, które da się kupić).
export function parsujWydarzenie(html, adres) {
  const $ = cheerio.load(html);
  const tytulLinie = $('#bilety .event-listing-title').first().find('p').first().html();
  const linie = (tytulLinie ? tytulLinie.split(/<br\s*\/?>/i) : [$('h1').first().text()]).map((l) => spacje(cheerio.load(`<p>${l}</p>`)('p').text())).filter(Boolean);
  const tytul = tytulWydarzenia(linie);
  let sekcja = '';
  let wszystkich = 0;
  const terminy = [];
  $('#bilety table tr').each((_, tr) => {
    const w = $(tr);
    if (!w.hasClass('event')) { const h = spacje(w.find('h3').text()); if (h) sekcja = h; return; }
    const tekst = spacje(w.text());
    const d = tekst.match(/(\d{2})-(\d{2})-(\d{4})/);
    const g = tekst.match(/(\d{1,2}:\d{2})/);
    if (!d || !g) return;
    wszystkich += 1;
    const przycisk = spacje(w.find('.add-to-basket-button').text());
    if (!przycisk || /wyprzedan/i.test(tekst) || /dostępne bilety:?\s*0\b/i.test(tekst)) return; // nie da się kupić
    const cena = (przycisk.match(/(od\s+)?(\d{1,4}(?:[.,]\d{1,2})?)\s*zł/i) || []);
    terminy.push({
      data: `${d[3]}-${d[2]}-${d[1]}`,
      godzina: godzina(g[1]),
      sekcja,
      wiek: wiekZTekstu(sekcja),
      cena: cena[2] ? `${cena[1] ? 'od ' : ''}${cena[2].replace(',', '.')} zł` : '',
    });
  });
  return { tytul, terminy, wszystkich };
}

export function naWydarzenia(strona, adres, dzis = dzisWarszawa()) {
  return strona.terminy.filter((t) => t.data >= dzis).map((t) => ({
    tytul: strona.tytul,
    data: t.data,
    godzina: t.godzina,
    miejsce: MIEJSCE,
    kategoria: 'koncert',
    typ: 'koncert',
    wiek: t.wiek,
    cena: t.cena,
    link: `${adres}#bilety`,
    opisUrl: adres,
    strona: adres,
    // obie kategorie serwisu są dziecięce; dorosłych (np. „Koncert w Ciemności") tu nie ma, ale gdyby nagłówek tak mówił, pomijamy
    dlaDzieci: !/dorosł/i.test(`${t.sekcja} ${strona.tytul}`),
  }));
}

export default {
  id: 'konwersatorium',
  nazwa: 'Konwersatorium Muzyczne',
  url: adresListy('koncerty-dla-maluszkow'),
  rodzaj: 'wydarzenia',
  wyprzedzenieDni: 180,
  lagodny: true, // błąd serwisu to tylko ostrzeżenie, poprzednie dane zostają
  moznaPusto: true, // gdy wszystkie terminy są wyprzedane, lista jest pusta i to nie jest błąd
  miejsca: [[/ckf\s*13/i, /ckf\s*13|centrum konferencyjne fabryczna/i]], // karta CKF13 w arkuszu „Miejsca" jest tylko, jeśli ją dodano
  async pobierz() {
    const adresy = new Set();
    for (const k of KATEGORIE) for (const a of adresyWydarzen(await pobierz(adresListy(k), { robots: true }))) adresy.add(a);
    const wynik = [];
    for (const adres of adresy) {
      const strona = parsujWydarzenie(await pobierz(adres, { robots: true }), adres);
      if (!strona.tytul) throw new Error(`Konwersatorium: brak tytułu na ${adres} (zmiana strony?)`);
      wynik.push(...naWydarzenia(strona, adres));
    }
    return wynik;
  },
};
