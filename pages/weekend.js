import WeekendStrona from '../components/WeekendStrona';
import { pobierzDane } from '../lib/dane';

export async function getStaticProps() {
  return pobierzDane({
    sekcja: 'z-marszu',
    zWydarzeniami: true,
    zAdresami: true,
    adres: '/weekend',
    teksty: {
      tytul: 'Weekend dla dzieci w Krakowie: co robić w sobotę i niedzielę | Frajdoplan',
      opis: 'Wszystkie wydarzenia dla dzieci w najbliższy weekend w Krakowie: spektakle, koncerty, warsztaty, wydarzenia na polu. Sobota i niedziela, według pory dnia.',
      h1: 'Weekend dla dzieci w Krakowie',
      wstep: 'Wszystko, co dzieje się w sobotę i niedzielę, ułożone według pory dnia. Przyciskiem „+” zapiszesz wydarzenia do swojego planu.',
    },
  });
}

export default function Weekend(props) {
  return <WeekendStrona {...props} />;
}
