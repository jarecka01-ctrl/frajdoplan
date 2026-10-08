import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { akcje, usePlan } from '../lib/planStore';
import { useDanePlanu } from '../lib/danePlanu';
import {
  MAKS_NOTATKA, MAKS_NAZWA, MAKS_POZYCJI, DOMYSLNA_NAZWA, kluczPozycji, rozwiazPozycje, grupujPoDniach, znajdzKolizje,
} from '../lib/plan';
import { NAZWY_DNI, ladnaData, dzienTygodnia, dzisWarszawa, godzinaWarszawa } from './Wydarzenia';

const NA_FOKUS = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
const godzinyLinie = (g) => String(g || '').split(/\s*[,;]\s*/).filter(Boolean);
const naglowekDnia = (iso) => `${NAZWY_DNI[dzienTygodnia(iso)]}, ${ladnaData(iso)}`;

// Okno dialogowe: pułapka fokusu, Esc, blokada przewijania tła, powrót fokusu do przycisku, który je otworzył.
function useOknoDialogowe(ref, onZamknij) {
  useEffect(() => {
    const poprzedni = document.activeElement;
    const korzen = document.getElementById('__next');
    const body = document.body;
    const stare = { overflow: body.style.overflow, padding: body.style.paddingRight };
    const szerokoscPaska = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (szerokoscPaska > 0) body.style.paddingRight = `${szerokoscPaska}px`; // bez „skoku" strony po zniknięciu paska przewijania
    if (korzen) { korzen.setAttribute('inert', ''); korzen.setAttribute('aria-hidden', 'true'); } // reszta strony niedostępna dla fokusu i czytników
    ref.current?.focus();
    const przyKlawiszu = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onZamknij(); return; }
      if (e.key !== 'Tab' || !ref.current) return;
      const elementy = [...ref.current.querySelectorAll(NA_FOKUS)].filter((el) => el.offsetParent !== null);
      if (!elementy.length) { e.preventDefault(); return; }
      const pierwszy = elementy[0];
      const ostatni = elementy[elementy.length - 1];
      const aktywny = document.activeElement;
      if (e.shiftKey && (aktywny === pierwszy || aktywny === ref.current)) { e.preventDefault(); ostatni.focus(); }
      else if (!e.shiftKey && aktywny === ostatni) { e.preventDefault(); pierwszy.focus(); }
    };
    document.addEventListener('keydown', przyKlawiszu);
    return () => {
      document.removeEventListener('keydown', przyKlawiszu);
      body.style.overflow = stare.overflow;
      body.style.paddingRight = stare.padding;
      if (korzen) { korzen.removeAttribute('inert'); korzen.removeAttribute('aria-hidden'); }
      if (poprzedni && document.contains(poprzedni) && poprzedni.focus) poprzedni.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function Pozycja({ r, kolizja, zamknij }) {
  const miejsce = r.poz.typ === 'miejsce';
  const stan = r.status === 'niedostepne' ? ' niedostepne' : r.status === 'odbylo' ? ' odbylo' : '';
  const tytul = r.href ? (
    r.href.startsWith('/')
      ? <Link href={r.href} onClick={zamknij}>{r.tytul}</Link>
      : <a href={r.href} target="_blank" rel="noreferrer">{r.tytul}</a>
  ) : r.tytul;
  return (
    <li className={`plan-poz${stan}${kolizja ? ' kol' : ''}`}>
      <div className="plan-h">
        {miejsce ? <span className="plan-h-miejsce">miejsce</span>
          : r.status === 'niedostepne' ? <span className="plan-h-miejsce">—</span>
            : godzinyLinie(r.godzina).length ? godzinyLinie(r.godzina).map((g) => <b key={g}>{g}</b>)
              : <span className="plan-h-miejsce">cały dzień</span>}
      </div>
      <div className="plan-tr">
        <p className="plan-t">{tytul}</p>
        <small>{[miejsce ? r.rodzaj : r.miejsce, miejsce ? r.adres : null, r.wiek, r.cena].filter(Boolean).join(' · ')}</small>
        {r.status === 'odbylo' && <small className="plan-stan">już się odbyło</small>}
        {r.status === 'niedostepne' && <small className="plan-stan">już niedostępne</small>}
        {miejsce && r.status === 'ok' && (
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
      <button type="button" className="plan-usun" aria-label={`Usuń z planu: ${r.tytul}`} onClick={() => akcje.usun(r.klucz, r.tytul)}>
        <span aria-hidden="true">×</span>
      </button>
    </li>
  );
}

export default function PlanPanel({ onZamknij }) {
  const plan = usePlan();
  const oknoRef = useRef(null);
  const [czyszczenie, setCzyszczenie] = useState(false);
  const { status, dane, ponow } = useDanePlanu();
  const teraz = useMemo(() => ({ dzien: dzisWarszawa(), godzina: godzinaWarszawa() }), []);
  useOknoDialogowe(oknoRef, onZamknij);

  const rozwiazane = useMemo(
    () => (dane ? plan.pozycje.map((p) => rozwiazPozycje(p, dane, teraz)) : []),
    [plan.pozycje, dane, teraz],
  );
  const grupy = useMemo(() => grupujPoDniach(rozwiazane), [rozwiazane]);
  // kolizje tylko między wydarzeniami, które jeszcze przed nami, i tylko w obrębie jednego dnia
  const kolizje = useMemo(
    () => znajdzKolizje(rozwiazane.filter((r) => r.poz.typ === 'wydarzenie' && r.status === 'ok').map((r) => ({ klucz: r.klucz, dzien: r.dzien, godzina: r.godzina, nazwa: r.tytul }))),
    [rozwiazane],
  );
  const wKolizji = new Set(kolizje.flatMap((k) => [k.a.klucz, k.b.klucz]));
  const pusty = plan.pozycje.length === 0;

  const rysujPozycje = (lista) => (
    <ul className="plan-lista">
      {lista.map((r) => <Pozycja key={r.klucz} r={r} kolizja={wKolizji.has(r.klucz)} zamknij={onZamknij} />)}
    </ul>
  );

  return createPortal(
    <>
      <div className="plan-tlo" onClick={onZamknij} aria-hidden="true" />
      <div ref={oknoRef} className="plan-okno" role="dialog" aria-modal="true" aria-labelledby="plan-tytul" tabIndex={-1}>
        <div className="plan-uchwyt" aria-hidden="true" />
        <div className="plan-gora">
          <h2 id="plan-tytul">Mój plan</h2>
          <button type="button" className="plan-zamknij" aria-label="Zamknij plan" onClick={onZamknij}><span aria-hidden="true">✕</span></button>
        </div>
        <input
          className="plan-nazwa"
          value={plan.nazwa}
          maxLength={MAKS_NAZWA}
          aria-label="Nazwa planu"
          onChange={(e) => akcje.ustawNazwe(e.target.value)}
          onBlur={(e) => { if (!e.target.value.trim()) akcje.ustawNazwe(DOMYSLNA_NAZWA); }}
        />
        {!plan.trwaly && <p className="plan-info">Przeglądarka nie pozwala zapisać planu, więc zniknie po zamknięciu karty.</p>}

        {kolizje.length > 0 && (
          <div className="plan-ostrzezenia" role="status">
            {kolizje.map(({ a, b }) => (
              <p className="plan-ostrzezenie" key={`${a.klucz}~${b.klucz}`}>
                <b>Nakładają się godziny:</b> „{a.nazwa}” ({a.godzina}) i „{b.nazwa}” ({b.godzina}) w dniu: {naglowekDnia(a.dzien)}. Wybierz jedno albo dojedź na część.
              </p>
            ))}
          </div>
        )}

        {pusty && <p className="plan-pusty">Plan jest pusty. Dodawaj wydarzenia i miejsca przyciskiem „+” na kafelkach.</p>}
        {!pusty && status === 'laduje' && <p className="plan-info" role="status">Ładuję aktualne dane…</p>}
        {!pusty && status === 'blad' && (
          <p className="plan-info" role="alert">
            Nie udało się pobrać aktualnych danych planu. <button type="button" className="plan-link" onClick={ponow}>Spróbuj ponownie</button>
          </p>
        )}

        {status === 'ok' && !pusty && (
          <>
            {grupy.dni.map(({ dzien, pozycje }) => (
              <section key={dzien} aria-label={naglowekDnia(dzien)}>
                <h3 className="plan-dzien-naglowek">{naglowekDnia(dzien)}</h3>
                {rysujPozycje(pozycje)}
              </section>
            ))}
            {grupy.bezDnia.length > 0 && (
              <section aria-label="Kiedy chcesz">
                <h3 className="plan-dzien-naglowek">Kiedy chcesz</h3>
                <p className="plan-podpis">Miejsca bez dnia. Wybierz datę, jeśli chcesz je zaplanować na konkretny dzień.</p>
                {rysujPozycje(grupy.bezDnia)}
              </section>
            )}
          </>
        )}

        <label className="plan-notatka-etykieta" htmlFor="plan-notatka">Notatka do planu</label>
        <textarea
          id="plan-notatka"
          className="plan-notatka"
          value={plan.notatka}
          maxLength={MAKS_NOTATKA}
          placeholder="Np. zabrać zmianę ubrań i skarpetki antypoślizgowe"
          onChange={(e) => akcje.ustawNotatke(e.target.value)}
        />
        <p className="plan-licznik" aria-hidden="true">{plan.notatka.length}/{MAKS_NOTATKA}</p>

        <div className="plan-stopka">
          {!pusty && (czyszczenie ? (
            <div className="plan-potwierdz" role="alertdialog" aria-label="Potwierdź wyczyszczenie planu">
              <span>Usunąć cały plan?</span>
              <button type="button" className="plan-przycisk niebezpieczny" onClick={() => { akcje.wyczysc(); setCzyszczenie(false); }}>Tak, wyczyść</button>
              <button type="button" className="plan-przycisk" onClick={() => setCzyszczenie(false)}>Anuluj</button>
            </div>
          ) : (
            <button type="button" className="plan-przycisk" onClick={() => setCzyszczenie(true)}>Wyczyść plan</button>
          ))}
        </div>
        <p className="plan-uwaga">
          Plan zapisuje się tylko w tej przeglądarce, na tym urządzeniu (maks. {MAKS_POZYCJI} pozycji). Godziny mogły się zmienić, przed wyjściem sprawdź u organizatora.
        </p>
      </div>
    </>,
    document.body,
  );
}
