import Uklad from '../components/Uklad';
import Katalog from '../components/Katalog';
import Okruszki from '../components/Okruszki';
import { listaMiejscJsonLd } from '../lib/jsonld';
import { pobierzDane } from '../lib/dane';

export async function getStaticProps() {
  return pobierzDane({
    sekcja: 'polkolonie',
    adres: '/polkolonie',
    teksty: {
      tytul: 'Półkolonie w Krakowie | Frajdoplan',
      opis: 'Półkolonie letnie i zimowe dla dzieci w Krakowie i okolicy.',
      h1: 'Półkolonie',
      wstep: 'Półkolonie letnie i zimowe w Krakowie i okolicy. Listę uzupełniamy przed feriami i wakacjami.',
    },
  });
}

export default function Polkolonie({ places, seo, missingConfig, fetchError }) {
  return (
    <Uklad seo={seo} jsonLd={[listaMiejscJsonLd(places, seo.h1)]} missingConfig={missingConfig} fetchError={fetchError}>
      <Okruszki sciezka={[{ nazwa: 'Półkolonie', href: '/polkolonie' }]} siteUrl={seo.siteUrl} />
      <section className="hero">
        <h1>{seo.h1}</h1>
        <p className="lead">{seo.wstep}</p>
      </section>
      <Katalog places={places} tytul="Organizatorzy półkolonii" pokazDachPole={false} pokazStrefy={false} placeholder="Szukaj organizatora lub dzielnicy…" />
    </Uklad>
  );
}
