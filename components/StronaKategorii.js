import Uklad from './Uklad';
import Katalog from './Katalog';
import { DZIALY } from '../lib/kategorie';

// Wspólny wygląd podstron kategorii: /atrakcje/…, /sport/…, /zajecia/…
export default function StronaKategorii({ dzial, places, kategorie, kategoria, missingConfig, fetchError }) {
  const atrakcje = dzial === 'atrakcje';
  const fraza = `${kategoria.fraza} w Krakowie`;
  return (
    <Uklad
      tytul={`${fraza} | Frajdoplan`}
      opis={`${kategoria.fraza} w Krakowie i okolicy: adresy, oceny i mapa. ${places.length} sprawdzonych miejsc w jednym miejscu.`}
      missingConfig={missingConfig}
      fetchError={fetchError}
    >
      <section className="hero">
        <h1>{fraza}</h1>
        <p className="lead">{kategoria.fraza} w Krakowie i okolicy: adresy, oceny z Google i mapa w jednym miejscu.</p>
      </section>
      <Katalog
        places={places}
        dzial={dzial}
        kategorie={kategorie}
        kategoria={kategoria}
        naStrone={100}
        tytul={`${DZIALY[dzial].nazwa}: ${kategoria.nazwa.toLowerCase()}`}
        grupuj={DZIALY[dzial].pole}
        pokazDachPole={atrakcje}
        pokazStrefy={atrakcje}
        placeholder="Szukaj po nazwie lub ulicy…"
      />
    </Uklad>
  );
}
