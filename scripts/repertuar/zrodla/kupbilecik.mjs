// kupbilecik.pl: oficjalne API partnerskie (JSON), kategoria „dzieci", województwo małopolskie. Adres API z tokenem partnera
// jest w sekrecie `KUPBILECIK_API_URL` (zmienna środowiskowa albo sekret repozytorium GitHub); token NIE może trafić do
// repozytorium, do logów ani do data/repertuar.json, więc w każdym komunikacie błędu jest zasłaniany.
// Limit API: 3 zapytania na minutę i 10 na godzinę; po przekroczeniu blokada na 24 godziny (HTTP 429, `blockedUntil`).
// Dlatego moduł robi dokładnie jedno zapytanie na przebieg, bez ponowień, a HTTP 429 to tylko ostrzeżenie (`lagodny`):
// poprzednie dane zostają. Zwykłych stron kupbilecik.pl nadal nie pobieramy (zakazanyAdres w wspolne.mjs): ten moduł
// nie używa `pobierz()` (które ponawia po błędzie 5xx, a każde ponowienie liczy się do limitu), tylko własnego pojedynczego
// zapytania do adresu https://www.kupbilecik.pl/api.
// Odpowiedź API ma okno 2 miesięcy (parametr `m=2`; wartości 4 i 6 zwróciły pustą listę), więc to nie jest 180 dni.
// Bez sekretu moduł jest wyłączony (nic nie robi). Do prób: KUPBILECIK_PLIK=<zapisana odpowiedź JSON> zamiast zapytania.
// „Dla dzieci" = kategoria API „dzieci" lub „teatr_dzieci"; „widowiska" (teatr_widowisko) tylko przy wyraźnym sygnale
// dziecięcym, inaczej do weryfikacji; sygnał dla dorosłych (18+, „dla dorosłych"…) odrzuca. Opisów i plakatów nie
// kopiujemy: opis służy tylko do rozpoznania wieku. Link do biletów zostaje taki, jak podaje API (ma znacznik partnera).
import { readFile } from 'node:fs/promises';
import { USER_AGENT, spacje, godzina, wiekDlaDzieci } from '../wspolne.mjs';
import { wiekZOpisu, dlaDoroslych, ocenaGoscinna, tekstZHtml } from '../dla-dzieci.mjs';
import { nazwaMiejsca, kategoriaZ } from './kbf.mjs';

const ADRES_API = /^https:\/\/www\.kupbilecik\.pl\/api\?/;
const adres = () => (process.env.KUPBILECIK_API_URL || '').trim();

