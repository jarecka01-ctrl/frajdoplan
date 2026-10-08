// Muzeum Narodowe w Krakowie (mnk.pl/wydarzenia/). Lista jest ładowana przez AJAX (WordPress admin-ajax.php, akcja
// `filter_posts_wydarzenia`; robots.txt wprost zezwala na ten adres): sekcja „w wybranym zakresie" (najbliższe dni)
// i „późniejsze wydarzenia", po 30 na stronę, z flagami `has_moreselected` / `has_morefuture`, więc doczytujemy kolejne strony.
// Na karcie jest tylko data (bez godziny), typ i oddział; godzina, cena i opis są dopiero na stronie wydarzenia
// (panel boczny „Czas trwania": `<b>07.11.2026</b>` + `10:00 - 13:00`, jedna lub kilka dat).
// Dla dzieci: filtr „Dla kogo: Rodzice i dzieci" (drugie zapytanie z `dla_kogo_filter=rodzice-i-dzieci`) albo typ
// „Bajeczne i słoneczne", albo wyraźny sygnał w tytule/opisie („dla rodzin z dziećmi", wiek ≤ 12 lat).
// Sam znacznik „Rodzice i dzieci" przy wydarzeniu ogólnym (festiwal, targi) to za mało: wtedy ocena „do weryfikacji".
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina, dataPL, wiekZTekstu, wiekDlaDzieci } from '../wspolne.mjs';
import { ocenaGoscinna } from '../dla-dzieci.mjs';

const BAZA = 'https://mnk.pl';
const AJAX = `${BAZA}/wp-admin/admin-ajax.php`;
const MAKS_STRON = 6;

// Typ z karty → kategoria frajdoplanu i typ wydarzenia.
export function kategoriaWydarzenia(typ, tytul) {
  const t = String(typ || '').toLowerCase();
  const n = String(tytul || '').toLowerCase();
  if (/koncert/.test(t) && !/teatr|kino/.test(n)) return { kategoria: 'koncert', typ: 'koncert' };
  if (/warsztat|sztuka bycia razem/.test(t) || /warsztat/.test(n)) return { kategoria: 'warsztaty', typ: 'wydarzenie' };
  if (/spacer|plener/.test(t)) return { kategoria: 'spacer', typ: 'wydarzenie' };
  if (/wystaw/.test(t)) return { kategoria: 'wystawa', typ: 'wydarzenie' };
  if (/bajeczne/.test(t)) return { kategoria: 'warsztaty', typ: 'wydarzenie' };
  if (/crawl|święto|targi|festiwal/.test(`${t} ${n}`)) return { kategoria: 'festyn', typ: 'wydarzenie' };
  return { kategoria: 'inne', typ: 'wydarzenie' };
}

// „10 października 2026" albo „29 października 2026 – 30 października 2026" → { data, dataDo? }
const zakresDat = (tekst) => {
  const [a, b] = spacje(tekst).split(/\s+[–-]\s+/);
  const data = dataPL(a || '');
  const dataDo = b ? dataPL(b) : '';
  return { data, dataDo: dataDo && dataDo !== data ? dataDo : '' };
};

// Odpowiedź AJAX (JSON z polem `html`) albo gotowy HTML → karty wydarzeń.
export function parsuj(odpowiedz) {
  let html = odpowiedz;
  try { html = JSON.parse(odpowiedz).html || ''; } catch (e) { /* zwykły HTML */ }
  const $ = cheerio.load(html);
  const wydarzenia = [];
  $('.article-card').each((_, el) => {
    const x = $(el);
    const a = x.find('h3 a').first();
    const strona = a.attr('href') || '';
    const surowy = spacje(a.text());
    const { data, dataDo } = zakresDat(x.find('.date-sec').first().text());
    if (!strona || !surowy || !data) return;
    wydarzenia.push({
      tytul: spacje(surowy.replace(/\(\s*brak wolnych miejsc\s*\)/i, '')),
      brakMiejsc: /brak wolnych miejsc/i.test(surowy),
      data,
      dataDo,
      typ: spacje(x.find('.category-sec').first().text()),
      oddzial: spacje(x.find('.place-cat span').first().text()),
      strona: new URL(strona, BAZA).href,
    });
  });
  return wydarzenia;
}

