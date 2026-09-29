import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { IKONY } from '../lib/ikony';

// Mapa ładuje się tylko w przeglądarce (Leaflet nie działa na serwerze).
const Mapa = dynamic(() => import('./Mapa'), {
  ssr: false,
  loading: () => <div className="mapa mapa-ladowanie">Ładuję mapę…</div>,
});

const NA_STRONE = 24;
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

export default function Katalog({ places, tytul, pokazDachPole = true, placeholder = 'Szukaj po nazwie lub ulicy…' }) {
  const [strefa, setStrefa] = useState('Kraków i okolice');
  const [kategoria, setKategoria] = useState('');
  const [podkategoria, setPodkategoria] = useState('');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(NA_STRONE);
  const [widok, setWidok] = useState('lista');

  useEffect(() => setLimit(NA_STRONE), [strefa, kategoria, podkategoria, query]);

  // Rodzaje miejsc z liczbą — tylko te, które są w wybranej strefie i kategorii.
  const rodzaje = useMemo(() => {
    const licz = {};
    places
      .filter((p) => (!strefa || p.strefa === strefa) && (!kategoria || p.kategoria === kategoria) && p.podkategoria)
      .forEach((p) => { licz[p.podkategoria] = (licz[p.podkategoria] || 0) + 1; });
    return Object.entries(licz).sort((a, b) => b[1] - a[1]);
  }, [places, strefa, kategoria]);

  useEffect(() => {
    if (podkategoria && !rodzaje.some(([r]) => r === podkategoria)) setPodkategoria('');
  }, [rodzaje, podkategoria]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = places.filter((p) => {
      if (strefa && p.strefa !== strefa) return false;
      if (kategoria && p.kategoria !== kategoria) return false;
      if (podkategoria && p.podkategoria !== podkategoria) return false;
      if (q && !`${p.name} ${p.adres} ${p.podkategoria}`.toLowerCase().includes(q)) return false;
      return true;
    });
    if (strefa === 'Pod Krakowem') out.sort((a, b) => (a.km ?? 999) - (b.km ?? 999));
    else out.sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0));
    return out;
  }, [places, strefa, kategoria, podkategoria, query]);

  const wyczysc = () => { setKategoria(''); setPodkategoria(''); setQuery(''); };

  return (
    <section aria-label={tytul}>
      <h2 className="sekcja">{tytul}</h2>
      <nav className="strefy" aria-label="Gdzie szukasz">
        {STREFY.map((z) => (
          <button key={z.label} className="strefa" aria-pressed={strefa === z.id} onClick={() => setStrefa(z.id)}>{z.label}</button>
        ))}
      </nav>

      <div className="panel">
        <label className="szukaj">
          <span className="sr-only">Szukaj</span>
          <input type="search" placeholder={placeholder} value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>

        {pokazDachPole && (
          <div className="chipy" role="group" aria-label="Pod dachem czy na polu">
            {KATEGORIE.map((k) => (
              <button
                key={k.label}
                className={`chip chip-${k.id === 'Plener' ? 'pole' : k.id === 'Pod dachem' ? 'dach' : 'all'}`}
                aria-pressed={kategoria === k.id}
                onClick={() => setKategoria(k.id)}
              >
                {k.label}
              </button>
            ))}
          </div>
        )}

        <div className="rodzaje" role="group" aria-label="Rodzaj miejsca">
          <button className="rodzaj" aria-pressed={!podkategoria} onClick={() => setPodkategoria('')}>Wszystkie rodzaje</button>
          {rodzaje.map(([r, n]) => (
            <button key={r} className="rodzaj" aria-pressed={podkategoria === r} onClick={() => setPodkategoria(podkategoria === r ? '' : r)}>
              <span aria-hidden="true">{IKONY[r] || '📍'}</span> {r} <small>{n}</small>
            </button>
          ))}
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
                <p className="adres">{[p.adres, p.gmina !== 'Kraków' || !p.adres ? p.gmina : null].filter(Boolean).join(', ')}</p>
                <div className="dol">
                  {p.rating != null && (
                    <span className="ocena" title={`${p.reviews ?? 0} opinii w Google`}>
                      ★ {p.rating.toFixed(1)} <small>({p.reviews ?? 0})</small>
                    </span>
                  )}
                  {pokazDachPole && <span className="info">{pole ? 'na polu' : 'pod dachem'}</span>}
                  {p.strefa === 'Pod Krakowem' && p.km != null && <span className="info">{Math.round(p.km)} km od Krakowa</span>}
                  {p.website && <a className="link" href={p.website} target="_blank" rel="noreferrer">Strona miejsca</a>}
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
    </section>
  );
}
