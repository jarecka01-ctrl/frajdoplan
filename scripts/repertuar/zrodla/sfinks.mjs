// Kino Sfinks (Ośrodek Kultury Norwida) — lista wydarzeń w HTML, podzielona na strony.
// Biletów online brak, link prowadzi do opisu seansu.
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina } from '../wspolne.mjs';

const BAZA = 'https://kinosfinks.okn.edu.pl';
const MAKS_STRON = 4;

export default {
  id: 'sfinks',
  nazwa: 'Kino Sfinks',
  url: `${BAZA}/wydarzenia-kategoria-158.html`,
  async pobierz() {
    const seanse = [];
    const widziane = new Set();
    let adres = `${BAZA}/wydarzenia-kategoria-158.html`;
    for (let strona = 1; strona <= MAKS_STRON && adres; strona += 1) {
      const $ = cheerio.load(await pobierz(adres));
      let nowe = 0;
      $('li.zaj-wrapper').each((_, li) => {
        const link = $(li).find('a[href*="wydarzenie-"]').first().attr('href') || '';
        const termin = spacje($(li).find('.kali_data_od').text()); // „Od: Sobota, 03-10-2026 godz. 17:00"
        const d = termin.match(/(\d{2})-(\d{2})-(\d{4})/);
        if (!d || !link) return;
        const tagi = $(li).find('.tag').map((__, t) => spacje($(t).text())).get();
        if (!tagi.some((t) => /seanse/i.test(t))) return;
        const klucz = `${link}|${termin}`;
        if (widziane.has(klucz)) return;
        widziane.add(klucz);
        nowe += 1;
        const tytulEl = $(li).find('.title').first().clone();
        tytulEl.find('.etykieta_zajawka').remove();
        seanse.push({
          tytul: spacje(tytulEl.text()).replace(/^tani wtorek:\s*/i, ''),
          data: `${d[3]}-${d[2]}-${d[1]}`,
          godzina: godzina(termin.split('godz.')[1]),
          miejsce: 'Kino Sfinks',
          link: new URL(link, BAZA).href,
          dlaDzieci: tagi.some((t) => /dziec|najmłodsz|familij|rodzin/i.test(t)),
        });
      });
      if (!nowe) break;
      adres = `${BAZA}/wydarzenia-szukaj-strona-${strona + 1}.html`;
    }
    return seanse;
  },
};