// Strona wydarzenia: terminy z panelu „Czas trwania", cena z „Bilety", początek opisu.
export function parsujSzczegoly(html) {
  const $ = cheerio.load(html);
  const panel = $('.sidebar-sec').first();
  const terminy = [];
  const blok = panel.find('.content').filter((_, e) => /czas trwania/i.test($(e).children('span').first().text())).first();
  blok.find('p').each((_, p) => {
    const tekst = spacje($(p).text());
    if (/\d{1,2}\.\d{1,2}\.\d{4}/.test(tekst)) {
      const [a, b] = tekst.split(/\s*[–-]\s*/);
      terminy.push({ data: dataPL(a), dataDo: b ? dataPL(b) : '', godziny: [] });
    } else if (/^\d{1,2}[:.]\d{2}/.test(tekst) && terminy.length) {
      terminy[terminy.length - 1].godziny.push(godzina(tekst.match(/^\d{1,2}[:.]\d{2}/)[0].replace('.', ':')));
    }
  });
  const cena = spacje(panel.find('.list-data-sec li').filter((_, e) => /bilet/i.test($(e).text())).first().find('b').first().text()).replace(/\s*\/\s*/g, ' / ');
  $('script, style, nav, header, footer, .sidebar-sec').remove();
  const opis = spacje($('main').first().text());
  return { terminy: terminy.filter((t) => t.data), cena, opis: opis.slice(0, 400), wiek: wiekZTekstu(opis) };
}

// Wiek ze strony (≤ 12 lat na dolnej granicy, górna do 14).
const wiekObejmujeDzieci = (wiek) => {
  if (!wiekDlaDzieci(wiek)) return false;
  const gorna = (String(wiek).match(/\d+\s*[–-]\s*(\d+)/) || [])[1];
  return !gorna || Number(gorna) <= 14;
};

// Ocena „dla dzieci". tag = wydarzenie jest na liście „Dla kogo: Rodzice i dzieci".
export function ocena(w, s, tag) {
  const typ = w.typ.toLowerCase();
  if (/18\+|dorosł|nauczyciel|60\+|seniorów/i.test(w.tytul)) return { dlaDzieci: false, wiek: '' };
  if (/niemowl/i.test(`${w.tytul} ${s.opis}`)) return { dlaDzieci: undefined, wiek: '' }; // spotkania dla opiekunów z niemowlętami
  if (s.wiek) return wiekObejmujeDzieci(s.wiek) ? { dlaDzieci: true, wiek: s.wiek } : { dlaDzieci: false, wiek: '' };
  const o = ocenaGoscinna({ tytul: w.tytul, opis: '', kategoria: '' }) // opis pomijamy: "rodzinny" w historii rodu to nie sygnał dla dzieci;
  if (o.dlaDzieci === true) return { dlaDzieci: true, wiek: o.wiek };
  if (/bajeczne/.test(typ)) return { dlaDzieci: true, wiek: '' };
  if (tag) {
    // znacznik „Rodzice i dzieci" przy warsztatach, rodzinnych oprowadzaniach i cyklu „Sztuka bycia razem" wystarcza;
    // przy wydarzeniach ogólnych (Extra, targi, święto) zostaje do weryfikacji
    if (o.dlaDzieci === false && /targi|konferencj/i.test(w.tytul)) return { dlaDzieci: false, wiek: '' };
    if (/warsztat|sztuka bycia razem|oprowadzanie/.test(typ) && !/60\+|kuratorsk/i.test(w.tytul)) return { dlaDzieci: true, wiek: '' };
    return { dlaDzieci: undefined, wiek: '' };
  }
  return { dlaDzieci: o.dlaDzieci, wiek: o.wiek };
}

