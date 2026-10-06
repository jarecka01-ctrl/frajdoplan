import ListaWydarzen from '../components/ListaWydarzen';
import { pobierzListeWydarzen } from '../lib/dane';

export async function getStaticProps() {
  return pobierzListeWydarzen({
    kategoria: 'koncert',
    adres: '/koncerty',
    teksty: {
      tytul: 'Koncerty dla dzieci w Krakowie: terminy | Frajdoplan',
      opis: 'Wszystkie najbliższe koncerty dla dzieci w Krakowie: filharmonia, koncerty rodzinne, zajęcia muzyczne dla maluchów. Daty, godziny, miejsca i bilety.',
      h1: 'Koncerty dla dzieci w Krakowie',
      wstep: 'Wszystkie terminy koncertów dla dzieci, od najbliższych, z biletami. Lista obejmuje także koncerty zapowiedziane z dużym wyprzedzeniem.',
    },
  });
}

export default function Koncerty(props) {
  return <ListaWydarzen {...props} nazwaOkruszka="Koncerty" pusto="Nie mamy teraz koncertów dla dzieci w kalendarzu. Zajrzyj tu za kilka dni." />;
}
