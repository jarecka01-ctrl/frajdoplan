import 'leaflet/dist/leaflet.css';
import '../styles/globals.css';
import { Analytics } from '@vercel/analytics/next';

export default function App({ Component, pageProps }) {
  // Vercel Analytics: statystyki bez ciasteczek i bez zapisu w przeglądarce (włącza się je w panelu projektu Vercel → Analytics).
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
