// MuFo, Muzeum Fotografii w Krakowie (mufo.krakow.pl; siedziby MuFo Rakowicka i MuFo Józefitów). Kalendarz
// /odwiedzaj/wydarzenia to zwykły HTML (kalendarz ładowany też parametrami w adresie, bez AJAX-a): z `calendar_search_js_all_events=1`
// strona 1 zawiera wszystkie nadchodzące wydarzenia (od najdalszych), a strona 2 zaczyna się od dni minionych. Wpis na liście:
// data „17.10.2026" (albo „11.09–11.10.2026"), godzina, siedziba, tytuł. Grupa docelowa jest dopiero na stronie wydarzenia
// (`.event_info li.group`: „Rodziny z dziećmi", „Seniorzy", „Dorośli", „Bez ograniczeń wiekowych"…), więc czytamy podstrony.
// „Rodziny z dziećmi" = dla dzieci; „Bez ograniczeń wiekowych" = niepewne (undefined); reszta = nie.
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina, dzisWarszawa, wiekZTekstu } from '../wspolne.mjs';

const BAZA = 'https://mufo.krakow.pl';
const LISTA = `${BAZA}/odwiedzaj/wydarzenia?calendar_search_js_building_id=&calendar_search_js_event_type_id=&calendar_search_js_event_user_group_id=&calendar_search_js_all_events=1&calendar_search_js_archive=0&year=2026&month=10&day=null`;
const SIEDZIBY = { 'MuFo Rakowicka': 'MuFo Rakowicka', 'MuFo Józefitów': 'MuFo Józefitów' };

// „17.10.2026" → { data }, „11.09–11.10.2026" → { data, dataDo }.
export function daty(tekst) {
  const t = spacje(tekst);
  const zakres = t.match(/(\d{2})\.(\d{2})(?:\.(\d{4}))?\s*[–-]\s*(\d{2})\.(\d{2})\.(\d{4})/);
  if (zakres) return { data: `${zakres[3] || zakres[6]}-${zakres[2]}-${zakres[1]}`, dataDo: `${zakres[6]}-${zakres[5]}-${zakres[4]}` };
  const m = t.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  return m ? { data: `${m[3]}-${m[2]}-${m[1]}`, dataDo: '' } : { data: '', dataDo: '' };
}

// Strona kalendarza → wpisy z listy (tytuł, data, godzina, siedziba, adres).
export function parsuj(html) {
  const $ = cheerio.load(html);
  const wynik = [];
  $('.pioromycalendar2_js_ajax_box_event_calendar article').each((_, el) => {
    const x = $(el);
    const href = x.closest('a').attr('href');
    const tytul = spacje(x.find('.short_desc').text());
    const { data, dataDo } = daty(x.find('.date').text());
    const g = spacje(x.find('.time').text()).match(/(\d{1,2}:\d{2})/);
    if (!href || !tytul || !data) return;
    wynik.push({ tytul, data, dataDo, godzina: g ? godzina(g[1]) : '', siedziba: spacje(x.find('.title').text()), strona: new URL(href, BAZA).href });
  });
  return wynik;
}

// Podstrona: typ, grupy docelowe, cena („Cena: 20 PLN za osobę"), wiek z opisu.
export function parsujSzczegoly(html) {
  const $ = cheerio.load(html);
  const info = $('.event_info').first();
  const grupy = info.find('li.group span').map((_, e) => spacje($(e).text())).get();
  const typ = spacje(info.find('li.type').text());
  const opis = spacje($('.right_side .desc').first().text() || $('main').text());
  const cena = (opis.match(/Cena:\s*(\d[\d\s,]*\s*(?:PLN|zł)(?:\s*(?:za osobę|\/\s*os\.?))?|bezpłatn\p{L}*|wstęp wolny)/iu) || [])[1] || '';
  return { grupy, typ, opis, cena: spacje(cena).replace(/\bPLN\b/, 'zł') };
}

export function ocena(s) {
  if (s.grupy.some((g) => /rodziny z dziećmi/i.test(g))) return { dlaDzieci: true, wiek: wiekZTekstu(s.opis.slice(0, 600)) };
  if (s.grupy.some((g) => /bez ograniczeń wiekowych/i.test(g))) return { dlaDzieci: undefined, wiek: '' };
  return { dlaDzieci: false, wiek: '' };
}

const kategoria = (typ, tytul) => {
  const t = `${typ} ${tytul}`.toLowerCase();
  if (/warsztat/.test(t)) return 'warsztaty';
  if (/spacer/.test(t)) return 'spacer';
  if (/oprowadzani/.test(t)) return 'spacer';
  if (/wystaw|wernisaż/.test(t)) return 'wystawa';
  if (/koncert/.test(t)) return 'koncert';
  if (/pokaz/.test(t)) return 'pokaz';
  return 'inne';
};

export default {
  id: 'mufo',
  nazwa: 'MuFo Muzeum Fotografii',
  url: `${BAZA}/odwiedzaj/wydarzenia`,
  rodzaj: 'wydarzenia',
  miejsca: [[/rakowicka/i, /mufo\s+rakowicka/i]], // MuFo Józefitów nie ma karty w arkuszu „Miejsca"
  async pobierz() {
    const dzis = dzisWarszawa();
    let lista = parsuj(await pobierz(`${LISTA}&active_page=1`, { robots: true }));
    // strona 1 ma wszystkie nadchodzące; jeśli jest w całości przyszła, sięgamy po następną
    if (lista.length && lista.every((w) => (w.dataDo || w.data) >= dzis)) lista = lista.concat(parsuj(await pobierz(`${LISTA}&active_page=2`, { robots: true })));
    const wynik = [];
    for (const w of lista.filter((x) => (x.dataDo || x.data) >= dzis)) {
      const s = parsujSzczegoly(await pobierz(w.strona, { robots: true }));
      const o = ocena(s);
      wynik.push({
        tytul: w.tytul,
        data: w.data,
        ...(w.dataDo ? { dataDo: w.dataDo } : {}),
        godzina: w.godzina,
        miejsce: SIEDZIBY[w.siedziba] || 'Muzeum Fotografii w Krakowie',
        kategoria: kategoria(s.typ, w.tytul),
        typ: 'wydarzenie',
        wiek: o.wiek,
        cena: s.cena,
        strona: w.strona,
        link: '',
        dlaDzieci: o.dlaDzieci,
      });
    }
    return wynik;
  },
};
