// Opera Krakowska — terminy z publicznego JSON-a, z którego korzysta strona repertuaru:
// GET /ajax/repertuar?year=2026&month=10 → { performances: [ { "0": termin, title, type, place, postscript, slug, ticketUrl } ] }.
// Serwer dokleja do odpowiedzi skrypty odświeżające stronę (przed i po JSON-ie), więc JSON wycinamy z odpowiedzi.
// Dla dzieci: rodzaj „Dla dzieci" albo „Spektakl rodzinny (od 12 roku życia)". Warsztaty z działu edukacji (np. „Duszek w
// Operze") trafiają do „do weryfikacji"; terminy z dopiskiem „Spektakl zamknięty" to występy dla grup (`dlaGrup`).
import { pobierz, spacje, godzina, dzisWarszawa, miesiaceOkna, pad } from '../wspolne.mjs';
import { ocenaGoscinna } from '../dla-dzieci.mjs';

const BAZA = 'https://opera.krakow.pl';
const DNI_WYPRZEDZENIA = 60;

// Pierwszy kompletny obiekt JSON z tekstu (omija doklejone skrypty).
export function wytnijJson(tekst) {
  const start = tekst.indexOf('{');
  if (start < 0) throw new Error('Opera Krakowska: brak JSON-a w odpowiedzi');
  let glebokosc = 0;
  let wCudzyslowie = false;
  for (let i = start; i < tekst.length; i += 1) {
    const c = tekst[i];
    if (wCudzyslowie) {
      if (c === '\\') i += 1;
      else if (c === '"') wCudzyslowie = false;
    } else if (c === '"') wCudzyslowie = true;
    else if (c === '{') glebokosc += 1;
    else if (c === '}') { glebokosc -= 1; if (glebokosc === 0) return JSON.parse(tekst.slice(start, i + 1)); }
  }
  throw new Error('Opera Krakowska: niekompletny JSON w odpowiedzi');
}

const RODZAJE_DLA_DZIECI = /^(dla dzieci|spektakl rodzinny)/i;

export function parsuj(json) {
  const wydarzenia = [];
  for (const p of json.performances || []) {
    const t = p['0'];
    if (!t || t.isCanceled || !p.title) continue;
    const data = String(t.date?.date || '').slice(0, 10);
    const g = godzina(String(t.time?.date || '').slice(11, 16));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) continue;
    const rodzaj = spacje(p.type);
    const edukacja = Boolean(t.Parent?.isEducation);
    const ocena = ocenaGoscinna({ tytul: p.title, kategoria: rodzaj });
    let dlaDzieci = ocena.dlaDzieci;
    let wiek = ocena.wiek;
    if (RODZAJE_DLA_DZIECI.test(rodzaj)) {
      dlaDzieci = true;
      wiek = wiek || (rodzaj.match(/od (\d{1,2})/i) ? `${rodzaj.match(/od (\d{1,2})/i)[1]}+` : '');
    } else if (dlaDzieci === false && edukacja) {
      dlaDzieci = undefined; // warsztaty edukacyjne: nie wiadomo, czy dla dzieci
    }
    wydarzenia.push({
      tytul: spacje(p.title),
      data,
      godzina: g,
      miejsce: 'Opera Krakowska',
      kategoria: /koncert/i.test(rodzaj) ? 'koncert' : /warsztat/i.test(rodzaj) ? 'warsztaty' : 'spektakl',
      typ: /koncert/i.test(rodzaj) ? 'koncert' : 'spektakl',
      link: t.ticketUrl || p.ticketUrl || '',
      strona: p.slug ? `${BAZA}/spektakle/${p.slug}` : '',
      wiek,
      dlaDzieci,
      dlaGrup: /zamkni[ęe]ty/i.test(p.postscript || ''),
    });
  }
  return wydarzenia;
}

// WYŁĄCZONE: z serwerów GitHub Actions opera.krakow.pl odpowiada HTTP 403 (blokada ruchu z serwerów; z innych sieci działa).
// Blokady nie obchodzimy. Włączyć ponownie po uzyskaniu zgody Opery albo gdy blokada zniknie (usuń `wlaczone: false`).
export default {
  id: 'opera-krakowska',
  wlaczone: false,
  nazwa: 'Opera Krakowska',
  url: `${BAZA}/repertuar`,
  rodzaj: 'wydarzenia',
  miejsca: [['Opera Krakowska', /^opera krakowska$/i]],
  async pobierz() {
    const wszystkie = [];
    for (const [rok, mies] of miesiaceOkna(dzisWarszawa(), DNI_WYPRZEDZENIA)) {
      wszystkie.push(...parsuj(wytnijJson(await pobierz(`${BAZA}/ajax/repertuar?year=${rok}&month=${pad(mies)}`, { robots: true }))));
    }
    return wszystkie;
  },
};
