import Uklad from '../components/Uklad';
import Katalog from '../components/Katalog';
import { pobierzDane } from '../lib/dane';

export async function getStaticProps() {
  return pobierzDane({ sekcja: 'zajecia' });
}

export default function Zajecia({ places, missingConfig, fetchError }) {
  return (
    <Uklad
      tytul="Zajęcia dla dzieci w Krakowie — Frajdoplan"
      opis="Zajęcia edukacyjne i artystyczne, zajęcia dla maluchów z rodzicami oraz domy kultury w Krakowie."
      missingConfig={missingConfig}
      fetchError={fetchError}
    >
      <section className="hero">
        <h1>Zajęcia dla dzieci</h1>
        <p className="lead">Zajęcia artystyczne i edukacyjne, zajęcia dla maluchów z rodzicami i domy kultury w Krakowie. Treningi sportowe znajdziesz w zakładce Treningi.</p>
      </section>
      <Katalog places={places} tytul="Gdzie zapisać dziecko" pokazDachPole={false} pokazStrefy={false} placeholder="Szukaj: robotyka, ceramika, angielski, Bronowice…" />
    </Uklad>
  );
}
