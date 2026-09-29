import Uklad from '../components/Uklad';
import Katalog from '../components/Katalog';
import { pobierzDane } from '../lib/dane';

export async function getStaticProps() {
  return pobierzDane({ sekcja: 'polkolonie' });
}

export default function Polkolonie({ places, missingConfig, fetchError }) {
  return (
    <Uklad
      tytul="Półkolonie w Krakowie — Frajdoplan"
      opis="Półkolonie letnie i zimowe dla dzieci w Krakowie i okolicy."
      missingConfig={missingConfig}
      fetchError={fetchError}
    >
      <section className="hero">
        <h1>Półkolonie</h1>
        <p className="lead">Półkolonie letnie i zimowe w Krakowie i okolicy. Listę uzupełniamy przed feriami i wakacjami.</p>
      </section>
      <Katalog places={places} tytul="Organizatorzy półkolonii" pokazDachPole={false} placeholder="Szukaj organizatora lub dzielnicy…" />
    </Uklad>
  );
}
