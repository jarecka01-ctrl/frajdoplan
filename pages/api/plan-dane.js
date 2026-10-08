import { daneDoPlanu } from '../../lib/dane';

// Ogólne dane dla funkcji „Mój plan" (miejsca i wydarzenia w zwartej postaci). Nie przyjmuje żadnych danych od użytkownika:
// plan zostaje w jego przeglądarce, a ta odpowiedź jest taka sama dla wszystkich i trzymana w CDN godzinę (jak ISR strony).
export default async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); res.status(405).end(); return; }
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  try {
    const dane = await daneDoPlanu();
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json(dane);
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(503).json({ blad: 'Dane chwilowo niedostępne' });
  }
}
