import Uklad from '../../components/Uklad';
import Katalog from '../../components/Katalog';
import Okruszki from '../../components/Okruszki';
import { listaMiejscJsonLd } from '../../lib/jsonld';
import { pobierzDane } from '../../lib/dane';

export async function getStaticProps() {
  return pobierzDane({
    sekcja: 'treningi',
    adres: '/sport',
    teksty: {
      tytul: 'Sport dla dzieci w Krakowie: treningi i zajęcia | Frajdoplan',
      opis: 'Pływanie, taniec, sztuki walki, piłka nożna, tenis, gimnastyka, jazda konna i inne treningi dla dzieci w Krakowie.',
      h1: 'Sport dla dzieci',
      wstep: 'Pływanie, taniec, sztuki walki, piłka nożna, tenis i inne sporty. Wybierz jedną lub kilka dyscyplin.',
    },
  });
}

export default function Sport({ places, seo, missingConfig, fetchError }) {
  return (
    <Uklad seo={seo} jsonLd={[listaMiejscJsonLd(places, seo.h1)]} missingConfig={missingConfig} fetchError={fetchError}>
      <Okruszki sciezka={[{ nazwa: 'Sport', href: '/sport' }]} siteUrl={seo.siteUrl} />
      <section className="hero">
        <h1>{seo.h1}</h1>
        <p className="lead">{seo.wstep}</p>
      </section>
      <Katalog places={places} tytul="Gdzie zapisać dziecko na trening" pokazDachPole={false} pokazStrefy={false} grupuj="dyscyplina" dzial="sport" placeholder="Szukaj: judo, balet, Bronowice…" />
    </Uklad>
  );
}
