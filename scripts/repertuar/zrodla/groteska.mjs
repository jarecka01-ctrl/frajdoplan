// Teatr Groteska — repertuar w zwykłym HTML, osobna strona na miesiąc (`/repertuar/10/2026`): dzień, godzina, tytuł z adresem
// spektaklu (`/spektakle/dla-dzieci/…` albo `/spektakle/dla-doroslych/…`), sala, link do biletów albo informacja o rezerwacji
// telefonicznej. Dla dzieci: kategoria „dla-dzieci" w adresie spektaklu; „dla-doroslych" odpada; pozostałe kategorie
// (wydarzenia, czytanki, nowe sztuki…) trafiają do „do weryfikacji".
// Poranki w dni robocze bez biletów online, z samą rezerwacją telefoniczną, to spektakle dla grup szkolnych i przedszkolnych
// (`dlaGrup`, jak w Kultureskach); termin z biletami online jest dla wszystkich, także rano. „Dostępne czwartki" (spektakle
// dostępne dla osób z niepełnosprawnościami) nie są dla grup.
import * as cheerio from 'cheerio';
import { pobierz, spacje, dzienTygodnia, pad, dzisWarszawa, miesiaceOkna } from '../wspolne.mjs';

const BAZA = 'https://www.groteska.pl';
const DNI_WYPRZEDZENIA = 60;

// „9<sup>00</sup>" → „09:00"
const godzinaZWiersza = (el, $) => {
  const t = spacje($(el).html().replace(/<sup>/gi, ':').replace(/<[^>]+>/g, ''));
  const m = t.match(/(\d{1,2}):?(\d{2})/);
  return m ? `${pad(m[1])}:${m[2]}` : '';
};

const ocenaKategorii = (kategoria, tytul) => {
  if (/dla-dzieci/i.test(kategoria)) return true;
  if (/dla-doroslych/i.test(kategoria) || /dla dorosłych/i.test(tytul)) return false;
  if (/dla dzieci/i.test(tytul)) return true;
  return undefined; // wydarzenia, czytanki, nowe sztuki: nie wiadomo
};

export function parsuj(html, rok, miesiac) {
  const $ = cheerio.load(html);
  const wydarzenia = [];
  $('.m-repertoire > .row').each((_, wiersz) => {
    const x = $(wiersz);
    const kolumny = x.children('.col-auto');
    const dzien = (spacje(kolumny.first().text()).match(/^\d{1,2}/) || [])[0];
    const g = kolumny.length > 1 ? godzinaZWiersza(kolumny.eq(1), $) : '';
    const a = x.find('a.text-uppercase').first();
    const tytul = spacje(a.text());
    if (!dzien || !tytul) return;
    const href = a.attr('href') || '';
    const kategoria = decodeURIComponent(href.replace(/^\/spektakle\//, '').split('/')[0] || '');
    const informacja = spacje(x.find('.m-repertoire-info').text());
    const bilety = x.find('a[href*="kup-bilet"]').first().attr('href') || '';
    const data = `${rok}-${pad(miesiac)}-${pad(dzien)}`;
    const dzienTyg = dzienTygodnia(data);
    const roboczy = dzienTyg >= 1 && dzienTyg <= 5;
    wydarzenia.push({
      tytul,
      data,
      godzina: g,
      miejsce: 'Teatr Groteska',
      kategoria: 'spektakl',
      typ: 'spektakl',
      link: bilety,
      strona: href ? new URL(href, BAZA).href : '',
      dlaDzieci: ocenaKategorii(kategoria, tytul),
      dlaGrup: roboczy && Boolean(g) && g < '13:00' && !bilety && /rezerwacj/i.test(informacja) && !/dostępne/i.test(informacja),
    });
  });
  return wydarzenia;
}

export default {
  id: 'groteska',
  nazwa: 'Teatr Groteska',
  url: `${BAZA}/repertuar`,
  rodzaj: 'wydarzenia',
  miejsca: [['Teatr Groteska', /groteska/i]],
  async pobierz() {
    const wszystkie = [];
    for (const [rok, mies] of miesiaceOkna(dzisWarszawa(), DNI_WYPRZEDZENIA)) {
      wszystkie.push(...parsuj(await pobierz(`${BAZA}/repertuar/${mies}/${rok}`, { robots: true }), rok, mies));
    }
    return wszystkie;
  },
};
