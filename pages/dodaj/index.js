import Link from 'next/link';
import Uklad from '../../components/Uklad';
import Okruszki from '../../components/Okruszki';
import { seoStrony } from '../../lib/seo';

export async function getStaticProps() {
  const seo = await seoStrony('/dodaj', {
    tytul: 'Dodaj wydarzenie lub miejsce | Frajdoplan',
    opis: 'Znasz wydarzenie albo miejsce dla dzieci w Krakowie, którego u nas brakuje? Zgłoś je, a my sprawdzimy i dodamy do Frajdoplanu.',
    h1: 'Dodaj do Frajdoplanu',
    wstep: 'Brakuje czegoś, co warto pokazać rodzicom w Krakowie? Zgłoś wydarzenie albo miejsce. Każde zgłoszenie sprawdzamy, zanim cokolwiek pojawi się na stronie.',
  }, 0);
  return { props: { seo }, revalidate: 3600 };
}

export default function Dodaj({ seo }) {
  return (
    <Uklad seo={seo}>
      <Okruszki sciezka={[{ nazwa: 'Dodaj', href: seo.adres }]} siteUrl={seo.siteUrl} />
      <section className="hero">
        <h1>{seo.h1}</h1>
        <p className="lead">{seo.wstep}</p>
      </section>
      <div className="dodaj-wybor">
        <Link href="/dodaj/wydarzenie" className="dodaj-karta dodaj-wydarzenie">
          <span className="dodaj-ikona" aria-hidden="true">🎟️</span>
          <strong>Dodaj wydarzenie</strong>
          <span>Koncert, spektakl, warsztaty, festyn, jarmark. Coś, co dzieje się w konkretnym dniu.</span>
          <span className="dodaj-strzalka" aria-hidden="true">Wypełnij formularz →</span>
        </Link>
        <Link href="/dodaj/miejsce" className="dodaj-karta dodaj-miejsce">
          <span className="dodaj-ikona" aria-hidden="true">📍</span>
          <strong>Dodaj miejsce</strong>
          <span>Sala zabaw, plac zabaw, park, muzeum, kawiarnia przyjazna dzieciom. Coś, co jest otwarte na stałe.</span>
          <span className="dodaj-strzalka" aria-hidden="true">Wypełnij formularz →</span>
        </Link>
      </div>
    </Uklad>
  );
}
