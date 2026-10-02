// Kino Pod Baranami — zwykły HTML w kodowaniu ISO-8859-2.
// Każdy seans ma przycisk z validateAndShowOrderDialog(id,'tytuł','rrrr','mm','dd','gg:mm','dzień','sala',…).
import * as cheerio from 'cheerio';
import { pobierz, spacje, rozbierzTytul } from '../wspolne.mjs';

const BAZA = 'https://www.kinopodbaranami.pl';
const WZOR = /validateAndShowOrderDialog\(\s*(\d+)\s*,\s*'((?:\\'|[^'])*)'\s*,\s*'(\d{4})'\s*,\s*'(\d{1,2})'\s*,\s*'(\d{1,2})'\s*,\s*'([\d:]+)'\s*,\s*'[^']*'\s*,\s*'([^']*)'/;

export default {
  id: 'pod-baranami',
  nazwa: 'Kino Pod Baranami',
  url: `${BAZA}/repertuar.php`,
  async pobierz() {
    const $ = cheerio.load(await pobierz(`${BAZA}/repertuar.php`, { kodowanie: 'iso-8859-2' }));
    const seanse = [];
    $('a[onclick*="validateAndShowOrderDialog"]').each((_, a) => {
      const m = ($(a).attr('onclick') || '').match(WZOR);
      if (!m) return;
      const [, id, surowy, r, mies, d, czas, sala] = m;
      const li = $(a).closest('li');
      const cykl = spacje(li.find('small').text());
      const { tytul, wersja } = rozbierzTytul(surowy.replace(/\\'/g, "'"));
      seanse.push({
        tytul,
        data: `${r}-${mies.padStart(2, '0')}-${d.padStart(2, '0')}`,
        godzina: czas.padStart(5, '0'),
        miejsce: 'Kino Pod Baranami',
        sala: spacje(sala),
        wersja,
        link: `${BAZA}/rezerwacja_start.php?event_id=${id}`,
        film: li.find('a[href*="film.php"]').first().attr('href') ? `${BAZA}/${li.find('a[href*="film.php"]').first().attr('href')}` : '',
        // cykl „Baranki Dzieciom" (bajki i warsztaty, zwykle niedziela 11:00)
        dlaDzieci: /dzieciom|dla dzieci|dla najmłodszych/i.test(cykl),
      });
    });
    return seanse;
  },
};
