import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { jsonLdTekst } from '../lib/jsonld';

const MENU = [
  { href: '/', label: 'Atrakcje', dzial: '/atrakcje' },
  { href: '/sport', label: 'Sport' },
  { href: '/zajecia', label: 'Zajęcia' },
  { href: '/polkolonie', label: 'Półkolonie' },
];
// Zakładka jest aktywna też na podstronach działu (np. /sport/taniec).
const aktywna = (m, pathname) => pathname === m.href || pathname.startsWith(`${m.dzial || m.href}/`) || pathname === m.dzial;

// `seo` przychodzi z getStaticProps (lib/seo.js): tytul, opis, canonical, obrazek. `jsonLd` = lista obiektów schema.org.
export default function Uklad({ seo, jsonLd = [], children, missingConfig, fetchError }) {
  const { pathname } = useRouter();
  return (
    <>
      <Head>
        <title>{seo.tytul}</title>
        {/* Wersja testowa: nie indeksuj. Usuń tę linię po podpięciu domeny frajdoplan.pl. */}
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content={seo.opis} />
        <link rel="canonical" href={seo.canonical} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#F7B32B" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="pl_PL" />
        <meta property="og:site_name" content="Frajdoplan" />
        <meta property="og:title" content={seo.tytul} />
        <meta property="og:description" content={seo.opis} />
        <meta property="og:url" content={seo.canonical} />
        <meta property="og:image" content={seo.obrazek} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Frajdoplan: co robić z dzieckiem w Krakowie" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seo.tytul} />
        <meta name="twitter:description" content={seo.opis} />
        <meta name="twitter:image" content={seo.obrazek} />
        {jsonLd.map((obiekt, i) => (
          <script key={`ld-${i}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdTekst(obiekt) }} />
        ))}
      </Head>
      <div className="wrap">
        <header className="top">
          <Link href="/" className="brand" aria-label="Frajdoplan: co robić z dzieckiem w Krakowie, strona główna">
            <span className="brand-logo"><img src="/brand/logo-frajdoplan.png" alt="Frajdoplan" width="1254" height="316" /></span>
            <img className="brand-smok" src="/brand/smok.png" alt="" width="626" height="683" />
          </Link>
          <img className="top-krakow" src="/brand/krakow-baner.png" alt="" width="1406" height="349" />
        </header>
        <nav className="menu" aria-label="Główne menu">
          {MENU.map((m) => (
            <Link key={m.href} href={m.href} className="menu-link" aria-current={aktywna(m, pathname) ? 'page' : undefined}>
              {m.label}
            </Link>
          ))}
        </nav>
        {missingConfig && <div className="notice">Brak zmiennej <code>SHEET_CSV_URL</code>. Ustaw ją w Vercel (Settings → Environment Variables).</div>}
        {fetchError && <div className="notice">Nie udało się pobrać danych z arkusza. Sprawdź, czy link CSV nadal działa.</div>}
        {children}
        <footer className="stopka">
          <p>Frajdoplan, Kraków. Dane o miejscach pochodzą z publicznych źródeł, m.in. Map Google.</p>
          <img className="stopka-smok" src="/brand/smok.png" alt="" width="626" height="683" />
        </footer>
      </div>
    </>
  );
}
