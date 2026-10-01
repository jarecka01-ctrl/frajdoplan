import Uklad from '../components/Uklad';
import Katalog from '../components/Katalog';
import { pobierzDane } from '../lib/dane';

export async function getStaticProps() {
  return pobierzDane({ sekcja: 'treningi' });
}

export default function Treningi({ places, missingConfig, fetchError }) {
  return (
    <Uklad
      tytul="Sport dla dzieci w Krakowie: treningi i zajęcia sportowe — Frajdoplan"
      opis="Pływanie, taniec, sztuki walki, piłka nożna, tenis, gimnastyka, jazda konna i inne treningi dla dzieci w Krakowie."
      missingConfig={missingConfig}
      fetchError={fetchError}
    >
      <section className="hero">
        <h1>Sport dla dzieci</h1>
        <p className="lead">Pływanie, taniec, sztuki walki, piłka nożna, tenis i inne sporty. Wybierz jedną lub kilka dyscyplin.</p>
      </section>
      <Katalog places={places} tytul="Gdzie zapisać dziecko na trening" pokazDachPole={false} pokazStrefy={false} grupuj="dyscyplina" placeholder="Szukaj: judo, balet, Bronowice…" />
    </Uklad>
  );
}
