// Karty miejsc: adresy (slug), reguły indeksowania i odchudzone dane dla przeglądarki. Bez pobierania danych.
import { slugZ } from './kategorie';

// Sekcje, które mają karty miejsc (reszta, np. „archiwum", nie jest nigdzie pokazywana).
export const SEKCJE_Z_KARTA = new Set(['z-marszu', 'treningi', 'zajecia', 'polkolonie']);

// Flagi z arkusza, przy których karta dostaje noindex.
const FLAGI_NOINDEX = /do weryfikacji|brak adresu|domena z innego miasta/i;

// Identyfikatory Google zaczynają się od wspólnego „ChIJ", więc przy sufiksie pomijamy ten przedrostek.
const koncowkaId = (id, dlugosc) => String(id || '').replace(/^ChIJ/, '').replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, dlugosc);

// Slug: nazwa bez polskich znaków + 4 znaki z place_id. Gdy dwa miejsca dałyby ten sam adres, sufiks się wydłuża.
export function nadajSlugi(places) {
  const zajete = new Set();
  places.forEach((p) => {
    const baza = (slugZ(p.name) || 'miejsce').slice(0, 60).replace(/-+$/, '');
    let dl = 4, slug = `${baza}-${koncowkaId(p.id, dl)}`;
    while (zajete.has(slug) && dl < 24) { dl += 2; slug = `${baza}-${koncowkaId(p.id, dl)}`; }
    zajete.add(slug);
    p.slug = SEKCJE_Z_KARTA.has(p.sekcja) ? slug : '';
  });
  return places;
}

// Karta jest indeksowana tylko, gdy ma adres, współrzędne, co najmniej 20 opinii i żadnej flagi „do sprawdzenia".
export const kartaIndeksowalna = (p) => Boolean(
  p.slug && p.adres && p.lat != null && p.lon != null && (p.reviews ?? 0) >= 20 && !FLAGI_NOINDEX.test(p.flaga || '')
);

// Pola potrzebne przeglądarce do kafelków, listy i mapy. Puste pola pomijamy, żeby nie powiększać strony.
export function doKlienta(p) {
  const o = { id: p.id, name: p.name, kategoria: p.kategoria, podkategoria: p.podkategoria, gmina: p.gmina, strefa: p.strefa };
  if (p.slug) o.slug = p.slug;
  if (p.dyscyplina) o.dyscyplina = p.dyscyplina;
  if (p.adres) o.adres = p.adres;
  if (p.rating != null) o.rating = p.rating;
  if (p.reviews != null) o.reviews = p.reviews;
  if (p.website) o.website = p.website;
  if (p.urodziny) o.urodziny = true;
  if (p.km != null) o.km = p.km;
  if (p.lat != null) o.lat = p.lat;
  if (p.lon != null) o.lon = p.lon;
  return o;
}

// Wiek podany w opisie („od 3 lat", „3–9 lat", „4+"), jeśli jest.
export const wiekZOpisu = (opis) => {
  const t = String(opis || '');
  const m = t.match(/\bod\s+\d{1,2}\s+(?:lat|roku|miesięcy)|\b\d{1,2}\s*[–-]\s*\d{1,2}\s+lat|\b\d{1,2}\+(?!\w)/i);
  return m ? m[0] : '';
};
