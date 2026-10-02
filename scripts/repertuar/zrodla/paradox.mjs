// Kino Paradox — zwykły HTML (WordPress). Gatunek jest na stronie filmu: jedno zapytanie na film.
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina, rozbierzTytul } from '../wspolne.mjs';

const URL = 'https://kinoparadox.pl/repertuar/';

async function gatunekFilmu(adres) {
  const $ = cheerio.load(await pobierz(adres));
  const pole = (nazwa) => {
    let wynik = '';
    $('*').each((_, el) => {
      if (!wynik && $(el).children().length === 0 && spacje($(el).text()) === nazwa) {
        wynik = spacje($(el).next().text() || $(el).parent().next().text());
      }
    });
    return wynik;
  };
  return { gatunek: pole('Gatunek'), wersja: pole('Wersja językowa') };
}

export default {
  id: 'paradox',
  nazwa: 'Kino Paradox',
  url: URL,
  async pobierz() {
    const $ = cheerio.load(await pobierz(URL));
    const seanse = [];
    $('.list-item__content__row[data-date]').each((_, wiersz) => {
      const [dd, mm, rrrr] = String($(wiersz).attr('data-date')).split('.');
      const tytulEl = $(wiersz).find('a.item-title');
      tytulEl.find('.item-photo').remove();
      const { tytul, wersja } = rozbierzTytul(tytulEl.text());
      seanse.push({
        tytul,
        data: `${rrrr}-${mm}-${dd}`,
        godzina: godzina($(wiersz).find('.item-time').text()),
        miejsce: 'Kino Paradox',
        wersja,
        link: $(wiersz).find('.item-button a').attr('href') || '',
        strona: tytulEl.attr('href') || '',
      });
    });
    // gatunek i wersja ze strony filmu (każdy film raz)
    const opisy = {};
    for (const adres of [...new Set(seanse.map((s) => s.strona).filter(Boolean))]) {
      try { opisy[adres] = await gatunekFilmu(adres); } catch (e) { opisy[adres] = {}; }
    }
    return seanse.map(({ strona, ...s }) => {
      const o = opisy[strona] || {};
      const wersja = s.wersja || (/dubbing/i.test(o.wersja) ? 'dubbing' : /napisy/i.test(o.wersja) ? 'napisy' : '');
      return { ...s, wersja, gatunek: (o.gatunek || '').toLowerCase() };
    });
  },
};
