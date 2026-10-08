// Muzeum Inżynierii i Techniki w Krakowie (mit.krakow.pl): Zajezdnia (św. Wawrzyńca 15), Hangar Czyżyny, Ogród Doświadczeń.
// Lista /wydarzenia/ ładuje się w przeglądarce z otwartego API WordPressa (/wp-json/api/v1/entities?entity_type=wydarzenie
// &date_type[]=actual&countPerPage=-1): wszystkie aktualne wydarzenia w jednej odpowiedzi (title, date „2026/10/10",
// categories.name = lokalizacja, url). Opis w API jest ucięty, więc godzinę, wiek i cenę czytamy ze strony wydarzenia
// („Zajęcia dla dzieci w wieku 7 – 12 lat…", „10 października | sobota godz. 10.00", „Bilety: 45 zł").
// Strona nie ma oznaczenia „dla dzieci": ocena po wieku z opisu, a bez wieku po tytule i opisie (ocenaGoscinna);
// wydarzenia „dla dorosłych (z możliwością udziału młodzieży 13+)" są odrzucane.
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina, wiekZTekstu, wiekDlaDzieci } from '../wspolne.mjs';
import { ocenaGoscinna } from '../dla-dzieci.mjs';

const BAZA = 'https://www.mit.krakow.pl';
const API = `${BAZA}/wp-json/api/v1/entities?sortBy=date&entity_type=wydarzenie&list-page=1&countPerPage=-1&date_type[]=actual`;

const MIEJSCA = { ZAJEZDNIA: 'Muzeum Inżynierii i Techniki (Zajezdnia)', HANGAR: 'Hangar Czyżyny (MIT)', 'OGRÓD': 'Ogród Doświadczeń im. Stanisława Lema' };

// Lista z API → [{ tytul, data, lokalizacja, strona }]
export function parsuj(json) {
  const dane = typeof json === 'string' ? JSON.parse(json) : json;
  return (dane.results || []).map((r) => {
    const m = String(r.date || '').match(/^(\d{4})[/-](\d{2})[/-](\d{2})/);
    return {
      tytul: spacje(cheerio.load(`<d>${r.title || ''}</d>`)('d').text()),
      data: m ? `${m[1]}-${m[2]}-${m[3]}` : '',
      lokalizacja: spacje(r.categories && r.categories.name),
      strona: r.url || '',
    };
  }).filter((w) => w.tytul && w.data && w.strona);
}

// Strona wydarzenia: godzina („godz. 10.00"), wiek, cena („Bilety: 45 zł"), początek opisu do oceny.
export function parsujSzczegoly(html) {
  const $ = cheerio.load(html);
  $('script, style, nav, header, footer').remove();
  const tekst = spacje($('main').first().text() || $('body').text());
  const g = tekst.match(/godz\.?\s*(\d{1,2})[.:](\d{2})/i);
  // opis zaczyna się po adresie („Zajezdnia przy ul. …") i kończy przed „Powiązane elementy"
  const poAdresie = tekst.split(/Zaplanuj wizytę/)[1] || tekst;
  const opis = spacje(poAdresie.split('Powiązane elementy')[0]);
  const cena = (opis.match(/(?:Bilety?|Cena|Wstęp)\s*:?\s*([^.]{0,60}?\d[\d\s,]*\s*zł(?:\s*\([^)]*\))?|wolny|bezpłatn\p{L}*)/iu) || [])[1] || '';
  return { godzina: g ? godzina(`${g[1]}:${g[2]}`) : '', cena: spacje(cena), opis };
}

// „od 3 miesiąca życia do 6 lat" → „0–6 lat"; inaczej wiekZTekstu („7 – 12 lat", „od 5 lat", „5+").
function wiekZOpisu(opis) {
  const m = opis.match(/od\s+\d+\s*(?:miesiąca|miesięcy|miesiąc)\s+życia\s+do\s+(\d{1,2})\s*lat/i);
  if (m) return `0–${m[1]} lat`;
  return wiekZTekstu(opis);
}

// Zdanie o odbiorcach: pierwsze po adresie (np. „Zajęcia dla dorosłych (…)", „Zajęcia dla dzieci w wieku 7 – 12 lat…").
export function ocena(tytul, opis) {
  const poczatek = opis.replace(/^.*?(?:ul\.|ulicy)\s*[\p{L}. ]+\d+[a-z]?\s*/iu, '').slice(0, 400);
  const dorosli = /^(zajęcia\s+)?(dla\s+)?(dorosłych|dorośli)/i.test(poczatek) || /dla dorosłych|18\+/i.test(tytul);
  const wiek = wiekZOpisu(poczatek);
  if (dorosli) return { dlaDzieci: false, wiek: '' };
  if (wiek) return wiekDlaDzieci(wiek) ? { dlaDzieci: true, wiek } : { dlaDzieci: false, wiek: '' };
  const o = ocenaGoscinna({ tytul, opis: opis.slice(0, 500) });
  return { dlaDzieci: o.dlaDzieci, wiek: o.wiek };
}

export function kategoria(tytul, opis) {
  const t = `${tytul} ${opis.slice(0, 300)}`.toLowerCase();
  if (/warsztat|zajęcia|pracownia|jak to działa|gordonki/.test(t)) return 'warsztaty';
  if (/koncert/.test(t)) return 'koncert';
  if (/pokaz|projekcj|seans/.test(t)) return 'pokaz';
  if (/spacer/.test(t)) return 'spacer';
  return 'inne';
}

export default {
  id: 'mit',
  nazwa: 'Muzeum Inżynierii i Techniki',
  url: `${BAZA}/wydarzenia/`,
  rodzaj: 'wydarzenia',
  miejsca: [
    ['Muzeum Inżynierii i Techniki', /muzeum\s+inżynierii/i],
    ['Hangar Czyżyny', /hangar\s+czyżyny/i],
    ['Ogród Doświadczeń im. Stanisława Lema', /ogród\s+doświadczeń/i],
  ],
  async pobierz() {
    const lista = parsuj(await pobierz(API, { robots: true }));
    const wynik = [];
    for (const w of lista) {
      const s = parsujSzczegoly(await pobierz(w.strona, { robots: true }));
      const o = ocena(w.tytul, s.opis);
      wynik.push({
        tytul: w.tytul,
        data: w.data,
        godzina: s.godzina,
        miejsce: MIEJSCA[w.lokalizacja.toUpperCase()] || 'Muzeum Inżynierii i Techniki',
        kategoria: kategoria(w.tytul, s.opis),
        typ: 'wydarzenie',
        wiek: o.wiek,
        cena: s.cena,
        strona: w.strona,
        link: '',
        dlaDzieci: o.dlaDzieci,
      });
    }
    return wynik;
  },
};
