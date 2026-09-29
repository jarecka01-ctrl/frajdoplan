import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Papa from 'papaparse';
import Wydarzenia from '../components/Wydarzenia';
import BliskoIKina from '../components/BliskoIKina';
import { IKONY } from '../lib/ikony';

// Mapa ładuje się tylko w przeglądarce (Leaflet nie działa na serwerze).
const Mapa = dynamic(() => import('../components/Mapa'), {
  ssr: false,
  loading: () => <div className="mapa mapa-ladowanie">Ładuję mapę…</div>,
});

const SHEET_CSV_URL = process.env.SHEET_CSV_URL;
const SHEET_EVENTS_CSV_URL = process.env.SHEET_EVENTS_CSV_URL;

// Zakładka „Wydarzenia" z arkusza. Brak linku lub błąd = pusta lista (strona działa dalej).
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
const NA_STRONE = 24;

export async function getStaticProps() {
  if (!SHEET_CSV_URL) {
    return { props: { places: [], missingConfig: true }, revalidate: 3600 };
  }
  try {
    const res = await fetch(SHEET_CSV_URL);
    const text = await res.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    const liczba = (v) => {
      const n = parseFloat(String(v || '').replace(',', '.'));
      return Number.isFinite(n) ? n : null;
    };
    const places = parsed.data
      .filter((row) => row.name)
      .map((row, i) => ({
        id: row.place_id || String(i),
        name: row.name,
        kategoria: row.kategoria_glowna || '',
        podkategoria: row.podkategoria || '',
        adres: row.street || '',
        gmina: row.gmina_aglomeracja || 'Kraków',
        rating: liczba(row.rating),
        reviews: liczba(row.reviews),
        website: row.website || '',
        urodziny: (row.organizuje_urodziny || '').toLowerCase() === 'tak',
        strefa: row.strefa || 'Kraków i okolice',
        km: liczba(row.odleglosc_km),
        lat: liczba(row.lat),
        lon: liczba(row.lon),
      }));
    const wydarzenia = await pobierzWydarzenia(places);
    return { props: { places, wydarzenia, missingConfig: false }, revalidate: 3600 };
  } catch (e) {
    return { props: { places: [], missingConfig: false, fetchError: true }, revalidate: 600 };
  }
}


const STREFY = [
  { id: 'Kraków i okolice', label: 'Kraków' },
  { id: 'Pod Krakowem', label: 'Pod Krakowem' },
  { id: '', label: 'Wszystko' },
];

const KATEGORIE = [
  { id: '', label: 'Wszystko' },
  { id: 'Pod dachem', label: 'Pod dachem' },
  { id: 'Plener', label: 'Na polu' },
];

const odmianaMiejsc = (n) => {
  if (n === 1) return 'miejsce';
  const r10 = n % 10, r100 = n % 100;
  return r10 >= 2 && r10 <= 4 && !(r100 >= 12 && r100 <= 14) ? 'miejsca' : 'miejsc';
};

