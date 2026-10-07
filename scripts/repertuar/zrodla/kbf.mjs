// KBF Bilety (kbfbilety.krakow.pl) — platforma biletowa Krakowskiego Biura Festiwalowego. Lista wydarzeń z filtrem „Dla dzieci"
// (/wydarzenia/filtruj?type["children"]=on) to zwykły HTML renderowany na serwerze; każde wydarzenie ma stronę szczegółów
// (/kup-bilet/<nazwa>?id=N) z miejscem, datą i godziną, ceną i krótkim opisem. robots.txt zakazuje tylko parametrów
// language / miasto / wojewodztwo i /admin; regulaminy o pobieraniu danych nic nie mówią (docs/rozpoznanie-kbf.md).
// Bierzemy tylko fakty (tytuł, data, godzina, miejsce, wiek, cena, link). Opisów i plakatów nie kopiujemy: opis służy
// wyłącznie do rozpoznania wieku i sygnałów „dla dorosłych".
// „Dla dzieci" = zaufanie filtrowi KBF, z wyjątkiem: sygnał dla dorosłych (18+, „dla dorosłych"…) → odrzucamy;
// wiek powyżej 12 lat → `do_weryfikacji`.
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina, pad, slugZ, MIESIACE_DOPELNIACZ } from '../wspolne.mjs';
import { wiekZOpisu, dlaDoroslych } from '../dla-dzieci.mjs';

const BAZA = 'https://kbfbilety.krakow.pl';
const LISTA = `${BAZA}/wydarzenia/filtruj?type%5B%22children%22%5D=on&location=0`;
const DNI = 180;
const MAKS_STRON_LISTY = 10;

// Nazwa miejsca z KBF → nazwa, której używają inne moduły (żeby to samo wydarzenie z dwóch źródeł zostało jednym).
const MIEJSCA = [
  [/filharmoni/i, 'Filharmonia Krakowska'],
  [/groteska/i, 'Teatr Groteska'],
  [/tauron\s*arena/i, 'TAURON Arena Kraków'],
  [/^ice\b|centrum kongresowe ice/i, 'ICE Kraków'],
  [/klub studio/i, 'Klub Studio'],
  [/variet/i, 'Krakowski Teatr VARIETE'],
  [/s[łl]owackiego/i, 'Teatr im. Juliusza Słowackiego'],
  [/teatr ludowy/i, 'Teatr Ludowy'],
  [/teatr wsp[óo][łl]czesny/i, 'Teatr Współczesny'],
  [/teatr szcz[ęe][śs]cie/i, 'Teatr Szczęście'],
  [/kultureska/i, 'Teatr Kultureska'],
  [/teatr figur/i, 'Teatr Figur'],
  [/kij[óo]w/i, 'Kino Kijów'],
  [/opera krakowska/i, 'Opera Krakowska'],
  [/sinfonietta/i, 'Sinfonietta Cracovia'],
];
export const nazwaMiejsca = (surowa) => {
  const nazwa = spacje(surowa);
  const znana = MIEJSCA.find(([wzor]) => wzor.test(nazwa));
  return znana ? znana[1] : nazwa;
};

// Kategoria z listy (koncert, spektakl, warsztaty, pokaz, czytanie, wystawa, jarmark, festyn, sport, spacer, planszowki, inne) z tytułu i podtytułu.
const KATEGORIE = [
  ['planszowki', /planszówk|gry planszowe|gier planszowych|szachy/i],
  ['warsztaty', /warsztat|zajęcia|laboratori/i],
  ['czytanie', /czytani|bajkowani|opowieści|opowiadani/i],
  ['wystawa', /wystaw/i],
  ['jarmark', /jarmark/i],
  ['festyn', /festyn|piknik/i],
  ['spacer', /spacer|rajd miejski|gra miejska/i],
  ['koncert', /koncert|recital|muzyk|śpiew|chór|orkiestr|filharmoni/i],
  ['spektakl', /spektakl|przedstawieni|teatr|bajka muzyczna|musical|kabaret dla dzieci/i],
  ['pokaz', /pokaz|show|cyrk|iluzj|widowisko/i],
  ['sport', /turniej|zawody|mecz|trening/i],
];
export const kategoriaZ = (tekst) => (KATEGORIE.find(([, wzor]) => wzor.test(tekst)) || ['inne'])[0];
const typZKategorii = (kategoria) => (kategoria === 'koncert' ? 'koncert' : kategoria === 'spektakl' ? 'spektakl' : 'wydarzenie');

