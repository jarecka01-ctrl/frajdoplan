// Ośrodek Kultury Norwida (Nowa Huta: Kuźnia, ARTzona, Nowohuckie Laboratorium Dziedzictwa, biblioteki, galerie).
// Jeden kalendarz na okn.edu.pl; dla dzieci bierzemy kategorie „Dla dzieci", „Dla rodzin" i „Dla rodziców z maluszkami".
// Kino Sfinks ma własny moduł (to samo źródło, osobne podejście), więc seanse pomijamy.
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina, dataPL, wiekZTekstu } from '../wspolne.mjs';

const BAZA = 'https://okn.edu.pl';
const KATEGORIE = [[225, 'Dla dzieci'], [223, 'Dla rodzin'], [224, 'Dla rodziców z maluszkami']];
const MAKS_STRON = 3;

// Kategoria strony → kategoria frajdoplanu (z tagów wydarzenia).
const kategoriaZTagow = (tagi) => {
  const t = tagi.join(' ').toLowerCase();
  if (/koncert/.test(t)) return 'koncert';
  if (/warsztat/.test(t)) return 'warsztaty';
  if (/wystaw|w galeriach/.test(t)) return 'wystawa';
  if (/literatur|czytan/.test(t)) return 'czytanie';
  if (/festiwal/.test(t)) return 'festyn';
  return 'inne';
};

export function parsuj(html) {
  const $ = cheerio.load(html);
  const wydarzenia = [];
  $('li.zaj-wrapper').each((_, li) => {
    const link = $(li).find('a[href*="wydarzenie-"]').first().attr('href') || '';
    const termin = spacje($(li).find('.kali_data_od').first().text()); // „Od: Sobota, 10-10-2026 godz. 10:00"
    const data = dataPL(termin);
    if (!data || !link) return;
    const tagi = [...new Set($(li).find('.kategorie .tag').map((__, t) => spacje($(t).text())).get())];
    if (tagi.some((t) => /^film$/i.test(t))) return; // seanse kinowe
    const tytulEl = $(li).find('.title').first().clone();
    tytulEl.find('.etykieta_zajawka').remove();
    const opis = spacje($(li).find('img').first().attr('alt') || ''); // „… dla dzieci 5–9 lat. 10.10.2026, godz. 10:00–11:00. Wstęp: 30 zł/dziecko. …"
    const cena = (opis.match(/Wstęp:\s*([^.]*?(?:zł[^.]*|wolny|bezpłatny))\./i) || [])[1] || '';
    wydarzenia.push({
      tytul: spacje(tytulEl.text()),
      data,
      godzina: godzina(termin.split('godz.')[1]),
      miejsce: spacje($(li).find('.miejsce').first().text()) || 'Ośrodek Kultury Norwida',
      kategoria: kategoriaZTagow(tagi),
      typ: 'wydarzenie',
      wiek: wiekZTekstu(opis),
      cena: spacje(cena),
      strona: new URL(link, BAZA).href,
      link: '',
      dlaDzieci: true, // wybrane z kategorii „dla dzieci / rodzin / maluszków"
    });
  });
  const nastepna = $('a[href*="strona-"]').map((_, a) => $(a).attr('href')).get().find((h) => /wydarzenia-.*strona-\d+\.html/.test(h));
  return { wydarzenia, nastepna: nastepna || '' };
}

export default {
  id: 'okn',
  nazwa: 'Ośrodek Kultury Norwida',
  url: `${BAZA}/wydarzenia.html`,
  rodzaj: 'wydarzenia',
  miejsca: [
    ['Kuźnia', /kuźnia|kuznia/i],
    ['ARTzona', /artzona/i],
    ['Ośrodek Kultury Norwida', /ośrodek kultury norwida|ośrodek kultury (im\. )?c\.? ?k\.? norwida|norwid/i],
  ],
  async pobierz() {
    const wynik = [];
    for (const [id] of KATEGORIE) {
      let adres = `${BAZA}/wydarzenia-kategoria-${id}.html`;
      const odwiedzone = new Set();
      for (let strona = 1; strona <= MAKS_STRON && adres && !odwiedzone.has(adres); strona += 1) {
        odwiedzone.add(adres);
        const { wydarzenia, nastepna } = parsuj(await pobierz(adres, { robots: true }));
        wynik.push(...wydarzenia);
        adres = nastepna ? new URL(nastepna, BAZA).href : '';
      }
    }
    return wynik;
  },
};
