// Muzeum Krakowa (muzeumkrakowa.pl/kalendarium): zwykły HTML renderowany po stronie serwera. Filtry to formularz GET
// (`?group_dzieci=on&group_rodziny=on`, `?type_spotkanie dla dzieci=on`, osobne parametry w obrębie grupy łączą się jako „lub"),
// a lista ma stronicowanie `?page=N` (16 wpisów na stronę, po jednym wpisie na dzień i godzinę). Strona wydarzenia
// ma etykiety (`.page-content__filters__item`: rodzaj i grupa odbiorców, np. „warsztaty", „dzieci", „rodziny"), oddział,
// ramkę „Najważniejsze informacje" (cena, wiek) i opis. Pobieramy listę dwa razy (grupy dzieci/rodziny oraz rodzaj
// „spotkanie dla dzieci"), potem stronę każdego wydarzenia (raz, wynik jest w pamięci) po etykiety, wiek i cenę.
// Dla dzieci: etykieta „dzieci" albo wiek ≤ 12 lat; sama etykieta „rodziny" wymaga potwierdzenia w tytule („dla rodzin
// z dziećmi"), inaczej wydarzenie idzie do „do weryfikacji". „Dla dorosłych" w tytule = nie.
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina, dataPL, wiekZTekstu, wiekDlaDzieci } from '../wspolne.mjs';
import { ocenaGoscinna } from '../dla-dzieci.mjs';

const BAZA = 'https://muzeumkrakowa.pl';
const MAKS_STRON = 15;
const DLA_GRUP = /z przedszkoli|dla (?:grup|klas)|dla szkół|szkół podstawowych/i;
const ODDZIALY = /krzysztofory|schindler|emalia|stara synagoga|apteka pod orłem|ulica pomorska|rydlówka|muzeum podgórza|nowej huty|podziemna nowa huta|kamienica hipolit|przystań|thesaurus|harcerskiego|niematerialnego|muzeum krakowa/i;

// Etykiety rodzaju → kategoria frajdoplanu i typ wydarzenia (tytuł pomaga przy czytaniu i bajkach).
export function kategoriaWydarzenia(etykiety, tytul) {
  const e = etykiety.join(' ').toLowerCase();
  const t = String(tytul || '').toLowerCase();
  if (/koncert/.test(e)) return { kategoria: 'koncert', typ: 'koncert' };
  if (/spektakl/.test(e)) return { kategoria: 'spektakl', typ: 'spektakl' };
  if (/warsztat/.test(e) || /warsztat/.test(t)) return { kategoria: 'warsztaty', typ: 'wydarzenie' };
  if (/czytani|bajk/.test(t)) return { kategoria: 'czytanie', typ: 'wydarzenie' };
  if (/spacer|wycieczka|plener/.test(e)) return { kategoria: 'spacer', typ: 'wydarzenie' };
  if (/pokaz|film|prezentacja/.test(e)) return { kategoria: 'pokaz', typ: 'wydarzenie' };
  if (/spotkanie autorskie/.test(e)) return { kategoria: 'czytanie', typ: 'wydarzenie' };
  if (/wernisaż|finisaż/.test(e)) return { kategoria: 'wystawa', typ: 'wydarzenie' };
  if (/święto oddziału|obchody/.test(e)) return { kategoria: 'festyn', typ: 'wydarzenie' };
  return { kategoria: 'inne', typ: 'wydarzenie' };
}

// Strona listy: wpisy „08.10.2026 godz. 17:00", tytuł, miejsce i adres wydarzenia.
export function parsuj(html) {
  const $ = cheerio.load(html);
  const wydarzenia = [];
  $('a.calendar-day').each((_, el) => {
    const x = $(el);
    const href = x.attr('href') || '';
    const termin = spacje(x.find('.calendar-day__date').text()); // „08.10.2026 godz. 17:00"
    const data = dataPL(termin);
    const tytul = spacje(x.find('.calendar-day__name').text());
    if (!href || !tytul || !data) return;
    const miejsceListy = spacje(x.find('.calendar-day__place span').last().text());
    wydarzenia.push({ tytul, data, godzina: godzina((termin.match(/godz\.\s*(\d{1,2}:\d{2})/) || [])[1] || ''), miejsceListy, strona: new URL(href, BAZA).href });
  });
  const strony = $('.pagination__item').map((_, e) => parseInt(spacje($(e).text()), 10)).get().filter(Number.isFinite);
  return { wydarzenia, ostatniaStrona: strony.length ? Math.max(...strony) : 1 };
}

