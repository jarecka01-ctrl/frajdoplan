import { SITE_URL } from '../lib/seo';
import { DZIALY } from '../lib/kategorie';
import { sciezkiKategorii } from '../lib/dane';

// Mapa strony (/sitemap.xml): strony główne działów, listy /koncerty i /spektakle oraz kategorie z danych.
const STALE = ['/', '/atrakcje', '/sport', '/zajecia', '/polkolonie', '/koncerty', '/spektakle'];
const NAGLOWEK_DZIALU = { atrakcje: 'kategoria', sport: 'dyscyplina', zajecia: 'kategoria' };

const xml = (adresy) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${adresy.map((a) => `  <url><loc>${SITE_URL}${a === '/' ? '/' : a}</loc></url>`).join('\n')}
</urlset>
`;

export async function getServerSideProps({ res }) {
  const adresy = [...STALE];
  for (const dzial of Object.keys(DZIALY)) {
    const { paths } = await sciezkiKategorii(dzial, NAGLOWEK_DZIALU[dzial]);
    paths.forEach((p) => adresy.push(`${DZIALY[dzial].hub}/${p.params[NAGLOWEK_DZIALU[dzial]]}`));
  }
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(xml([...new Set(adresy)]));
  res.end();
  return { props: {} };
}

export default function Sitemap() { return null; }
