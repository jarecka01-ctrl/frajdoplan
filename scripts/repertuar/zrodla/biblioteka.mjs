// Biblioteka Kraków — wydarzenia w filiach. Lista na stronie ładuje się z `/front-api/events` (to samo zapytanie,
// które wysyła sama strona: JSON z fragmentem HTML). Filtrujemy po odbiorcach „Dzieci" i „Rodziny z dziećmi"
// (identyfikatory bierzemy ze strony `/wydarzenia`, bo mogą się zmienić).
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina, dataPL, dzisWarszawa } from '../wspolne.mjs';

const BAZA = 'https://biblioteka.krakow.pl';
const ODBIORCY = ['Dzieci', 'Rodziny z dziećmi'];
const NA_STRONE = 100;
const MAKS_STRON = 3;

export const idOdbiorcow = (html) => {
  const wynik = {};
  for (const m of html.matchAll(/recipients%5B0%5D=([0-9a-f-]{36})"[^>]*>([^<]*)</g)) wynik[spacje(m[2])] = m[1];
  return wynik;
};

const KATEGORIE = [
  [/warsztat|rękodzie|plastyk/i, 'warsztaty'],
  [/czytani|bajk|literack/i, 'czytanie'],
  [/spacer|wycieczk/i, 'spacer'],
  [/wystaw/i, 'wystawa'],
  [/koncert|muzyk/i, 'koncert'],
  [/spektakl|teatr/i, 'spektakl'],
  [/pokaz|film/i, 'pokaz'],
  [/gr[ay]|planszów|sport/i, 'sport'],
];
const kategoriaZTagow = (tagi) => {
  const t = tagi.join(' ');
  return (KATEGORIE.find(([wzor]) => wzor.test(t)) || [0, 'inne'])[1];
};

// „4 października" / „22 stycznia 2024 - 22 lutego 2024" → { od, do }
export function zakres(tekst, rok) {
  const [a, b] = spacje(tekst).split(/\s+[-–]\s+/);
  const od = dataPL(a, rok);
  return { od, do: b ? dataPL(b, rok) : '' };
}

export function parsuj(html, rok = new Date().getFullYear()) {
  const $ = cheerio.load(html);
  const wydarzenia = [];
  $('.news-item').each((_, el) => {
    const { od, do: doDnia } = zakres($(el).find('.news-item__date').first().text(), rok);
    const tytul = spacje($(el).find('.news-item__title').first().text());
    const href = $(el).find('a.news-item__title').first().attr('href') || '';
    if (!od || !tytul) return;
    const tagi = $(el).find('.news-item__tag').map((__, t) => spacje($(t).text())).get();
    const odbiorcy = tagi.filter((t) => ODBIORCY.includes(t));
    const miejsce = spacje($(el).find('div.news-item__text').first().text()); // „Filia nr 56 Odział dla dzieci | Os. Zgody 7"
    wydarzenia.push({
      tytul,
      data: od,
      dataDo: doDnia && doDnia > od ? doDnia : '',
      godzina: godzina($(el).find('span.news-item__text').first().text()),
      miejsce: miejsce.split('|')[0].trim() ? `Biblioteka Kraków, ${miejsce.split('|')[0].trim()}` : 'Biblioteka Kraków',
      adres: (miejsce.split('|')[1] || '').trim(),
      kategoria: kategoriaZTagow(tagi.filter((t) => !ODBIORCY.includes(t) && t !== 'Dorośli' && t !== 'Seniorzy' && t !== 'Młodzież')),
      typ: 'wydarzenie',
      strona: href ? new URL(href, BAZA).href : '',
      link: '',
      dlaDzieci: odbiorcy.length > 0 && !(tagi.includes('Dorośli') && !tagi.includes('Dzieci')),
    });
  });
  return wydarzenia;
}

export default {
  id: 'biblioteka',
  nazwa: 'Biblioteka Kraków',
  url: `${BAZA}/wydarzenia`,
  rodzaj: 'wydarzenia',
  // filia z tytułu („Filia nr 56 …" lub „Filia „Kosmos" (nr 58)") → wiersz z arkusza „Miejsca"
  dopasujMiejsce(w, wiersze) {
    const nr = (w.miejsce.match(/filia[^0-9]*(?:\(nr\s*)?(\d+)/i) || [])[1];
    if (!nr) return '';
    const traf = wiersze.filter((r) => r.podkategoria === 'Biblioteka' && new RegExp(`filia[^0-9]*${nr}\\b`, 'i').test(r.name));
    return traf[0] ? traf[0].place_id : '';
  },
  async pobierz() {
    const strona = await pobierz(this.url, { robots: true });
    const id = idOdbiorcow(strona);
    const rok = Number(dzisWarszawa().slice(0, 4));
    const wynik = new Map();
    for (const nazwa of ODBIORCY) {
      if (!id[nazwa]) continue;
      for (let nr = 1; nr <= MAKS_STRON; nr += 1) {
        const odp = await pobierz(`${BAZA}/front-api/events`, {
          robots: true,
          json: true,
          cialo: { page: nr, perPage: NA_STRONE, dateFrom: dzisWarszawa(), recipients: [id[nazwa]] },
        });
        for (const w of parsuj(odp.html || '', rok)) wynik.set(`${w.strona}|${w.data}|${w.godzina}`, w);
        if (nr >= (odp.maxPages || 1)) break;
      }
    }
    return [...wynik.values()];
  },
};
