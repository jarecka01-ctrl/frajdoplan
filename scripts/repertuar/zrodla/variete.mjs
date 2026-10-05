// Krakowski Teatr VARIETE — strona „Sprawdź repertuar" to aplikacja Next.js z danymi w znaczniku __NEXT_DATA__ (JSON):
// każdy spektakl ma tytuł, opis i listę terminów („upcoming": data, godzina, link do biletów). Daje to wszystkie terminy
// na kilkanaście miesięcy. Teatr pokazuje głównie musicale dla dorosłych, więc „dla dzieci" rozstrzyga ocenaGoscinna
// po opisie (np. „rekomendowany dla widzów od 10. roku życia"); niepewne (np. „Adonis ma gościa", spektakl dla szkół)
// trafiają do „do weryfikacji". Poranki w dni robocze przed 13:00 to terminy dla grup.
import * as cheerio from 'cheerio';
import { pobierz, godzina, dzienTygodnia } from '../wspolne.mjs';
import { ocenaGoscinna, tekstZHtml } from '../dla-dzieci.mjs';

const BAZA = 'https://www.teatrvariete.pl';

// Zbiera wszystkie teksty obiektu (bez listy terminów), do oceny „dla dzieci".
function teksty(o, wynik = []) {
  if (typeof o === 'string') { if (!/^https?:/.test(o)) wynik.push(o); }
  else if (Array.isArray(o)) o.forEach((v) => teksty(v, wynik));
  else if (o && typeof o === 'object') Object.entries(o).forEach(([k, v]) => { if (k !== 'upcoming') teksty(v, wynik); });
  return wynik;
}

export function parsuj(html) {
  const dane = cheerio.load(html)('script#__NEXT_DATA__').first().html();
  if (!dane) throw new Error('Variété: brak danych __NEXT_DATA__ (zmiana strony?)');
  const json = JSON.parse(dane);
  const spektakle = new Map();
  const szukaj = (o) => {
    if (Array.isArray(o)) { o.forEach(szukaj); return; }
    if (!o || typeof o !== 'object') return;
    const tytul = o.title && typeof o.title === 'object' ? o.title.rendered : '';
    if (tytul && o.slug && !spektakle.has(o.slug) && JSON.stringify(o).includes('"upcoming"')) {
      const terminy = [];
      const zbierz = (x) => {
        if (Array.isArray(x)) { x.forEach(zbierz); return; }
        if (!x || typeof x !== 'object') return;
        if (x.upcoming && Array.isArray(x.upcoming.items)) terminy.push(...x.upcoming.items);
        Object.values(x).forEach(zbierz);
      };
      zbierz(o);
      if (terminy.length) spektakle.set(o.slug, { tytul: tekstZHtml(tytul), slug: o.slug, opis: tekstZHtml(teksty(o).join(' ')).slice(0, 6000), terminy });
    }
    Object.values(o).forEach(szukaj);
  };
  szukaj(json.props);

  const wydarzenia = [];
  for (const s of spektakle.values()) {
    const ocena = ocenaGoscinna({ tytul: s.tytul, opis: s.opis });
    const koncert = /koncert/i.test(s.tytul);
    const klucze = new Set();
    for (const t of s.terminy) {
      const m = String(t.date || '').match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/);
      if (!m || klucze.has(t.date)) continue;
      klucze.add(t.date);
      const g = godzina(m[2]);
      const dzien = dzienTygodnia(m[1]);
      wydarzenia.push({
        tytul: s.tytul,
        data: m[1],
        godzina: g,
        miejsce: 'Krakowski Teatr VARIETE',
        typ: koncert ? 'koncert' : 'spektakl',
        kategoria: koncert ? 'koncert' : 'spektakl',
        link: (t.link && t.link.url) || '',
        strona: `${BAZA}/repertuar/spektakle`,
        wiek: ocena.wiek,
        dlaDzieci: ocena.dlaDzieci,
        dlaGrup: dzien >= 1 && dzien <= 5 && g < '13:00',
      });
    }
  }
  return wydarzenia;
}

export default {
  id: 'variete',
  nazwa: 'Krakowski Teatr VARIETE',
  url: `${BAZA}/repertuar/sprawdz-repertuar`,
  rodzaj: 'wydarzenia',
  goscinne: true, // hala, klub albo teatr z wydarzeniami gościnnymi; brakujące miejsca w arkuszu trafiają do podsumowania
  wyprzedzenieDni: 180,
  miejsca: [['Krakowski Teatr VARIETE', /variet/i]],
  async pobierz() {
    return parsuj(await pobierz(this.url, { robots: true }));
  },
};