// „od lat 3", „od 3 lat", „od 3. roku życia", „4+", „4–8 lat", „w wieku 4-8 lat" → „3+" / „4–8 lat" albo ''
export function wiekZTresci(tekst) {
  const t = spacje(tekst);
  const odLat = t.match(/od\s+lat\s+(\d{1,2})/i);
  if (odLat) return `${odLat[1]}+`;
  const wWieku = t.match(/w wieku\s+(\d{1,2})\s*[–-]\s*(\d{1,2})/i);
  if (wWieku) return `${wWieku[1]}–${wWieku[2]} lat`;
  return wiekZOpisu(t);
}
const wiekPierwszaLiczba = (wiek) => parseInt((String(wiek).match(/\d+/) || [])[0], 10);

// „08 listopada 2026, godz. 13:00" → [{ data: '2026-11-08', godzina: '13:00' }]
export function terminy(tekst) {
  const wynik = [];
  const wzor = /(\d{1,2})\s+([\p{L}]+)\s+(\d{4})(?:\s*,?\s*godz\.?\s*(\d{1,2}[:.]\d{2}))?/giu;
  for (const m of spacje(tekst).matchAll(wzor)) {
    const miesiac = MIESIACE_DOPELNIACZ.indexOf(m[2].toLowerCase()) + 1;
    if (!miesiac) continue;
    wynik.push({ data: `${m[3]}-${pad(miesiac)}-${pad(Number(m[1]))}`, godzina: m[4] ? godzina(m[4].replace('.', ':')) : '' });
  }
  return wynik;
}

// Lista: odnośniki do stron wydarzeń. Pusta lista jest poprawna tylko z komunikatem „Brak aktywnych wydarzeń";
// bez formularza filtrów i bez komunikatu strona wygląda inaczej niż zwykle (zmiana układu, blokada) → błąd.
export function parsujListe(html) {
  const $ = cheerio.load(html);
  const wydarzenia = [];
  $('.striped-table .stripe').each((_, el) => {
    const a = $(el).find('.name a.ticket-link').first();
    const href = a.attr('href');
    if (!href) return;
    wydarzenia.push({ adres: new URL(href, BAZA).href, tytul: spacje(a.text()), termin: spacje($(el).find('.date').first().text()) });
  });
  const nastepne = $('a[href*="page="]').map((_, a) => $(a).attr('href')).get().filter((h) => /filtruj/.test(h));
  if (!wydarzenia.length && !$('.empty-store').length && !$('.clear-filters-wrapper').length) {
    throw new Error('KBF Bilety: lista wydarzeń ma inny układ niż zwykle (brak tabeli, komunikatu o braku wydarzeń i filtrów)');
  }
  return { wydarzenia, nastepne };
}

// Strona wydarzenia → lista terminów w wspólnym formacie (po jednym wpisie na termin).
export function parsujWydarzenie(html, adres) {
  const $ = cheerio.load(html);
  const tytul = spacje($('.category-box h1').first().text());
  const podtytul = spacje($('.category-box .lead h5').first().text());
  const opis = spacje($('.category-box .lead').text());
  const dostepnosc = spacje($('#event-desc').text());
  const szczegoly = $('.post-details').first();
  const adresMiejsca = spacje(szczegoly.find('.address').first().text());
  const cena = spacje(szczegoly.find('.price').first().text());
  const daty = terminy(szczegoly.find('.first-row').text() || szczegoly.find('.date').text());
  if (!tytul || !daty.length) throw new Error(`KBF Bilety: brak tytułu lub daty na stronie ${adres}`);
  const miejsce = nazwaMiejsca(adresMiejsca.split(/\s\/\s|,/)[0]);
  const wKrakowie = /krak[óo]w/i.test(adresMiejsca);
  const wiek = wiekZTresci(`${tytul}. ${podtytul}. ${opis}`) || wiekZTresci(dostepnosc);
  const wiekLiczba = wiekPierwszaLiczba(wiek);
  const naglowek = `${tytul} ${podtytul}`;
  let dlaDzieci = true; // zaufanie filtrowi „Dla dzieci"
  if (dlaDoroslych(naglowek, `${naglowek} ${opis}`)) dlaDzieci = false;
  else if (Number.isFinite(wiekLiczba) && wiekLiczba > 12) dlaDzieci = undefined; // starsze dzieci i młodzież: sprawdza właścicielka
  const kategoria = kategoriaZ(`${tytul} ${podtytul}`);
  return daty.map((d) => ({
    tytul,
    data: d.data,
    godzina: d.godzina,
    miejsce: miejsce || 'Kraków',
    kategoria,
    typ: typZKategorii(kategoria),
    wiek: wiek && (!Number.isFinite(wiekLiczba) || wiekLiczba <= 12) ? wiek : '',
    cena,
    link: adres,
    strona: adres,
    dlaDzieci,
    poza: !wKrakowie, // wydarzenie poza Krakowem: pomijamy w `pobierz`
  }));
}

