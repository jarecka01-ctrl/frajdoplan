import Uklad from '../components/Uklad';
import Katalog from '../components/Katalog';
import Okruszki from '../components/Okruszki';
import { pobierzDane } from '../lib/dane';

export async function getStaticProps() {
  return pobierzDane({
    sekcja: 'z-marszu',
    adres: '/miejsca',
    teksty: {
      tytul: 'Mapa miejsc dla dzieci w Krakowie | Frajdoplan',
      opis: 'Mapa sal zabaw, placów zabaw, parków, muzeów i basenów dla dzieci w Krakowie i okolicy. Wybierz rodzaj miejsca albo sprawdź, co jest blisko Ciebie.',
      h1: 'Miejsca dla dzieci w Krakowie',
      wstep: 'Sale zabaw, place zabaw, parki, muzea i wiele więcej na jednej mapie. Wybierz rodzaj albo wpisz, czego szukasz.',
    },
  });
}

export default function Miejsca({ places, seo, missingConfig, fetchError }) {
  return (
    <Uklad seo={seo} missingConfig={missingConfig} fetchError={fetchError}>
      <Okruszki sciezka={[{ nazwa: 'Miejsca', href: '/miejsca' }]} siteUrl={seo.siteUrl} />
      <section className="hero">
        <h1>{seo.h1}</h1>
        <p className="lead">{seo.wstep}</p>
      </section>
      <Katalog places={places} dzial="atrakcje" mapaZawsze tytul="Miejsca na mapie" placeholder="Szukaj: sala zabaw, Nowa Huta, trampoliny…" />
    </Uklad>
  );
}
