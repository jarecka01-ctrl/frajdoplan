import Uklad from '../components/Uklad';
import Baner from '../components/Baner';
import Wydarzenia from '../components/Wydarzenia';
import BliskoIKina from '../components/BliskoIKina';
import Katalog from '../components/Katalog';
import Kalendarz from '../components/Kalendarz';
import { pobierzDane } from '../lib/dane';

export async function getStaticProps() {
  return pobierzDane({ sekcja: 'z-marszu', zWydarzeniami: true });
}

export default function Home({ places, wydarzenia = [], missingConfig, fetchError }) {
  return (
    <Uklad
      tytul="Frajdoplan — gdzie dziś idziemy z dzieckiem w Krakowie"
      opis="Sale zabaw, place zabaw, muzea, kina i wycieczki pod Krakowem. Sprawdź, gdzie iść z dzieckiem dziś i w weekend."
      missingConfig={missingConfig}
      fetchError={fetchError}
    >
      <Baner wydarzenia={wydarzenia} />
      <section className="hero">
        <h1>Gdzie dziś idziemy?</h1>
        <p className="lead">Miejsca dla dzieci w Krakowie i okolicy: od sal zabaw po wycieczki za miasto.</p>
      </section>
      <Wydarzenia wydarzenia={wydarzenia} />
      <BliskoIKina places={places} wydarzenia={wydarzenia} />
      <Katalog places={places} tytul="Miejsca na każdy dzień" placeholder="Szukaj: sala zabaw, Nowa Huta, trampoliny…" />
      <Kalendarz wydarzenia={wydarzenia} />
    </Uklad>
  );
}