// Wszystko, co wygląda na token albo adres z tokenem, zamieniamy na „***".
export const zasloniete = (tekst) => String(tekst).replace(/token=[^&\s"')]+/gi, 'token=***').replace(/https:\/\/www\.kupbilecik\.pl\/api\?[^\s"')]*/gi, 'https://www.kupbilecik.pl/api?***');

// Tytuły sprzedawcy bywają ogólnikowe („Spektakl taneczno-akrobatyczny", „Interaktywne widowisko z…"): wtedy bierzemy nazwę artysty.
const OGOLNY_TYTUL = /^(spektakl|widowisko|interaktywn\p{L}*|muzyczny spektakl|koncert|pokaz)(?![\p{L}\d])/iu;
export function tytulWydarzenia(e) {
  const nazwa = spacje(e.Name);
  const artysta = spacje(e.Artist?.Name);
  if (artysta && (OGOLNY_TYTUL.test(nazwa) || nazwa.length > 70 || /zwyci[ęe]żczyni/i.test(nazwa))) return artysta.slice(0, 90);
  return nazwa;
}

function kategoriaITyp(e, tytul) {
  const podkategoria = e.Category?.SubCategory?.Type || '';
  if (/koncert/i.test(tytul)) return { kategoria: 'koncert', typ: 'koncert' };
  if (podkategoria === 'teatr_widowisko') return { kategoria: 'pokaz', typ: 'widowisko' };
  if (e.Category?.Type === 'teatr' || /spektakl|teatr/i.test(tytul)) return { kategoria: 'spektakl', typ: 'spektakl' };
  if (/koncert|muzyk|filharmoni/i.test(tytul)) return { kategoria: 'koncert', typ: 'koncert' };
  const kategoria = kategoriaZ(tytul);
  return { kategoria, typ: kategoria === 'koncert' ? 'koncert' : 'wydarzenie' };
}

// Wiek tylko z jawnych sformułowań: „Dla Dzieci 2-7" w tytule, „Rekomendowany wiek widza: 13+", „w wieku 3-10 lat",
// „dla dzieci od 6 lat". Luźnych liczb z opisu nie bierzemy („Od 10 lat realizuje program" w życiorysie artystki to nie wiek widza).
export function wiekWydarzenia(nazwa, opis) {
  let m = spacje(nazwa).match(/dla\s+dzieci\s+(\d{1,2})\s*[–-]\s*(\d{1,2})(?!\d)/i);
  if (m) return `${m[1]}–${m[2]} lat`;
  m = opis.match(/rekomendowany wiek widza:\s*(\d{1,2})\s*\+/i);
  if (m) return `${m[1]}+`;
  m = opis.match(/w wieku\s+(\d{1,2})\s*[–-]\s*(\d{1,2})\s*lat/i);
  if (m) return `${m[1]}–${m[2]} lat`;
  m = opis.match(/dla\s+dzieci\s+od\s+(\d{1,2})\s*(?:lat|roku)/i);
  if (m) return `${m[1]}+`;
  return wiekZOpisu(nazwa);
}

// Ocena „dla dzieci": kategoria sprzedawcy + wiek i sygnały z tytułu i opisu. { dlaDzieci: true | false | undefined, wiek }
// Wiek powyżej 12 lat (np. „13+") = nie dla dzieci; wiek do 12 lat = dla dzieci także przy „widowisku".
export function ocena(e, tytul, opis) {
  const typy = [e.Category?.Type, e.Category?.SubCategory?.Type, ...(e.Categories || []).flatMap((c) => [c.Type])];
  const wiek = wiekWydarzenia(e.Name, opis) || wiekWydarzenia(tytul, '');
  if (dlaDoroslych(`${tytul} ${e.Name}`, `${tytul} ${opis}`)) return { dlaDzieci: false, wiek: '' };
  if (wiek) return wiekDlaDzieci(wiek) ? { dlaDzieci: true, wiek } : { dlaDzieci: false, wiek: '' };
  const widowisko = typy.includes('teatr_widowisko');
  if (typy.includes('teatr_dzieci') || (typy.includes('dzieci') && !widowisko)) return { dlaDzieci: true, wiek: '' };
  // widowisko bez podanego wieku może być dla starszych: publikujemy tylko przy wyraźnym sygnale dziecięcym
  const o = ocenaGoscinna({ tytul: `${tytul} ${e.Name}`, opis: opis.slice(0, 600), kategoria: '' });
  return { dlaDzieci: o.dlaDzieci === true ? true : undefined, wiek: o.wiek };
}

export function parsuj(dane) {
  if (dane?.error) throw new Error(`API kupbilecik: ${dane.error.code || 'błąd'}${dane.error.status ? ` (HTTP ${dane.error.status})` : ''}`);
  const wynik = [];
  for (const e of dane?.events || []) {
    const m = String(e.Date || '').match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
    if (!m || !e.Name) continue;
    if (spacje(e.City) !== 'Kraków') continue; // tylko Kraków (inne miasta ze zbioru województwa pomijamy)
    const tytul = tytulWydarzenia(e);
    const opis = tekstZHtml(e.Description);
    const o = ocena(e, tytul, opis);
    const { kategoria, typ } = kategoriaITyp(e, tytul);
    const cena = Number(e.TicketsInfo?.Price) > 0 ? `${e.TicketsInfo.Price} zł` : ''; // 0 albo brak: nie wiemy, więc nie wpisujemy
    wynik.push({
      tytul,
      data: m[1],
      godzina: godzina(m[2]),
      miejsce: nazwaMiejsca(e.Object?.Name || 'Kraków'),
      kategoria,
      typ,
      wiek: o.wiek,
      cena,
      strona: e.Link || '',
      link: e.Link || '',
      dlaDzieci: o.dlaDzieci,
    });
  }
  return [...new Map(wynik.map((w) => [`${w.strona}|${w.data}|${w.godzina}`, w])).values()];
}

// Jedno zapytanie, bez ponowień (limit API: 3 na minutę, 10 na godzinę, po przekroczeniu blokada na 24 godziny).
// Błędy nigdy nie zawierają adresu z tokenem.
async function zapytanie(url) {
  let res;
  try {
    res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
  } catch (e) {
    throw new Error(`nie udało się połączyć z API kupbilecik (${zasloniete(e.cause?.code || e.message)})`);
  }
  if (res.status === 429) throw new Error('limit zapytań API kupbilecik (HTTP 429), poprzednie dane zostają');
  if (!res.ok) throw new Error(`API kupbilecik → HTTP ${res.status}`);
  try {
    return JSON.parse(await res.text());
  } catch (e) {
    throw new Error('API kupbilecik zwróciło odpowiedź, która nie jest JSON-em');
  }
}

export default {
  id: 'kupbilecik',
  nazwa: 'kupbilecik.pl (dla dzieci)',
  url: 'https://www.kupbilecik.pl/', // bez tokenu: ten adres trafia do data/repertuar.json
  rodzaj: 'wydarzenia',
  wyprzedzenieDni: 180,
  lagodny: true, // HTTP 429 (limit API) albo chwilowy błąd to ostrzeżenie, poprzednie dane zostają
  wlaczone: Boolean(adres() || process.env.KUPBILECIK_PLIK), // bez sekretu źródło jest pomijane
  // powiązanie z kartą miejsca (adres w „Moim planie"): tylko miejsca, które mają kartę w arkuszu „Miejsca"; reszta (np. Forum Horyzonty) zostaje bez place_id
  miejsca: [['Kino Kijów', /^kino\s+kij[óo]w/i], ['ICE Kraków', /ice\s*krak/i], [/klub\s+p[łl]asz[óo]w/i, /klub\s+p[łl]asz[óo]w/i]],
  async pobierz() {
    let dane;
    if (process.env.KUPBILECIK_PLIK) {
      dane = JSON.parse(await readFile(process.env.KUPBILECIK_PLIK, 'utf8'));
    } else {
      if (!ADRES_API.test(adres())) throw new Error('KUPBILECIK_API_URL: oczekiwany adres https://www.kupbilecik.pl/api?…');
      dane = await zapytanie(adres());
    }
    return parsuj(dane);
  },
};
