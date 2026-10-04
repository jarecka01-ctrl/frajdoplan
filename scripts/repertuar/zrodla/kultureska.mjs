// Teatr Kultureska — repertuar dla dzieci w ramce `/rep/view_table.php` (zwykły HTML: data, godzina, tytuł, cena).
// Poranki w dni robocze to spektakle dla grup szkolnych i przedszkolnych (rezerwacja mailowa) — oznaczamy je
// `dlaGrup` i nie pokazujemy rodzicom. Spektakle w weekendy i po południu są dla wszystkich.
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina, dataPL, dzienTygodnia } from '../wspolne.mjs';

const BAZA = 'https://kultureska.pl';

export function parsuj(html) {
  const $ = cheerio.load(html);
  const wydarzenia = [];
  $('div.flex').each((_, wiersz) => {
    const data = dataPL($(wiersz).find('.data').first().text());
    const g = godzina($(wiersz).find('.godzina').first().text());
    const tytulEl = $(wiersz).find('.tytul a').first();
    const tytul = spacje(tytulEl.clone().children().remove().end().text());
    if (!data || !tytul) return;
    const dzien = dzienTygodnia(data);
    const roboczy = dzien >= 1 && dzien <= 5;
    const przedPoludniem = g && g < '13:00';
    const href = tytulEl.attr('href') || '';
    wydarzenia.push({
      tytul,
      data,
      godzina: g,
      miejsce: 'Teatr Kultureska',
      kategoria: 'spektakl',
      typ: 'spektakl',
      cena: spacje($(wiersz).find('.cena').last().text()).replace(/^Cena$/i, ''),
      strona: href ? new URL(href, `${BAZA}/rep/`).href : '',
      dlaDzieci: true, // cały repertuar teatru jest dla dzieci
      dlaGrup: roboczy && Boolean(przedPoludniem),
    });
  });
  return wydarzenia;
}

export default {
  id: 'kultureska',
  nazwa: 'Teatr Kultureska',
  url: `${BAZA}/repertuar`,
  rodzaj: 'wydarzenia',
  miejsca: [['Teatr Kultureska', /kultureska/i]],
  async pobierz() {
    return parsuj(await pobierz(`${BAZA}/rep/view_table.php`, { robots: true }));
  },
};
