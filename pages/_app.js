import 'leaflet/dist/leaflet.css';
import '../styles/globals.css';
import { Analytics } from '@vercel/analytics/next';
import PlanRoot from '../components/PlanRoot';

export default function App({ Component, pageProps }) {
  // Vercel Analytics: statystyki bez ciasteczek i bez zapisu w przeglądarce (włącza się je w panelu projektu Vercel → Analytics).
  return (
    <>
      <Component {...pageProps} />
      <PlanRoot />
      {/* adres planu udostępnionego linkiem (/plan?p=…) nie trafia do statystyk w całości: obcinamy część po znaku zapytania */}
      <Analytics beforeSend={(zdarzenie) => (zdarzenie.url.includes('/plan') ? { ...zdarzenie, url: zdarzenie.url.split('?')[0] } : zdarzenie)} />
    </>
  );
}
