import StronaKategorii from '../../components/StronaKategorii';
import { sciezkiKategorii, pobierzKategorie } from '../../lib/dane';

export async function getStaticPaths() {
  return sciezkiKategorii('zajecia', 'kategoria');
}

export async function getStaticProps({ params }) {
  return pobierzKategorie('zajecia', params.kategoria);
}

export default function Kategoria(props) {
  return <StronaKategorii dzial="zajecia" {...props} />;
}
