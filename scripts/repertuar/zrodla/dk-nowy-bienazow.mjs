// Dom Kultury SM Nowy Bieżanów (dknowybiezanow.pl, ul. Aleksandry 11). Kalendarz to wtyczka The Events Calendar, więc
// bierzemy dane z jej REST: /wp-json/tribe/events/v1/events (tytuł, początek, koniec, kategorie, koszt, opis; strony po 50).
// Oferta to głównie wieczory dla dorosłych (podróże, literatura, joga, język angielski), a dzieci zdarzają się rzadko
// (np. „spotkanie muzyczne dla najmłodszych", warsztaty z Małą Warsztatownią), więc „dla dzieci" rozstrzyga ocenaGoscinna
// po tytule, kategoriach i opisie: wyraźny sygnał = tak, same wzmianki o dzieciach = „do weryfikacji", reszta = nie.
// Zajęcia stałe (kółka) nie są w kalendarzu.
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina, dzisWarszawa, plusDni } from '../wspolne.mjs';
import { ocenaGoscinna, tekstZHtml } from '../dla-dzieci.mjs';

const BAZA = 'https://www.dknowybiezanow.pl';
const MIEJSCE = 'Dom Kultury SM Nowy Bieżanów';
const DNI = 180;
const MAKS_STRON = 5;

const tekst = (html) => spacje(cheerio.load(`<b>${html || ''}</b>`)('b').text()); // encje typu &#8211; w tytule

// Kategoria strony („koncerty", „warsztaty", „teatr"…) i tytuł → kategoria frajdoplanu i typ.
export function kategoriaWydarzenia(nazwy, tytul) {
  const k = `${nazwy} ${tytul}`.toLowerCase();
  if (/koncert|chór|spotkanie muzyczne/.test(k)) return { kategoria: 'koncert', typ: 'koncert' };
  if (/teatr|spektakl/.test(k)) return { kategoria: 'spektakl', typ: 'spektakl' };
  if (/warsztat|pracownia/.test(k)) return { kategoria: 'warsztaty', typ: 'wydarzenie' };
  if (/wernisaż|wystaw/.test(k)) return { kategoria: 'wystawa', typ: 'wydarzenie' };
  if (/literack|książ|od deski/.test(k)) return { kategoria: 'czytanie', typ: 'wydarzenie' };
  if (/spacer/.test(k)) return { kategoria: 'spacer', typ: 'wydarzenie' };
  if (/impreza|kiermasz|festyn|piknik|dzień otwarty/.test(k)) return { kategoria: 'festyn', typ: 'wydarzenie' };
  return { kategoria: 'inne', typ: 'wydarzenie' };
}

// Odpowiedź REST (obiekt z `events`) → wydarzenia; `od` – pierwszy dzień (starsze pomijamy).
export function parsuj(json, od = '0000-00-00') {
  const wynik = [];
  for (const e of json.events || []) {
    const m = String(e.start_date || '').match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
    if (!m || !e.title || m[1] < od) continue;
    const tytul = tekst(e.title);
    const nazwy = [...(e.categories || []), ...(e.tags || [])].map((c) => tekst(c.name)).join(' ');
    const ocena = ocenaGoscinna({ tytul, opis: `${nazwy} ${tekstZHtml(e.description).slice(0, 600)}`, kategoria: '' });
    const koniec = String(e.end_date || '').slice(0, 10);
    const { kategoria, typ } = kategoriaWydarzenia(nazwy, tytul);
    const cena = tekst(e.cost);
    wynik.push({
      tytul,
      data: m[1],
      ...(koniec && koniec > m[1] ? { dataDo: koniec } : {}),
      godzina: e.all_day ? '' : godzina(m[2]),
      miejsce: MIEJSCE,
      kategoria,
      typ,
      wiek: ocena.wiek,
      cena: /^bezpłatn/i.test(cena) ? 'bezpłatne' : cena,
      strona: e.url,
      link: '',
      dlaDzieci: ocena.dlaDzieci,
    });
  }
  return wynik;
}

export default {
  id: 'dk-nowy-bienazow',
  nazwa: 'Dom Kultury SM Nowy Bieżanów',
  url: `${BAZA}/events/`,
  rodzaj: 'wydarzenia',
  // Wyłączone, bo w chwili budowy (8.10.2026) w kalendarzu są 4 wydarzenia i żadne nie jest dla dzieci. Oceny sprawdzone na
  // archiwum (93 wydarzenia z lat 2025-26: ok. 5 dla dzieci, ok. 5 do weryfikacji). Włączyć: usuń `wlaczone: false`.
  wlaczone: false,
  wyprzedzenieDni: DNI,
  miejsca: [[MIEJSCE, /dom\s+kultury\s+(sm\s+)?nowy\s+bie[żz]an[óo]w|dknowybiezanow/i]],
  async pobierz() {
    const dzis = dzisWarszawa();
    let adres = `${BAZA}/wp-json/tribe/events/v1/events?per_page=50&start_date=${dzis}&end_date=${plusDni(dzis, DNI)}`;
    const wynik = [];
    for (let i = 0; i < MAKS_STRON && adres; i += 1) {
      const json = JSON.parse(await pobierz(adres, { robots: true }));
      wynik.push(...parsuj(json, dzis));
      adres = json.next_rest_url || '';
    }
    return wynik;
  },
};
