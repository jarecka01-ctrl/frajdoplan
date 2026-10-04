// ZIS Kraków — „Dzieciaki na start!": cykl bezpłatnych treningów ruchowych dla dzieci (6–14 lat).
// Harmonogram to zwykła tabela HTML (miesiąc, data, godzina, miejsce/opis, zapisy).
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina, dataPL } from '../wspolne.mjs';

const BAZA = 'https://zis.krakow.pl';

export function parsuj(html) {
  const $ = cheerio.load(html);
  const wydarzenia = [];
  $('table tr').each((_, tr) => {
    const komorki = $(tr).find('td').map((__, td) => spacje($(td).text())).get();
    // wiersz z miesiącem ma 5 komórek, kolejne wiersze tego samego miesiąca 4 (miesiąc scalony)
    const poz = komorki.findIndex((k) => /^\d{1,2}\.\d{2}\.\d{4}$/.test(k));
    if (poz < 0) return;
    const data = dataPL(komorki[poz]);
    const opis = komorki[poz + 2] || '';
    if (!data || !opis) return;
    const link = $(tr).find('a[href]').filter((__, a) => /formularz/i.test($(a).text())).first().attr('href') || '';
    wydarzenia.push({
      tytul: `Dzieciaki na start: ${opis.replace(/^\*\s*/, '')}`,
      data,
      godzina: godzina(komorki[poz + 1]),
      miejsce: 'ZIS Kraków',
      kategoria: 'sport',
      typ: 'wydarzenie',
      wiek: '6–14 lat',
      cena: 'bezpłatnie',
      strona: `${BAZA}/dzieciaki-na-start`,
      link: link ? new URL(link, BAZA).href : '',
      dlaDzieci: true,
    });
  });
  return wydarzenia;
}

export default {
  id: 'zis',
  nazwa: 'Dzieciaki na start (ZIS Kraków)',
  url: `${BAZA}/dzieciaki-na-start`,
  rodzaj: 'wydarzenia',
  miejsca: [],
  async pobierz() {
    return parsuj(await pobierz(this.url, { robots: true }));
  },
};
