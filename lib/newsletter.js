// Wspólne dla formularza zapisu na newsletter (przeglądarka) i /api/newsletter (serwer).
export const MAKS_EMAIL = 254;

export function czystyEmail(v) {
  return String(v || '').trim().toLowerCase();
}

// Łagodne sprawdzenie: jedno „@", coś przed i po, kropka w domenie, bez spacji. Prawdziwy test to link potwierdzający wysłany e-mailem.
export function sprawdzEmail(v) {
  const e = czystyEmail(v);
  if (!e) return 'Wpisz adres e-mail.';
  if (e.length > MAKS_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return 'Ten adres e-mail wygląda na niepoprawny. Sprawdź, czy nie ma literówki.';
  return '';
}
