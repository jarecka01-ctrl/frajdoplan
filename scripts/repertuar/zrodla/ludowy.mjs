// Teatr Ludowy — repertuar miesiąc po miesiącu w zwykłym HTML (`/repertuar/?rep_month=10&rep_year=2026`).
// Wiek podaje dopiero strona spektaklu („Spektakl dla widzów 6+"), więc czytamy ją raz na tytuł.
// Dla dzieci: wiek do 12 lat albo scena TIM (Teatralny Instytut Młodych). Poranki z „rezerwacją grupową"
// (bez linku do biletów) są dla szkół — oznaczamy je `dlaGrup` i nie pokazujemy rodzicom.
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina, pad, wiekDlaDzieci } from '../wspolne.mjs';

const BAZA = 'https://ludowy.pl';

export function parsuj(html, rok, miesiac) {
  const $ = cheerio.load(html);
  const wydarzenia = [];
  $('.repertoire-list-list-item').each((_, dzien) => {
    const nr = parseInt(spacje($(dzien).find('.repertoire-list-list-item-day-content-nr').first().text()), 10);
    if (!nr) return;
    $(dzien).find('article.repertoire-list-list-item-spectacles-item').each((__, art) => {
      const tytulEl = $(art).find('.repertoire-list-list-item-spectacles-item-content-link-title').first().clone();
      tytulEl.find('.sr-only').remove();
      const tytul = spacje(tytulEl.text());
      if (!tytul) return;
      const tagi = $(art).find('.repertoire-list-list-item-spectacles-item-tags--desktop span').map((___, t) => spacje($(t).text())).get();
      const scena = tagi[0] || '';
      const przycisk = $(art).find('a.btn').first();
      const wyprzedane = /wyprzedane/i.test($(art).find('.btn').text());
      wydarzenia.push({
        tytul,
        data: `${rok}-${pad(miesiac)}-${pad(nr)}`,
        godzina: godzina($(art).find('.repertoire-list-list-item-spectacles-item-hour').first().text()),
        miejsce: 'Teatr Ludowy',
        scena,
        kategoria: 'spektakl',
        typ: 'spektakl',
        link: wyprzedane ? '' : przycisk.attr('href') || '',
        strona: $(art).find('a.repertoire-list-list-item-spectacles-item-content-link').first().attr('href') || '',
        // rezerwacja grupowa tylko przez biuro obsługi widza = poranek dla szkół
        dlaGrup: tagi.some((t) => /rezerwacja grupowa/i.test(t)) && !przycisk.length,
        scenaDzieci: /^TIM/i.test(scena),
      });
    });
  });
  return wydarzenia;
}

// „* Spektakl dla widzów 6+" → '6+'
export const wiekZeStrony = (html) => {
  const m = cheerio.load(html).text().match(/dla widz[óo]w\s+(\d{1,2})\s*\+/i);
  return m ? `${m[1]}+` : '';
};

export default {
  id: 'ludowy',
  nazwa: 'Teatr Ludowy',
  url: `${BAZA}/repertuar/`,
  rodzaj: 'wydarzenia',
  miejsca: [['Teatr Ludowy', /teatr ludowy|ludowy/i]],
  async pobierz() {
    const teraz = new Date();
    const wyniki = [];
    for (let i = 0; i < 3; i += 1) { // 60 dni to bieżący i dwa następne miesiące
      const d = new Date(Date.UTC(teraz.getUTCFullYear(), teraz.getUTCMonth() + i, 1));
      const rok = d.getUTCFullYear();
      const miesiac = d.getUTCMonth() + 1;
      wyniki.push(...parsuj(await pobierz(`${BAZA}/repertuar/?rep_month=${miesiac}&rep_year=${rok}`, { robots: true }), rok, miesiac));
    }
    const wieki = new Map();
    for (const strona of new Set(wyniki.map((w) => w.strona).filter(Boolean))) {
      try { wieki.set(strona, wiekZeStrony(await pobierz(strona, { robots: true }))); } catch (e) { wieki.set(strona, ''); }
    }
    for (const w of wyniki) {
      w.wiek = wieki.get(w.strona) || '';
      // wiek ze strony spektaklu rozstrzyga; bez wieku nie wiadomo (scena TIM to też młodzież i dorośli),
      // więc tytuł trafia do „do weryfikacji"
      w.dlaDzieci = w.wiek ? wiekDlaDzieci(w.wiek) : null;
      delete w.scenaDzieci;
    }
    return wyniki;
  },
};
