// krakow.pl — „Kraków dla dzieci": miejski kalendarz wydarzeń dla dzieci (kategoria 2431), wybrana przez urząd miasta.
// Strona główna ma w kodzie mapę dni z wydarzeniami (`dates`), a listę dnia daje to samo zapytanie, które wysyła
// strona po kliknięciu dnia (`/ajax/KalendariumKom/data`). Na liście są tylko tytuł, zakres dat i link do komunikatu —
// godziny i miejsca nie ma, więc wydarzenia trafiają do kalendarza jako całodniowe.
import * as cheerio from 'cheerio';
import { pobierz, spacje, dzisWarszawa, plusDni } from '../wspolne.mjs';

const BAZA = 'https://krakow.pl';
const KATEGORIA_ID = '2431';

export const dniZWydarzeniami = (html) => {
  const blok = (html.match(/dates\s*=\s*\{([\s\S]*?)\}\s*;/) || [])[1] || '';
  return [...blok.matchAll(/'(\d{4})(\d{2})(\d{2})'\s*:\s*[1-9]/g)].map((m) => `${m[1]}-${m[2]}-${m[3]}`);
};

const KATEGORIE = [
  [/warsztat/i, 'warsztaty'],
  [/koncert/i, 'koncert'],
  [/spektakl|teatr/i, 'spektakl'],
  [/wystaw/i, 'wystawa'],
  [/kiermasz|jarmark|targi/i, 'jarmark'],
  [/festiwal|festyn|piknik|święto/i, 'festyn'],
  [/bieg|sport|turniej|trening|rajd/i, 'sport'],
  [/spacer|wycieczk|rajd/i, 'spacer'],
  [/czytani|książk|literack|biblioteczn/i, 'czytanie'],
  [/pokaz|film/i, 'pokaz'],
];

export function parsuj(html) {
  const $ = cheerio.load(html);
  const wydarzenia = [];
  $('.ev').each((_, el) => {
    const zakres = spacje($(el).find('span').first().text()); // „2026-10-03 - 2026-10-04"
    const [od, doDnia] = zakres.match(/\d{4}-\d{2}-\d{2}/g) || [];
    const a = $(el).find('a').first();
    const tytul = spacje(a.attr('title') || a.text());
    if (!od || !tytul) return;
    wydarzenia.push({
      tytul,
      data: od,
      dataDo: doDnia && doDnia > od ? doDnia : '',
      godzina: '',
      miejsce: 'Kraków',
      kategoria: (KATEGORIE.find(([w]) => w.test(tytul)) || [0, 'inne'])[1],
      typ: 'wydarzenie',
      strona: a.attr('href') || '',
      link: '',
      dlaDzieci: true, // kategoria „Kraków dla dzieci" prowadzona przez miasto
    });
  });
  return wydarzenia;
}

export default {
  id: 'krakow-pl',
  nazwa: 'Kraków dla dzieci (krakow.pl)',
  url: `${BAZA}/nasze_miasto/301055,artykul,krakow-dla-dzieci.html`,
  rodzaj: 'wydarzenia',
  // Gotowy, ale wyłączony do czasu decyzji: lista zawiera ogłoszenia dla rodziców i konkursy, a większość pozycji
  // powtarza inne źródła (Biblioteka Kraków, Szczęście, Groteska); nie ma godzin ani miejsc.
  wlaczone: false,
  miejsca: [],
  async pobierz() {
    const dzis = dzisWarszawa();
    const koniec = plusDni(dzis, 60);
    const strona = await pobierz(this.url, { robots: true });
    const dni = dniZWydarzeniami(strona).filter((d) => d >= dzis && d <= koniec);
    const wynik = new Map();
    for (const dzien of dni) {
      const html = await pobierz(`${BAZA}/ajax/KalendariumKom/data`, { robots: true, json: true, cialo: { date: dzien, c: KATEGORIA_ID } });
      for (const w of parsuj(typeof html === 'string' ? html : '')) wynik.set(w.strona || w.tytul, w);
    }
    return [...wynik.values()];
  },
};
