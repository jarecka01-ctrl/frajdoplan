import Head from 'next/head';
import Link from 'next/link';
import { jsonLdTekst, okruszkiJsonLd } from '../lib/jsonld';

// Okruszki nawigacji: Frajdoplan › Sport › Taniec (+ dane BreadcrumbList dla Google)
export default function Okruszki({ sciezka, siteUrl }) {
  const pelna = [{ nazwa: 'Frajdoplan', href: '/' }, ...sciezka];
  return (
    <nav className="okruszki" aria-label="Jesteś tutaj">
      <Head>
        <script key="ld-okruszki" type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdTekst(okruszkiJsonLd(pelna, siteUrl)) }} />
      </Head>
      <ol>
        {pelna.map((o, i) => (
          <li key={o.href}>
            {i < pelna.length - 1 ? <Link href={o.href}>{o.nazwa}</Link> : <span aria-current="page">{o.nazwa}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
