import Link from 'next/link';
import ListaWydarzen from '../components/ListaWydarzen';
import { pobierzListeWydarzen } from '../lib/dane';

export async function getStaticProps() {
  return pobierzListeWydarzen({
    kategoria: 'koncert',
    adres: '/koncerty',
    teksty: {
      tytul: 'Koncerty dla dzieci w Krakowie: terminy | Frajdoplan',
      opis: 'Najbliższe koncerty dla dzieci w Krakowie: filharmonia, koncerty rodzinne i zajęcia muzyczne dla maluchów. Daty, godziny, miejsca i bilety.',
      h1: 'Koncerty dla dzieci w Krakowie',
      wstep: 'Wszystkie terminy koncertów dla dzieci, od najbliższych, z biletami. Lista obejmuje także koncerty zapowiedziane z dużym wyprzedzeniem.',
    },
  });
}

export default function Koncerty(props) {
  return (
    <ListaWydarzen {...props} nazwaOkruszka="Koncerty" pusto="Nie mamy teraz koncertów dla dzieci w kalendarzu. Zajrzyj tu za kilka dni.">
      <section className="kk-poradnik" aria-labelledby="kk-poradnik-h">
        <h2 id="kk-poradnik-h">Jak wybrać koncert dla dziecka</h2>
        <ul>
          <li><b>Termin.</b> Koncerty rodzinne grane są najczęściej w weekendy, sprawdź też stronę <Link href="/weekend">Weekend</Link>.</li>
          <li><b>Bilety.</b> Link prowadzi do organizatora albo do sprzedawcy biletów. Cenę i wolne miejsca sprawdź tam.</li>
          <li><b>Teatr zamiast koncertu.</b> Wolisz przedstawienie? Zobacz <Link href="/spektakle">spektakle dla dzieci w Krakowie</Link>.</li>
          <li><b>Plan.</b> Przyciskiem „+” dodasz koncert do swojego planu i wyślesz go rodzinie.</li>
        </ul>
      </section>
    </ListaWydarzen>
  );
}
