import Uklad from '../../components/Uklad';
import Katalog from '../../components/Katalog';
import Okruszki from '../../components/Okruszki';
import { listaMiejscJsonLd } from '../../lib/jsonld';
import { pobierzDane } from '../../lib/dane';

export async function getStaticProps() {
  return pobierzDane({
    sekcja: 'zajecia',
    adres: '/zajecia',
    teksty: {
      tytul: 'Zajęcia dla dzieci w Krakowie | Frajdoplan',
      opis: 'Zajęcia edukacyjne i artystyczne, zajęcia dla maluchów z rodzicami oraz domy kultury w Krakowie.',
      h1: 'Zajęcia dla dzieci',
      wstep: 'Zajęcia artystyczne i edukacyjne, zajęcia dla maluchów z rodzicami i domy kultury w Krakowie. Sport znajdziesz w zakładce Sport.',
    },
  });
}

export default function Zajecia({ places, seo, missingConfig, fetchError }) {
  return (
    <Uklad seo={seo} jsonLd={[listaMiejscJsonLd(places, seo.h1)]} missingConfig={missingConfig} fetchError={fetchError}>
      <Okruszki sciezka={[{ nazwa: 'Zajęcia', href: '/zajecia' }]} siteUrl={seo.siteUrl} />
      <section className="hero">
        <h1>{seo.h1}</h1>
        <p className="lead">{seo.wstep}</p>
      </section>
      <Katalog places={places} dzial="zajecia" tytul="Gdzie zapisać dziecko" pokazDachPole={false} pokazStrefy={false} placeholder="Szukaj: robotyka, ceramika, angielski, Bronowice…" />
    </Uklad>
  );
}
