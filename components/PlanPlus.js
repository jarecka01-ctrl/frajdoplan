import { akcje, useWPlanie } from '../lib/planStore';

/*
  Przycisk „+" z funkcji „Mój plan" (na kafelkach wydarzeń i kartach miejsc): dodaje pozycję do planu albo ją usuwa.
    typ   — 'wydarzenie' | 'miejsce';  id — stabilne ID z danych;  dzien — 'RRRR-MM-DD' (wydarzenia: termin, miejsca: bez dnia);
    tytul — tylko do opisu dla czytników ekranu.
  Pole dotyku ma min. 44×44 px (wizualnie 34 px). Klik nie uruchamia linku kafelka.
*/
export default function PlanPlus({ typ, id, dzien, tytul }) {
  const poz = { typ, id: id == null ? '' : String(id), dzien };
  const jest = useWPlanie(poz);
  if (!poz.id) return null;
  return (
    <button
      type="button"
      className={`plan-plus${jest ? ' on' : ''}`}
      aria-pressed={jest}
      aria-label={`${jest ? 'Usuń z planu' : 'Dodaj do planu'}: ${tytul}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); akcje.przelacz(poz, tytul); }}
    >
      {jest ? (
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8" /></svg>
      ) : (
        <span aria-hidden="true">+</span>
      )}
    </button>
  );
}
