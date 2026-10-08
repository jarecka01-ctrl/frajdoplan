import { useEffect, useState } from 'react';
import { dzisWarszawa, godzinaWarszawa, plusDni, trwaW, poGodzinie, ladnaData, dzienTygodnia, NAZWY_DNI } from './Wydarzenia';
import NajblizszeWydarzenia from './NajblizszeWydarzenia';
import Bilet, { Nazwa, Szczegoly } from './Bilet';
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
  const dataDnia = dzien === 'dzis' ? dzis : plusDni(dzis, 1);
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
    <div className="k k-kino">
      <h2 className="k-tytul">Dziś w kinach</h2>
      <p className="k-pod">{NAZWY_DNI[dzienTygodnia(dataDnia)]}, {ladnaData(dataDnia)}</p>
      <div className="kina-dni" role="group" aria-label="Dzień seansów">
        <button type="button" aria-pressed={dzien === 'dzis'} onClick={() => setWybor('dzis')}>Dziś</button>
        <button type="button" aria-pressed={dzien === 'jutro'} onClick={() => setWybor('jutro')}>Jutro</button>
      </div>
      {dzisPusto && <p className="kina-pusto">Na dziś seansów już nie ma. Pokazujemy repertuar na jutro.</p>}
      {seanse.length ? (
        <ul className="k-lista">
          {Object.entries(kina).slice(0, 4).flatMap(([kino, lista]) => {
            const z = zrodloSeansu(lista);
            return filmy(lista).slice(0, 4).map((f) => {
              const jeden = f.seanse.length === 1;
              const kinoLink = z && z.url ? <a href={z.url} target="_blank" rel="noreferrer">{kino}</a> : kino;
              const godziny = jeden ? null : f.seanse.map((s, i) => (
                <span key={s.id}>
                  {i > 0 && ', '}
                  {s.link ? <a href={s.link} target="_blank" rel="noreferrer">{s.godzina}</a> : s.godzina}
                </span>
              ));
              // jeden seans: godzina jest na odcinku, a jego link obejmuje cały bilet (przez tytuł); kilka seansów: „od" i linki przy godzinach
              return (
                <Bilet key={`${kino}-${f.nazwa}`} nad={jeden ? undefined : 'od'} godzina={f.seanse[0].godzina} plan={{ id: f.seanse[0].id, dzien: dataDnia, tytul: f.nazwa }}>
                  <Nazwa nazwa={f.nazwa} href={jeden ? f.seanse[0].link : undefined} />
                  <Szczegoly czesci={[kinoLink, godziny, f.wiek]} />
                </Bilet>
              );
            });
          })}
        </ul>
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
        <p className="k-wiecej k-wiecej-kina">
          {stale.map((k, i) => (
            <span key={k.nazwa}>
              {i > 0 && ' · '}
              <a href={k.url} target="_blank" rel="noreferrer">{k.nazwa}: repertuar</a>
            </span>
          ))}
        </p>
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
        typ={['koncert', 'widowisko']} // widowisko: trasy i pokazy z hal (TAURON Arena, ICE…)
        wariant="kreda"
        wyprzedzenie={180}
        pusto="Nie mamy teraz koncertów dla dzieci w kalendarzu. Program sprawdzisz na stronach:"
        strony={muzyka}
        wiecej={{ href: '/koncerty', tekst: 'Wszystkie koncerty →' }}
      />
    </section>
  );
}
