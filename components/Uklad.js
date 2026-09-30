import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

const MENU = [
  { href: '/', label: 'Gdzie iść' },
  { href: '/treningi', label: 'Treningi' },
  { href: '/zajecia', label: 'Zajęcia' },
  { href: '/polkolonie', label: 'Półkolonie' },
];

export default function Uklad({ tytul, opis, children, missingConfig, fetchError }) {
  const { pathname } = useRouter();
  return (
    <>
      <Head>
        <title>{tytul}</title>
        {/* Wersja testowa: nie indeksuj. Usuń tę linię po podpięciu domeny frajdoplan.pl. */}
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content={opis} />
      </Head>
      <div className="wrap">
        <header className="top">
          <Link href="/" className="brand">Frajdoplan</Link>
          <nav className="menu" aria-label="Główne menu">
            {MENU.map((m) => (
              <Link key={m.href} href={m.href} className="menu-link" aria-current={pathname === m.href ? 'page' : undefined}>
                {m.label}
              </Link>
            ))}
          </nav>
        </header>
        {missingConfig && <div className="notice">Brak zmiennej <code>SHEET_CSV_URL</code>. Ustaw ją w Vercel (Settings → Environment Variables).</div>}
        {fetchError && <div className="notice">Nie udało się pobrać danych z arkusza. Sprawdź, czy link CSV nadal działa.</div>}
        {children}
        <footer className="stopka">Frajdoplan, Kraków. Dane o miejscach pochodzą z publicznych źródeł, m.in. Map Google.</footer>
      </div>
    </>
  );
}
