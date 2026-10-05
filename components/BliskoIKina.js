import { useEffect, useState } from 'react';
import { dzisWarszawa, godzinaWarszawa, plusDni, trwaW, poGodzinie, ladnaData } from './Wydarzenia';
import NajblizszeWydarzenia from './NajblizszeWydarzenia';
import u from '../styles/Sekcja.module.css';

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
function DzisWKinach({ places, wydarzenia, dzis, godz, info }) {
  const [wybor, setWybor] = useState(null); // null = wybór automatyczny: dziś, a gdy nic nie zostało, jutro
  const kinowe = wydarzenia.filter((w) => w.kino);
  // „Dziś": tylko seanse, które jeszcze się nie zaczęły
  const dzisiejsze = kinowe.filter((w) => trwaW(w.data_regula, dzis) && (!w.godzina || w.godzina > godz)).sort(poGodzinie);
  const jutrzejsze = kinowe.filter((w) => trwaW(w.data_regula, plusDni(dzis, 1))).sort(poGodzinie);
  const dzisPusto = dzisiejsze.length === 0;
  const dzien = wybor || (dzisPusto ? 'jutro' : 'dzis');
  const seanse = dzien === 'dzis' ? dzisiejsze : jutrzejsze;
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
      <div className="kina-dni" role="group" aria-label="Dzień seansów">
        <button type="button" aria-pressed={dzien === 'dzis'} onClick={() => setWybor('dzis')}>Dziś</button>
        <button type="button" aria-pressed={dzien === 'jutro'} onClick={() => setWybor('jutro')}>Jutro</button>
      </div>
      {dzisPusto && <p className="kina-pusto">Na dziś seansów już nie ma. Pokazujemy repertuar na jutro.</p>}
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
          <p className="kina-pusto">{dzien === 'dzis' ? 'Dziś' : 'Jutro'} nie ma seansów dla dzieci w kinach studyjnych. Repertuar sprawdzisz bezpośrednio:</p>
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

export default function BliskoIKina({ places, wydarzenia, kina = null, muzyka = [] }) {
  const [czas, setCzas] = useState(null); // { dzis, godz } liczone w przeglądarce
  useEffect(() => setCzas({ dzis: dzisWarszawa(), godz: godzinaWarszawa() }), []);
  if (!czas) return <section className="blisko-kina" aria-hidden="true" />;
  return (
    <section className={`blisko-kina ${u.trzy}`} aria-label="Kina, spektakle i koncerty">
      <DzisWKinach places={places} wydarzenia={wydarzenia} dzis={czas.dzis} godz={czas.godz} info={kina} />
      <NajblizszeWydarzenia
        places={places}
        wydarzenia={wydarzenia}
        tytul="Najbliższe spektakle"
        podtytul="Dla dzieci, do zaplanowania na weekend"
        etykieta="Najbliższe spektakle dla dzieci"
        podkategoria="Teatr"
        wzorNazwy={/spektakl|teatr/i}
        typ="spektakl"
        wariant="ceglany"
        wyprzedzenie={60}
        pusto="Repertuar pojawi się tutaj, gdy włączymy automatyczne pobieranie. Na razie sprawdzisz go na stronach teatrów:"
        strony={places.filter((p) => p.podkategoria === 'Teatr' && p.website).sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0)).slice(0, 5)}
        wiecej={{ href: '/spektakle', tekst: 'Wszystkie spektakle →' }}
      />
      <NajblizszeWydarzenia
        places={places}
        wydarzenia={wydarzenia}
        tytul="Najbliższe koncerty"
        podtytul="Dla dzieci, do zaplanowania z wyprzedzeniem"
        etykieta="Najbliższe koncerty dla dzieci"
        podkategoria="Koncerty dla dzieci"
        wzorNazwy={/koncert/i}
        typ="koncert"
        wariant="kreda"
        wyprzedzenie={180}
        pusto="Nie mamy teraz koncertów dla dzieci w kalendarzu. Program sprawdzisz na stronach:"
        strony={muzyka}
        wiecej={{ href: '/koncerty', tekst: 'Wszystkie koncerty →' }}
      />
    </section>
  );
}
