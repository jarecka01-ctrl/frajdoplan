import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { akcje, usePlan } from '../lib/planStore';
import { useDanePlanu } from '../lib/danePlanu';
import { zbudujLinkPlanu, MAKS_DLUGOSC_LINKU } from '../lib/linkPlanu';
import { planDoIcs, opisPominietych } from '../lib/ics';
import { zdarzenie } from '../lib/statystyki';
import { slugZ } from '../lib/kategorie';
import { useOknoDialogowe } from '../lib/oknoDialogowe';
import {
  MAKS_NAZWA, MAKS_POZYCJI, DOMYSLNA_NAZWA, rozwiazPlan, grupujPoDniach, znajdzKolizje, odciskPozycji,
} from '../lib/plan';
import { dzisWarszawa, godzinaWarszawa } from './Wydarzenia';
import PlanDni, { naglowekDnia } from './PlanWidok';

// Kopiowanie do schowka z zapasowym sposobem (starsze przeglądarki, brak zgody na schowek).
async function skopiuj(tekst, poleZapasowe) {
  try {
    await navigator.clipboard.writeText(tekst);
    return true;
  } catch (e) {
    try {
      poleZapasowe?.select();
      return document.execCommand('copy');
    } catch (e2) { return false; }
  }
}

export default function PlanPanel({ onZamknij }) {
  const plan = usePlan();
  const oknoRef = useRef(null);
  const poleLinku = useRef(null);
  const [czyszczenie, setCzyszczenie] = useState(false);
  const [link, setLink] = useState(null); // { url, dlugosc, zaDlugi }
  const [mozeUdostepnic, setMozeUdostepnic] = useState(false); // systemowe udostępnianie (telefony, część komputerów)
  const [kalendarz, setKalendarz] = useState(''); // podsumowanie po pobraniu pliku .ics
  const { status, dane, ponow } = useDanePlanu();
  const teraz = useMemo(() => ({ dzien: dzisWarszawa(), godzina: godzinaWarszawa() }), []);
  useOknoDialogowe(oknoRef, onZamknij);
  useEffect(() => { setMozeUdostepnic(typeof navigator.share === 'function'); }, []);

  const rozwiazane = useMemo(
    () => (dane ? rozwiazPlan(plan.pozycje, dane, teraz) : []),
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

  // Link do udostępniania: w adresie jest cały plan (identyfikatory, dni, nazwa) i odciski treści, serwer niczego nie zapisuje.
  useEffect(() => {
    if (status !== 'ok' || pusty) { setLink(null); return undefined; }
    let aktualny = true;
    const odciski = Object.fromEntries(rozwiazane.filter((r) => r.status === 'ok' || r.status === 'odbylo').map((r) => [r.klucz, odciskPozycji(r)]));
    zbudujLinkPlanu(window.location.origin, { nazwa: plan.nazwa, pozycje: plan.pozycje }, odciski, teraz.dzien)
      .then((l) => { if (aktualny) setLink(l); })
      .catch(() => { if (aktualny) setLink(null); });
    return () => { aktualny = false; };
  }, [status, pusty, rozwiazane, plan.nazwa, plan.pozycje, teraz.dzien]);

  const kopiujLink = async () => {
    if (!link || link.zaDlugi) return;
    const udalo = await skopiuj(link.url, poleLinku.current);
    if (udalo) zdarzenie('plan_link_skopiowany', { liczba_pozycji: plan.pozycje.length });
    akcje.komunikat(udalo ? 'Link do planu skopiowany' : 'Nie udało się skopiować. Zaznacz link i skopiuj go ręcznie.');
  };

  // Systemowe okno udostępniania (WhatsApp, SMS, Messenger…); anulowanie przez użytkownika nic nie zmienia, inny błąd = kopiujemy link.
  const udostepnij = async () => {
    if (!link || link.zaDlugi) return;
    try {
      await navigator.share({ title: plan.nazwa, text: `${plan.nazwa}: plan z Frajdoplanu`, url: link.url });
      zdarzenie('plan_udostepniono', { liczba_pozycji: plan.pozycje.length });
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      await kopiujLink();
    }
  };

  // Plik .ics budowany w przeglądarce; miejsca bez dnia i wydarzenia, które się odbyły albo są niedostępne, pomijamy i mówimy o tym.
  const doKalendarza = () => {
    const wynik = planDoIcs(plan.nazwa, rozwiazane, window.location.origin);
    const pominiete = opisPominietych(wynik.pominieto);
    if (!wynik.dodano) {
      setKalendarz(`Nie ma czego dodać do kalendarza.${pominiete ? ` Pominięto: ${pominiete}.` : ''} Miejsca trzeba najpierw przypisać do dnia.`);
      return;
    }
    const adres = URL.createObjectURL(new Blob([wynik.ics], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = adres;
    a.download = `${slugZ(plan.nazwa) || 'moj-plan'}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(adres), 10000);
    zdarzenie('plan_kalendarz', { liczba_pozycji: wynik.dodano });
    setKalendarz(`Pobrano plik kalendarza: ${wynik.dodano} pozycji.${pominiete ? ` Pominięto: ${pominiete}.` : ''}`);
  };

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

        {status === 'ok' && !pusty && <PlanDni grupy={grupy} wKolizji={wKolizji} tryb="edycja" zamknij={onZamknij} />}

        {!pusty && status === 'ok' && (
          <div className="plan-akcje">
            {mozeUdostepnic ? (
              <>
                <button type="button" className="plan-przycisk glowny" disabled={!link || link.zaDlugi} onClick={udostepnij}>📤 Wyślij</button>
                <button type="button" className="plan-przycisk" disabled={!link || link.zaDlugi} onClick={kopiujLink}>🔗 Skopiuj link</button>
              </>
            ) : (
              <button type="button" className="plan-przycisk glowny" disabled={!link || link.zaDlugi} onClick={kopiujLink}>🔗 Skopiuj link i wyślij</button>
            )}
            <button type="button" className="plan-przycisk" onClick={doKalendarza}>📅 Do kalendarza</button>
            <a
              className={`plan-przycisk${!link || link.zaDlugi ? ' wylaczony' : ''}`}
              href={link && !link.zaDlugi ? `${link.url}&druk=1` : undefined}
              target="_blank"
              rel="noopener"
              aria-disabled={!link || link.zaDlugi}
              role={!link || link.zaDlugi ? 'link' : undefined}
              tabIndex={!link || link.zaDlugi ? -1 : undefined}
            >
              🖨 Drukuj / PDF
            </a>
            {kalendarz && <p className="plan-info" role="status">{kalendarz}</p>}
            {link && link.zaDlugi && (
              <p className="plan-ostrzezenie" role="alert">
                Plan jest za długi na link ({link.dlugosc} znaków, bezpieczny limit to {MAKS_DLUGOSC_LINKU}). Usuń kilka pozycji i spróbuj ponownie.
              </p>
            )}
            {link && !link.zaDlugi && (
              <label className="plan-link-etykieta">
                <span>Link do planu</span>
                <input ref={poleLinku} className="plan-link-pole" readOnly value={link.url} onFocus={(e) => e.target.select()} />
              </label>
            )}
          </div>
        )}

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
          Plan zapisuje się tylko w tej przeglądarce, na tym urządzeniu (maks. {MAKS_POZYCJI} pozycji). Link zawiera wybrane pozycje, a serwis ich nie zapisuje.
          Godziny mogły się zmienić, przed wyjściem sprawdź u organizatora.
        </p>
      </div>
    </>,
    document.body,
  );
}
