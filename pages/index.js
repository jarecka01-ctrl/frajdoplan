import Uklad from '../components/Uklad';
import Baner from '../components/Baner';
import Wydarzenia from '../components/Wydarzenia';
import BliskoIKina from '../components/BliskoIKina';
import Katalog from '../components/Katalog';
import Kalendarz from '../components/Kalendarz';
import PogodaPowietrze from '../components/PogodaPowietrze';
import { pobierzDane } from '../lib/dane';
import { pobierzPogode } from '../lib/pogoda';
import { pobierzPowietrze } from '../lib/powietrze';

export async function getStaticProps() {
  const [wynik, pogoda, powietrze] = await Promise.all([pobierzDane({
    sekcja: 'z-marszu',
    zWydarzeniami: true,
    adres: '/',
    teksty: {
      tytul: 'Atrakcje dla dzieci w Krakowie: gdzie iść dziś | Frajdoplan',
      opis: 'Co robić z dzieckiem w Krakowie? Aktualne wydarzenia na dziś i weekend, atrakcje i miejsca dla dzieci w Krakowie i okolicy – wszystko pod ręką.',
      h1: 'Gdzie dziś idziemy?',
      wstep: 'Aktualne wydarzenia, atrakcje i miejsca dla dzieci w Krakowie i okolicy – wszystko pod ręką.',
    },
  }), pobierzPogode(), pobierzPowietrze()]);
  // brak prognozy lub powietrza (błąd źródła) = widżet się nie pokazuje albo pokazuje samą pogodę
  return { ...wynik, props: { ...wynik.props, pogoda: pogoda || null, powietrze: powietrze || null } };
}

// Słowo „dziś" w nagłówku dostaje żółty marker (tekst nagłówka nadal pochodzi z seo.h1).
function zakreslDzis(h1) {
  return String(h1).split(/(dziś)/i).map((c, i) => (/^dziś$/i.test(c) ? <span key={i} className="marker">{c}</span> : c));
}

export default function Home({ places, wydarzenia = [], kina = null, muzyka = [], pogoda = null, powietrze = null, seo, missingConfig, fetchError }) {
  return (
    <Uklad seo={seo} missingConfig={missingConfig} fetchError={fetchError}
      widget={pogoda ? <PogodaPowietrze pogoda={pogoda} powietrze={powietrze} /> : null}
      hero={(
        <section className="hero hero-glowna">
          <h1>{zakreslDzis(seo.h1)}</h1>
          <p className="lead">{seo.wstep}</p>
        </section>
      )}>
      <Baner wydarzenia={wydarzenia} />
      <Wydarzenia wydarzenia={wydarzenia} places={places} />
      <BliskoIKina places={places} wydarzenia={wydarzenia} kina={kina} muzyka={muzyka} />
      <Kalendarz wydarzenia={wydarzenia} />
      <Katalog id="miejsca" className="katalog-miejsca" naStrone={6} places={places} dzial="atrakcje" tytul="Miejsca na każdy dzień" placeholder="Szukaj: sala zabaw, Nowa Huta, trampoliny…" />
    </Uklad>
  );
}