// Wszystkie strony listy dla danego filtru „Dla kogo" (sekcje: zakres i późniejsze), bez powtórzeń.
async function listaAjax(dlaKogo) {
  const mapa = new Map();
  const zapytanie = async (sekcja, strona) => {
    const f = new URLSearchParams({
      date_filter: '', oddzialy_filter: '', categoris_filter: '', dla_kogo_filter: dlaKogo, search_filter: '',
      action: 'filter_posts_wydarzenia', page: String(strona), per_page: '30', section: sekcja,
    });
    const tekst = await pobierz(AJAX, { robots: true, metoda: 'POST', cialo: f });
    for (const w of parsuj(tekst)) mapa.set(w.strona, w);
    return JSON.parse(tekst);
  };
  const pierwsza = await zapytanie('', 1);
  for (const [sekcja, flaga] of [['range', 'has_moreselected'], ['future', 'has_morefuture']]) {
    let ma = pierwsza[flaga];
    for (let strona = 2; ma && strona <= MAKS_STRON; strona += 1) ma = (await zapytanie(sekcja, strona))[flaga];
  }
  return [...mapa.values()];
}

export default {
  id: 'mnk',
  nazwa: 'Muzeum Narodowe w Krakowie',
  url: `${BAZA}/wydarzenia/`,
  rodzaj: 'wydarzenia',
  // tylko oddziały, które mają kartę w arkuszu „Miejsca" (Gmach Główny = al. 3 Maja 1, Pałac Czapskich); reszta zostaje bez powiazane_miejsce_id
  miejsca: [[/gmach\s+główny|^muzeum\s+narodowe/i, /^muzeum\s+narodowe\s+w\s+krakowie$/i], [/czapscy/i, /ogród\s+czapskich/i]],
  async pobierz() {
    const wszystkie = await listaAjax('');
    const znacznik = new Set((await listaAjax('rodzice-i-dzieci')).map((w) => w.strona));
    const wynik = [];
    for (const w of wszystkie) {
      // wykłady i konferencje dla dorosłych: bez znacznika „Rodzice i dzieci" nie pobieramy nawet szczegółów
      if (!znacznik.has(w.strona) && /wykład|konferencj|czwartki|wokół wyspiańskiego/i.test(w.typ)) continue;
      const s = parsujSzczegoly(await pobierz(w.strona, { robots: true }));
      const o = ocena(w, s, znacznik.has(w.strona));
      const { kategoria, typ } = kategoriaWydarzenia(w.typ, w.tytul);
      const terminy = s.terminy.length ? s.terminy : [{ data: w.data, dataDo: w.dataDo, godziny: [] }];
      for (const t of terminy) {
        const godziny = t.godziny.length ? t.godziny : [''];
        for (const g of godziny) {
          wynik.push({
            tytul: w.tytul,
            data: t.data,
            ...(t.dataDo && t.dataDo !== t.data ? { dataDo: t.dataDo } : {}),
            godzina: g,
            miejsce: w.oddzial ? `MNK ${w.oddzial}`.replace(/^MNK MNK/, 'MNK') : 'Muzeum Narodowe w Krakowie',
            kategoria: t.dataDo && t.dataDo !== t.data && kategoria === 'inne' ? 'festyn' : kategoria,
            typ,
            wiek: o.wiek,
            cena: s.cena,
            strona: w.strona,
            link: '',
            dlaDzieci: o.dlaDzieci,
            dlaGrup: /dla (?:grup|klas|szkół)|z przedszkoli/i.test(w.tytul),
          });
        }
      }
    }
    return [...new Map(wynik.map((x) => [`${x.strona}|${x.data}|${x.godzina}`, x])).values()];
  },
};
