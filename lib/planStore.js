// „Mój plan": magazyn w przeglądarce. Plan żyje tylko w localStorage użytkownika (klucz KLUCZ_PLANU): bez konta, bez wysyłania na serwer.
// Bezpieczny przy renderowaniu po stronie serwera: do czasu `inicjuj()` (wołanego po zamontowaniu w przeglądarce) plan jest pusty,
// więc HTML z serwera i pierwszy render w przeglądarce są takie same (bez błędów hydracji).
// Przycisk „+" subskrybuje tylko własną pozycję (useWPlanie), więc zmiana planu nie przerysowuje setek kafelków na liście.
import { useSyncExternalStore } from 'react';
import { zdarzenie } from './statystyki';
import {
  KLUCZ_PLANU, MAKS_POZYCJI, MAKS_NAZWA, DOMYSLNA_NAZWA, kluczPozycji, oczyscPlan, planPusty,
} from './plan';

const zbuduj = (plan, reszta) => ({ ...plan, klucze: new Set(plan.pozycje.map(kluczPozycji)), ...reszta });
const STAN_SERWERA = zbuduj(oczyscPlan(null), { zamontowany: false, trwaly: true });
const KOMUNIKAT_SERWERA = { tekst: '', nr: 0 };

let stan = STAN_SERWERA;
let komunikat = KOMUNIKAT_SERWERA;
const sluchacze = new Set();
const powiadom = () => sluchacze.forEach((f) => f());
const subskrybuj = (f) => { sluchacze.add(f); return () => sluchacze.delete(f); };

// localStorage bywa niedostępny (tryb prywatny, zablokowane dane witryn): każdy dostęp w try/catch.
function dostepny() {
  try {
    const t = '__frajdoplan_test__';
    window.localStorage.setItem(t, '1');
    window.localStorage.removeItem(t);
    return true;
  } catch (e) { return false; }
}
function czytajZapis() {
  try {
    const t = window.localStorage.getItem(KLUCZ_PLANU);
    return t ? JSON.parse(t) : null;
  } catch (e) { return null; } // uszkodzony zapis traktujemy jak brak
}
function zapisz() {
  const plan = { nazwa: stan.nazwa, pozycje: stan.pozycje };
  try {
    if (planPusty(plan)) window.localStorage.removeItem(KLUCZ_PLANU);
    else window.localStorage.setItem(KLUCZ_PLANU, JSON.stringify({ v: 1, ...plan }));
    if (!stan.trwaly) stan = { ...stan, trwaly: true };
  } catch (e) {
    // plan działa dalej w pamięci na czas sesji, a panel pokazuje, że nie zostanie zapamiętany
    if (stan.trwaly) stan = { ...stan, trwaly: false };
  }
}

function ustaw(czesc) {
  stan = zbuduj({ nazwa: stan.nazwa, pozycje: stan.pozycje, ...czesc }, { zamontowany: true, trwaly: stan.trwaly });
  zapisz();
  powiadom();
}

function powiedz(tekst) {
  komunikat = { tekst, nr: komunikat.nr + 1 };
  powiadom();
}

let zainicjowany = false;
function przeladujZZapisu() {
  stan = zbuduj(oczyscPlan(czytajZapis()), { zamontowany: true, trwaly: stan.trwaly });
  powiadom();
}
// Zmiana planu w innej karcie przeglądarki (zdarzenie `storage` nie odpala w karcie, która zapisała).
function przyZdarzeniuStorage(e) {
  if (e.key !== null && e.key !== KLUCZ_PLANU) return; // key === null: ktoś wyczyścił cały localStorage
  przeladujZZapisu();
}

// Wołać raz, po zamontowaniu w przeglądarce.
export function inicjuj() {
  if (zainicjowany || typeof window === 'undefined') return;
  zainicjowany = true;
  const ok = dostepny();
  stan = zbuduj(oczyscPlan(ok ? czytajZapis() : null), { zamontowany: true, trwaly: ok });
  window.addEventListener('storage', przyZdarzeniuStorage);
  powiadom();
}