// Dopasowanie do arkusza „Miejsca": znane hale i teatry po nazwie, reszta tylko przy (prawie) identycznej nazwie.
const WZORY_ARKUSZA = [
  ['Filharmonia Krakowska', /filharmonia krakowska/i],
  ['Teatr Groteska', /teatr groteska/i],
  ['TAURON Arena Kraków', /tauron\s*arena/i],
  ['ICE Kraków', /\bice krak[óo]w/i],
  ['Klub Studio', /klub studio/i],
  ['Krakowski Teatr VARIETE', /variet/i],
  ['Teatr im. Juliusza Słowackiego', /s[łl]owackiego/i],
  ['Teatr Ludowy', /teatr ludowy/i],
  ['Teatr Współczesny', /teatr wsp[óo][łl]czesny/i],
  ['Teatr Szczęście', /teatr szcz[ęe][śs]cie/i],
  ['Teatr Kultureska', /kultureska/i],
  ['Teatr Figur', /teatr figur$/i],
  ['Kino Kijów', /kij[óo]w/i],
  ['Opera Krakowska', /^opera krakowska$/i],
];
export function dopasujMiejsce(wydarzenie, wiersze) {
  const wedlugLiczbyOpinii = (a, b) => (parseFloat(b.reviews) || 0) - (parseFloat(a.reviews) || 0);
  const znane = WZORY_ARKUSZA.find(([nazwa]) => nazwa === wydarzenie.miejsce);
  const pasuje = znane
    ? wiersze.filter((r) => znane[1].test(r.name))
    : wiersze.filter((r) => slugZ(r.name) === slugZ(wydarzenie.miejsce)); // inne miejsca: tylko dokładna nazwa
  return (pasuje.sort(wedlugLiczbyOpinii)[0] || {}).place_id || '';
}

export default {
  id: 'kbf',
  nazwa: 'KBF Bilety',
  url: LISTA,
  rodzaj: 'wydarzenia',
  wyprzedzenieDni: DNI,
  moznaPusto: true, // lista „Dla dzieci" bywa chwilowo pusta (komunikat „Brak aktywnych wydarzeń"); brak komunikatu i tabeli to błąd
  dopasujMiejsce,
  async pobierz() {
    const strony = [];
    const odwiedzone = new Set();
    let kolejka = [LISTA];
    while (kolejka.length && odwiedzone.size < MAKS_STRON_LISTY) {
      const adres = kolejka.shift();
      if (odwiedzone.has(adres)) continue;
      odwiedzone.add(adres);
      const { wydarzenia, nastepne } = parsujListe(await pobierz(adres, { robots: true }));
      strony.push(...wydarzenia);
      kolejka.push(...nastepne.map((h) => new URL(h, BAZA).href));
    }
    const wynik = [];
    const widziane = new Set();
    for (const w of strony) {
      if (widziane.has(w.adres)) continue;
      widziane.add(w.adres);
      wynik.push(...parsujWydarzenie(await pobierz(w.adres, { robots: true }), w.adres));
    }
    return wynik.filter((s) => !s.poza).map(({ poza, ...reszta }) => reszta); // eslint-disable-line no-unused-vars
  },
};
