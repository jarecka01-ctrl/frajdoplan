// Odległości i granice regionu dla „Blisko mnie" (tylko w przeglądarce, położenie nigdzie nie jest zapisywane ani wysyłane).

export const RYNEK = { lat: 50.0617, lon: 19.9373 };
export const PROMIEN_REGIONU_KM = 40; // dalej niż to od Rynku nie przybliżamy mapy na pozycję użytkownika
export const PROMIEN_OKOLICY_KM = 2.5; // widok „okolica": ok. 2–3 km wokół (zoom 14–15)
export const MIN_MIEJSC_W_OKOLICY = 5; // gdy w okolicy jest mniej miejsc, oddalamy, żeby objąć co najmniej tyle najbliższych

// Odległość w km między dwoma punktami (wzór haversine).
export function km(a, b) {
  const R = 6371, r = (x) => (x * Math.PI) / 180;
  const dLat = r(b.lat - a.lat), dLon = r(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const pozaRegionem = (ja) => km(RYNEK, ja) > PROMIEN_REGIONU_KM;

// Promień (km) okolicy użytkownika: 2,5 km, a gdy mieści się w nim mniej niż 5 miejsc, tyle, żeby objąć 5 najbliższych
// (z niewielkim zapasem). Miejsca bez współrzędnych pomijamy.
export function promienOkolicy(ja, miejsca) {
  const odleglosci = miejsca
    .filter((p) => p.lat != null && p.lon != null)
    .map((p) => km(ja, p))
    .sort((a, b) => a - b);
  const wOkolicy = odleglosci.filter((d) => d <= PROMIEN_OKOLICY_KM).length;
  if (wOkolicy >= MIN_MIEJSC_W_OKOLICY || odleglosci.length === 0) return PROMIEN_OKOLICY_KM;
  const piate = odleglosci[Math.min(MIN_MIEJSC_W_OKOLICY, odleglosci.length) - 1];
  return Math.max(PROMIEN_OKOLICY_KM, piate * 1.15 + 0.2);
}
