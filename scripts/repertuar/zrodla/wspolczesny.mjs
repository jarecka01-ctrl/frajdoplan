// Teatr Współczesny w Krakowie — repertuar w HTML (po 10 pozycji; kolejne partie tą samą drogą co przewijanie
// strony: `admin-ajax.php`, akcja `load_more_repertuar`). Każda pozycja ma znaczek „Dla dzieci" / „Dla młodzieży",
// wiek w opisie („od 4 lat") i godziny. Godziny z biletami „dla grup" (poranki szkolne, bez linku) oznaczamy
// `dlaGrup` i nie pokazujemy rodzicom; godziny z linkiem do biletomat.pl są dla wszystkich.
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina, dataPL, wiekZTekstu, wiekDlaDzieci, MIESIACE_DOPELNIACZ } from '../wspolne.mjs';

const BAZA = 'https://teatrkrakow.pl';
const MIESIACE_MIANOWNIK = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
const MAKS_PARTII = 12;

// `rok0`, `mies0`: bieżący rok i miesiąc, żeby ustalić rok z nagłówka miesiąca („styczeń" po „grudzień" = następny rok).
export function parsuj(html, rokPoczatkowy, miesiacPoczatkowy) {
  const $ = cheerio.load(html);
  const wydarzenia = [];
  let rok = rokPoczatkowy;
  let ostatniMiesiac = miesiacPoczatkowy;
  // nagłówki miesięcy i pozycje występują na przemian
  $('.month-heading, .repertuare__section--item').each((_, el) => {
    if ($(el).is('.month-heading')) {
      const m = MIESIACE_MIANOWNIK.indexOf(spacje($(el).text()).toLowerCase()) + 1;
      if (m) { if (m < ostatniMiesiac) rok += 1; ostatniMiesiac = m; }
      return;
    }
    const tytul = spacje($(el).find('h3.heading').first().text());
    const opis = spacje($(el).find('.repertuare__section--content-description').text());
    const znaczek = spacje($(el).find('.badge').first().text());
    const termin = spacje($(el).find('.repertuare__section--content-meta-item .value').first().text()); // „5 października, poniedziałek"
    const scena = spacje($(el).find('.repertuare__section--content-meta-item .value').eq(1).text()).replace(/^Scena:\s*/i, '');
    const data = dataPL(termin, rok);
    if (!tytul || !data) return;
    const wiek = wiekZTekstu(opis);
    const dlaDzieci = /dla dzieci/i.test(znaczek) || (/dla młodzieży/i.test(znaczek) ? false : wiekDlaDzieci(wiek));
    const strona = $(el).find('a.heading-link').first().attr('href') || '';
    $(el).find('.repertuare__section--content-events-list').children().each((__, g) => {
      const czas = godzina($(g).text());
      const link = $(g).is('a') ? $(g).attr('href') || '' : '';
      wydarzenia.push({
        tytul,
        data,
        godzina: czas,
        miejsce: 'Teatr Współczesny',
        scena,
        kategoria: 'spektakl',
        typ: 'spektakl',
        wiek,
        link,
        strona,
        dlaDzieci,
        dlaGrup: !link, // bez linku do biletów online = sprzedaż grupowa
      });
    });
  });
  return wydarzenia;
}

export default {
  id: 'wspolczesny',
  nazwa: 'Teatr Współczesny',
  url: `${BAZA}/repertuar/`,
  rodzaj: 'wydarzenia',
  miejsca: [['Teatr Współczesny', /wsp[oó][lł]czesny/i]],
  async pobierz() {
    const teraz = new Date();
    const rok = teraz.getFullYear();
    const miesiac = teraz.getMonth() + 1;
    const wyniki = parsuj(await pobierz(this.url, { robots: true }), rok, miesiac);
    // kolejne partie po 10 pozycji, aż odpowiedź będzie pusta
    for (let i = 1; i <= MAKS_PARTII; i += 1) {
      const odpowiedz = await pobierz(`${BAZA}/wp-admin/admin-ajax.php`, {
        robots: true,
        cialo: new URLSearchParams({ action: 'load_more_repertuar', offset: String(i * 10), limit: '10', filter_month: '' }),
      });
      if (!odpowiedz.trim()) break;
      const wiecej = parsuj(odpowiedz, rok, miesiac);
      if (!wiecej.length) break;
      wyniki.push(...wiecej);
    }
    return wyniki;
  },
};
