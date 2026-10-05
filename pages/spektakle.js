import ListaWydarzen from '../components/ListaWydarzen';
import { pobierzListeWydarzen } from '../lib/dane';

export async function getStaticProps() {
  return pobierzListeWydarzen({
    kategoria: 'spektakl',
    adres: '/spektakle',
    teksty: {
      tytul: 'Spektakle dla dzieci w Krakowie: repertuar | Frajdoplan',
      opis: 'Repertuar teatrów dla dzieci w Krakowie: wszystkie najbliższe spektakle z datami, godzinami, miejscami i linkami do biletów.',
      h1: 'Spektakle dla dzieci w Krakowie',
      wstep: 'Wszystkie terminy spektakli dla dzieci, od najbliższych, z biletami. Godziny tego samego spektaklu są w jednym wierszu.',
    },
  });
}

export default function Spektakle(props) {
  return <ListaWydarzen {...props} nazwaOkruszka="Spektakle" pusto="Nie mamy teraz spektakli dla dzieci w kalendarzu. Zajrzyj tu za kilka dni." />;
}
