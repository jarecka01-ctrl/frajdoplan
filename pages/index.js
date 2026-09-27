import { useMemo, useState } from 'react';
import Papa from 'papaparse';

const SHEET_CSV_URL = process.env.SHEET_CSV_URL;

export async function getStaticProps() {
  if (!SHEET_CSV_URL) {
    return { props: { places: [], missingConfig: true }, revalidate: 3600 };
  }

  try {
    const res = await fetch(SHEET_CSV_URL);
    const text = await res.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

    const places = parsed.data
      .filter((row) => row.name)
      .map((row, i) => ({
        id: row.place_id || String(i),
        name: row.name,
        kategoria: row.kategoria_glowna || '',
        podkategoria: row.podkategoria || '',
        pogoda: row.pogoda || '',
        adres: row.street || '',
        gmina: row.gmina_aglomeracja || 'Kraków',
        rating: row.rating || '',
        reviews: row.reviews || '',
        website: row.website || '',
        urodziny: (row.organizuje_urodziny || '').toLowerCase() === 'tak',
      }));

    return { props: { places, missingConfig: false }, revalidate: 3600 };
  } catch (e) {
    return { props: { places: [], missingConfig: false, fetchError: true }, revalidate: 600 };
  }
}

const KATEGORIA_LABEL = { 'Plener': 'Na polu', 'Pod dachem': 'Pod dachem' };
const displayKategoria = (k) => KATEGORIA_LABEL[k] || k;

export default function Home({ places, missingConfig, fetchError }) {
  const [kategoria, setKategoria] = useState('');
  const [podkategoria, setPodkategoria] = useState('');
  const [gmina, setGmina] = useState('');
  const [query, setQuery] = useState('');

  const podkategorie = useMemo(() => {
    const set = new Set(places.map((p) => p.podkategoria).filter(Boolean));
    return [...set].sort();
  }, [places]);

  const gminy = useMemo(() => {
    const set = new Set(places.map((p) => p.gmina).filter(Boolean));
    return [...set].sort();
  }, [places]);

  const filtered = places.filter((p) => {
    if (kategoria && p.kategoria !== kategoria) return false;
    if (podkategoria && p.podkategoria !== podkategoria) return false;
    if (gmina && p.gmina !== gmina) return false;
    if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="wrap">
      <header>
        <div className="brand">Frajdoplan</div>
      </header>
      <p className="tagline">Co robić z dzieckiem w Krakowie, dziś i w ten weekend.</p>

      {missingConfig && (
        <div className="notice">
          Brak zmiennej środowiskowej <code>SHEET_CSV_URL</code> — ustaw ją w panelu Vercel
          (Settings → Environment Variables), wskazując opublikowany link CSV z Arkusza Google.
        </div>
      )}
      {fetchError && (
        <div className="notice">
          Nie udało się pobrać danych z arkusza — sprawdź, czy link CSV nadal działa.
        </div>
      )}

      <div className="filters">
        <input
          type="text"
          placeholder="Szukaj miejsca..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={kategoria} onChange={(e) => setKategoria(e.target.value)}>
          <option value="">Wszystkie kategorie</option>
          <option value="Pod dachem">Pod dachem</option>
          <option value="Plener">Na polu</option>
        </select>
        <select value={podkategoria} onChange={(e) => setPodkategoria(e.target.value)}>
          <option value="">Wszystkie podkategorie</option>
          {podkategorie.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select value={gmina} onChange={(e) => setGmina(e.target.value)}>
          <option value="">Kraków + aglomeracja</option>
          {gminy.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      <p className="count">{filtered.length} miejsc pasuje do filtrów</p>

      <div className="list">
        {filtered.slice(0, 200).map((p) => (
          <div className="card" key={p.id}>
            <div className="row">
              <p className="name">{p.name}</p>
              {p.urodziny && <span className="tag urodziny">urodziny</span>}
            </div>
            <p className="meta">
              {p.podkategoria || displayKategoria(p.kategoria)} · {p.adres} {p.adres && '·'} {p.gmina}
            </p>
            <div className="tags">
              {p.rating && <span className="tag">★ {p.rating} ({p.reviews})</span>}
              {p.pogoda && <span className="tag">{p.pogoda}</span>}
              {p.website && (
                <a className="tag link" href={p.website} target="_blank" rel="noreferrer">
                  strona
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length > 200 && (
        <p className="count">Pokazano pierwsze 200 z {filtered.length} — dopracujemy paginację później.</p>
      )}
    </div>
  );
}
