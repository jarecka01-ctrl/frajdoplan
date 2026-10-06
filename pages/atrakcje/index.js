import Uklad from '../../components/Uklad';
import Katalog from '../../components/Katalog';
import Okruszki from '../../components/Okruszki';
import { listaMiejscJsonLd } from '../../lib/jsonld';
import { pobierzDane } from '../../lib/dane';

export async function getStaticProps() {
  return pobierzDane({
    sekcja: 'z-marszu',
    adres: '/atrakcje',
    teksty: {
      tytul: 'Atrakcje dla dzieci w Krakowie: lista miejsc | Frajdoplan',
      opis: 'Sale zabaw, place zabaw, parki, muzea, teatry, kina i baseny dla dzieci w Krakowie i okolicy.',
      h1: 'Atrakcje dla dzieci',
      wstep: 'Sale zabaw, place zabaw, parki, muzea, kina i wycieczki pod Krakowem. Wybierz jeden lub kilka rodzajów.',
    },
  });
}

export default function Atrakcje({ places, seo, missingConfig, fetchError }) {
  return (
    <Uklad seo={seo} jsonLd={[listaMiejscJsonLd(places, seo.h1)]} missingConfig={missingConfig} fetchError={fetchError}>
      <Okruszki sciezka={[{ nazwa: 'Atrakcje', href: '/atrakcje' }]} siteUrl={seo.siteUrl} />
      <section className="hero">
        <h1>{seo.h1}</h1>
        <p className="lead">{seo.wstep}</p>
      </section>
      <Katalog places={places} dzial="atrakcje" tytul="Miejsca na każdy dzień" placeholder="Szukaj: sala zabaw, Nowa Huta, trampoliny…" />
    </Uklad>
  );
}
