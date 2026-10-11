import Uklad from '../../components/Uklad';
import Okruszki from '../../components/Okruszki';
import FormularzZgloszenia from '../../components/FormularzZgloszenia';
import { seoStrony } from '../../lib/seo';

export async function getStaticProps() {
  const seo = await seoStrony('/dodaj/miejsce', {
    tytul: 'Dodaj miejsce dla dzieci w Krakowie | Frajdoplan',
    opis: 'Zgłoś miejsce dla dzieci w Krakowie: salę zabaw, plac zabaw, muzeum, park. Sprawdzimy je i dodamy do katalogu Frajdoplanu.',
    h1: 'Dodaj miejsce',
    wstep: 'Prowadzisz miejsce dla dzieci w Krakowie albo znasz takie, którego u nas brakuje? Podaj kilka informacji, a my sprawdzimy zgłoszenie i dodamy miejsce do katalogu.',
  }, 0);
  return { props: { seo }, revalidate: 3600 };
}

export default function DodajMiejsce({ seo }) {
  return (
    <Uklad seo={seo}>
      <Okruszki sciezka={[{ nazwa: 'Dodaj', href: '/dodaj' }, { nazwa: 'Miejsce', href: seo.adres }]} siteUrl={seo.siteUrl} />
      <section className="hero">
        <h1>{seo.h1}</h1>
        <p className="lead">{seo.wstep}</p>
      </section>
      <FormularzZgloszenia typ="miejsce" />
    </Uklad>
  );
}
