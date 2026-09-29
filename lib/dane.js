import Papa from 'papaparse';

const SHEET_CSV_URL = process.env.SHEET_CSV_URL;
const SHEET_EVENTS_CSV_URL = process.env.SHEET_EVENTS_CSV_URL;

// Podkategorie z sekcji „Zajęcia". Reszta to miejsca „z marszu", Półkolonie mają osobną stronę.
export const PODKAT_ZAJECIA = new Set([
  'Zajęcia mama-dziecko', 'Zajęcia edukacyjne i artystyczne', 'Szkoły pływania',
  'Zajęcia sportowe', 'Sport / zajęcia ruchowe', 'Instytucja kultury',
]);

const sekcjaZ = (row) => {
  if (row.sekcja) return row.sekcja;
  if (row.podkategoria === 'Półkolonie') return 'polkolonie';
  return PODKAT_ZAJECIA.has(row.podkategoria) ? 'zajecia' : 'z-marszu';
};

const liczba = (v) => {
  const n = parseFloat(String(v || '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

async function pobierzMiejsca() {
  const res = await fetch(SHEET_CSV_URL);
  const rows = Papa.parse(await res.text(), { header: true, skipEmptyLines: true }).data;
  return rows
    .filter((row) => row.name)
    .map((row, i) => ({
      id: row.place_id || String(i),
      name: row.name,
      kategoria: row.kategoria_glowna || '',
      podkategoria: row.podkategoria === 'Sport / zajęcia ruchowe' ? 'Zajęcia sportowe' : row.podkategoria || '',
      sekcja: sekcjaZ(row),
      adres: row.street || '',
      gmina: String(row.gmina_aglomeracja || 'Kraków').startsWith('Kraków') ? 'Kraków' : row.gmina_aglomeracja,
      rating: liczba(row.rating),
      reviews: liczba(row.reviews),
      website: /wikipedia\.org/.test(row.website || '') ? '' : row.website || '',
      urodziny: (row.organizuje_urodziny || '').toLowerCase() === 'tak',
      strefa: row.strefa || 'Kraków i okolice',
      km: liczba(row.odleglosc_km),
      lat: liczba(row.lat),
      lon: liczba(row.lon),
    }));
}

async function pobierzWydarzenia(places) {
  if (!SHEET_EVENTS_CSV_URL) return [];
  try {
    const res = await fetch(SHEET_EVENTS_CSV_URL);
    const rows = Papa.parse(await res.text(), { header: true, skipEmptyLines: true }).data;
    const poId = Object.fromEntries(places.map((p) => [p.id, p]));
    const ok = new Set(['', 'aktywne', 'zatwierdzone']);
    return rows
      .filter((r) => r.nazwa && r.data_regula && ok.has(String(r.status || '').trim().toLowerCase()))
      .map((r, i) => {
        const miejsce = poId[r.powiazane_miejsce_id];
        return {
          id: r.id || `w${i}`,
          nazwa: r.nazwa,
          data_regula: r.data_regula,
          godzina: (r.godzina || '').trim(),
          miejsce: r.miejsce || (miejsce ? miejsce.name : ''),
          wiek: r.grupa_wiekowa || '',
          cena: r.cena || '',
          link: r.link_biletow || '',
          miejsceId: miejsce ? miejsce.id : '',
          kino: (miejsce && miejsce.podkategoria === 'Kino') || /kino|seans|film/i.test(r.kategoria || ''),
        };
      });
  } catch (e) {
    return [];
  }
}

// Wspólne dla wszystkich stron: dane odświeżają się co godzinę bez przebudowy.
export async function pobierzDane({ sekcja, zWydarzeniami = false }) {
  if (!SHEET_CSV_URL) return { props: { places: [], wydarzenia: [], missingConfig: true }, revalidate: 3600 };
  try {
    const wszystkie = await pobierzMiejsca();
    const wydarzenia = zWydarzeniami ? await pobierzWydarzenia(wszystkie) : [];
    const places = wszystkie.filter((p) => p.sekcja === sekcja);
    return { props: { places, wydarzenia, missingConfig: false }, revalidate: 3600 };
  } catch (e) {
    return { props: { places: [], wydarzenia: [], missingConfig: false, fetchError: true }, revalidate: 600 };
  }
}
