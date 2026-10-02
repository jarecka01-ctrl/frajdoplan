// Kino Agrafka — zwykły HTML (tylko http). Stare repertuary są w komentarzach HTML, cheerio je pomija.
import * as cheerio from 'cheerio';
import { pobierz, godzina, spacje, zdaniowo, MIESIACE_DOPELNIACZ, pad } from '../wspolne.mjs';

const URL = 'http://kinoagrafka.pl/rep.php';

export default {
  id: 'agrafka',
  nazwa: 'Kino Agrafka',
  url: URL,
  async pobierz() {
    const $ = cheerio.load(await pobierz(URL));
    const seanse = [];
    $('table.repertoire').each((_, tabela) => {
      const naglowek = spacje($(tabela).find('thead h3').text());
      const m = naglowek.match(/(\d{1,2})\s+(\p{L}+)\s+(\d{4})/u);
      const mies = m ? MIESIACE_DOPELNIACZ.indexOf(m[2].toLowerCase()) : -1;
      if (!m || mies < 0) return;
      const data = `${m[3]}-${pad(mies + 1)}-${pad(m[1])}`;
      $(tabela).find('tbody tr').each((__, tr) => {
        const komorka = $(tr).find('td.title');
        const czas = godzina($(tr).find('td.hour').text());
        if (!czas || !komorka.length) return;
        const tekst = spacje(komorka.text());
        const tytulLink = komorka.find('a[href*="film.php"]').first();
        const oryginalny = (tekst.split('|')[1] || '').split(',')[0];
        const tytul = zdaniowo(tytulLink.text() || tekst.split('|')[0], oryginalny);
        const nawias = (tekst.match(/\(([^)]*(?:dubbing|lektor|napisy|animacja|aktorski)[^)]*)\)\s*$/i) || [])[1] || '';
        const wersja = /dubbing/i.test(nawias) ? 'dubbing' : /lektor/i.test(nawias) ? 'lektor' : /napisy/i.test(nawias + tekst) ? 'napisy' : '';
        const gatunek = /animacja/i.test(nawias) ? 'animacja' : '';
        seanse.push({
          tytul,
          data,
          godzina: czas,
          miejsce: 'Kino Agrafka',
          wersja,
          gatunek,
          link: $(tr).find('td.link a').attr('href') || '',
          // cykle dla najmłodszych: „Czytamy i oglądamy", „dla najmłodszych"
          dlaDzieci: /czytamy i oglądamy|dla najmłodszych/i.test(tekst),
        });
      });
    });
    return seanse;
  },
};
