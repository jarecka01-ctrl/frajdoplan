import Uklad from '../../components/Uklad';
import Okruszki from '../../components/Okruszki';
import NewsletterForm from '../../components/NewsletterForm';
import { seoStrony } from '../../lib/seo';

export async function getStaticProps() {
  const seo = await seoStrony('/newsletter', {
    tytul: 'Newsletter: weekend z dzieckiem w Krakowie, co tydzień | Frajdoplan',
    opis: 'Co tydzień, przed weekendem, jeden e-mail z planem weekendu dla dzieci w Krakowie: wydarzenia, nasze typy i bezpłatne atrakcje. Zapisz się, to nic nie kosztuje.',
    h1: 'Plan weekendu w skrzynce, co tydzień',
    wstep: 'Jeden krótki e-mail raz w tygodniu: co dzieje się w sobotę i niedzielę w Krakowie, z godzinami i adresami. Bez reklam i spamu.',
  }, 0);
  return { props: { seo }, revalidate: 3600 };
}

export default function Newsletter({ seo }) {
  return (
    <Uklad seo={seo}>
      <Okruszki sciezka={[{ nazwa: 'Newsletter', href: seo.adres }]} siteUrl={seo.siteUrl} />
      <section className="hero">
        <h1>{seo.h1}</h1>
        <p className="lead">{seo.wstep}</p>
      </section>
      <div className="nl-strona">
        <ul className="nl-lista">
          <li><strong>Nasze typy</strong> na weekend, czyli wydarzenia, które naprawdę warto zobaczyć.</li>
          <li><strong>Sobota i niedziela</strong> według pory dnia, z godziną, miejscem i ceną.</li>
          <li><strong>Bezpłatne atrakcje</strong> oznaczone osobno, żeby łatwo je znaleźć.</li>
          <li>Wysyłamy w środę wieczorem albo w czwartek rano, żebyś zdążyła wszystko zaplanować.</li>
        </ul>
        <NewsletterForm id="nl-strona" />
        <p className="nl-nota">Po zapisie dostaniesz e-mail z prośbą o potwierdzenie adresu. Z newslettera możesz zrezygnować jednym kliknięciem w dowolnej wiadomości.</p>
      </div>
    </Uklad>
  );
}
