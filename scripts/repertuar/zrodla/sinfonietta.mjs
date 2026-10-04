// Sinfonietta Cracovia — kalendarium koncertów w HTML (Webflow). Dla dzieci tylko cykl „Sinfonietka".
// Koncerty „dla klas…" to poranki szkolne, więc oznaczamy je `dlaGrup` i nie pokazujemy rodzicom.
// Strona nie podaje roku — wyznaczamy go z kolejności dat (kalendarium idzie chronologicznie).
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina, pad } from '../wspolne.mjs';

const BAZA = 'https://sinfonietta.pl';

export function parsuj(html, rokPoczatkowy, miesiacPoczatkowy) {
  const $ = cheerio.load(html);
  const wydarzenia = [];
  let rok = rokPoczatkowy;
  let poprzedni = miesiacPoczatkowy;
  $('.concert-item').each((_, el) => {
    const dzien = parseInt(spacje($(el).find('.date .heading-4').eq(0).text()), 10);
    const miesiac = parseInt(spacje($(el).find('.date .heading-4').eq(1).text()), 10);
    const tytul = spacje($(el).find('.concert-title .heading-5').first().text());
    if (!dzien || !miesiac || !tytul) return;
    if (miesiac < poprzedni) rok += 1;
    poprzedni = miesiac;
    const cykl = spacje($(el).find('.concert-title .overline').first().text());
    const miejsce = spacje($(el).find('.address').first().text());
    const kup = $(el).find('a.primary-button').filter((__, a) => !$(a).hasClass('w-condition-invisible') && /kup bilet/i.test($(a).text())).first();
    const strona = $(el).find('a.concert-title').first().attr('href') || '';
    wydarzenia.push({
      tytul,
      cykl,
      data: `${rok}-${pad(miesiac)}-${pad(dzien)}`,
      godzina: godzina($(el).find('.date.vertical .overline').eq(1).text()),
      miejsce: miejsce || 'Sinfonietta Cracovia',
      kategoria: 'koncert',
      typ: 'koncert',
      link: kup.attr('href') && kup.attr('href') !== '#' ? kup.attr('href') : '',
      strona: strona ? new URL(strona, BAZA).href : '',
      dlaDzieci: /sinfonietka/i.test(cykl),
      dlaGrup: /dla klas/i.test(tytul),
    });
  });
  return wydarzenia;
}

export default {
  id: 'sinfonietta',
  nazwa: 'Sinfonietta Cracovia',
  url: `${BAZA}/kalendarium`,
  rodzaj: 'wydarzenia',
  wyprzedzenieDni: 180,
  miejsca: [['Sinfonietta Cracovia', /sinfonietta/i]],
  async pobierz() {
    const teraz = new Date();
    return parsuj(await pobierz(this.url, { robots: true }), teraz.getFullYear(), teraz.getMonth() + 1);
  },
};
