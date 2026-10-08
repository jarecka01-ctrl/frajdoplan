import { akcje, useWPlanie } from '../lib/planStore';

/*
  Przycisk „+" z funkcji „Mój plan" (na kafelkach wydarzeń i kartach miejsc): dodaje pozycję do planu albo ją usuwa.
    typ   — 'wydarzenie' | 'miejsce';  id — stabilne ID z danych;  dzien — 'RRRR-MM-DD' (wydarzenia: termin, miejsca: bez dnia);
    godz  — wybrana godzina, gdy jedno wydarzenie ma ich kilka w jednej komórce arkusza;  tytul — tylko do opisu dla czytników ekranu.
  Pole dotyku ma min. 44×44 px (wizualnie 34 px). Klik nie uruchamia linku kafelka.
*/
export default function PlanPlus({ typ, id, dzien, godz, tytul }) {
  const poz = { typ, id: id == null ? '' : String(id), dzien, godz };
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

// Bilet z kilkoma godzinami: osobny przycisk „+" przy każdej godzinie (pozycja planu = jedna godzina).
// `godziny`: [{ godzina: '10:00', id, godz? }]; id to ID wydarzenia tej godziny (albo wspólne, wtedy z `godz`).
function Pastylka({ id, dzien, godz, godzina, tytul }) {
  const poz = { typ: 'wydarzenie', id: String(id), dzien, godz };
  const jest = useWPlanie(poz);
  return (
    <button
      type="button"
      className={`plan-godzina${jest ? ' on' : ''}`}
      aria-pressed={jest}
      aria-label={`${jest ? 'Usuń z planu' : 'Dodaj do planu'}: ${tytul}, ${godzina}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); akcje.przelacz(poz, `${tytul}, ${godzina}`); }}
    >
      <span aria-hidden="true">{jest ? '✓' : '+'} {godzina}</span>
    </button>
  );
}

export function PlanGodziny({ godziny, dzien, tytul }) {
  return (
    <span className="plan-godziny" role="group" aria-label={`Dodaj do planu wybraną godzinę: ${tytul}`}>
      {godziny.map((g) => <Pastylka key={`${g.id}-${g.godz || g.godzina}`} id={g.id} dzien={dzien} godz={g.godz} godzina={g.godzina} tytul={tytul} />)}
    </span>
  );
}
