import Link from 'next/link';
import ListaWydarzen from '../../components/ListaWydarzen';
import { pobierzTeatr, sciezkiTeatrow } from '../../lib/dane';

export async function getStaticPaths() {
  return sciezkiTeatrow();
}

export async function getStaticProps({ params }) {
  return pobierzTeatr(params.teatr);
}

export default function StronaTeatru({ teatr, inne, ...props }) {
  const nad = (
    <p className="teatr-info">
      {teatr.adres && <span>Adres: {teatr.adres}. </span>}
      {teatr.karta && <Link href={teatr.karta}>Karta miejsca</Link>}
    </p>
  );
  return (
    <ListaWydarzen
      {...props}
      nad={nad}
      okruszki={[{ nazwa: 'Spektakle', href: '/spektakle' }, { nazwa: teatr.nazwa, href: props.seo.adres }]}
      kolor="spektakl"
      pusto="Nie mamy teraz terminów w tym teatrze."
    >
      <section className="kk-poradnik" aria-labelledby="teatry-inne-h">
        <h2 id="teatry-inne-h">Inne teatry i spektakle</h2>
        <nav className="teatry-nav" aria-label="Inne teatry">
          <Link href="/spektakle">Wszystkie spektakle</Link>
          <Link href="/spektakle/weekend">W ten weekend</Link>
          {inne.map((t) => <Link key={t.slug} href={`/spektakle/${t.slug}`}>{t.nazwa}<i>{t.n}</i></Link>)}
        </nav>
      </section>
    </ListaWydarzen>
  );
}