export const akcje = {
  // `poz`: { typ, id, dzien?, godz? }; `tytul` tylko do komunikatu dla czytnika ekranu.
  dodaj(poz, tytul = '') {
    const klucz = kluczPozycji(poz);
    if (stan.klucze.has(klucz)) return;
    if (stan.pozycje.length >= MAKS_POZYCJI) {
      powiedz(`Plan ma już ${MAKS_POZYCJI} pozycji. Usuń którąś, żeby dodać kolejną.`);
      return;
    }
    const nowa = { typ: poz.typ, id: String(poz.id) };
    if (poz.dzien) nowa.dzien = poz.dzien;
    if (poz.godz) nowa.godz = poz.godz;
    ustaw({ pozycje: [...stan.pozycje, nowa] });
    zdarzenie('plan_dodano', { typ: nowa.typ });
    powiedz(`Dodano do planu: ${tytul || 'pozycję'}`);
  },
  usun(klucz, tytul = '') {
    if (!stan.klucze.has(klucz)) return;
    const usuwana = stan.pozycje.find((p) => kluczPozycji(p) === klucz);
    ustaw({ pozycje: stan.pozycje.filter((p) => kluczPozycji(p) !== klucz) });
    zdarzenie('plan_usunieto', { typ: usuwana.typ });
    powiedz(`Usunięto z planu: ${tytul || 'pozycję'}`);
  },
  przelacz(poz, tytul = '') {
    if (stan.klucze.has(kluczPozycji(poz))) akcje.usun(kluczPozycji(poz), tytul);
    else akcje.dodaj(poz, tytul);
  },
  wyczysc() {
    ustaw({ nazwa: DOMYSLNA_NAZWA, pozycje: [] });
    powiedz('Plan został wyczyszczony');
  },
  // Dzień pozycji-miejsca (puste = „Kiedy chcesz"). Wydarzenia mają dzień na stałe (to ich termin).
  ustawDzien(klucz, dzien) {
    ustaw({ pozycje: stan.pozycje.map((p) => {
      if (kluczPozycji(p) !== klucz || p.typ !== 'miejsce') return p;
      const { dzien: _stary, ...reszta } = p;
      return dzien ? { ...reszta, dzien } : reszta;
    }) });
  },
  ustawNazwe(nazwa) { ustaw({ nazwa: String(nazwa).slice(0, MAKS_NAZWA) }); },
  // Krótki komunikat dla czytnika ekranu i widoczny dymek (np. „Link skopiowany").
  komunikat(tekst) { powiedz(tekst); },
  // Wczytanie planu z udostępnionego linku. tryb: 'zastap' (zamienia cały plan) albo 'polacz' (dokłada brakujące do limitu, nazwa zostaje).
  // Zwraca { dodano, pominieto } (pominięte = nie zmieściły się w limicie albo już były).
  zaimportuj(obcy, tryb) {
    if (tryb === 'zastap') {
      ustaw({ nazwa: obcy.nazwa, pozycje: obcy.pozycje.slice(0, MAKS_POZYCJI) });
      const dodano = Math.min(obcy.pozycje.length, MAKS_POZYCJI);
      powiedz(`Wczytano plan: ${dodano} pozycji`);
      return { dodano, pominieto: obcy.pozycje.length - dodano };
    }
    const nowe = obcy.pozycje.filter((p) => !stan.klucze.has(kluczPozycji(p))).slice(0, Math.max(0, MAKS_POZYCJI - stan.pozycje.length));
    if (nowe.length) ustaw({ pozycje: [...stan.pozycje, ...nowe] });
    powiedz(`Dodano do Twojego planu: ${nowe.length} pozycji`);
    return { dodano: nowe.length, pominieto: obcy.pozycje.length - nowe.length };
  },
};

export const usePlan = () => useSyncExternalStore(subskrybuj, () => stan, () => STAN_SERWERA);
export const useKomunikat = () => useSyncExternalStore(subskrybuj, () => komunikat, () => KOMUNIKAT_SERWERA);
// Czy ta pozycja jest w planie (renderuje się ponownie tylko, gdy zmieni się ta jedna wartość).
export const useWPlanie = (poz) => {
  const klucz = kluczPozycji(poz);
  return useSyncExternalStore(subskrybuj, () => stan.klucze.has(klucz), () => false);
};
