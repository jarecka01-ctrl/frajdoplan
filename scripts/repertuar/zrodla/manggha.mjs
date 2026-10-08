// Muzeum Manggha (manggha.pl, ul. Konopnickiej 26). Kalendarium /kalendarium-wydarzen/N (domyślnie od dziś; „Późniejsze" =
// następna strona, 10 wydarzeń na stronę): tytuł (h4), data „sobota, 10 października 2026 | 12:00", kategoria (Warsztaty,
// Oprowadzanie, Polecamy…) i adres /wydarzenie/…. Wiek jest dopiero na stronie wydarzenia („Grupa docelowa: młodzież
// i dorośli 16+", „Nie wprowadzamy limitu wieku", „dostosowane do wszystkich grup wiekowych"), więc czytamy każdą podstronę.
// WYŁĄCZONE: oferta dla dzieci jest tu rzadka (dziś 0 pewnych, 2 niepewne: lekcja muzealna „bez limitu wieku" i festiwal
// origami „dla wszystkich"), a robots.txt serwisu odpowiada HTTP 200 z komunikatem błędu PHP zamiast pliku (brak zakazów,
// ale też brak potwierdzenia zasad). Włączyć po zgodzie muzeum / gdy pojawi się cykl dla dzieci (usuń `wlaczone: false`).
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina, dataPL, wiekZTekstu, wiekDlaDzieci } from '../wspolne.mjs';
import { ocenaGoscinna } from '../dla-dzieci.mjs';

const BAZA = 'https://manggha.pl';
const MIEJSCE = 'Muzeum Manggha';

export function parsuj(html) {
  const $ = cheerio.load(html);
  const wynik = [];
  $('section.list a.item').each((_, el) => {
    const x = $(el);
    const tytul = spacje(x.find('h4').first().text());
    const termin = spacje(x.find('.date').first().text());
    const g = termin.match(/(\d{1,2}[:.]\d{2})/);
    const data = dataPL(termin.replace(/^[^,]*,\s*/, ''));
    const href = x.attr('href');
    if (!tytul || !data || !href) return;
    wynik.push({ tytul, data, godzina: g ? godzina(g[1].replace('.', ':')) : '', kategoria: spacje(x.find('.cat-fill').first().text()), opis: spacje(x.find('.paragraph-text').first().text()), strona: new URL(href, BAZA).href });
  });
  return { wydarzenia: wynik, nastepna: $('nav.detail-nav a.next').attr('href') || '' };
}

// Podstrona: wiek („Grupa docelowa: …", „powyżej 16. roku życia", „bez limitu wieku") i koszt.
export function parsujSzczegoly(html) {
  const $ = cheerio.load(html);
  $('script, style, nav, header, footer').remove();
  const tekst = spacje($('main').first().text() || $('body').text());
  const grupa = (tekst.match(/Grupa docelowa:\s*(.{0,80}?)(?:\s+Koszt|\s+Cena|\s+Język|$)/i) || [])[1] || '';
  const koszt = (tekst.match(/Koszt(?: udziału)?:\s*(\d[\d\s,]*\s*zł(?:\s*\/\s*[\p{L}.]+| za osobę)?)/iu) || [])[1] || '';
  return { tekst, grupa: spacje(grupa), cena: spacje(koszt) };
}

export function ocena(w, s) {
  const powyzej = s.tekst.match(/powyżej\s+(\d{1,2})\.?\s*(?:roku życia|lat)/i);
  if (/(młodzież|dorośli)\s+\d{2}\+|\b1[3-8]\+/i.test(s.grupa) || (powyzej && Number(powyzej[1]) >= 13)) return { dlaDzieci: false, wiek: '' };
  if (/\b(1[3-9]|[2-9]\d)\+|seniorów/i.test(`${w.tytul} ${s.grupa}`)) return { dlaDzieci: false, wiek: '' };
  const wiek = wiekZTekstu(s.grupa);
  if (wiek) return wiekDlaDzieci(wiek) ? { dlaDzieci: true, wiek } : { dlaDzieci: false, wiek: '' };
  if (/bez limitu wieku|nie wprowadzamy limitu wieku|wszystkich grup wiekowych/i.test(s.tekst)) return { dlaDzieci: undefined, wiek: '' };
  const o = ocenaGoscinna({ tytul: w.tytul, opis: `${w.opis} ${s.grupa}` });
  return { dlaDzieci: o.dlaDzieci, wiek: o.wiek };
}

const kat = (k, t) => {
  const s = `${k} ${t}`.toLowerCase();
  if (/warsztat|lekcja/.test(s)) return 'warsztaty';
  if (/koncert/.test(s)) return 'koncert';
  if (/spektakl/.test(s)) return 'spektakl';
  if (/oprowadzani/.test(s)) return 'spacer';
  if (/projekcj|pokaz/.test(s)) return 'pokaz';
  if (/festiwal/.test(s)) return 'festyn';
  return 'inne';
};

export default {
  id: 'manggha',
  wlaczone: false,
  nazwa: 'Muzeum Manggha',
  url: `${BAZA}/kalendarium-wydarzen`,
  rodzaj: 'wydarzenia',
  miejsca: [[MIEJSCE, /manggha/i]],
  async pobierz() {
    const wynik = [];
    let adres = '/kalendarium-wydarzen/1';
    for (let i = 0; adres && i < 10; i += 1) {
      const { wydarzenia, nastepna } = parsuj(await pobierz(new URL(adres, BAZA).href, { robots: true }));
      for (const w of wydarzenia) {
        const s = parsujSzczegoly(await pobierz(w.strona, { robots: true }));
        const o = ocena(w, s);
        wynik.push({ tytul: w.tytul, data: w.data, godzina: w.godzina, miejsce: MIEJSCE, kategoria: kat(w.kategoria, w.tytul), typ: 'wydarzenie', wiek: o.wiek, cena: s.cena, strona: w.strona, link: '', dlaDzieci: o.dlaDzieci });
      }
      adres = nastepna;
    }
    return wynik;
  },
};
