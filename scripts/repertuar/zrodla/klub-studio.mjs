// Klub Studio — pełny kalendarz wydarzeń ładuje skrypt strony z adresu /index.ajax (kolejne partie po 10 wydarzeń:
// pierwsza przez GET, następne przez POST z numerem strony, tak jak przycisk „więcej" na stronie /wydarzenia). Odpowiedź
// to zwykły HTML: data i godzina, tytuł, adres wydarzenia (z typem), „Bilety od … zł", przycisk do sprzedawcy biletów.
// Klub ma głównie koncerty rockowe i kabarety, więc „dla dzieci" rozstrzyga ocenaGoscinna (po samym tytule).
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina } from '../wspolne.mjs';
import { ocenaGoscinna } from '../dla-dzieci.mjs';

const BAZA = 'https://www.klubstudio.pl';
const MAKS_STRON = 12;

export function parsuj(html) {
  const $ = cheerio.load(html);
  const wydarzenia = [];
  $('.row.bottommargin-lg').each((_, el) => {
    const x = $(el);
    const href = x.find('h1.head a').first().attr('href') || '';
    const m = href.match(/^\/([a-z_-]+)\/[A-Za-z0-9]+\/(\d{4}-\d{2}-\d{2})\//);
    const tytul = spacje(x.find('h1.head a').first().text());
    if (!m || !tytul) return;
    const typ = m[1];
    const ocena = ocenaGoscinna({ tytul, kategoria: typ });
    const strona = new URL(href, BAZA).href;
    const bilety = x.find('a.button').first().attr('href') || '';
    const cena = spacje(x.find('a.entry-title h6').filter((__, h) => /^bilety od/i.test($(h).text().trim())).first().text()).replace(/^bilety\s+/i, '');
    wydarzenia.push({
      tytul,
      data: m[2],
      godzina: godzina(x.find('a.entry-title h6').first().text()),
      miejsce: 'Klub Studio',
      typ: typ === 'koncert' ? 'koncert' : 'widowisko',
      kategoria: typ === 'koncert' ? 'koncert' : 'pokaz',
      link: /^https?:/.test(bilety) ? bilety : strona,
      strona,
      cena,
      wiek: ocena.wiek,
      dlaDzieci: ocena.dlaDzieci,
    });
  });
  return wydarzenia;
}

export default {
  id: 'klub-studio',
  nazwa: 'Klub Studio',
  url: `${BAZA}/wydarzenia`,
  rodzaj: 'wydarzenia',
  goscinne: true, // hala, klub albo teatr z wydarzeniami gościnnymi; brakujące miejsca w arkuszu trafiają do podsumowania
  wyprzedzenieDni: 180,
  miejsca: [['Klub Studio', /klub\s*studio/i]],
  async pobierz() {
    const wszystkie = [];
    for (let strona = 1; strona <= MAKS_STRON; strona += 1) {
      const html = strona === 1
        ? await pobierz(`${BAZA}/index.ajax`, { robots: true })
        : await pobierz(`${BAZA}/index.ajax`, { robots: true, cialo: new URLSearchParams({ page: String(strona) }) });
      wszystkie.push(...parsuj(html));
      if (html.includes('end-of-data') || !html.trim()) break;
    }
    return [...new Map(wszystkie.map((w) => [`${w.strona}|${w.godzina}`, w])).values()];
  },
};
