import { czystyEmail, sprawdzEmail } from '../../lib/newsletter';

// Zapis na newsletter: przekazuje adres do Brevo z potwierdzeniem e-mailem (double opt-in). Dopiero kliknięcie w link z wiadomości
// dodaje osobę do listy. Klucz i numery są tylko w zmiennych Vercela (BREVO_API_KEY, BREVO_LIST_ID, BREVO_DOI_TEMPLATE_ID), nigdy w kodzie.
// Adresów IP nie zapisujemy; limit zapisów z jednego adresu działa tylko w pamięci serwera i służy do wyłapania nadużyć.
export const config = { api: { bodyParser: { sizeLimit: '5kb' } } };

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

  // zapis musi przyjść z naszej strony
  const origin = req.headers.origin;
  if (origin) {
    let host = '';
    try { host = new URL(origin).host; } catch (e) { /* zły nagłówek */ }
    if (host !== req.headers.host) return res.status(403).json({ ok: false, blad: 'Niedozwolone źródło.' });
  }

  const { email, zgoda, www_firmowa: pulapka, czas } = req.body || {};
  // pułapka na boty (ukryte pole) i zbyt szybkie wysłanie (poniżej 2 s od otwarcia): udajemy sukces, nic nie wysyłamy
  if (pulapka || (typeof czas === 'number' && czas < 2000)) {
    console.warn('[newsletter] zapis pominięty (bez wysyłki do Brevo):', pulapka ? 'wypełnione ukryte pole' : `za szybko, ${czas} ms`);
    return res.status(200).json({ ok: true });
  }

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  if (przekroczonyLimit(ip)) return res.status(429).json({ ok: false, blad: 'Było już kilka prób zapisu. Spróbuj ponownie za godzinę albo napisz na kontakt@frajdoplan.pl.' });

  if (zgoda !== true) return res.status(400).json({ ok: false, bledy: { zgoda: 'Zaznacz zgodę, żebyśmy mogli wysyłać Ci newsletter.' } });
  const bladEmaila = sprawdzEmail(email);
  if (bladEmaila) return res.status(400).json({ ok: false, bledy: { email: bladEmaila } });

  const klucz = process.env.BREVO_API_KEY;
  const lista = Number(process.env.BREVO_LIST_ID);
  const szablon = Number(process.env.BREVO_DOI_TEMPLATE_ID);
  if (!klucz || !lista || !szablon) return res.status(503).json({ ok: false, blad: 'Zapis na newsletter jest chwilowo niedostępny. Napisz proszę na kontakt@frajdoplan.pl.' });

  const adres = (process.env.SITE_URL || 'https://frajdoplan.pl').replace(/\/+$/, '');
  try {
    const odp = await fetch('https://api.brevo.com/v3/contacts/doubleOptinConfirmation', {
      method: 'POST',
      headers: { 'api-key': klucz, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: czystyEmail(email), includeListIds: [lista], templateId: szablon, redirectionUrl: `${adres}/newsletter/dziekujemy` }),
      signal: AbortSignal.timeout(10000),
    });
    if (odp.ok) {
      console.log(`[newsletter] Brevo przyjęło zapis: HTTP ${odp.status}`);
      return res.status(200).json({ ok: true });
    }

    const tekst = await odp.text().catch(() => '');
    let dane = null;
    try { dane = JSON.parse(tekst); } catch (e) { /* nie JSON */ }
    // Ten adres już jest na liście albo czeka na potwierdzenie: osobie piszemy to samo co przy sukcesie (nie zdradzamy, kto jest zapisany)
    if (odp.status === 400 && /already|duplicate|contact.{0,20}exist/i.test(`${dane && dane.code} ${dane && dane.message}`) && !/template/i.test(String(dane && dane.message))) {
      console.warn(`[newsletter] Brevo: adres już istnieje lub czeka na potwierdzenie (HTTP 400, ${String((dane && `${dane.code} / ${dane.message}`) || '').replace(/\S+@\S+/g, '[adres]').slice(0, 120)}), e-mail nie został wysłany ponownie`);
      return res.status(200).json({ ok: true });
    }
    // do logu tylko kod i komunikat Brevo (bez adresu e-mail i bez klucza)
    throw new Error(`Brevo: HTTP ${odp.status}, ${String((dane && `${dane.code} / ${dane.message}`) || tekst.replace(/\s+/g, ' ').slice(0, 80)).replace(/\S+@\S+/g, '[adres]').slice(0, 160)}`);
  } catch (e) {
    console.error('[newsletter] nie udało się zapisać adresu:', e.message);
    return res.status(502).json({ ok: false, blad: 'Nie udało się zapisać na newsletter. Spróbuj za chwilę albo napisz na kontakt@frajdoplan.pl.' });
  }
}
