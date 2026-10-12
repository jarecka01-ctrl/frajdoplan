import { sprawdzZgloszenie, wierszDoArkusza } from '../../lib/zgloszenia';

// Przyjmuje zgłoszenie z formularza „Dodaj wydarzenie" / „Dodaj miejsce" i przekazuje je do skryptu Apps Script, który zapisuje wiersz
// w arkuszu Google. Adres skryptu i hasło są tylko w zmiennych Vercela (ZGLOSZENIA_URL, ZGLOSZENIA_SEKRET), nigdy w kodzie.
// Nie zapisujemy adresów IP; limit zgłoszeń z jednego adresu działa tylko w pamięci serwera i służy do wyłapania nadużyć.
export const config = { api: { bodyParser: { sizeLimit: '20kb' } } };

const OKNO_MS = 60 * 60 * 1000;
const LIMIT = 5;
const ostatnie = new Map(); // ip → [czasy]
function przekroczonyLimit(ip) {
  const teraz = Date.now();
  const lista = (ostatnie.get(ip) || []).filter((t) => teraz - t < OKNO_MS);
  if (lista.length >= LIMIT) { ostatnie.set(ip, lista); return true; }
  lista.push(teraz);
  ostatnie.set(ip, lista);
  if (ostatnie.size > 5000) ostatnie.clear();
  return false;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, blad: 'Metoda niedozwolona.' }); }

  // zgłoszenie musi przyjść z naszej strony
  const origin = req.headers.origin;
  if (origin) {
    let host = '';
    try { host = new URL(origin).host; } catch (e) { /* zły nagłówek */ }
    if (host !== req.headers.host) return res.status(403).json({ ok: false, blad: 'Niedozwolone źródło.' });
  }

  const { typ, pola, zgoda, www_firmowa: pulapka, czas } = req.body || {};
  // pułapka na boty (ukryte pole) i zbyt szybkie wysłanie (poniżej 3 s od otwarcia formularza): udajemy sukces, nic nie zapisujemy
  if (pulapka || (typeof czas === 'number' && czas < 3000)) return res.status(200).json({ ok: true });

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  if (przekroczonyLimit(ip)) return res.status(429).json({ ok: false, blad: 'Wysłano już kilka zgłoszeń. Spróbuj ponownie za godzinę albo napisz na kontakt@frajdoplan.pl.' });

  if (zgoda !== true) return res.status(400).json({ ok: false, bledy: { zgoda: 'Zaznacz zgodę, żebyśmy mogli przetworzyć zgłoszenie.' } });
  const wynik = sprawdzZgloszenie(typ, pola);
  if (wynik.bledy) return res.status(400).json({ ok: false, bledy: wynik.bledy });

  const url = process.env.ZGLOSZENIA_URL;
  const sekret = process.env.ZGLOSZENIA_SEKRET;
  if (!url || !sekret) return res.status(503).json({ ok: false, blad: 'Formularz jest chwilowo niedostępny. Napisz proszę na kontakt@frajdoplan.pl.' });

  try {
    const odp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // „zwykły" typ omija dodatkowe zapytanie wstępne, którego Apps Script nie obsługuje
      body: JSON.stringify({ sekret, typ, wiersz: wierszDoArkusza(typ, wynik.czyste) }),
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    const tekst = await odp.text().catch(() => '');
    let dane = null;
    try { dane = JSON.parse(tekst); } catch (e) { /* odpowiedź nie jest JSON-em, np. strona logowania Google */ }
    if (!odp.ok || !dane || dane.ok !== true) {
      // do logu tylko to, co pomaga znaleźć przyczynę: komunikat skryptu („brak dostępu" = złe hasło) albo początek odpowiedzi, która nie jest JSON-em (bez treści zgłoszenia)
      const powod = dane ? `błąd skryptu: ${String(dane.blad || 'brak opisu').slice(0, 200)}` : `odpowiedź nie jest JSON-em: ${tekst.replace(/\s+/g, ' ').slice(0, 80)}`;
      throw new Error(`Apps Script: HTTP ${odp.status}, ${powod}`);
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[zglos] nie udało się zapisać zgłoszenia:', e.message); // bez treści zgłoszenia i bez adresu skryptu
    return res.status(502).json({ ok: false, blad: 'Nie udało się zapisać zgłoszenia. Spróbuj za chwilę albo napisz na kontakt@frajdoplan.pl.' });
  }
}
