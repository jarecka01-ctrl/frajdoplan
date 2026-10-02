import Uklad from '../components/Uklad';
import Baner from '../components/Baner';
import Wydarzenia from '../components/Wydarzenia';
import BliskoIKina from '../components/BliskoIKina';
import Katalog from '../components/Katalog';
import Kalendarz from '../components/Kalendarz';
import { pobierzDane } from '../lib/dane';

export async function getStaticProps() {
  return pobierzDane({
    sekcja: 'z-marszu',
    zWydarzeniami: true,
    adres: '/',
    teksty: {
      tytul: 'Atrakcje dla dzieci w Krakowie: gdzie dziś iść z dzieckiem | Frajdoplan',
      opis: 'Sale zabaw, place zabaw, muzea, kina i wycieczki pod Krakowem. Sprawdź, gdzie iść z dzieckiem dziś i w weekend.',
      h1: 'Gdzie dziś idziemy?',
      wstep: 'Miejsca dla dzieci w Krakowie i okolicy: od sal zabaw po wycieczki za miasto.',
    },
  });
}

export default function Home({ places, wydarzenia = [], kina = null, seo, missingConfig, fetchError }) {
  return (
    <Uklad seo={seo} missingConfig={missingConfig} fetchError={fetchError}>
      <Baner wydarzenia={wydarzenia} />
      <section className="hero">
        <h1>{seo.h1}</h1>
        <p className="lead">{seo.wstep}</p>
      </section>
      <Wydarzenia wydarzenia={wydarzenia} />
      <BliskoIKina places={places} wydarzenia={wydarzenia} kina={kina} />
      <Katalog places={places} dzial="atrakcje" tytul="Miejsca na każdy dzień" placeholder="Szukaj: sala zabaw, Nowa Huta, trampoliny…" />
      <Kalendarz wydarzenia={wydarzenia} />
    </Uklad>
  );
}
