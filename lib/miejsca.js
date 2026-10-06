import { slugZ } from './kategorie';

// Karty miejsc (/miejsce/[slug]). Bez pobierania danych — działa też w przeglądarce.

// Adres karty: nazwa bez polskich znaków + 4 pierwsze znaki place_id (po wspólnym początku „ChIJ", który mają wszystkie identyfikatory Google).
const kluczId = (id, n = 4) => String(id || '').replace(/^ChIJ/, '').replace(/[^A-Za-z0-9]/g, '').slice(0, n).toLowerCase();
export const slugMiejsca = (nazwa, id, n = 4) => `${slugZ(nazwa) || 'miejsce'}-${kluczId(id, n)}`;

// Kopia organizatora w sekcji „Półkolonie": ta sama firma co wiersz w swojej kategorii (place_id kończy się na „-polk").
export const czyKopiaPolkolonii = (p) => /-polk$/.test(String(p.id || ''));

// Nadaje każdemu miejscu unikalny adres karty. Najpierw 4 znaki place_id; przy zbiegu 8 znaków (to już działa, nie zmieniamy);
// jeśli i wtedy adresy się powtarzają (kopia półkolonii ma ten sam początek place_id co oryginał), oryginał zostaje,
// a kopia dostaje „-polkolonie" (w ostateczności numer: „-2", „-3").
export function przypiszSlugi(miejsca) {
  const licz = (klucz) => miejsca.reduce((m, p) => { m[klucz(p)] = (m[klucz(p)] || 0) + 1; return m; }, {});
  const ile4 = licz((p) => slugMiejsca(p.name, p.id));
  miejsca.forEach((p) => { p.slug = ile4[slugMiejsca(p.name, p.id)] > 1 ? slugMiejsca(p.name, p.id, 8) : slugMiejsca(p.name, p.id); });
  const zajete = new Set();
  // oryginały przed kopiami, żeby oryginał zawsze zachował swój dotychczasowy adres
  [...miejsca].sort((a, b) => Number(czyKopiaPolkolonii(a)) - Number(czyKopiaPolkolonii(b))).forEach((p) => {
    let slug = p.slug;
    if (zajete.has(slug) && czyKopiaPolkolonii(p)) slug = `${p.slug}-polkolonie`;
    for (let n = 2; zajete.has(slug); n += 1) slug = `${p.slug}-${n}`;
    p.slug = slug;
    zajete.add(slug);
  });
}

// Sekcje, dla których robimy karty (archiwum zostaje bez karty).
export const SEKCJE_Z_KARTA = new Set(['z-marszu', 'treningi', 'zajecia', 'polkolonie']);

const FLAGI_NOINDEX = /do weryfikacji|brak adresu|domena z innego miasta/i;

// Karta bez adresu, bez współrzędnych, z mniej niż 20 opiniami albo z flagą kontrolną nie trafia do Google.
// Kopie organizatorów półkolonii to ta sama firma co oryginał — też nie idą do Google (żeby nie było dwóch takich samych stron).
export const czyKartaIndeksowalna = (p) =>
  !czyKopiaPolkolonii(p) && Boolean(p.adres) && p.lat != null && p.lon != null && (p.reviews ?? 0) >= 20 && !FLAGI_NOINDEX.test(p.flaga || '');

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
