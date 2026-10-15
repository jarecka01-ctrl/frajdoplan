import Link from 'next/link';
import ListaWydarzen from '../../components/ListaWydarzen';
import { pobierzListeWydarzen } from '../../lib/dane';

export async function getStaticProps() {
  return pobierzListeWydarzen({
    kategoria: 'spektakl',
    adres: '/spektakle',
    zTeatrami: true,
    teksty: {
      // {liczba} = liczba pozycji na liście (lib/seo.js); gdy listy nie ma, działają teksty „Pusty” bez liczby
      tytul: 'Spektakle dla dzieci w Krakowie: {liczba} terminów | Frajdoplan',
      opis: 'Repertuar teatrów dla dzieci w Krakowie: {liczba} terminów z godzinami i biletami. Groteska, Ludowy, Figur, VARIETE i inne. Linki do biletów przy każdym.',
      tytulPusty: 'Spektakle dla dzieci w Krakowie: repertuar | Frajdoplan',
      opisPusty: 'Repertuar teatrów dla dzieci w Krakowie: spektakle z datami, godzinami, miejscami i linkami do biletów.',
      h1: 'Spektakle dla dzieci w Krakowie',
      wstep: 'Wszystkie spektakle dla dzieci w Krakowie na jednej liście, od najbliższego terminu: teatry lalkowe, bajki i przedstawienia dla przedszkolaków i starszych dzieci. Przy każdym jest link do biletów, a filtr pozwala wybrać teatr. Lista odświeża się kilka razy w tygodniu.',
    },
  });
}

export default function Spektakle({ teatry = [], ...props }) {
  const nad = (
    <p className="lead-link">Szukasz czegoś na najbliższy weekend? Zobacz <Link href="/spektakle/weekend">spektakle w ten weekend</Link>.</p>
  );
  return (
    <ListaWydarzen {...props} nad={nad} teatry={teatry} nazwaOkruszka="Spektakle" kolor="spektakl" pusto="Nie mamy teraz spektakli dla dzieci w kalendarzu. Zajrzyj tu za kilka dni.">
      <section className="kk-poradnik" aria-labelledby="kk-poradnik-h">
        <h2 id="kk-poradnik-h">Jak wybrać spektakl dla dziecka</h2>
        <ul>
          <li><b>Termin.</b> W dni powszednie przed południem teatry często grają dla szkół i przedszkoli, takich poranków nie pokazujemy. Rodziny mają najwięcej do wyboru w weekendy, sprawdź też stronę <Link href="/weekend">Weekend</Link>.</li>
          <li><b>Bilety.</b> Link prowadzi do teatru albo do sprzedawcy biletów. Cenę i wolne miejsca sprawdź tam.</li>
          <li><b>Plan.</b> Przyciskiem „+” dodasz spektakl do swojego planu i wyślesz go rodzinie. Szukasz muzyki? Zobacz <Link href="/koncerty">koncerty dla dzieci w Krakowie</Link>.</li>
        </ul>
      </section>
      {teatry.length > 0 && (
        <section className="kk-poradnik" aria-labelledby="kk-teatry-h">
          <h2 id="kk-teatry-h">Repertuar według teatru</h2>
          <ul>
            {teatry.map((t) => <li key={t.slug}><Link href={`/spektakle/${t.slug}`}>{t.nazwa}</Link>: {t.n} {t.n % 10 >= 2 && t.n % 10 <= 4 && !(t.n % 100 >= 12 && t.n % 100 <= 14) ? 'terminy' : 'terminów'}</li>)}
          </ul>
        </section>
      )}
    </ListaWydarzen>
  );
}
