import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { jsonLdTekst } from '../lib/jsonld';
import { KONTAKT_EMAIL } from '../lib/prawne';

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
        {/* Indeksowanie tylko na produkcji (seo.noindex z lib/seo.js); host sprawdza middleware.js. */}
        {seo.noindex && <meta name="robots" content="noindex, nofollow" />}
        {seo.weryfikacjaGoogle && <meta name="google-site-verification" content={seo.weryfikacjaGoogle} />}
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
            <span className="brand-logo"><img src="/brand/nowe/logo-header.png" alt="Frajdoplan – co robić z dzieckiem w Krakowie" width="1528" height="449" /></span>
          </Link>
          <img className="top-krakow" src="/brand/krakow-baner.png" alt="" width="1406" height="349" />
        </header>
        <nav className="menu" aria-label="Główne menu">
          {/* skrót do listy miejsc na stronie głównej (jest na jej końcu, pod kalendarzem) */}
          <Link href="/#miejsca" className="menu-link menu-skrot"><span aria-hidden="true">↓ </span>Miejsca</Link>
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
          {/* tło stopki jest jasne (papier), więc wersja z ciemnym napisem; na ciemne tło służy logo-slowo-jasne.png */}
          <img className="stopka-logo" src="/brand/nowe/logo-slowo.png" alt="Frajdoplan" width="1528" height="361" loading="lazy" />
          <p>Frajdoplan, Kraków. Dane o miejscach pochodzą z publicznych źródeł, m.in. Map Google.</p>
          <nav className="stopka-linki" aria-label="Informacje prawne i kontakt">
            <Link href="/polityka-prywatnosci">Polityka prywatności</Link>
            <Link href="/regulamin">Regulamin</Link>
            <Link href="/kontakt">Kontakt</Link>
            <a href={`mailto:${KONTAKT_EMAIL}?subject=${encodeURIComponent('Błąd na stronie')}`}>Zgłoś błąd</a>
          </nav>
        </footer>
      </div>
    </>
  );
}
