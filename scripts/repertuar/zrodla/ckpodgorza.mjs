// Centrum Kultury Podgórza (Strefa Sokolska, Dwór Czeczów, Fort Borek, Teatr Praska 52 i kluby osiedlowe) —
// jeden kalendarz wydarzeń na ckpodgorza.pl. Lista ładuje się z `/oferta/wydarzenia/filterAjax` (to samo zapytanie
// wysyła strona po zaznaczeniu filtra); filtrujemy po grupie wiekowej „dla dzieci" (jej identyfikator 1 jest w formularzu).
// Cykle tygodniowe (np. „wtorek – 18:00" w zakresie dat) rozpisujemy na pojedyncze dni.
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina, dataPL, dzisWarszawa, dzienTygodnia, plusDni } from '../wspolne.mjs';

const BAZA = 'https://www.ckpodgorza.pl';
const MAKS_STRON = 6;
const DNI = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];

const KATEGORIE = [
  [/wystaw|wernisaż/i, 'wystawa'],
  [/koncert/i, 'koncert'],
  [/spektakl|teatr/i, 'spektakl'],
  [/warsztat/i, 'warsztaty'],
  [/piknik|festyn|plenerow/i, 'festyn'],
  [/spacer|wycieczk/i, 'spacer'],
];
const kategoria = (rodzaj) => (KATEGORIE.find(([w]) => w.test(rodzaj)) || [0, 'inne'])[1];

export function parsuj(json, dzis = dzisWarszawa(), horyzontDni = 60) {
  const $ = cheerio.load(json.content || '');
  const wydarzenia = [];
  const koniecHoryzontu = plusDni(dzis, horyzontDni);
  $('a.blocks__item').each((_, el) => {
    const tytul = spacje($(el).find('.block__title').first().text());
    const miejsce = spacje($(el).find('.block__place').first().text());
    const zakres = spacje($(el).find('.date__day').first().text()); // „04.10.2026" albo „15.09.2026 - 27.10.2026"
    const godz = spacje($(el).find('.date__hour').first().text()); // „wtorek - 18:00"
    const rodzaj = spacje($(el).find('.category__type').first().text());
    const cena = spacje($(el).find('.bl__text').first().text());
    const href = $(el).attr('href') || '';
    const [od, doDnia] = zakres.split(/\s+-\s+/).map((d) => dataPL(d));
    if (!tytul || !od) return;
    const wspolne = {
      tytul,
      godzina: godzina(godz),
      miejsce: miejsce || 'Centrum Kultury Podgórza',
      kategoria: kategoria(`${rodzaj} ${tytul}`),
      typ: 'wydarzenie',
      cena: /wstęp wolny|bezpłatn/i.test(cena) ? 'wstęp wolny' : '',
      strona: href ? new URL(href.trim(), BAZA).href : '',
      link: '',
      dlaDzieci: true, // lista jest przefiltrowana do grupy „dla dzieci"
      // „Spektakl … (grupy zorganizowane)" to pokaz dla szkół i przedszkoli; „(odbiorcy indywidualni)" jest dla wszystkich
      dlaGrup: /\(grupy|dla grup|grup[ay] zorganizowan/i.test(tytul),
    };
    if (!doDnia || doDnia === od) {
      wydarzenia.push({ ...wspolne, data: od });
      return;
    }
    // cykl w zakresie dat: dzień tygodnia z pola godziny, a bez niego codziennie byłoby błędem — wtedy pierwszy dzień
    const dzienNazwa = DNI.findIndex((d) => godz.toLowerCase().startsWith(d));
    if (dzienNazwa < 0) { wydarzenia.push({ ...wspolne, data: od }); return; }
    for (let d = od < dzis ? dzis : od; d <= doDnia && d <= koniecHoryzontu; d = plusDni(d, 1)) {
      if (dzienTygodnia(d) === dzienNazwa) wydarzenia.push({ ...wspolne, data: d });
    }
  });
  return { wydarzenia, stron: json.pages || 1 };
}

export default {
  id: 'ckpodgorza',
  nazwa: 'Centrum Kultury Podgórza',
  url: `${BAZA}/oferta/wydarzenia`,
  rodzaj: 'wydarzenia',
  // „Klub Iskierka" → „Centrum Kultury Podgórza - Klub Iskierka"; „Fort Borek" → „Fort 52 „Borek""
  dopasujMiejsce(w, wiersze) {
    const klucz = (w.miejsce || '').toLowerCase().replace(/^(klub|ośrodek|strefa)\s+/, '').replace(/^fort\s+/, '');
    if (!klucz) return '';
    const traf = wiersze.filter((r) => /ckpodgorza\.pl|podgórza/i.test(`${r.website} ${r.name}`) && r.name.toLowerCase().includes(klucz));
    return traf[0] ? traf[0].place_id : '';
  },
  async pobierz() {
    const wynik = [];
    for (let strona = 1; strona <= MAKS_STRON; strona += 1) {
      const odp = await pobierz(`${BAZA}/oferta/wydarzenia/filterAjax`, {
        robots: true,
        json: true,
        cialo: { filters: { group: ['1'] }, type: 'filter', page: strona },
      });
      const { wydarzenia, stron } = parsuj(odp);
      wynik.push(...wydarzenia);
      if (strona >= stron) break;
    }
    return wynik;
  },
};