// Strona wydarzenia: etykiety, oddział, cena, wiek, początek opisu.
export function parsujSzczegoly(html) {
  const $ = cheerio.load(html);
  const etykiety = $('.page-content__filters__item').map((_, e) => spacje($(e).text()).toLowerCase()).get();
  const oddzial = spacje($('.page-content__loc-branch').first().text());
  const ramka = spacje($('.right-contact__text').first().text());
  const opis = spacje($('.page-content__section__text').first().text());
  let cena = '';
  if (/udział bezpłatny|wstęp wolny|bezpłatn/i.test(ramka)) cena = 'bezpłatnie';
  else cena = ((ramka.match(/(\d+(?:[.,]\d+)?\s*zł(?:\s*\/\s*(?:os\.?|osobę|dziecko|uczestnika))?)/u) || [])[1] || '').replace(/\s+/g, ' ');
  return { etykiety, oddzial, cena, opis: opis.slice(0, 400), wiek: wiekZTekstu(`${ramka} ${opis}`) };
}

const wiekObejmujeDzieci = (wiek) => {
  if (!wiekDlaDzieci(wiek)) return false;
  const gorna = (String(wiek).match(/\d+\s*[–-]\s*(\d+)/) || [])[1];
  return !gorna || Number(gorna) <= 14;
};

// Ocena „dla dzieci" z etykiet, wieku i tytułu.
export function ocena(w, s) {
  const dzieci = s.etykiety.includes('dzieci') || s.etykiety.includes('spotkanie dla dzieci');
  const rodziny = s.etykiety.includes('rodziny');
  if (/dla dorosłych|18\+|dla seniorów|dla nauczycieli/i.test(w.tytul)) return { dlaDzieci: false, wiek: '' };
  if (s.wiek && !wiekObejmujeDzieci(s.wiek)) return { dlaDzieci: false, wiek: '' };
  const o = ocenaGoscinna({ tytul: w.tytul, opis: '', kategoria: '' });
  // spotkania „dla rodziców" (z niemowlętami, cykl „Muzeum od Kołyski"): dzieci są tylko towarzyszami, do weryfikacji
  if (/dla rodziców|dla opiekunów/i.test(w.tytul)) return { dlaDzieci: undefined, wiek: '' };
  if (dzieci) return { dlaDzieci: true, wiek: wiekObejmujeDzieci(s.wiek) ? s.wiek : '' };
  if (s.wiek) return { dlaDzieci: true, wiek: s.wiek };
  if (rodziny) return o.dlaDzieci === true ? { dlaDzieci: true, wiek: o.wiek } : { dlaDzieci: undefined, wiek: '' };
  return { dlaDzieci: false, wiek: '' };
}

// Wszystkie strony listy dla danego zestawu filtrów (parametry GET).
async function lista(parametry) {
  const wszystkie = [];
  let ostatnia = 1;
  for (let strona = 1; strona <= Math.min(ostatnia, MAKS_STRON); strona += 1) {
    const q = new URLSearchParams({ ...parametry, page: String(strona) });
    const wynik = parsuj(await pobierz(`${BAZA}/kalendarium?${q}`, { robots: true }));
    wszystkie.push(...wynik.wydarzenia);
    ostatnia = wynik.ostatniaStrona;
    if (!wynik.wydarzenia.length) break;
  }
  return wszystkie;
}

export default {
  id: 'muzeum-krakowa',
  nazwa: 'Muzeum Krakowa',
  url: `${BAZA}/kalendarium`,
  rodzaj: 'wydarzenia',
  miejsca: [['Muzeum Krakowa', /muzeum\s+krakowa|krzysztofory|schindler|emalia|stara\s+synagoga|apteka\s+pod\s+orłem|rydlówka|muzeum\s+podgórza|nowej\s+huty|kamienica\s+hipolit|przystań/i]],
  async pobierz() {
    const jakoMapa = new Map();
    const zbieraj = (arr) => arr.forEach((w) => jakoMapa.set(`${w.strona}|${w.data}|${w.godzina}`, w));
    zbieraj(await lista({ group_dzieci: 'on', group_rodziny: 'on' }));
    zbieraj(await lista({ 'type_spotkanie dla dzieci': 'on' }));
    const szczegoly = new Map();
    const wynik = [];
    for (const w of jakoMapa.values()) {
      if (!szczegoly.has(w.strona)) szczegoly.set(w.strona, parsujSzczegoly(await pobierz(w.strona, { robots: true })));
      const s = szczegoly.get(w.strona);
      const o = ocena(w, s);
      const { kategoria, typ } = kategoriaWydarzenia(s.etykiety, w.tytul);
      wynik.push({
        tytul: w.tytul,
        data: w.data,
        godzina: w.godzina,
        miejsce: s.oddzial || (ODDZIALY.test(w.miejsceListy) ? w.miejsceListy : 'Muzeum Krakowa'),
        kategoria,
        typ,
        wiek: o.wiek,
        cena: s.cena,
        strona: w.strona,
        link: '',
        dlaDzieci: o.dlaDzieci,
        dlaGrup: DLA_GRUP.test(w.tytul), // warsztaty dla przedszkoli i szkół (w dni powszednie rano), nie dla rodziców
      });
    }
    return wynik.sort((a, b) => `${a.data}${a.godzina}`.localeCompare(`${b.data}${b.godzina}`));
  },
};
