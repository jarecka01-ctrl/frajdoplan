// ICE Kraków — kalendarium w zwykłym HTML (/kalendarium: data, kategoria, tytuł, opis, sala, link do biletów; na stronie są
// tylko najbliższe tygodnie). Wydarzenia dla dorosłych dominują, więc „dla dzieci" rozstrzyga ocenaGoscinna.
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina, dataPL, MIESIACE_DOPELNIACZ, pad } from '../wspolne.mjs';
import { ocenaGoscinna } from '../dla-dzieci.mjs';

const BAZA = 'https://icekrakow.pl';

// „sobota, 10 października 2026 16:00 i 19:00" → { data, dataDo, godziny: ['16:00', '19:00'] }
// „4 - 7 października 2026 09:00" → data 2026-10-04, dataDo 2026-10-07
function rozbierzDate(tekst) {
  const t = spacje(tekst).toLowerCase();
  const m = t.match(/(\d{1,2})(?:\s*-\s*(\d{1,2}))?\s+([a-ząćęłńóśźż]+)\s+(\d{4})/);
  if (!m) return null;
  const mies = MIESIACE_DOPELNIACZ.indexOf(m[3]) + 1;
  if (!mies) return null;
  const data = `${m[4]}-${pad(mies)}-${pad(m[1])}`;
  const dataDo = m[2] ? `${m[4]}-${pad(mies)}-${pad(m[2])}` : '';
  return { data, dataDo, godziny: (t.match(/\d{1,2}:\d{2}/g) || []).map(godzina) };
}

export function parsuj(html) {
  const $ = cheerio.load(html);
  const wydarzenia = [];
  $('.event.modal-entity').each((_, el) => {
    const x = $(el);
    const tytul = spacje(x.find('h4').first().text());
    const d = rozbierzDate(x.find('.date').first().text());
    if (!tytul || !d || /odwołan/i.test(tytul)) return;
    const kategoria = spacje(x.find('.cat').first().text());
    const opis = spacje(x.find('.paragraph-text').first().text());
    const sala = spacje(x.find('.upperline').first().text()).split('|')[0].trim();
    const ocena = ocenaGoscinna({ tytul, opis, kategoria });
    const bilety = x.find('a.btn-round').first().attr('href') || '';
    const wspolne = {
      tytul,
      miejsce: sala && !/cały obiekt/i.test(sala) ? `ICE Kraków, ${sala}` : 'ICE Kraków',
      typ: /koncert|symphony|tour/i.test(tytul) ? 'koncert' : 'spektakl',
      kategoria: /koncert|symphony|tour/i.test(tytul) ? 'koncert' : 'spektakl',
      link: bilety,
      strona: `${BAZA}/kalendarium`,
      wiek: ocena.wiek,
      dlaDzieci: ocena.dlaDzieci,
    };
    (d.godziny.length ? d.godziny : ['']).forEach((g) => wydarzenia.push({ ...wspolne, data: d.data, ...(d.dataDo ? { dataDo: d.dataDo } : {}), godzina: g }));
  });
  return wydarzenia;
}

export default {
  id: 'ice-krakow',
  nazwa: 'ICE Kraków',
  url: `${BAZA}/kalendarium`,
  rodzaj: 'wydarzenia',
  goscinne: true, // hala, klub albo teatr z wydarzeniami gościnnymi; brakujące miejsca w arkuszu trafiają do podsumowania
  wyprzedzenieDni: 180,
  miejsca: [['ICE Kraków', /ice\s*krak/i]],
  async pobierz() {
    return parsuj(await pobierz(this.url, { robots: true }));
  },
};
