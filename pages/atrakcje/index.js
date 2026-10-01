import Uklad from '../../components/Uklad';
import Katalog from '../../components/Katalog';
import { pobierzDane } from '../../lib/dane';

export async function getStaticProps() {
  return pobierzDane({ sekcja: 'z-marszu' });
}

export default function Atrakcje({ places, missingConfig, fetchError }) {
  return (
    <Uklad
      tytul="Atrakcje dla dzieci w Krakowie: sale zabaw, muzea, parki — Frajdoplan"
      opis="Sale zabaw, place zabaw, parki, muzea, teatry, kina i baseny dla dzieci w Krakowie i okolicy."
      missingConfig={missingConfig}
      fetchError={fetchError}
    >
      <section className="hero">
        <h1>Atrakcje dla dzieci</h1>
        <p className="lead">Sale zabaw, place zabaw, parki, muzea, kina i wycieczki pod Krakowem. Wybierz jeden lub kilka rodzajów.</p>
      </section>
      <Katalog places={places} dzial="atrakcje" tytul="Miejsca na każdy dzień" placeholder="Szukaj: sala zabaw, Nowa Huta, trampoliny…" />
    </Uklad>
  );
}
