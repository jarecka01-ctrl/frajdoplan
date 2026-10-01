import StronaKategorii from '../../components/StronaKategorii';
import { sciezkiKategorii, pobierzKategorie } from '../../lib/dane';

export async function getStaticPaths() {
  return sciezkiKategorii('atrakcje', 'kategoria');
}

export async function getStaticProps({ params }) {
  return pobierzKategorie('atrakcje', params.kategoria);
}

export default function Kategoria(props) {
  return <StronaKategorii dzial="atrakcje" {...props} />;
}
