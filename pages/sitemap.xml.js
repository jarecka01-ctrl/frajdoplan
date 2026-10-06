import { SITE_URL } from '../lib/seo';
import { adresyDoSitemapy } from '../lib/dane';

// Mapa strony (/sitemap.xml): strona główna, huby, listy wydarzeń, kategorie z co najmniej 3 miejscami i indeksowalne karty miejsc.
// Odświeżana co godzinę (cache CDN). `lastmod` = dzień ostatniego odświeżenia danych (arkusz nie ma dat zmian poszczególnych miejsc).
const STALE = ['/', '/atrakcje', '/sport', '/zajecia', '/polkolonie', '/koncerty', '/spektakle'];

const dzisWarszawa = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw' }).format(new Date());

const xml = (adresy, lastmod) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${adresy.map((a) => `  <url><loc>${SITE_URL}${a}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}
</urlset>
`;

export async function getServerSideProps({ res }) {
  const { kategorie, karty } = await adresyDoSitemapy();
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(xml([...new Set([...STALE, ...kategorie, ...karty])], dzisWarszawa()));
  res.end();
  return { props: {} };
}

export default function Sitemap() { return null; }
