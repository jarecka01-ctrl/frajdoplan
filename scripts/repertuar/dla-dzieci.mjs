// Ocena „czy to wydarzenie dla dzieci" dla źródeł, które mają głównie wydarzenia dla dorosłych (hale, kluby, teatry
// gościnne). Wynik: { dlaDzieci: true | false | undefined, wiek }.
//   true       — wyraźny sygnał: „dla dzieci", „familijny", „rodzinny", „bajka", „Disney", „na lodzie", „od N lat" (N ≤ 12),
//                „maluch", „przedszkol", „dla całej rodziny";
//   false      — sygnał dla dorosłych (18+, kabaret, stand-up, metal, rap, disco polo, mecze, MMA, konferencje…) albo brak
//                jakiegokolwiek sygnału;
//   undefined  — niepewne (np. w opisie jest „dzieci" albo „rodzina", ale bez wyraźnego oznaczenia, albo sygnał dziecięcy
//                przy wydarzeniu sportowym): trafia do `do_weryfikacji`, a właścicielka dopisuje tytuł do `wymus` lub `ukryj`.
// Przy niepewności nic nie publikujemy.
import { spacje } from './wspolne.mjs';

const KONIEC = '(?![\\p{L}\\d])';
const wzor = (zrodlo) => new RegExp(zrodlo, 'iu');

const DLA_DOROSLYCH = wzor(`(18\\+|\\+18|dla dorosłych|kabaret|stand-?up|metal|(^|[^\\p{L}])rap${KONIEC}|disco polo|(^|[^\\p{L}])mecz${KONIEC}|(^|[^\\p{L}])mma${KONIEC}|adcc|konferencj|targi|półmaraton|maraton|piątka|bieg(?!\\p{L})|(^|[^\\p{L}])run${KONIEC}|kongres|terapia dla par)`);
const SYGNAL = wzor(`(dla dzieci|dla najmłodszych|familijn|rodzinn|dla całej rodziny|dla całych rodzin|(^|[^\\p{L}])bajk|disney|na lodzie|(^|[^\\p{L}])maluch|przedszkol|dla maluchów)`);
const SPORT = wzor('(sport|mecz|globetrotters|walk[ia]|mma)');
const WSKAZOWKA = wzor(`(^|[^\\p{L}])(dzieci|dzieciom|dziećmi|dziecko|dziecka|rodzin\\p{L}*|maluch\\p{L}*)${KONIEC}`);

// Wiek z tekstu: „od 6 lat", „od 10. roku życia", „5+", „3–9 lat" → „6+", „10+", „5+", „3–9 lat" (albo '').
export function wiekZOpisu(tekst, { plus = true } = {}) {
  const t = spacje(tekst);
  let m = t.match(/(\d{1,2})\s*[–-]\s*(\d{1,2})\s*lat/i);
  if (m) return `${m[1]}–${m[2]} lat`;
  m = t.match(/od\s+(\d{1,2})\.?\s*(?:roku\s+życia|r\.\s*ż\.|lat)/i) || (plus && t.match(/(?:^|[^\d\p{L}])(\d{1,2})\+(?![\p{L}\d])/u));
  return m ? `${m[1]}+` : '';
}
const wiekDoDwunastu = (wiek) => { const n = parseInt((String(wiek).match(/\d+/) || [])[0], 10); return Number.isFinite(n) && n <= 12; };

// Wyraźny sygnał dla dorosłych w nagłówku (tytuł i kategoria) albo w treści (18+, od 15–18 lat).
export const dlaDoroslych = (naglowek, tresc) => DLA_DOROSLYCH.test(naglowek) || /18\+|od 1[5-8] lat/i.test(tresc);

// tytul: nazwa wydarzenia; opis: tekst ze strony (może być pusty); kategoria: kategoria ze źródła (np. „Sportowe")
export function ocenaGoscinna({ tytul = '', opis = '', kategoria = '' }) {
  const naglowek = spacje(`${tytul} ${kategoria}`);
  const tresc = spacje(`${tytul} ${opis}`);
  // 5+ uznajemy tylko w tytule; w opisach zdarza się przy dystansach i liczbach (3+ km)
  const wiek = wiekZOpisu(tytul) || wiekZOpisu(opis, { plus: false });
  if (dlaDoroslych(naglowek, tresc)) return { dlaDzieci: false, wiek: '' };
  const sygnal = SYGNAL.test(tresc) || (wiek && wiekDoDwunastu(wiek));
  if (sygnal) {
    // sygnał rodzinny przy imprezie sportowej (np. pokaz koszykarzy) to za mało, żeby publikować samemu
    if (SPORT.test(naglowek)) return { dlaDzieci: undefined, wiek };
    return { dlaDzieci: true, wiek: wiekDoDwunastu(wiek) ? wiek : '' };
  }
  if (WSKAZOWKA.test(opis)) return { dlaDzieci: undefined, wiek: '' };
  return { dlaDzieci: false, wiek: '' };
}

// Tekst z HTML-a (opisy z API) bez znaczników i encji.
import * as cheerio from 'cheerio';
export const tekstZHtml = (html) => spacje(cheerio.load(`<div>${html || ''}</div>`)('div').text());
