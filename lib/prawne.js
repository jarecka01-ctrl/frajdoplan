// Wspólne dane stron prawnych. Dane osobowe administratora NIE są wpisane w kodzie: imię i nazwisko pochodzi
// ze zmiennej środowiskowej NEXT_PUBLIC_ADMIN_NAME (Vercel → Settings → Environment Variables; po zmianie trzeba nowego wdrożenia).
export const KONTAKT_EMAIL = 'kontakt@frajdoplan.pl';
export const NAZWA_ADMINISTRATORA = (process.env.NEXT_PUBLIC_ADMIN_NAME || '').trim();
