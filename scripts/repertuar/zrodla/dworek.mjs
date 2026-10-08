// Centrum Kultury Dworek Białoprądnicki (dworek.eu, ul. Papiernicza 2). Lista na /wydarzenia/ to zwykły HTML: pierwsze 6 wydarzeń
// widać od razu, a przycisk „Pokaż więcej +" tylko rozwija resztę (Alpine.js, `x-show`), więc wszystkie wydarzenia są
// w jednej odpowiedzi i nie trzeba żadnych zapytań w tle. Na liście jest data i godzina (`time[itemprop=startDate]`),
// tytuł, kategoria (badge) i adres wydarzenia. Wiek („Dla kogo? 4+" albo „przedział wiekowy: 6+"), wstęp i czas trwania
// są dopiero na stronie wydarzenia, więc pobieramy ją dla każdego wydarzenia (ok. 40 zapytań, 1 na sekundę).
// Wiek do 12 lat = dla dzieci; bez wieku decyduje ocenaGoscinna po tytule i opisie (niepewne idą do „do weryfikacji").
// Kluby Dworku na własnych subdomenach (np. mydlniki.dworek.eu) mają osobne kalendarze i nie są tu pobierane.
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina, wiekZTekstu, wiekDlaDzieci } from '../wspolne.mjs';
import { ocenaGoscinna } from '../dla-dzieci.mjs';

const BAZA = 'https://dworek.eu';
const MIEJSCE = 'Dworek Białoprądnicki';

// Kategoria strony („Festiwal", „Koncert", „Film"…) i tytuł → kategoria frajdoplanu i typ wydarzenia.
export function kategoriaWydarzenia(badge, tytul) {
  const b = String(badge || '').toLowerCase();
  const t = String(tytul || '').toLowerCase();
  if (/koncert/.test(b)) return { kategoria: 'koncert', typ: 'koncert' };
  if (/teatr|spektakl/.test(b)) return { kategoria: 'spektakl', typ: 'spektakl' };
  if (/wystaw/.test(b)) return { kategoria: 'wystawa', typ: 'wydarzenie' };
  if (/warsztat/.test(b) || /warsztat|wyhaftuj|haft/.test(t)) return { kategoria: 'warsztaty', typ: 'wydarzenie' };
  if (/film|kino/.test(b) || /animacj|kino na|na ekranie|film/.test(t)) return { kategoria: 'pokaz', typ: 'wydarzenie' };
  if (/literatur|czytel/.test(b) || /spotkanie autorskie|czytani|opowie|książk/.test(t)) return { kategoria: 'czytanie', typ: 'wydarzenie' };
  if (/festiwal/.test(b)) return { kategoria: 'festyn', typ: 'wydarzenie' };
  return { kategoria: 'inne', typ: 'wydarzenie' };
}

// Lista wydarzeń ze strony /wydarzenia/ (wszystkie, także te za przyciskiem „Pokaż więcej").
export function parsuj(html) {
  const $ = cheerio.load(html);
  const wydarzenia = [];
  $('article.card').each((_, el) => {
    const x = $(el);
    const strona = x.find('a.card-body').first().attr('href') || x.find('a[href*="/wydarzenia/"]').first().attr('href') || '';
    const tytul = spacje(x.find('.card-title').first().text());
    const start = x.find('time[itemprop="startDate"]').first().attr('content') || ''; // „2026-10-11T11:00" (czas lokalny)
    const m = start.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
    if (!strona || !tytul || !m) return;
    const badge = spacje(x.find('.badge').first().text());
    wydarzenia.push({ tytul, data: m[1], godzina: godzina(m[2]), badge, strona: new URL(strona, BAZA).href });
  });
  return wydarzenia;
}

