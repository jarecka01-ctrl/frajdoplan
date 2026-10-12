import NewsletterGenerator from '../../components/NewsletterGenerator';
import { pobierzDane } from '../../lib/dane';

// Ukryty widok do składania newslettera na weekend: bez indeksowania, bez linków w serwisie, poza sitemapą.
export async function getStaticProps() {
  return pobierzDane({
    sekcja: 'z-marszu',
    zWydarzeniami: true,
    zAdresami: true,
    adres: '/newsletter/generator',
    noindex: true,
    teksty: { tytul: 'Newsletter na weekend | Frajdoplan', opis: 'Widok roboczy.', h1: 'Newsletter na weekend', wstep: '' },
  });
}

export default function Generator(props) {
  return <NewsletterGenerator {...props} />;
}
