// Karty miejsc: adresy (slug), reguły indeksowania i odchudzone dane dla przeglądarki. Bez pobierania danych.
import { slugZ } from './kategorie';

// Sekcje, które mają karty miejsc (reszta, np. „archiwum", nie jest nigdzie pokazywana).
export const SEKCJE_Z_KARTA = new Set(['z-marszu', 'treningi', 'zajecia', 'polkolonie']);

// Flagi z arkusza, przy których karta dostaje noindex.
// Flaga „ta sama firma jest też w swojej kategorii" oznacza kopię organizatora półkolonii, czyli powtórzoną treść.
const FLAGI_NOINDEX = /do weryfikacji|brak adresu|domena z innego miasta|ta sama firma jest też w swojej kategorii/i;

// Początek identyfikatora Google jest wspólny (zaczyna się od „ChIJ", a dalej koduje okolicę), więc dwa oddziały tej samej sieci
// miałyby ten sam sufiks. Bierzemy więc znaki z końca identyfikatora.
const koncowkaId = (id, dlugosc) => String(id || '').replace(/-polk$/, '').replace(/[^a-z0-9]/gi, '').toLowerCase().slice(-dlugosc);

// Slug: nazwa bez polskich znaków + 4 znaki z place_id (stały, bo id się nie zmienia). Kopia miejsca w półkoloniach ma id z przyrostkiem
// „-polk", więc dostaje „-polkolonie" w adresie. Ta podstawowa wersja liczy się też w przeglądarce, więc nie trzeba jej przesyłać.
export const slugPodstawowy = (p, dlugosc = 4) =>
  `${(slugZ(p.name) || 'miejsce').slice(0, 60).replace(/-+$/, '')}${/-polk$/.test(p.id) ? '-polkolonie' : ''}-${koncowkaId(p.id, dlugosc)}`;

// Gdy dwa miejsca dałyby ten sam adres, sufiks drugiego się wydłuża (wtedy slug jest przesyłany do przeglądarki osobno).
export function nadajSlugi(places) {
  const zajete = new Set();
  places.forEach((p) => {
    let dl = 4, slug = slugPodstawowy(p, dl);
    while (zajete.has(slug) && dl < 24) { dl += 2; slug = slugPodstawowy(p, dl); }
    zajete.add(slug);
    p.slug = SEKCJE_Z_KARTA.has(p.sekcja) ? slug : '';
  });
  return places;
}

// Adres karty miejsca (strona kategorii i listy dostają tylko miejsca z sekcji, które mają karty).
export const adresKarty = (p) => `/miejsce/${p.slug || slugPodstawowy(p)}`;

// Karta jest indeksowana tylko, gdy ma adres, współrzędne, co najmniej 20 opinii i żadnej flagi „do sprawdzenia".
export const kartaIndeksowalna = (p) => Boolean(
  p.slug && p.adres && p.lat != null && p.lon != null && (p.reviews ?? 0) >= 20 && !FLAGI_NOINDEX.test(p.flaga || '')
);

// Pola potrzebne przeglądarce do kafelków, listy i mapy. Puste pola pomijamy, żeby nie powiększać strony.
export function doKlienta(p) {
  const o = { id: p.id, name: p.name, kategoria: p.kategoria, podkategoria: p.podkategoria, gmina: p.gmina, strefa: p.strefa };
  if (p.slug && p.slug !== slugPodstawowy(p)) o.slug = p.slug; // zwykle wystarczy podstawowy, liczony w przeglądarce
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
