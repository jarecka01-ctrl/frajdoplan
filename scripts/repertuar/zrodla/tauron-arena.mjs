// TAURON Arena Kraków — kalendarz wydarzeń przez publiczne API wtyczki The Events Calendar (JSON), dozwolone w robots.txt
// (zakaz tylko /wp-admin/). Hala ma głównie koncerty i imprezy dla dorosłych, więc „dla dzieci" rozstrzyga ocenaGoscinna
// (wyraźny sygnał w tytule albo opisie); niepewne trafiają do „do weryfikacji". Duże widowiska rodzinne dostają
// `kandydatBanera` (nic nie ustawia `wyrozniony` samo).
import { pobierz, plusDni, dzisWarszawa, godzina } from '../wspolne.mjs';
import { ocenaGoscinna, tekstZHtml } from '../dla-dzieci.mjs';

const BAZA = 'https://www.tauronarenakrakow.pl';
const DNI = 180;
const NA_STRONE = 50;
const WIDOWISKO_RODZINNE = /(on ice|na lodzie|disney|cyrk|circus|globetrotters|freestyle)/i;

export function parsuj(json) {
  const wydarzenia = [];
  for (const e of json.events || []) {
    const tytul = tekstZHtml(e.title);
    const data = String(e.start_date || '').slice(0, 10);
    if (!tytul || !/^\d{4}-\d{2}-\d{2}$/.test(data)) continue;
    const kategoria = (e.categories || []).map((c) => c.name).join(', ');
    const ocena = ocenaGoscinna({ tytul, opis: tekstZHtml(e.description), kategoria });
    const muzyka = /muzyczne/i.test(kategoria);
    wydarzenia.push({
      tytul,
      data,
      godzina: e.all_day ? '' : godzina(String(e.start_date).slice(11, 16)),
      miejsce: 'TAURON Arena Kraków',
      typ: muzyka ? 'koncert' : 'widowisko',
      kategoria: muzyka ? 'koncert' : 'pokaz',
      link: e.url || '',
      strona: e.url || '',
      cena: tekstZHtml(e.cost),
      wiek: ocena.wiek,
      dlaDzieci: ocena.dlaDzieci,
      kandydatBanera: ocena.dlaDzieci === true && WIDOWISKO_RODZINNE.test(tytul),
    });
  }
  return wydarzenia;
}

export default {
  id: 'tauron-arena',
  nazwa: 'TAURON Arena Kraków',
  url: `${BAZA}/events/`,
  rodzaj: 'wydarzenia',
  wyprzedzenieDni: DNI,
  miejsca: [['TAURON Arena Kraków', /tauron\s*arena/i]],
  async pobierz() {
    const od = dzisWarszawa();
    const wszystkie = [];
    for (let strona = 1; strona <= 6; strona += 1) {
      const adres = `${BAZA}/wp-json/tribe/events/v1/events?per_page=${NA_STRONE}&page=${strona}&start_date=${od}&end_date=${plusDni(od, DNI)}`;
      const json = await pobierz(adres, { robots: true, json: true });
      wszystkie.push(...parsuj(json));
      if (strona >= (json.total_pages || 1)) break;
    }
    return wszystkie;
  },
};
