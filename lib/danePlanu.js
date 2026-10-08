// Aktualna treść pozycji planu: jedno ogólne pobranie /api/plan-dane (te same dane dla wszystkich, nic z planu użytkownika nie jest wysyłane).
// Wynik jest trzymany w pamięci do odświeżenia strony; błąd pobierania pozwala ponowić próbę.
import { useCallback, useEffect, useState } from 'react';

let obietnica = null;

function indeksuj(d) {
  return {
    wydarzenia: new Map((d.wydarzenia || []).map((w) => [String(w.id), w])),
    miejsca: new Map((d.miejsca || []).map((m) => [String(m.id), m])),
  };
}

function pobierz() {
  if (!obietnica) {
    obietnica = fetch('/api/plan-dane', { cache: 'no-cache' })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(indeksuj)
      .catch((e) => { obietnica = null; throw e; });
  }
  return obietnica;
}

// { status: 'laduje' | 'ok' | 'blad', dane, ponow }
export function useDanePlanu() {
  const [wynik, setWynik] = useState({ status: 'laduje', dane: null });
  const wczytaj = useCallback(() => {
    setWynik({ status: 'laduje', dane: null });
    pobierz().then((dane) => setWynik({ status: 'ok', dane })).catch(() => setWynik({ status: 'blad', dane: null }));
  }, []);
  useEffect(() => { wczytaj(); }, [wczytaj]);
  return { ...wynik, ponow: wczytaj };
}
