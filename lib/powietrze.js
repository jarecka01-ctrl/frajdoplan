// Jakość powietrza w Krakowie: średni indeks ze stacji GIOŚ w Krakowie (otwarte dane, api.gios.gov.pl). Tylko na serwerze.
// Błąd lub brak danych = null, a widżet pokazuje samą pogodę. Klucze odpowiedzi szukamy po nazwie (API GIOŚ ma polskie klucze),
// żeby drobna zmiana nazw nie wyłączyła widżetu. Adres bazowy można podmienić zmienną GIOS_API_URL.
const BAZA = (process.env.GIOS_API_URL || 'https://api.gios.gov.pl/pjp-api/v1/rest').replace(/\/+$/, '');
const ETYKIETY = ['bardzo dobre', 'dobre', 'umiarkowane', 'dostateczne', 'złe', 'bardzo złe']; // indeks 0–5
const KOLORY = ['#3f9b3a', '#6BC04B', '#F7B32B', '#F28C28', '#E4483A', '#8d2418'];

const znajdz = (obj, wzor) => { const k = Object.keys(obj || {}).find((x) => wzor.test(x)); return k ? obj[k] : undefined; };
const zNazwa = (x) => String(x || '').toLowerCase();

async function json(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

export async function pobierzPowietrze() {
  try {
    const odp = await json(`${BAZA}/station/findAll?size=500`);
    const lista = Array.isArray(odp) ? odp : (Object.values(odp).find(Array.isArray) || []);
    const krakow = lista.filter((s) => /krak[oó]w/.test(zNazwa(znajdz(s, /miast|city/i)) + ' ' + zNazwa(znajdz(s, /nazwa stacji|stationname/i))));
    const id = (s) => znajdz(s, /identyfikator stacji|^id$/i);
    const wyniki = await Promise.all(krakow.map(async (s) => {
      try {
        const o = await json(`${BAZA}/aqindex/getIndex/${id(s)}`);
        const korzen = znajdz(o, /aqindex|stindex/i) || o;
        const w = znajdz(korzen, /warto.*indeksu|indexlevel|^id$/i);
        const liczba = typeof w === 'object' ? Number(znajdz(w, /^id$|warto/i)) : Number(w);
        return Number.isFinite(liczba) && liczba >= 0 && liczba <= 5 ? liczba : null;
      } catch (e) { return null; }
    }));
    const dobre = wyniki.filter((x) => x !== null);
    if (!dobre.length) return null;
    const srednia = Math.round(dobre.reduce((s, x) => s + x, 0) / dobre.length);
    return { poziom: srednia, etykieta: ETYKIETY[srednia], kolor: KOLORY[srednia], stacje: dobre.length };
  } catch (e) {
    return null;
  }
}
