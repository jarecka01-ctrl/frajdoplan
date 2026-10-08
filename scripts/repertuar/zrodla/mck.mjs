// Międzynarodowe Centrum Kultury (mck.krakow.pl, Rynek Główny 25; warsztaty „MINIspotkania ze sztuką" bywają w Muzeum UJ).
// Kalendarz /wystawy-i-wydarzenia/kalendarz/ ma w ukrytym bloku `#all_events` JSON ze wszystkimi nadchodzącymi
// wydarzeniami ({ "2026-10-18": { event_ids: [{ title, url, category: [{ title }] }] } }), więc jedno zapytanie
// wystarcza (przycisk „Załaduj więcej" tylko pokazuje te dane partiami). Odbiorców strona oznacza taksonomią `dla_kogo`
// (dzieci / rodziny z dziećmi / dorośli i młodzież…), widoczną w REST: /wp-json/wp/v2/wydarzenia (pole class_list).
// Dla dzieci = „dzieci" albo „rodziny z dziećmi"; oznaczenie dla innych odbiorców = nie; brak oznaczenia = ocenaGoscinna.
// Godzinę, wiek i cenę czytamy ze strony wydarzenia (tylko dla wydarzeń dla dzieci i niepewnych).
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina, dataPL, wiekZTekstu, MIESIACE_DOPELNIACZ } from '../wspolne.mjs';
import { ocenaGoscinna, wiekZOpisu } from '../dla-dzieci.mjs';

const BAZA = 'https://mck.krakow.pl';
const MIEJSCE = 'Międzynarodowe Centrum Kultury';
const MIEJSCE_UJ = 'Muzeum UJ Collegium Maius';
const DLA_DZIECI = ['dzieci', 'rodziny-z-dziecmi'];
const DLA_INNYCH = ['dorosli-i-mlodziez', 'studenci', 'uczniowie-i-nauczyciele', 'obcokrajowcy', 'osoby-ze-szczegolnymi-potrzebami'];

// Kategoria strony („Warsztat", „Spacer miejski"…) → kategoria frajdoplanu.
export function kategoriaWydarzenia(nazwa) {
  const k = String(nazwa || '').toLowerCase();
  if (/warsztat/.test(k)) return 'warsztaty';
  if (/spacer|oprowadz/.test(k)) return 'spacer';
  if (/wystaw|wernisaż/.test(k)) return 'wystawa';
  if (/pokaz filmowy/.test(k)) return 'pokaz';
  if (/koncert/.test(k)) return 'koncert';
  return 'inne';
}

// JSON z ukrytego bloku #all_events → lista { data, tytul, strona, kategoria }.
export function parsujKalendarz(html) {
  const $ = cheerio.load(html);
  let json;
  try { json = JSON.parse($('#all_events').first().text()); } catch (e) { return []; }
  const wynik = [];
  for (const [dzien, wpis] of Object.entries(json || {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dzien)) continue;
    for (const e of wpis.event_ids || []) {
      if (!e.url || !e.title) continue;
      wynik.push({
        data: dzien,
        tytul: cheerio.load(`<b>${e.title}</b>`)('b').text().trim(),
        strona: e.url,
        kategoria: kategoriaWydarzenia((e.category || []).map((c) => c.title).join(' ')),
      });
    }
  }
  return wynik;
}

// REST: adres wydarzenia → lista slugów `dla_kogo` (z class_list: „dla_kogo-dzieci").
export function odbiorcyZRest(json) {
  const mapa = new Map();
  for (const e of Array.isArray(json) ? json : []) {
    const odbiorcy = (e.class_list || []).filter((c) => c.startsWith('dla_kogo-')).map((c) => c.slice('dla_kogo-'.length));
    if (e.link) mapa.set(e.link, odbiorcy);
  }
  return mapa;
}

