import StronaKategorii from '../../components/StronaKategorii';
import { sciezkiKategorii, pobierzKategorie } from '../../lib/dane';

export async function getStaticPaths() {
  return sciezkiKategorii('sport', 'dyscyplina');
}

export async function getStaticProps({ params }) {
  return pobierzKategorie('sport', params.dyscyplina);
}

export default function Kategoria(props) {
  return <StronaKategorii dzial="sport" {...props} />;
}
