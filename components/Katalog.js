import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { adresKarty } from '../lib/miejsca';
import { km, pozaRegionem, PROMIEN_REGIONU_KM } from '../lib/geo';
import { IKONY, SKROTY } from '../lib/ikony';
import { DZIALY, kategoriaRodzaju, odmianaMiejsc } from '../lib/kategorie';

// Mapa ładuje się tylko w przeglądarce (Leaflet nie działa na serwerze).
const Mapa = dynamic(() => import('./Mapa'), {
  ssr: false,
  loading: () => <div className="mapa mapa-ladowanie">Ładuję mapę…</div>,
});

const NA_STRONE = 24;
// Dane z serwera pomijają najczęstsze wartości (lib/miejsca.js: doListy).
const strefaZ = (p) => p.strefa ?? 'Kraków i okolice';
const kategoriaZ = (p) => p.kategoria ?? 'Pod dachem';

const ladnieKm = (d) => (d < 1 ? `${Math.max(50, Math.round(d * 1000 / 50) * 50)} m` : `${d.toFixed(1).replace('.', ',')} km`);
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
  // Kafelek = kategoria z adresem (tak samo nazwana jak na jej stronie); rodzaje z jedną kategorią (np. dwa rodzaje boisk) są jednym kafelkiem.
  const kluczZ = (p) => (dzial && rodzajZ(p) ? kategoriaRodzaju(dzial, rodzajZ(p)).slug : rodzajZ(p));
  const [kategoria, setKategoria] = useState('');
  const [wybrane, setWybrane] = useState([]); // kilka rodzajów naraz; pusto = wszystkie
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(naStrone);
  const [widok, setWidok] = useState('lista');
  const [ja, setJa] = useState(null); // położenie użytkownika, gdy kliknął „Blisko mnie" i się zgodził
  const [szukam, setSzukam] = useState(false);
  const [komunikat, setKomunikat] = useState(''); // powód, dla którego „Blisko mnie" nie zadziałało

  // Jeden stan `ja` dla listy (sortowanie i odległości) i mapy (przybliżenie i punkt „jesteś tutaj"), niezależnie od widoku.
  // Prosi o zgodę na lokalizację; położenia nie zapisujemy ani nie wysyłamy. Drugie kliknięcie wyłącza „Blisko mnie".
  // Odmowa, błąd albo pozycja daleko od Krakowa: komunikat i bez zmiany widoku.
  const bliskoMnie = () => {
    setKomunikat('');
    if (ja) { setJa(null); return; }
    if (!('geolocation' in navigator)) { setKomunikat('Ta przeglądarka nie potrafi ustalić położenia. Szukaj po nazwie lub ulicy.'); return; }
    setSzukam(true);
    navigator.geolocation.getCurrentPosition(
      (poz) => {
        const gdzie = { lat: poz.coords.latitude, lon: poz.coords.longitude };
        setSzukam(false);
        if (pozaRegionem(gdzie)) {
          setKomunikat(`Wygląda na to, że jesteś ponad ${PROMIEN_REGIONU_KM} km od Krakowa, więc zostawiamy widok całego miasta.`);
          return;
        }
        setJa(gdzie);
      },
      (blad) => {
        setSzukam(false);
        setKomunikat(
          blad && blad.code === 1 ? 'Nie mamy zgody na sprawdzenie Twojego położenia. Zezwól na lokalizację w ustawieniach przeglądarki albo wpisz ulicę w wyszukiwarce.'
            : blad && blad.code === 3 ? 'Ustalanie położenia trwa zbyt długo. Spróbuj jeszcze raz.'
              : 'Nie udało się ustalić Twojego położenia. Spróbuj ponownie za chwilę.'
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  };

  useEffect(() => setLimit(naStrone), [strefa, kategoria, wybrane, query, naStrone]);

  // Link z kafelka wydarzeń (`/#miejsce-<id>`): pokaż tylko tę kartę i przewiń do niej.
  useEffect(() => {
    const id = (window.location.hash.match(/^#miejsce-(.+)$/) || [])[1];
    const miejsce = id && places.find((p) => p.id === decodeURIComponent(id));
    if (!miejsce) return;
    setStrefa(''); setKategoria(''); setWybrane([]); setQuery(miejsce.name);
    setTimeout(() => document.getElementById(`miejsce-${miejsce.id}`)?.scrollIntoView({ block: 'center' }), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rodzaje miejsc z liczbą — tylko te, które są w wybranej strefie i kategorii.
  const rodzaje = useMemo(() => {
    const licz = {};
    places
      .filter((p) => (!strefa || strefaZ(p) === strefa) && (!kategoria || kategoriaZ(p) === kategoria) && rodzajZ(p))
      .forEach((p) => { const k = kluczZ(p); licz[k] = licz[k] || { klucz: k, rodzaj: rodzajZ(p), n: 0 }; licz[k].n += 1; });
    return Object.values(licz).sort((a, b) => b.n - a.n);
  }, [places, strefa, kategoria]);

  // usuń z wyboru rodzaje, których nie ma w nowej strefie lub kategorii
  useEffect(() => {
    const dostepne = new Set(rodzaje.map((k) => k.klucz));
    if (wybrane.some((r) => !dostepne.has(r))) setWybrane(wybrane.filter((r) => dostepne.has(r)));
  }, [rodzaje, wybrane]);

  const przelacz = (r) => setWybrane((w) => (w.includes(r) ? w.filter((x) => x !== r) : [...w, r]));
  // zwykłe kliknięcie = zaznacz; Ctrl/środkowy przycisk = otwórz stronę kategorii
  const klikKafelka = (e, r) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    przelacz(r);
  };

  // odległość od użytkownika dla każdego miejsca (Infinity = brak współrzędnych, takie lądują na końcu)
  const odleglosci = useMemo(() => (ja
    ? Object.fromEntries(places.map((p) => [p.id, p.lat != null && p.lon != null ? km(ja, p) : Infinity]))
    : null), [places, ja]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = places.filter((p) => {
      if (strefa && strefaZ(p) !== strefa) return false;
      if (kategoria && kategoriaZ(p) !== kategoria) return false;
      if (wybrane.length && !wybrane.includes(kluczZ(p))) return false;
      if (q && !`${p.name} ${p.adres || ''} ${p.podkategoria || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
    if (odleglosci) out.sort((a, b) => odleglosci[a.id] - odleglosci[b.id]);
    else if (strefa === 'Pod Krakowem') out.sort((a, b) => (a.km ?? 999) - (b.km ?? 999));
    else out.sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0));
    return out;
  }, [places, strefa, kategoria, wybrane, query, odleglosci]);

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
            {rodzaje.map(({ klucz, rodzaj: r, n }) => {
              const tresc = (
                <>
                  <span className="rodzaj-ikona" aria-hidden="true">{IKONY[r] || '📍'}</span>
                  <span className="rodzaj-nazwa">{dzial ? kategoriaRodzaju(dzial, r).nazwa : SKROTY[r] || r}</span>
                  <small>{n}</small>
                </>
              );
              return dzial ? (
                <a key={klucz} className="rodzaj" href={kategoriaRodzaju(dzial, r).href} role="button" aria-pressed={wybrane.includes(klucz)} onClick={(e) => klikKafelka(e, klucz)}>
                  {tresc}
                </a>
              ) : (
                <button key={klucz} className="rodzaj" aria-pressed={wybrane.includes(klucz)} onClick={() => przelacz(klucz)}>
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
          {(ja || strefa === 'Pod Krakowem') && widok === 'lista' && ', najbliższe na górze'}
        </p>
        <div className="wynik-przyciski">
        <div className="widok" role="group" aria-label="Odległość">
          <button className="widok-btn" aria-pressed={Boolean(ja)} disabled={szukam} onClick={bliskoMnie}>
            {szukam ? 'Szukam…' : 'Blisko mnie'}
          </button>
        </div>
        <div className="widok" role="group" aria-label="Widok">
          <button className="widok-btn" aria-pressed={widok === 'lista'} onClick={() => setWidok('lista')}>Lista</button>
          <button className="widok-btn" aria-pressed={widok === 'mapa'} onClick={() => setWidok('mapa')}>Mapa</button>
        </div>
        </div>
      </div>

      {komunikat && <p className="notice" role="status">{komunikat}</p>}

      {widok === 'mapa' && filtered.length > 0 ? (
        <Mapa miejsca={filtered} ja={ja} />
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
              <li key={p.id} id={`miejsce-${p.id}`} className={`karta ${pole ? 'karta-pole' : 'karta-dach'}`}>
                <div className="karta-gora">
                  <span className="typ">
                    <span aria-hidden="true">{IKONY[rodzajZ(p)] || (pole ? '🌳' : '🏠')}</span>
                    {rodzajZ(p) || (pole ? 'Na polu' : 'Pod dachem')}
                  </span>
                  {p.urodziny && <span className="znaczek">urodziny</span>}
                </div>
                <h3 className="nazwa"><Link href={adresKarty(p)}>{p.name}</Link></h3>
                <p className="adres">{[p.adres, (p.gmina || 'Kraków') !== 'Kraków' || !p.adres ? (p.gmina || 'Kraków') : null].filter(Boolean).join(', ')}</p>
                <div className="dol">
                  {p.rating != null && (
                    <span className="ocena" title={`${p.reviews ?? 0} opinii w Google`}>
                      ★ {p.rating.toFixed(1)} <small>({p.reviews ?? 0})</small>
                    </span>
                  )}
                  {pokazDachPole && <span className="info">{pole ? 'na polu' : 'pod dachem'}</span>}
                  {odleglosci && odleglosci[p.id] !== Infinity && <span className="info">{ladnieKm(odleglosci[p.id])} od ciebie</span>}
                  {strefaZ(p) === 'Pod Krakowem' && p.km != null && <span className="info">{Math.round(p.km)} km od Krakowa</span>}
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
