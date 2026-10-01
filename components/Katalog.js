import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { IKONY, SKROTY } from '../lib/ikony';
import { DZIALY, kategoriaRodzaju, odmianaMiejsc } from '../lib/kategorie';

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

// Na hubie kafelki rodzajów to linki do kategorii, ale zwykłe kliknięcie zaznacza je (można kilka naraz).
// Na stronie kategorii (`kategoria` + `kategorie` z serwera) kafelki po prostu przenoszą do innej kategorii.
export default function Katalog({
  places, tytul, pokazDachPole = true, pokazStrefy = true, grupuj = 'podkategoria', placeholder = 'Szukaj po nazwie lub ulicy…',
  dzial, kategorie, kategoria: aktywna, naStrone = NA_STRONE,
}) {
  // Na stronie kategorii pokazujemy od razu całą listę (bez zawężania do Krakowa), żeby była w HTML.
  const [strefa, setStrefa] = useState(pokazStrefy && !aktywna ? 'Kraków i okolice' : '');
  const rodzajZ = (p) => p[grupuj] || p.podkategoria;
  const [kategoria, setKategoria] = useState('');
  const [wybrane, setWybrane] = useState([]); // kilka rodzajów naraz; pusto = wszystkie
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(naStrone);
  const [widok, setWidok] = useState('lista');

  useEffect(() => setLimit(naStrone), [strefa, kategoria, wybrane, query, naStrone]);

  // Rodzaje miejsc z liczbą — tylko te, które są w wybranej strefie i kategorii.
  const rodzaje = useMemo(() => {
    const licz = {};
    places
      .filter((p) => (!strefa || p.strefa === strefa) && (!kategoria || p.kategoria === kategoria) && rodzajZ(p))
      .forEach((p) => { const r = rodzajZ(p); licz[r] = (licz[r] || 0) + 1; });
    return Object.entries(licz).sort((a, b) => b[1] - a[1]);
  }, [places, strefa, kategoria]);

  // usuń z wyboru rodzaje, których nie ma w nowej strefie lub kategorii
  useEffect(() => {
    const dostepne = new Set(rodzaje.map(([r]) => r));
    if (wybrane.some((r) => !dostepne.has(r))) setWybrane(wybrane.filter((r) => dostepne.has(r)));
  }, [rodzaje, wybrane]);

  const przelacz = (r) => setWybrane((w) => (w.includes(r) ? w.filter((x) => x !== r) : [...w, r]));
  // zwykłe kliknięcie = zaznacz; Ctrl/środkowy przycisk = otwórz stronę kategorii
  const klikKafelka = (e, r) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    przelacz(r);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = places.filter((p) => {
      if (strefa && p.strefa !== strefa) return false;
      if (kategoria && p.kategoria !== kategoria) return false;
      if (wybrane.length && !wybrane.includes(rodzajZ(p))) return false;
      if (q && !`${p.name} ${p.adres} ${p.podkategoria}`.toLowerCase().includes(q)) return false;
      return true;
    });
    if (strefa === 'Pod Krakowem') out.sort((a, b) => (a.km ?? 999) - (b.km ?? 999));
    else out.sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0));
    return out;
  }, [places, strefa, kategoria, wybrane, query]);

  const wyczysc = () => { setKategoria(''); setWybrane([]); setQuery(''); };

  return (
    <section aria-label={tytul}>
      <h2 className="sekcja">{tytul}</h2>
      {pokazStrefy && (
        <nav className="strefy" aria-label="Gdzie szukasz">
          {STREFY.map((z) => (
            <button key={z.label} className="strefa" aria-pressed={strefa === z.id} onClick={() => setStrefa(z.id)}>{z.label}</button>
          ))}
        </nav>
      )}

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

        {aktywna && kategorie ? (
          <nav className="rodzaje" aria-label="Rodzaj miejsca">
            <a className="rodzaj" href={DZIALY[dzial].hub}>
              <span className="rodzaj-nazwa">Wszystkie rodzaje</span>
            </a>
            {kategorie.map((k) => (
              <a key={k.slug} className="rodzaj" href={k.href} aria-current={k.slug === aktywna.slug ? 'page' : undefined}>
                <span className="rodzaj-ikona" aria-hidden="true">{IKONY[k.rodzaj] || '📍'}</span>
                <span className="rodzaj-nazwa">{k.nazwa}</span>
                <small>{k.liczba}</small>
              </a>
            ))}
          </nav>
        ) : (
          <div className="rodzaje" role="group" aria-label="Rodzaj miejsca">
            <button className="rodzaj" aria-pressed={wybrane.length === 0} onClick={() => setWybrane([])}>
              <span className="rodzaj-nazwa">{wybrane.length ? `Wyczyść wybór (${wybrane.length})` : 'Wszystkie rodzaje'}</span>
            </button>
            {rodzaje.map(([r, n]) => {
              const tresc = (
                <>
                  <span className="rodzaj-ikona" aria-hidden="true">{IKONY[r] || '📍'}</span>
                  <span className="rodzaj-nazwa">{SKROTY[r] || r}</span>
                  <small>{n}</small>
                </>
              );
              return dzial ? (
                <a key={r} className="rodzaj" href={kategoriaRodzaju(dzial, r).href} role="button" aria-pressed={wybrane.includes(r)} onClick={(e) => klikKafelka(e, r)}>
                  {tresc}
                </a>
              ) : (
                <button key={r} className="rodzaj" aria-pressed={wybrane.includes(r)} onClick={() => przelacz(r)}>
                  {tresc}
                </button>
              );
            })}
          </div>
        )}
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
                    <span aria-hidden="true">{IKONY[rodzajZ(p)] || (pole ? '🌳' : '🏠')}</span>
                    {rodzajZ(p) || (pole ? 'Na polu' : 'Pod dachem')}
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
          <button className="przycisk" onClick={() => setLimit((l) => l + naStrone)}>
            Pokaż kolejne {Math.min(naStrone, filtered.length - limit)}
          </button>
        </div>
      )}
    </section>
  );
}
