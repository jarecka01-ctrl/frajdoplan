import Uklad from '../../components/Uklad';
import Okruszki from '../../components/Okruszki';
import FormularzZgloszenia from '../../components/FormularzZgloszenia';
import { seoStrony } from '../../lib/seo';

export async function getStaticProps() {
  const seo = await seoStrony('/dodaj/wydarzenie', {
    tytul: 'Dodaj wydarzenie dla dzieci w Krakowie | Frajdoplan',
    opis: 'Zgłoś wydarzenie dla dzieci w Krakowie: koncert, warsztaty, spektakl, festyn. Sprawdzimy je i dodamy do kalendarza Frajdoplanu.',
    h1: 'Dodaj wydarzenie',
    wstep: 'Organizujesz coś dla dzieci w Krakowie albo wiesz o czymś ciekawym? Podaj kilka informacji, a my sprawdzimy zgłoszenie i dodamy wydarzenie do kalendarza.',
  }, 0);
  return { props: { seo }, revalidate: 3600 };
}

export default function DodajWydarzenie({ seo }) {
  return (
    <Uklad seo={seo}>
      <Okruszki sciezka={[{ nazwa: 'Dodaj', href: '/dodaj' }, { nazwa: 'Wydarzenie', href: seo.adres }]} siteUrl={seo.siteUrl} />
      <section className="hero">
        <h1>{seo.h1}</h1>
        <p className="lead">{seo.wstep}</p>
      </section>
      <FormularzZgloszenia typ="wydarzenie" />
    </Uklad>
  );
}
