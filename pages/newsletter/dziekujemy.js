import Link from 'next/link';
import Uklad from '../../components/Uklad';
import { seoStrony } from '../../lib/seo';

// Tu trafia osoba po kliknięciu linku potwierdzającego w e-mailu (adres podaje api/newsletter.js). Strona bez indeksowania.
export async function getStaticProps() {
  const seo = await seoStrony('/newsletter/dziekujemy', {
    tytul: 'Dziękujemy za zapis na newsletter | Frajdoplan',
    opis: 'Adres e-mail potwierdzony. Przed najbliższym weekendem dostaniesz plan dla dzieci w Krakowie.',
    h1: 'Gotowe, jesteś zapisana!',
    wstep: 'Adres e-mail potwierdzony. Pierwszy newsletter dostaniesz przed najbliższym weekendem.',
  }, 0, { noindex: true });
  return { props: { seo: { ...seo, canonical: '' } }, revalidate: 3600 };
}

export default function Dziekujemy({ seo }) {
  return (
    <Uklad seo={seo}>
      <section className="hero">
        <h1>{seo.h1}</h1>
        <p className="lead">{seo.wstep}</p>
      </section>
      <div className="nl-strona">
        <p>W międzyczasie zajrzyj, co dzieje się w ten weekend.</p>
        <p><Link href="/weekend" className="przycisk">Zobacz weekend w Krakowie</Link></p>
      </div>
    </Uklad>
  );
}
