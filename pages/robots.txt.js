import { SITE_URL, czyProdukcja, czyHostGlowny } from '../lib/seo';

// /robots.txt zależy od hosta: produkcyjna domena główna pozwala na indeksowanie, reszta (podglądy, *.vercel.app) zabrania.
export async function getServerSideProps({ req, res }) {
  const dozwolone = czyProdukcja() && czyHostGlowny(req.headers.host);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(dozwolone ? `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
  res.end();
  return { props: {} };
}

export default function Robots() { return null; }