// Strona wydarzenia: godzina dla danej daty („18 października 2026, godz. 12.30"), opis, wiek, cena.
export function parsujSzczegoly(html, data) {
  const $ = cheerio.load(html);
  $('script, style').remove();
  const tresc = spacje($('.entry-content').first().text());
  const [r, m, d] = data.split('-').map(Number);
  const wzorData = new RegExp(`${d}\\s+${MIESIACE_DOPELNIACZ[m - 1]}\\s+${r}[^0-9]{0,6}(?:godz\\.?|o godz\\.?)?\\s*(\\d{1,2}[.:]\\d{2})`, 'i');
  const zData = tresc.match(wzorData);
  const godz = godzina(zData ? zData[1] : (tresc.match(/godz\.?\s*(\d{1,2}[.:]\d{2})/i) || [])[1]);
  const wiek = wiekZOpisu(tresc, { plus: false }) || wiekZTekstu(tresc);
  const cena = /(zajęcia|warsztaty|wstęp|udział)[^.]{0,30}(bezpłatn|wolny)/i.test(tresc) ? 'bezpłatne' : '';
  // zajęcia czasowo przeniesione z Rynku do Collegium Maius („Muzeum UJ, ul. Jagiellońska 15")
  const miejsce = /collegium maius|muzeum uj|muzeum uniwersytetu jagiello/i.test(tresc) ? MIEJSCE_UJ : '';
  return { godzina: godz, wiek, cena, miejsce, opis: tresc.slice(0, 400) };
}

export default {
  id: 'mck',
  nazwa: 'Międzynarodowe Centrum Kultury',
  url: `${BAZA}/wystawy-i-wydarzenia/kalendarz/`,
  rodzaj: 'wydarzenia',
  miejsca: [[MIEJSCE_UJ, /collegium\s+maius/i], [MIEJSCE, /międzynarodowe\s+centrum\s+kultury|(^|[^\p{L}])mck([^\p{L}]|$)/iu]],
  async pobierz() {
    const lista = parsujKalendarz(await pobierz(`${BAZA}/wystawy-i-wydarzenia/kalendarz/`, { robots: true }));
    if (!lista.length) return [];
    const pola = '_fields=link,class_list&per_page=100';
    const odbiorcy = odbiorcyZRest(JSON.parse(await pobierz(`${BAZA}/wp-json/wp/v2/wydarzenia?${pola}`, { robots: true })));
    // dla pewności osobno wydarzenia oznaczone „dla dzieci" / „rodziny z dziećmi" (starsze niż 100 ostatnich wpisów)
    const dzieci = odbiorcyZRest(JSON.parse(await pobierz(`${BAZA}/wp-json/wp/v2/wydarzenia?dla_kogo=99,24&${pola}`, { robots: true })));
    for (const [k, v] of dzieci) odbiorcy.set(k, v);
    const wynik = [];
    for (const w of lista) {
      const o = odbiorcy.get(w.strona);
      let dlaDzieci;
      if (o && o.some((x) => DLA_DZIECI.includes(x))) dlaDzieci = true;
      else if (o && o.some((x) => DLA_INNYCH.includes(x))) dlaDzieci = false;
      const szczegoly = dlaDzieci === false ? { godzina: '', wiek: '', cena: '', miejsce: '', opis: '' } : parsujSzczegoly(await pobierz(w.strona, { robots: true }), w.data);
      let wiek = dlaDzieci ? szczegoly.wiek : '';
      if (dlaDzieci === undefined) {
        const ocena = ocenaGoscinna({ tytul: w.tytul, opis: szczegoly.opis, kategoria: '' });
        dlaDzieci = ocena.dlaDzieci;
        wiek = ocena.wiek;
      }
      wynik.push({
        tytul: w.tytul,
        data: w.data,
        godzina: szczegoly.godzina,
        miejsce: szczegoly.miejsce || MIEJSCE,
        kategoria: w.kategoria,
        typ: w.kategoria === 'koncert' ? 'koncert' : 'wydarzenie',
        wiek,
        cena: dlaDzieci ? szczegoly.cena : '',
        strona: w.strona,
        link: '',
        dlaDzieci,
      });
    }
    return wynik;
  },
};
