// Filharmonia Krakowska — program koncertów w HTML. Strona ma filtr rodzaju koncertu (`fType`); dla dzieci
// bierzemy rodzaje z oznaczeniem dziecięcym (Koncerty dla Dzieci / familijny, Muzyczne Bobasy, Bajki muzyką pisane,
// Przygody w Muzogrodzie, Nutka DaNutka, Dzieci dzieciom, Kamishibai-ka, opera dziecięca Brundibár).
// „Audycje muzyczne" to koncerty szkolne, więc ich nie bierzemy. Koncerty publikowane są z dużym wyprzedzeniem.
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina, dataPL, pad } from '../wspolne.mjs';

const BAZA = 'https://filharmoniakrakow.pl';
const RODZAJE_DLA_DZIECI = [32, 67, 71, 72, 73, 98, 100, 105, 106];
const NA_STRONE = 6;
const MAKS_STRON = 8;

const adres = (strona, rodzaj) => {
  const sciezka = strona === 1 ? '/public/program' : `/public/program/${strona}`;
  return `${BAZA}${sciezka}?type=pagination&keyword=&fType=${rodzaj}&fPerformer=&fComposer=&fInstruments=&fDateFrom=&fDateTo=&fSubscriptions=`;
};

export function parsuj(html) {
  const $ = cheerio.load(html);
  const wydarzenia = [];
  $('.repRow').each((_, wiersz) => {
    const dzien = spacje($(wiersz).find('.calendar-date-big').first().text());
    const miesiacRok = spacje($(wiersz).find('.calendar-date').first().text()); // „10-2026"
    const data = dataPL(`${dzien}-${miesiacRok}`);
    const tytul = spacje($(wiersz).find('.repRow-title').first().text());
    if (!data || !tytul) return;
    const szczegoly = $(wiersz).find('a.get-content').first().attr('href') || '';
    // pierwszy człon opisu często mówi, o czym jest koncert („Kartonowy plac budowy"); bierzemy go do nazwy
    const podtytul = spacje($(wiersz).find('.repRow-description p').first().text());
    wydarzenia.push({
      tytul: podtytul && podtytul.length <= 80 ? `${tytul}: ${podtytul}` : tytul,
      cykl: tytul,
      data,
      godzina: godzina($(wiersz).find('.calendar-hour').first().text()),
      miejsce: 'Filharmonia Krakowska',
      kategoria: 'koncert',
      typ: 'koncert',
      link: spacje($(wiersz).find('a.primary-btn').first().attr('href') || '').replace(/&amp;/g, '&'),
      strona: szczegoly ? new URL(szczegoly, BAZA).href : '',
      dlaDzieci: true,
    });
  });
  return wydarzenia;
}

export default {
  id: 'filharmonia',
  nazwa: 'Filharmonia Krakowska',
  url: `${BAZA}/public/program`,
  rodzaj: 'wydarzenia',
  wyprzedzenieDni: 180,
  miejsca: [['Filharmonia Krakowska', /filharmoni/i]],
  async pobierz() {
    const wszystkie = [];
    const widziane = new Set();
    for (const rodzaj of RODZAJE_DLA_DZIECI) {
      for (let strona = 1; strona <= MAKS_STRON; strona += 1) {
        const partia = parsuj(await pobierz(adres(strona, rodzaj), { robots: true }));
        for (const w of partia) {
          const klucz = `${w.data}|${w.godzina}|${w.cykl}`;
          if (!widziane.has(klucz)) { widziane.add(klucz); wszystkie.push(w); }
        }
        if (partia.length < NA_STRONE) break;
      }
    }
    return wszystkie;
  },
};
