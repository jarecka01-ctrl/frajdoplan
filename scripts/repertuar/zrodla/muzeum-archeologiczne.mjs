// Muzeum Archeologiczne w Krakowie (ma.krakow.pl, ul. Senacka 3). Kalendarz to wtyczka The Events Calendar (Tribe Events):
// REST /wp-json/tribe/events/v1/events (start_date i end_date czasu lokalnego, cost „25zł", opis HTML, url). Wiek jest tylko
// w opisie („dla rodzin z dziećmi w wieku 7-10 lat"), więc ocena: wiek ≤ 12 w opisie = dla dzieci, bez wieku ocenaGoscinna
// po tytule i opisie (bez stopki o projekcie unijnym, w której jest „rodzice dzieci w wieku szkolnym").
// Wydarzenia kilkudniowe (np. weekend z wykładami i warsztatami) wchodzą jako jeden wpis w dniu rozpoczęcia z `dataDo`.
import { pobierz, spacje, godzina, wiekZTekstu, wiekDlaDzieci } from '../wspolne.mjs';
import { ocenaGoscinna, tekstZHtml } from '../dla-dzieci.mjs';

const BAZA = 'https://ma.krakow.pl';
const MIEJSCE = 'Muzeum Archeologiczne w Krakowie';

// Odpowiedź REST → lista wydarzeń (bez oceny).
export function parsuj(json) {
  const dane = typeof json === 'string' ? JSON.parse(json) : json;
  return (dane.events || []).map((e) => {
    const start = String(e.start_date || '').match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
    const koniec = String(e.end_date || '').match(/^(\d{4}-\d{2}-\d{2})/);
    if (!start || !e.title || !e.url) return null;
    // opis bez stopki o projekcie unijnym i sekcji „Grupy docelowe"
    const opis = spacje(tekstZHtml(e.description)).split(/Cykl\s+„[^”]*”\s+realizowany|Nazwa realizowanego projektu|Grupy docelowe/)[0];
    return {
      tytul: tekstZHtml(e.title),
      data: start[1],
      dataDo: koniec && koniec[1] > start[1] ? koniec[1] : '',
      godzina: e.all_day ? '' : godzina(start[2]),
      cena: spacje(e.cost).replace(/(\d)\s*zł/i, '$1 zł'),
      strona: e.url,
      opis,
    };
  }).filter(Boolean);
}

// Wiek ze zdania o odbiorcach; „dzieci w wieku 7-10 lat", „od 6 lat". Cykle „od 16 rż." i „dla dorosłych" to nie dzieci.
export function ocena(w) {
  if (/dla dorosłych|od\s+1[3-8]\s*(?:rż|r\.\s*ż|lat|roku)|18\+/i.test(`${w.tytul} ${w.opis}`)) return { dlaDzieci: false, wiek: '' };
  const zakres = w.opis.match(/w\s+wieku\s+(\d{1,2})\s*[–-]\s*(\d{1,2})(?!\s*:)/);
  const wiek = zakres ? `${zakres[1]}–${zakres[2]} lat` : wiekZTekstu(w.opis);
  if (wiek) return wiekDlaDzieci(wiek) ? { dlaDzieci: true, wiek } : { dlaDzieci: false, wiek: '' };
  const o = ocenaGoscinna({ tytul: w.tytul, opis: w.opis });
  return { dlaDzieci: o.dlaDzieci, wiek: o.wiek };
}

export function kategoria(w) {
  const t = `${w.tytul} ${w.opis.slice(0, 300)}`.toLowerCase();
  if (/warsztat|archeonauci/.test(t)) return 'warsztaty';
  if (/oprowadzanie|spacer/.test(t)) return 'spacer';
  if (/wystaw/.test(w.tytul.toLowerCase())) return 'wystawa';
  return 'inne';
}

export default {
  id: 'muzeum-archeologiczne',
  nazwa: 'Muzeum Archeologiczne w Krakowie',
  url: `${BAZA}/wydarzenia/`,
  rodzaj: 'wydarzenia',
  miejsca: [[MIEJSCE, /muzeum\s+archeologiczne/i]],
  async pobierz() {
    const wynik = [];
    for (let strona = 1; strona <= 5; strona += 1) {
      const json = JSON.parse(await pobierz(`${BAZA}/wp-json/tribe/events/v1/events?per_page=50&page=${strona}`, { robots: true }));
      for (const w of parsuj(json)) {
        const o = ocena(w);
        wynik.push({
          tytul: w.tytul,
          data: w.data,
          ...(w.dataDo ? { dataDo: w.dataDo } : {}),
          godzina: w.godzina,
          miejsce: MIEJSCE,
          kategoria: kategoria(w),
          typ: 'wydarzenie',
          wiek: o.wiek,
          cena: w.cena,
          strona: w.strona,
          link: '',
          dlaDzieci: o.dlaDzieci,
        });
      }
      if (strona >= (json.total_pages || 1)) break;
    }
    return wynik;
  },
};
