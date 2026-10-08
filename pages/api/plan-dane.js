import { createHash } from 'node:crypto';
import { daneDoPlanu } from '../../lib/dane';

// Ogólne dane dla funkcji „Mój plan" (miejsca i wydarzenia w zwartej postaci). Nie przyjmuje żadnych danych od użytkownika:
// plan zostaje w jego przeglądarce, a ta odpowiedź jest taka sama dla wszystkich.
// Cache: CDN Vercela trzyma ją godzinę (jak ISR strony), a przeglądarka zawsze pyta o świeżość (ETag, więc bez zbędnego pobierania).
// Nie dajemy przeglądarce stale-while-revalidate, bo pokazałaby w panelu planu dane sprzed dni.
export default async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); res.status(405).end(); return; }
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  try {
    const tresc = JSON.stringify(await daneDoPlanu());
    const etag = `"${createHash('sha1').update(tresc).digest('base64url').slice(0, 22)}"`;
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.setHeader('Vercel-CDN-Cache-Control', 'max-age=3600, stale-while-revalidate=86400');
    res.setHeader('ETag', etag);
    if (req.headers['if-none-match'] === etag) { res.status(304).end(); return; }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).send(tresc);
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(503).json({ blad: 'Dane chwilowo niedostępne' });
  }
}
