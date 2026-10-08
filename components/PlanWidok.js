import Link from 'next/link';
import { akcje } from '../lib/planStore';
import { dzisWarszawa, NAZWY_DNI, ladnaData, dzienTygodnia } from './Wydarzenia';

/*
  Pozycje planu pogrupowane po dniach — wspólny widok panelu planu i strony /plan.
    tryb 'edycja' — panel: przycisk usunięcia przy każdej pozycji i wybór dnia dla miejsc;
    tryb 'odczyt' — strona /plan (plan z linku): bez edycji, miejsce z dniem pokazuje dzień tekstem.
*/
const godzinyLinie = (g) => String(g || '').split(/\s*[,;]\s*/).filter(Boolean);
export const naglowekDnia = (iso) => `${NAZWY_DNI[dzienTygodnia(iso)]}, ${ladnaData(iso)}`;

const STANY = { odbylo: 'już się odbyło', niedostepne: 'już niedostępne', zmieniono: 'zmieniono: sprawdź godzinę i miejsce u organizatora' };

function Pozycja({ r, kolizja, tryb, zamknij }) {
  const miejsce = r.poz.typ === 'miejsce';
  const stan = r.status === 'ok' ? '' : ` ${r.status}`;
  const tytul = r.href ? (
    r.href.startsWith('/')
      ? <Link href={r.href} onClick={zamknij}>{r.tytul}</Link>
      : <a href={r.href} target="_blank" rel="noreferrer">{r.tytul}</a>
  ) : r.tytul;
  return (
    <li className={`plan-poz${stan}${kolizja ? ' kol' : ''}${tryb === 'odczyt' ? ' odczyt' : ''}`}>
      <div className="plan-h">
        {miejsce ? <span className="plan-h-miejsce">miejsce</span>
          : r.status === 'niedostepne' ? <span className="plan-h-miejsce">—</span>
            : godzinyLinie(r.godzina).length ? godzinyLinie(r.godzina).map((g) => <b key={g}>{g}</b>)
              : <span className="plan-h-miejsce">cały dzień</span>}
      </div>
      <div className="plan-tr">
        <p className="plan-t">{tytul}</p>
        <small>{[miejsce ? r.rodzaj : r.miejsce, r.adres, r.wiek, r.cena].filter(Boolean).join(' · ')}</small>
        {STANY[r.status] && <small className="plan-stan">{STANY[r.status]}</small>}
        {miejsce && r.status === 'ok' && tryb === 'edycja' && (
          <label className="plan-dzien">
            <span>Dzień:</span>
            <input
              type="date"
              value={r.poz.dzien || ''}
              min={dzisWarszawa()}
              onChange={(e) => akcje.ustawDzien(r.klucz, e.target.value)}
              aria-label={`Dzień wizyty: ${r.tytul}`}
            />
          </label>
        )}
      </div>
      {tryb === 'edycja' && (
        <button type="button" className="plan-usun" aria-label={`Usuń z planu: ${r.tytul}`} onClick={() => { akcje.usun(r.klucz, r.tytul); (r.takze || []).forEach((k) => akcje.usun(k, r.tytul)); }}>
          <span aria-hidden="true">×</span>
        </button>
      )}
    </li>
  );
}

// `grupy`: wynik grupujPoDniach; `wKolizji`: zbiór kluczy pozycji z nakładającymi się godzinami.
export default function PlanDni({ grupy, wKolizji = new Set(), tryb = 'edycja', zamknij }) {
  const lista = (pozycje) => (
    <ul className="plan-lista">
      {pozycje.map((r) => <Pozycja key={r.klucz} r={r} kolizja={wKolizji.has(r.klucz)} tryb={tryb} zamknij={zamknij} />)}
    </ul>
  );
  return (
    <>
      {grupy.dni.map(({ dzien, pozycje }) => (
        <section key={dzien} aria-label={naglowekDnia(dzien)}>
          <h3 className="plan-dzien-naglowek">{naglowekDnia(dzien)}</h3>
          {lista(pozycje)}
        </section>
      ))}
      {grupy.bezDnia.length > 0 && (
        <section aria-label="Kiedy chcesz">
          <h3 className="plan-dzien-naglowek">Kiedy chcesz</h3>
          {tryb === 'edycja' && <p className="plan-podpis">Miejsca bez dnia. Wybierz datę, jeśli chcesz je zaplanować na konkretny dzień.</p>}
          {lista(grupy.bezDnia)}
        </section>
      )}
    </>
  );
}
