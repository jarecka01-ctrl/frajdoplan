// Teatr Szczęście — repertuar w zwykłym HTML (tabela: data, kategoria, godziny, tytuł, link do ekobilet.pl).
// Dla dzieci: kategoria „Dla dzieci, młodzieży i rodziców".
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina, dataPL } from '../wspolne.mjs';

const BAZA = 'https://teatrszczescie.pl';

const bezSledzenia = (adres) => {
  try { const u = new URL(adres); u.searchParams.delete('fbclid'); return u.href; } catch (e) { return adres; }
};

export function parsuj(html) {
  const $ = cheerio.load(html);
  const wydarzenia = [];
  $('table.table-hover > tbody > tr, table.table-hover > tr').each((_, wiersz) => {
    const data = dataPL($(wiersz).children('th').first().clone().children().remove().end().text());
    if (!data) return;
    $(wiersz).find('td').each((__, kolumna) => {
      const kategoria = spacje($(kolumna).find('.art-stage').first().text());
      if (!kategoria) return;
      $(kolumna).find('div.mb-3').each((___, blok) => {
        const g = godzina($(blok).find('small').first().text());
        const tytul = spacje($(blok).find('a.text-muted').first().text());
        if (!tytul) return;
        wydarzenia.push({
          tytul,
          data,
          godzina: g,
          miejsce: 'Teatr Szczęście',
          kategoria: 'spektakl',
          typ: 'spektakl',
          link: bezSledzenia($(blok).find('a.text-primary').first().attr('href') || ''),
          strona: $(blok).find('a.text-muted').first().attr('href') || '',
          dlaDzieci: /dla dzieci/i.test(kategoria),
        });
      });
    });
  });
  // zagnieżdżone tabele: ten sam termin może trafić do listy dwa razy
  const klucze = new Set();
  return wydarzenia.filter((w) => { const k = `${w.data}|${w.godzina}|${w.tytul}`; if (klucze.has(k)) return false; klucze.add(k); return true; });
}

export default {
  id: 'szczescie',
  nazwa: 'Teatr Szczęście',
  url: `${BAZA}/repertuar/`,
  rodzaj: 'wydarzenia',
  miejsca: [['Teatr Szczęście', /szcz[eę][sś]cie/i]],
  async pobierz() {
    return parsuj(await pobierz(this.url, { robots: true }));
  },
};