// Strona wydarzenia: „Dla kogo? 4+", „przedział wiekowy: 6+", „Wstęp: wolny.", „Czas trwania: ok. 50 min", opis.
export function parsujSzczegoly(html) {
  const $ = cheerio.load(html);
  $('script, style, nav, header, footer').remove();
  const tekst = spacje($('main').first().text() || $('body').text());
  const pole = (nazwa, nastepne) => {
    const m = tekst.match(new RegExp(`${nazwa}\\s*:?\\s*(.+?)\\s*(?:${nastepne}|$)`));
    return m ? spacje(m[1]) : '';
  };
  const dlaKogo = pole('Dla kogo\\?', 'Czas trwania:|Wstęp:|Zapisy:|Data:|Godzina:|Podobne wydarzenia');
  // wstęp: tylko „wolny" / „bezpłatny" albo kwota („35 zł", „70 zł/os"); reszta zdania („Zapisy…", „Bilety dostępne…") nie jest ceną
  const wstepSurowy = pole('Wstęp:', 'Zapisy:|Czas trwania:|Dla kogo\\?|Podobne wydarzenia|Data:|Godzina:');
  const wstep = ((wstepSurowy.match(/^(wolny|bezpłatny|bezpłatne|\d[\d\s,.–-]*\s*zł(?:\s*\/\s*[\p{L}.]+)?)/iu) || [])[1] || '').replace(/\.$/, '');
  const przedzial = (tekst.match(/przedział wiekowy:\s*([^\s]+)/i) || [])[1] || '';
  const wiek = wiekZTekstu(dlaKogo) || wiekZTekstu(przedzial);
  // opis do oceny: tylko początek tekstu wydarzenia (dalej bywają życiorysy autorów z „dla dzieci i młodzieży")
  const poPowrocie = tekst.split('Powrót do listy wydarzeń')[1] || tekst;
  return { dlaKogo, wiek, cena: wstep.replace(/\s+/g, ' ').trim(), opis: spacje(poPowrocie).slice(0, 250) };
}

// Wiek obejmujący dzieci: dolna granica do 12 lat, a przy przedziale górna do 14 („11–18 lat" to już młodzież).
const wiekObejmujeDzieci = (wiek) => {
  if (!wiekDlaDzieci(wiek)) return false;
  const gorna = (String(wiek).match(/\d+\s*[–-]\s*(\d+)/) || [])[1];
  return !gorna || Number(gorna) <= 14;
};

// Ocena „dla dzieci": wiek ze strony wydarzenia, a gdy go nie ma, ocenaGoscinna po tytule i początku opisu.
// „Dla każdego" / „dla wszystkich" bez wieku to za mało, żeby publikować samemu: trafia do „do weryfikacji".
export function ocena(w, szczegoly) {
  const ogolna = ocenaGoscinna({ tytul: w.tytul, opis: `${szczegoly.dlaKogo} ${szczegoly.opis}`, kategoria: w.badge });
  if (szczegoly.wiek) {
    if (/18\+|dorosł|nauczyciel/i.test(`${w.tytul} ${szczegoly.dlaKogo}`)) return { dlaDzieci: false, wiek: '' };
    return wiekObejmujeDzieci(szczegoly.wiek) ? { dlaDzieci: true, wiek: szczegoly.wiek } : { dlaDzieci: false, wiek: '' };
  }
  if (ogolna.dlaDzieci === false && /^(dla\s+)?(każdego|wszystkich|całej rodziny)/i.test(szczegoly.dlaKogo) && !/18\+|dorosł/i.test(w.tytul)) return { dlaDzieci: undefined, wiek: '' };
  return { dlaDzieci: ogolna.dlaDzieci, wiek: ogolna.wiek };
}

export default {
  id: 'dworek',
  nazwa: 'Dworek Białoprądnicki',
  url: `${BAZA}/wydarzenia/`,
  rodzaj: 'wydarzenia',
  miejsca: [[MIEJSCE, /dworek\s+białoprądnicki/i]],
  async pobierz() {
    const lista = parsuj(await pobierz(`${BAZA}/wydarzenia/`, { robots: true }));
    const wynik = [];
    for (const w of lista) {
      const s = parsujSzczegoly(await pobierz(w.strona, { robots: true }));
      const o = ocena(w, s);
      const { kategoria, typ } = kategoriaWydarzenia(w.badge, w.tytul);
      wynik.push({
        tytul: w.tytul,
        data: w.data,
        godzina: w.godzina,
        miejsce: MIEJSCE,
        kategoria,
        typ,
        wiek: o.wiek,
        cena: s.cena,
        strona: w.strona,
        link: '',
        dlaDzieci: o.dlaDzieci,
      });
    }
    return [...new Map(wynik.map((w) => [`${w.strona}|${w.godzina}`, w])).values()];
  },
};