export default function Home({ places, wydarzenia = [], missingConfig, fetchError }) {
  const [strefa, setStrefa] = useState('Kraków i okolice');
  const [kategoria, setKategoria] = useState('');
  const [podkategoria, setPodkategoria] = useState('');
  const [gmina, setGmina] = useState('');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(NA_STRONE);
  const [widok, setWidok] = useState('lista');

  useEffect(() => setLimit(NA_STRONE), [strefa, kategoria, podkategoria, gmina, query]);

  const podkategorie = useMemo(() => {
    const set = new Set(
      places
        .filter((p) => (!strefa || p.strefa === strefa) && (!kategoria || p.kategoria === kategoria))
        .map((p) => p.podkategoria)
        .filter(Boolean)
    );
    return [...set].sort((a, b) => a.localeCompare(b, 'pl'));
  }, [places, strefa, kategoria]);

  const gminy = useMemo(() => {
    const set = new Set(places.filter((p) => !strefa || p.strefa === strefa).map((p) => p.gmina).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, 'pl'));
  }, [places, strefa]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = places.filter((p) => {
      if (strefa && p.strefa !== strefa) return false;
      if (kategoria && p.kategoria !== kategoria) return false;
      if (podkategoria && p.podkategoria !== podkategoria) return false;
      if (gmina && p.gmina !== gmina) return false;
      if (q && !`${p.name} ${p.adres} ${p.podkategoria}`.toLowerCase().includes(q)) return false;
      return true;
    });
    if (strefa === 'Pod Krakowem') out.sort((a, b) => (a.km ?? 999) - (b.km ?? 999));
    else out.sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0));
    return out;
  }, [places, strefa, kategoria, podkategoria, gmina, query]);

  const wyczysc = () => {
    setKategoria(''); setPodkategoria(''); setGmina(''); setQuery('');
  };

  return (
    <>
      <Head>
        <title>Frajdoplan — gdzie dziś idziemy z dzieckiem w Krakowie</title>
        {/* Wersja testowa: nie indeksuj. Usuń tę linię po podpięciu domeny frajdoplan.pl. */}
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="Sale zabaw, place zabaw, muzea, baseny i wycieczki pod Krakowem. Sprawdź, gdzie iść z dzieckiem dziś i w weekend." />
      </Head>

      <div className="wrap">
        <header className="top">
          <span className="brand">Frajdoplan</span>
        </header>

        <section className="hero">
          <h1>Gdzie dziś idziemy?</h1>
          <p className="lead">Miejsca dla dzieci w Krakowie i okolicy: od sal zabaw po wycieczki za miasto.</p>
        </section>

        {missingConfig && (
          <div className="notice">
            Brak zmiennej <code>SHEET_CSV_URL</code>. Ustaw ją w Vercel (Settings → Environment Variables) — link CSV z Arkusza Google.
          </div>
        )}
        {fetchError && <div className="notice">Nie udało się pobrać danych z arkusza. Sprawdź, czy link CSV nadal działa.</div>}

        <Wydarzenia wydarzenia={wydarzenia} />
        <BliskoIKina places={places} wydarzenia={wydarzenia} />

        <h2 className="sekcja">Miejsca na każdy dzień</h2>
        <nav className="strefy" aria-label="Gdzie szukasz">
          {STREFY.map((z) => (
            <button key={z.label} className="strefa" aria-pressed={strefa === z.id} onClick={() => setStrefa(z.id)}>
              {z.label}
            </button>
          ))}
        </nav>

        <div className="panel">
          <label className="szukaj">
            <span className="sr-only">Szukaj</span>
            <input
              type="search"
              placeholder="Szukaj: basen, Nowa Huta, trampoliny…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          <div className="chipy" role="group" aria-label="Pod dachem czy na polu">
            {KATEGORIE.map((k) => (
              <button
                key={k.label}
                className={`chip chip-${k.id === 'Plener' ? 'pole' : k.id === 'Pod dachem' ? 'dach' : 'all'}`}
                aria-pressed={kategoria === k.id}
                onClick={() => { setKategoria(k.id); setPodkategoria(''); }}
              >
                {k.label}
              </button>
            ))}
          </div>

          <div className="selecty">
            <select value={podkategoria} onChange={(e) => setPodkategoria(e.target.value)} aria-label="Rodzaj miejsca">
              <option value="">Każdy rodzaj miejsca</option>
              {podkategorie.map((p) => <option key={p} value={p}>{IKONY[p] ? `${IKONY[p]} ` : ''}{p}</option>)}
            </select>
            <select value={gmina} onChange={(e) => setGmina(e.target.value)} aria-label="Miejscowość">
              <option value="">Każda miejscowość</option>
              {gminy.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        <div className="wynik-pasek">
          <p className="wynik" aria-live="polite">
            {filtered.length} {odmianaMiejsc(filtered.length)}
            {strefa === 'Pod Krakowem' && widok === 'lista' && ', najbliższe na górze'}
          </p>
          <div className="widok" role="group" aria-label="Widok">
            <button className="widok-btn" aria-pressed={widok === 'lista'} onClick={() => setWidok('lista')}>Lista</button>
            <button className="widok-btn" aria-pressed={widok === 'mapa'} onClick={() => setWidok('mapa')}>Mapa</button>
          </div>
        </div>

        {widok === 'mapa' && filtered.length > 0 ? (
          <Mapa miejsca={filtered} />
        ) : filtered.length === 0 ? (
          <div className="pusto">
            <p>Nic tu nie pasuje do tych filtrów.</p>
            <button className="przycisk" onClick={wyczysc}>Wyczyść filtry</button>
          </div>
        ) : (
          <ul className="lista">
            {filtered.slice(0, limit).map((p) => {
              const pole = p.kategoria === 'Plener';
              return (
                <li key={p.id} className={`karta ${pole ? 'karta-pole' : 'karta-dach'}`}>
                  <div className="karta-gora">
                    <span className="typ">
                      <span aria-hidden="true">{IKONY[p.podkategoria] || (pole ? '🌳' : '🏠')}</span>
                      {p.podkategoria || (pole ? 'Na polu' : 'Pod dachem')}
                    </span>
                    {p.urodziny && <span className="znaczek">urodziny</span>}
                  </div>
                  <h3 className="nazwa">{p.name}</h3>
                  <p className="adres">
                    {[p.adres, p.gmina !== 'Kraków' || !p.adres ? p.gmina : null].filter(Boolean).join(', ')}
                  </p>
                  <div className="dol">
                    {p.rating != null && (
                      <span className="ocena" title={`${p.reviews ?? 0} opinii w Google`}>
                        ★ {p.rating.toFixed(1)} <small>({p.reviews ?? 0})</small>
                      </span>
                    )}
                    <span className="info">{pole ? 'na polu' : 'pod dachem'}</span>
                    {p.strefa === 'Pod Krakowem' && p.km != null && <span className="info">{Math.round(p.km)} km od Krakowa</span>}
                    {p.website && (
                      <a className="link" href={p.website} target="_blank" rel="noreferrer">Strona miejsca</a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {widok === 'lista' && filtered.length > limit && (
          <div className="wiecej">
            <button className="przycisk" onClick={() => setLimit((l) => l + NA_STRONE)}>
              Pokaż kolejne {Math.min(NA_STRONE, filtered.length - limit)}
            </button>
          </div>
        )}

        <footer className="stopka">
          Frajdoplan, Kraków. Dane o miejscach pochodzą z publicznych źródeł, m.in. Map Google.
        </footer>
      </div>
    </>
  );
}
