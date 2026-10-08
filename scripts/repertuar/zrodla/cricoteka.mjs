// Cricoteka, Ośrodek Dokumentacji Sztuki Tadeusza Kantora (cricoteka.pl, ul. Nadwiślańska 2–4). Kalendarium
// /pl/kalendarium/ to zwykły HTML ze wszystkimi nadchodzącymi wydarzeniami w jednej odpowiedzi (adresy /page/2/ i ?paged=2
// zwracają to samo; Cricoteka publikuje program z miesięcznym wyprzedzeniem). Wpis: dzień i miesiąc, typ (Warsztaty,
// Spektakle, Wydarzenia, Wykłady), „Czas: sobota, 10.10.2026 10:30 - 11:30 / sala", tytuł i adres wydarzenia.
// Wiek jest w tytule („warsztaty dla dzieci w wieku 2–3 lat", „spektakl dla dzieci (4-6 lat)"). Gdy tytuł nie rozstrzyga,
// czytamy z podstrony linię „Dla kogo?" (np. „Dla wszystkich bez względu na wiek" = niepewne). Spotkania dla osób
// pracujących w kulturze („nie tylko dla dzieci") są odrzucane. Jedna godzina = jeden wpis.
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina, wiekZTekstu } from '../wspolne.mjs';
import { ocenaGoscinna } from '../dla-dzieci.mjs';

const BAZA = 'https://cricoteka.pl';
const MIEJSCE = 'Cricoteka';

// Lista kalendarium → wpisy z godziną, typem i adresem.
export function parsuj(html) {
  const $ = cheerio.load(html);
  const wynik = [];
  $('.element-event').each((_, el) => {
    const x = $(el);
    const a = x.find('.event_title a').first();
    const tytul = spacje(a.text());
    const strona = a.attr('href') || '';
    const czas = spacje(x.find('.time-event').text());
    const d = czas.match(/(\d{2})\.(\d{2})\.(\d{4})/);
    const g = czas.match(/(\d{1,2}:\d{2})/);
    if (!tytul || !strona || !d) return;
    wynik.push({
      tytul,
      data: `${d[3]}-${d[2]}-${d[1]}`,
      godzina: g ? godzina(g[1]) : '',
      typ: spacje(x.find('.event_type').text()),
      strona,
    });
  });
  return wynik;
}

// Z podstrony: linia „Dla kogo? …" (bez dalszego tekstu po następnym pytaniu: „Bilety?", „Prowadzenie?").
export function dlaKogo(html) {
  const $ = cheerio.load(html);
  $('script, style, nav, header, footer').remove();
  const t = spacje($('main, #main-content').first().text() || $('body').text());
  const m = t.match(/Dla kogo\?\s*(.+?)(?=\s*(?:Bilety\?|Prowadzenie\?|Czas\?|Gdzie\?|Cena\?|Zapisy\?|Informacje|$))/);
  return m ? spacje(m[1]).slice(0, 200) : '';
}

// Ocena z tytułu: true / false albo null, gdy trzeba zajrzeć na podstronę.
export function ocenaTytulu(tytul) {
  if (/nie tylko dla dzieci/i.test(tytul)) return { dlaDzieci: false, wiek: '' };
  const o = ocenaGoscinna({ tytul });
  const wiek = wiekZTekstu(tytul) || o.wiek;
  return o.dlaDzieci === true ? { dlaDzieci: true, wiek } : null;
}

export function ocenaZPodstrony(tytul, dla) {
  if (/wszystkich|każdego|bez względu na wiek/i.test(dla) && !/dzieci|rodzin/i.test(dla)) return { dlaDzieci: undefined, wiek: '' };
  const o = ocenaGoscinna({ tytul, opis: dla });
  return { dlaDzieci: o.dlaDzieci, wiek: o.wiek };
}

export function kategoria(typ, tytul) {
  const t = `${typ} ${tytul}`.toLowerCase();
  if (/spektakl/.test(t)) return { kategoria: 'spektakl', typ: 'spektakl' };
  if (/koncert/.test(t)) return { kategoria: 'koncert', typ: 'koncert' };
  if (/warsztat/.test(t)) return { kategoria: 'warsztaty', typ: 'wydarzenie' };
  if (/wystaw/.test(t)) return { kategoria: 'wystawa', typ: 'wydarzenie' };
  return { kategoria: 'inne', typ: 'wydarzenie' };
}

export default {
  id: 'cricoteka',
  nazwa: 'Cricoteka',
  url: `${BAZA}/pl/kalendarium/`,
  rodzaj: 'wydarzenia',
  miejsca: [[MIEJSCE, /cricoteka/i]],
  async pobierz() {
    const lista = parsuj(await pobierz(`${BAZA}/pl/kalendarium/`, { robots: true }));
    const wynik = [];
    const podstrony = new Map(); // ten sam adres (cykl) czytamy raz
    for (const w of lista) {
      let o = ocenaTytulu(w.tytul);
      if (!o) {
        // dorosłe formy (spektakle, wykłady, performance) wykluczone od razu, niepewne sprawdzamy na podstronie
        if (!podstrony.has(w.strona)) podstrony.set(w.strona, dlaKogo(await pobierz(w.strona, { robots: true })));
        o = ocenaZPodstrony(w.tytul, podstrony.get(w.strona));
      }
      const { kategoria: kat, typ } = kategoria(w.typ, w.tytul);
      wynik.push({
        tytul: w.tytul,
        data: w.data,
        godzina: w.godzina,
        miejsce: MIEJSCE,
        kategoria: kat,
        typ,
        wiek: o.wiek,
        cena: '',
        strona: w.strona,
        link: '',
        dlaDzieci: o.dlaDzieci,
      });
    }
    return wynik;
  },
};
