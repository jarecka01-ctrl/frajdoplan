import { SITE_URL, czyIndeksowalnyHost } from '../lib/seo';

// /robots.txt: na produkcyjnym hoście wszystko dozwolone + mapa strony, na każdym innym zakaz.
export async function getServerSideProps({ req, res }) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const tekst = czyIndeksowalnyHost(String(host || '').split(',')[0].trim())
    ? `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n';
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(tekst);
  res.end();
  return { props: {} };
}

export default function Robots() { return null; }
