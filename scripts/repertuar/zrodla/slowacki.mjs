// Teatr im. Juliusza Słowackiego (teatrwkrakowie.pl) — strona repertuaru ładuje kolejne miesiące zwykłym żądaniem POST
// `/ajax/pl/repertoireList` (formularz: filters[…], startDate, lastDate), odpowiedź to JSON z fragmentem HTML („template").
// To samo żądanie wysyła przeglądarka przy zmianie miesiąca; nie potrzeba przeglądarki headless. Jeden POST zwraca
// dni od `startDate` do końca miesiąca.
// Repertuar teatru jest dla dorosłych i nie ma oznaczeń dla dzieci, więc „dla dzieci" rozstrzyga ocenaGoscinna
// (po tytule); bierzemy tylko spektakle, premiery i koncerty (bez filmów, zwiedzania, spotkań i wydarzeń zewnętrznych).
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina, pad, dzisWarszawa, miesiaceOkna } from '../wspolne.mjs';
import { ocenaGoscinna } from '../dla-dzieci.mjs';

const BAZA = 'https://teatrwkrakowie.pl';
const DNI_WYPRZEDZENIA = 60;
const MIESIACE = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];

export function parsuj(htmlFragment) {
  const $ = cheerio.load(htmlFragment);
  const wydarzenia = [];
  $('.day-wrap').each((_, dzienEl) => {
    const dzien = $(dzienEl).find('.day-number').first().text().trim();
    const [nazwaMies, rok] = spacje($(dzienEl).find('.month-year').first().text()).toLowerCase().split(' ');
    const mies = MIESIACE.indexOf(nazwaMies) + 1;
    if (!dzien || !mies || !rok) return;
    const data = `${rok}-${pad(mies)}-${pad(dzien)}`;
    $(dzienEl).find('.block').each((__, blok) => {
      const b = $(blok);
      const rodzaj = spacje(b.find('.event-type').first().clone().children().remove().end().text());
      if (!/^(spektakl|premiera|koncert)/i.test(rodzaj)) return;
      const a = b.find('h2 a').first();
      const tytul = spacje(a.text());
      if (!tytul) return;
      const sala = spacje(b.find('.desc a[href*="/sceny/"]').first().text());
      const bilety = b.find('.tickets a[href^="http"]').first().attr('href') || '';
      const ocena = ocenaGoscinna({ tytul, kategoria: rodzaj });
      const koncert = /koncert/i.test(rodzaj);
      b.find('.time').each((___, t) => {
        wydarzenia.push({
          tytul,
          data,
          godzina: godzina($(t).text()),
          miejsce: 'Teatr im. Juliusza Słowackiego',
          kategoria: koncert ? 'koncert' : 'spektakl',
          typ: koncert ? 'koncert' : 'spektakl',
          link: bilety,
          strona: a.attr('href') ? new URL(a.attr('href'), BAZA).href : '',
          wiek: ocena.wiek,
          dlaDzieci: ocena.dlaDzieci,
          sala,
        });
      });
    });
  });
  return wydarzenia;
}

export default {
  id: 'slowacki',
  nazwa: 'Teatr im. Słowackiego',
  url: `${BAZA}/repertuar`,
  rodzaj: 'wydarzenia',
  miejsca: [['Teatr im. Juliusza Słowackiego', /s[łl]owackiego/i]],
  async pobierz() {
    const dzis = dzisWarszawa();
    const wszystkie = [];
    for (const [rok, mies] of miesiaceOkna(dzis, DNI_WYPRZEDZENIA)) {
      const od = rok === Number(dzis.slice(0, 4)) && mies === Number(dzis.slice(5, 7)) ? dzis : `${rok}-${pad(mies)}-01`;
      const formularz = new URLSearchParams({
        'filters[0][type]': 'type', 'filters[0][value]': 'current',
        'filters[1][type]': 'EventType', 'filters[1][value]': 'all',
        'filters[2][type]': 'Event', 'filters[2][value]': 'all',
        'filters[3][type]': 'search', 'filters[3][value]': '',
        startDate: od,
        lastDate: `${Number(dzis.slice(0, 4)) + 1}-12-31`,
      });
      const json = await pobierz(`${BAZA}/ajax/pl/repertoireList`, { robots: true, cialo: formularz, json: true });
      wszystkie.push(...parsuj(json.template || ''));
    }
    return wszystkie;
  },
};
