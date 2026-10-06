import { slugZ } from './kategorie';

// Karty miejsc (/miejsce/[slug]). Bez pobierania danych — działa też w przeglądarce.

// Adres karty: nazwa bez polskich znaków + 4 pierwsze znaki place_id (po wspólnym początku „ChIJ", który mają wszystkie identyfikatory Google).
const kluczId = (id, n = 4) => String(id || '').replace(/^ChIJ/, '').replace(/[^A-Za-z0-9]/g, '').slice(0, n).toLowerCase();
export const slugMiejsca = (nazwa, id, n = 4) => `${slugZ(nazwa) || 'miejsce'}-${kluczId(id, n)}`;

// Sekcje, dla których robimy karty (archiwum zostaje bez karty).
export const SEKCJE_Z_KARTA = new Set(['z-marszu', 'treningi', 'zajecia', 'polkolonie']);

const FLAGI_NOINDEX = /do weryfikacji|brak adresu|domena z innego miasta/i;

// Karta bez adresu, bez współrzędnych, z mniej niż 20 opiniami albo z flagą kontrolną nie trafia do Google.
export const czyKartaIndeksowalna = (p) =>
  Boolean(p.adres) && p.lat != null && p.lon != null && (p.reviews ?? 0) >= 20 && !FLAGI_NOINDEX.test(p.flaga || '');

// Wiek tylko wtedy, gdy opis go podaje: „3–9 lat", „od 4 lat", „4+".
export function wiekZOpisu(opis) {
  const t = String(opis || '');
  const zakres = t.match(/(\d{1,2})\s*[–-]\s*(\d{1,2})\s*(?:lat|l\.)/i);
  if (zakres) return `${zakres[1]}–${zakres[2]} lat`;
  const od = t.match(/od\s+(\d{1,2})\s*(?:lat|roku|r\.)/i) || t.match(/\b(\d{1,2})\s*\+/);
  return od ? `od ${od[1]} lat` : '';
}

// Tylko pola potrzebne na listach, kafelkach i mapie — puste wartości pomijamy (mniej danych do przeglądarki).
export function doListy(p) {
  // Najczęstsze wartości pomijamy: brak `kategoria` = „Pod dachem", brak `strefa` = „Kraków i okolice", brak `gmina` = „Kraków".
  const wynik = { id: p.id, name: p.name, podkategoria: p.podkategoria };
  if (p.slug !== slugMiejsca(p.name, p.id)) wynik.slug = p.slug; // tylko przy zbiegu adresów; resztę przeglądarka liczy sama (`adresKarty`)
  if (p.kategoria !== 'Pod dachem') wynik.kategoria = p.kategoria;
  if (p.strefa !== 'Kraków i okolice') wynik.strefa = p.strefa;
  if (p.gmina !== 'Kraków') wynik.gmina = p.gmina;
  if (p.dyscyplina) wynik.dyscyplina = p.dyscyplina;
  if (p.adres) wynik.adres = p.adres;
  if (p.rating != null) wynik.rating = p.rating;
  if (p.reviews != null) wynik.reviews = p.reviews;
  if (p.website) wynik.website = p.website;
  if (p.urodziny) wynik.urodziny = true;
  if (p.km != null) wynik.km = p.km;
  if (p.lat != null && p.lon != null) { wynik.lat = Math.round(p.lat * 1e5) / 1e5; wynik.lon = Math.round(p.lon * 1e5) / 1e5; }
  return wynik;
}

// Adres karty miejsca z rekordu listy (przeglądarka i serwer liczą go tak samo).
export const adresKarty = (p) => `/miejsce/${p.slug || slugMiejsca(p.name, p.id)}`;
