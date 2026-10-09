// Jakość powietrza w Krakowie: średni indeks ze stacji GIOŚ w Krakowie (otwarte dane, api.gios.gov.pl). Tylko na serwerze.
// Błąd lub brak danych = null, a widżet pokazuje samą pogodę. Klucze odpowiedzi (GIOŚ ma polskie) szukamy po nazwie; stacje Krakowa wybieramy po współrzędnych. Adres bazowy można podmienić zmienną GIOS_API_URL.
const BAZA = (process.env.GIOS_API_URL || 'https://api.gios.gov.pl/pjp-api/v1/rest').replace(/\/+$/, '');
const ETYKIETY = ['bardzo dobre', 'dobre', 'umiarkowane', 'dostateczne', 'złe', 'bardzo złe']; // indeks 0–5
const KOLORY = ['#3f9b3a', '#6BC04B', '#F7B32B', '#F28C28', '#E4483A', '#8d2418'];

const znajdz = (obj, wzor) => { const k = Object.keys(obj || {}).find((x) => wzor.test(x)); return k ? obj[k] : undefined; };
const bezPolskich = (x) => String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').trim();
// Nazwy kategorii indeksu GIOŚ → poziom 0–5
const POZIOMY = { 'bardzo dobry': 0, dobry: 1, umiarkowany: 2, dostateczny: 3, zly: 4, 'bardzo zly': 5 };
const SRODEK = { lat: 50.0647, lon: 19.945 };
const PROMIEN_KM = 14; // stacje w granicach Krakowa (nie zależymy od nazwy miasta w odpowiedzi)

const odlegloscKm = (lat, lon) => {
  const r = Math.PI / 180; const dLat = (lat - SRODEK.lat) * r; const dLon = (lon - SRODEK.lon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(SRODEK.lat * r) * Math.cos(lat * r) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};

async function json(url) {
  // bez nagłówka Accept: GIOŚ odpowiada na niego błędem 406 (potwierdzone w logach budowania)
  const res = await fetch(url, { headers: { 'User-Agent': 'frajdoplan.pl https://frajdoplan.pl' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

async function stacjeKrakowa() {
  const wszystkie = [];
  for (let strona = 0, stron = 1; strona < stron && strona < 5; strona += 1) {
    const odp = await json(`${BAZA}/station/findAll?page=${strona}&size=500`);
    stron = Number(odp.totalPages) || 1;
    wszystkie.push(...(Array.isArray(odp) ? odp : (znajdz(odp, /lista stacji/i) || Object.values(odp).find(Array.isArray) || [])));
  }
  return wszystkie.filter((s) => {
    const lat = Number(String(znajdz(s, /^wgs84 .*n$/i) ?? '').replace(',', '.'));
    const lon = Number(String(znajdz(s, /^wgs84 .*e$/i) ?? '').replace(',', '.'));
    return Number.isFinite(lat) && Number.isFinite(lon) && lat !== 0 && odlegloscKm(lat, lon) <= PROMIEN_KM;
  });
}

export async function pobierzPowietrze() {
  try {
    const krakow = await stacjeKrakowa();
    console.log(`[powietrze] stacji w promieniu ${PROMIEN_KM} km od Krakowa: ${krakow.length}`);
    const wyniki = await Promise.all(krakow.map(async (s) => {
      try {
        const o = await json(`${BAZA}/aqindex/getIndex/${znajdz(s, /identyfikator stacji|^id$/i)}`);
        const korzen = znajdz(o, /aqindex/i) || o;
        const nazwa = bezPolskich(znajdz(korzen, /^nazwa kategorii indeksu$/i));
        if (!(nazwa in POZIOMY)) console.warn(`[powietrze] stacja ${znajdz(s, /identyfikator stacji|^id$/i)}: nieznana kategoria „${nazwa}", klucze: ${Object.keys(korzen || {}).join(' | ')}`);
        return nazwa in POZIOMY ? POZIOMY[nazwa] : null;
      } catch (e) { console.warn(`[powietrze] stacja ${znajdz(s, /identyfikator stacji|^id$/i)}: ${e.message}`); return null; }
    }));
    const dobre = wyniki.filter((x) => x !== null);
    if (!dobre.length) { console.warn('[powietrze] brak odczytów ze stacji'); return null; }
    const srednia = Math.round(dobre.reduce((s, x) => s + x, 0) / dobre.length);
    return { poziom: srednia, etykieta: ETYKIETY[srednia], kolor: KOLORY[srednia], stacje: dobre.length };
  } catch (e) {
    console.warn(`[powietrze] błąd: ${e.message}`);
    return null;
  }
}
