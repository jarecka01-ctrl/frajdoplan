// Statystyki funkcji „Mój plan" przez Vercel Analytics: tylko samo zdarzenie, typ pozycji i liczba pozycji.
// Bez nazwy planu, ID, dni i treści planu, czyli bez żadnych danych osobowych.
// Niestandardowe zdarzenia są w Vercelu płatną funkcją (plan Pro lub wyższy), więc ta cienka funkcja domyślnie NIC NIE ROBI.
// Włączenie: zmienna środowiskowa NEXT_PUBLIC_STATYSTYKI_ZDARZEN=1 (Vercel → Settings → Environment Variables, potem nowe wdrożenie).
import { track } from '@vercel/analytics';

export const ZDARZENIA_WLACZONE = process.env.NEXT_PUBLIC_STATYSTYKI_ZDARZEN === '1';

// nazwa: 'plan_dodano' | 'plan_usunieto' | 'plan_link_skopiowany' | 'plan_udostepniono' | 'plan_wydruk' | 'plan_kalendarz'
// dane: tylko { typ: 'wydarzenie' | 'miejsce' } i/lub { liczba_pozycji: number }
export function zdarzenie(nazwa, dane) {
  if (!ZDARZENIA_WLACZONE || typeof window === 'undefined') return;
  try { track(nazwa, dane); } catch (e) { /* statystyki nigdy nie mogą psuć działania strony */ }
}
