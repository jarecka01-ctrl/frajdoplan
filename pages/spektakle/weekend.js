import Link from 'next/link';
import ListaWydarzen from '../../components/ListaWydarzen';
import { pobierzSpektakleWeekend } from '../../lib/dane';

export async function getStaticProps() {
  return pobierzSpektakleWeekend();
}

export default function SpektakleWeekend(props) {
  return (
    <ListaWydarzen
      {...props}
      okruszki={[{ nazwa: 'Spektakle', href: '/spektakle' }, { nazwa: 'W weekend', href: '/spektakle/weekend' }]}
      kolor="spektakl"
      pusto="W najbliższy weekend nie mamy spektakli dla dzieci w kalendarzu. Zobacz wszystkie terminy."
    >
      <p className="dodaj-przypis">Więcej terminów: <Link href="/spektakle">wszystkie spektakle dla dzieci</Link>. Pełny plan weekendu: <Link href="/weekend">Weekend</Link>.</p>
    </ListaWydarzen>
  );
}
