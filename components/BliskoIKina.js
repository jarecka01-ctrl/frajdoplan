import { useEffect, useState } from 'react';
import { IKONY } from '../lib/ikony';
import { dzisWarszawa, trwaW, poGodzinie, ladnaData } from './Wydarzenia';
import Spektakle from './Spektakle';
import u from '../styles/Sekcja.module.css';

// Odległość w km między dwoma punktami (wzór haversine).
function km(a, b) {
  const R = 6371, r = (x) => (x * Math.PI) / 180;
  const dLat = r(b.lat - a.lat), dLon = r(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const ladnieKm = (d) => (d < 1 ? `${Math.round(d * 1000 / 50) * 50} m` : `${d.toFixed(1).replace('.', ',')} km`);
const trasa = (p) => `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`;

function BliskoCiebie({ places, wydarzenia, dzis }) {
  const [stan, setStan] = useState('start'); // start | szukam | ok | brak-zgody | blad
  const [ja, setJa] = useState(null);
  const [tylkoDach, setTylkoDach] = useState(false);

  const znajdz = () => {
    if (!('geolocation' in navigator)) { setStan('blad'); return; }
    setStan('szukam');
    navigator.geolocation.getCurrentPosition(
      (poz) => { setJa({ lat: poz.coords.latitude, lon: poz.coords.longitude }); setStan('ok'); },
      (err) => setStan(err.code === 1 ? 'brak-zgody' : 'blad'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  };

  let wydarzeniaObok = [], miejscaObok = [];
  if (ja) {
    const poId = Object.fromEntries(places.map((p) => [p.id, p]));
    wydarzeniaObok = wydarzenia
      .filter((w) => !w.kino && w.miejsceId && trwaW(w.data_regula, dzis))
      .map((w) => ({ ...w, p: poId[w.miejsceId] }))
      .filter((w) => w.p && w.p.lat != null)
      .map((w) => ({ ...w, d: km(ja, w.p) }))
      .filter((w) => w.d <= 5)
      .sort(poGodzinie)
      .slice(0, 3);
    miejscaObok = places
      .filter((p) => p.lat != null && p.lon != null && (!tylkoDach || p.kategoria === 'Pod dachem'))
      .map((p) => ({ ...p, d: km(ja, p) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 6);
  }

  return (
    <div className="blisko">
      <h2 className="wyd-tytul-maly">Dziś blisko ciebie</h2>

      {stan !== 'ok' && (
        <div className="blisko-start">
          <p className="wyd-data">
            {stan === 'brak-zgody'
              ? 'Przeglądarka nie udostępniła lokalizacji. Zezwól na nią w ustawieniach strony albo użyj filtrów poniżej.'
              : stan === 'blad'
              ? 'Nie udało się ustalić lokalizacji. Spróbuj ponownie za chwilę albo użyj filtrów poniżej.'
              : 'Pokażemy najbliższe miejsca i dzisiejsze wydarzenia w okolicy. Lokalizacja zostaje w twojej przeglądarce.'}
          </p>
          <button className="przycisk" onClick={znajdz} disabled={stan === 'szukam'}>
            {stan === 'szukam' ? 'Szukam…' : 'Pokaż miejsca blisko mnie'}
          </button>
        </div>
      )}

      {stan === 'ok' && (
        <>
          <div className="chipy blisko-chipy">
            <button className="chip chip-all" aria-pressed={!tylkoDach} onClick={() => setTylkoDach(false)}>Wszystko</button>
            <button className="chip chip-dach" aria-pressed={tylkoDach} onClick={() => setTylkoDach(true)}>Tylko pod dachem</button>
          </div>
          {wydarzeniaObok.length > 0 && (
            <ul className="blisko-lista">
              {wydarzeniaObok.map((w) => (
                <li key={w.id} className="blisko-item blisko-wyd">
                  <span className="blisko-ikona" aria-hidden="true">📅</span>
                  <span className="blisko-tekst">
                    <strong>{w.godzina ? `${w.godzina} ` : ''}{w.nazwa}</strong>
                    <small>{w.p.name}, {ladnieKm(w.d)}</small>
                  </span>
                  <a className="link" href={trasa(w.p)} target="_blank" rel="noreferrer">Trasa</a>
                </li>
              ))}
            </ul>
          )}
          <ul className="blisko-lista">
            {miejscaObok.map((p) => (
              <li key={p.id} className="blisko-item">
                <span className="blisko-ikona" aria-hidden="true">{IKONY[p.podkategoria] || '📍'}</span>
                <span className="blisko-tekst">
                  <strong>{p.name}</strong>
                  <small>{p.podkategoria || (p.kategoria === 'Plener' ? 'Na polu' : 'Pod dachem')}, {ladnieKm(p.d)}</small>
                </span>
                <a className="link" href={trasa(p)} target="_blank" rel="noreferrer">Trasa</a>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// Seanse jednego kina (już posortowane po godzinie) → filmy z godzinami obok siebie.
function filmy(lista) {
  const poNazwie = new Map();
  lista.forEach((s) => {
    if (!poNazwie.has(s.nazwa)) poNazwie.set(s.nazwa, { nazwa: s.nazwa, wiek: s.wiek, seanse: [] });
    poNazwie.get(s.nazwa).seanse.push(s);
  });
  return [...poNazwie.values()];
}

// `info` (z lib/dane.js): kiedy skrypt zaktualizował repertuar, stan źródeł i stałe linki do sieciówek.
function DzisWKinach({ places, wydarzenia, dzis, info }) {
  const seanse = wydarzenia.filter((w) => w.kino && trwaW(w.data_regula, dzis)).sort(poGodzinie);
  const kina = {};
  seanse.forEach((s) => { (kina[s.miejsce || 'Kino'] = kina[s.miejsce || 'Kino'] || []).push(s); });
  const listaKin = places
    .filter((p) => p.podkategoria === 'Kino' && p.website)
    .sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0))
    .slice(0, 6);
  const zrodla = info ? info.zrodla : [];
  const zrodloSeansu = (lista) => zrodla.find((z) => z.id === lista[0].zrodlo);
  const nieaktualne = zrodla.filter((z) => !z.ok);
  const stale = info ? info.stale : [];

  return (
    <div className="kina">
      <h2 className="wyd-tytul-maly">Dziś w kinach</h2>
      {seanse.length ? (
        <div className="kina-lista">
          {Object.entries(kina).slice(0, 4).map(([kino, lista]) => {
            const z = zrodloSeansu(lista);
            return (
              <div key={kino} className="kino">
                <p className="kino-nazwa">{z && z.url ? <a href={z.url} target="_blank" rel="noreferrer">{kino}</a> : kino}</p>
                <ul>
                  {filmy(lista).slice(0, 4).map((f) => (
                    <li key={f.nazwa}>
                      <span className="kino-film">{f.nazwa}</span>
                      <span className="kino-godziny">
                        {f.seanse.map((s, i) => (
                          <span key={s.id}>
                            {i > 0 && ', '}
                            {s.link ? <a href={s.link} target="_blank" rel="noreferrer">{s.godzina}</a> : s.godzina}
                          </span>
                        ))}
                        {f.wiek && <small> {f.wiek}</small>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : info && zrodla.length ? (
        <>
          <p className="kina-pusto">Dziś nie ma seansów dla dzieci w kinach studyjnych. Repertuar sprawdzisz bezpośrednio:</p>
          <ul className="kina-linki">
            {zrodla.filter((z) => z.url).map((z) => (
              <li key={z.id}><a href={z.url} target="_blank" rel="noreferrer">{z.nazwa}</a></li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="kina-pusto">Seanse dla dzieci pojawią się tutaj, gdy włączymy automatyczne pobieranie repertuaru. Na razie repertuar sprawdzisz bezpośrednio:</p>
          <ul className="kina-linki">
            {listaKin.map((p) => (
              <li key={p.id}><a href={p.website} target="_blank" rel="noreferrer">{p.name}</a></li>
            ))}
          </ul>
        </>
      )}
      {nieaktualne.map((z) => (
        <p key={z.id} className="kina-pusto">
          {z.nazwa}: nie udało się odświeżyć repertuaru{z.pobrano ? `, dane z ${ladnaData(z.pobrano.slice(0, 10))}` : ''}.{' '}
          {z.url && <a href={z.url} target="_blank" rel="noreferrer">Sprawdź na stronie kina</a>}
        </p>
      ))}
      {stale.length > 0 && (
        <ul className="kina-linki">
          {stale.map((k) => (
            <li key={k.nazwa}><a href={k.url} target="_blank" rel="noreferrer">{k.nazwa}: repertuar</a></li>
          ))}
        </ul>
      )}
      {info && info.zaktualizowano && (
        <p className="kina-pusto">Repertuar zaktualizowany: {ladnaData(info.zaktualizowano.slice(0, 10))}</p>
      )}
    </div>
  );
}

export default function BliskoIKina({ places, wydarzenia, kina = null }) {
  const [dzis, setDzis] = useState(null);
  useEffect(() => setDzis(dzisWarszawa()), []);
  if (!dzis) return <section className="blisko-kina" aria-hidden="true" />;
  return (
    <section className={`blisko-kina ${u.trzy}`} aria-label="Blisko ciebie, kina i spektakle">
      <BliskoCiebie places={places} wydarzenia={wydarzenia} dzis={dzis} />
      <DzisWKinach places={places} wydarzenia={wydarzenia} dzis={dzis} info={kina} />
      <Spektakle places={places} wydarzenia={wydarzenia} />
    </section>
  );
}
