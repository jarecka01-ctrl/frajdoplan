import { SITE_URL } from '../lib/seo';
import { adresyDoMapy, dzisWarszawa } from '../lib/dane';
import repertuar from '../data/repertuar.json';

// Mapa strony (/sitemap.xml): strona główna, huby, listy /koncerty i /spektakle, kategorie z co najmniej 3 miejscami
// i karty miejsc, które mogą się indeksować (bez stron z noindex). Odpowiedź trzymana w CDN godzinę (jak ISR, revalidate 3600).
const STALE = ['/', '/atrakcje', '/sport', '/zajecia', '/polkolonie', '/koncerty', '/spektakle'];

const xml = (wpisy) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${wpisy.map(([a, data]) => `  <url><loc>${SITE_URL}${a}</loc><lastmod>${data}</lastmod></url>`).join('\n')}
</urlset>
`;

export async function getServerSideProps({ res }) {
  const dzis = dzisWarszawa();
  const { kategorie, miejsca } = await adresyDoMapy();
  const dataRepertuaru = String(repertuar.zaktualizowano || '').slice(0, 10) || dzis;
  // lastmod: listy wydarzeń = ostatnia aktualizacja repertuaru, reszta = dzień odświeżenia danych z arkusza
  const wpisy = [...new Set([...STALE, ...kategorie, ...miejsca])].map((a) => [a, a === '/koncerty' || a === '/spektakle' ? dataRepertuaru : dzis]);
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(xml(wpisy));
  res.end();
  return { props: {} };
}

export default function Sitemap() { return null; }
