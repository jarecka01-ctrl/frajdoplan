import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Uklad from '../components/Uklad';
import PlanDni from '../components/PlanWidok';
import { seoStrony } from '../lib/seo';
import { odkodujPlan } from '../lib/linkPlanu';
import { useDanePlanu } from '../lib/danePlanu';
import { usePlan, akcje } from '../lib/planStore';
import { rozwiazPlan, grupujPoDniach, znajdzKolizje, MAKS_POZYCJI } from '../lib/plan';
import { zdarzenie } from '../lib/statystyki';
import { dzisWarszawa, godzinaWarszawa, ladnaData } from '../components/Wydarzenia';

// Plan udostępniony linkiem (/plan?p=…). Strona nie jest indeksowana, nie ma adresu kanonicznego i nie trafia do sitemapy;
// plan siedzi w adresie, a serwer niczego nie zapisuje. Nagłówki noindex i Referrer-Policy: no-referrer ustawia next.config.js.
export async function getStaticProps() {
  const seo = await seoStrony('/plan', {
    tytul: 'Mój plan | Frajdoplan',
    opis: 'Plan wydarzeń i miejsc dla dzieci w Krakowie, udostępniony linkiem.',
    h1: 'Mój plan',
    wstep: '',
  }, 0, { noindex: true });
  return { props: { seo: { ...seo, canonical: '' } }, revalidate: 3600 };
}

const BLEDY = {
  brak: 'Ten adres nie zawiera planu. Poproś osobę, która go wysłała, o nowy link.',
  blad: 'Ten link jest uszkodzony albo niepełny (mógł zostać ucięty przy wysyłaniu). Poproś osobę, która go wysłała, o nowy link.',
  stara: 'Ta przeglądarka jest zbyt stara, żeby otworzyć ten plan. Spróbuj w nowszej przeglądarce.',
};
const dataPelna = (iso) => `${ladnaData(iso)} ${iso.slice(0, 4)}`;

export default function PlanZLinku({ seo }) {
  const [wynik, setWynik] = useState({ etap: 'czytam' }); // czytam | ok | brak | blad | stara
  const [druk, setDruk] = useState(false);
  const [pytanie, setPytanie] = useState(false); // czy pokazać pytanie o wczytanie planu
  const [zrobione, setZrobione] = useState(null); // { dodano, pominieto }
  const wydrukowano = useRef(false);
  const mojPlan = usePlan();
  const { status, dane, ponow } = useDanePlanu();
  const teraz = useMemo(() => ({ dzien: dzisWarszawa(), godzina: godzinaWarszawa() }), []);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setDruk(q.get('druk') === '1');
    odkodujPlan(q.get('p'))
      .then((plan) => setWynik({ etap: 'ok', plan }))
      .catch((e) => setWynik({ etap: e.kod === 'brak' || e.kod === 'stara' ? e.kod : 'blad' }));
  }, []);

  const plan = wynik.etap === 'ok' ? wynik.plan : null;
  const rozwiazane = useMemo(
    () => (plan && dane ? rozwiazPlan(plan.pozycje, dane, teraz, plan.odciski) : []),
    [plan, dane, teraz],
  );
  const grupy = useMemo(() => grupujPoDniach(rozwiazane), [rozwiazane]);
  const kolizje = useMemo(
    () => znajdzKolizje(rozwiazane.filter((r) => r.poz.typ === 'wydarzenie' && (r.status === 'ok' || r.status === 'zmieniono')).map((r) => ({ klucz: r.klucz, dzien: r.dzien, godzina: r.godzina, nazwa: r.tytul }))),
    [rozwiazane],
  );
  const wKolizji = new Set(kolizje.flatMap((k) => [k.a.klucz, k.b.klucz]));
  const gotowy = plan && status === 'ok';

  // Wejście z przycisku „Drukuj / PDF" w panelu planu (?druk=1): okno drukowania otwiera się samo, gdy plan jest gotowy.
  useEffect(() => {
    if (!druk || !gotowy || wydrukowano.current) return undefined;
    wydrukowano.current = true;
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, [druk, gotowy]);

  // Statystyka wydruku: jedno zdarzenie na każde okno drukowania (przycisk, automatyczny druk i Ctrl+P).
  useEffect(() => {
    if (!plan) return undefined;
    const przyDruku = () => zdarzenie('plan_wydruk', { liczba_pozycji: plan.pozycje.length });
    window.addEventListener('beforeprint', przyDruku);
    return () => window.removeEventListener('beforeprint', przyDruku);
  }, [plan]);

  const wczytaj = (tryb) => {
    setZrobione(akcje.zaimportuj(plan, tryb));
    setPytanie(false);
  };
  const maWlasny = mojPlan.pozycje.length > 0;
  const dataUtworzenia = plan && plan.utworzono ? dataPelna(plan.utworzono) : dataPelna(teraz.dzien);

  return (
    <Uklad seo={seo}>
      <article className="plan-strona">
        <img className="plan-druk-logo" src="/brand/nowe/logo-slowo.png" alt="Frajdoplan" width="1528" height="361" />
        {wynik.etap === 'czytam' && <p className="plan-info" role="status">Otwieram plan…</p>}
        {BLEDY[wynik.etap] && (
          <>
            <h1>Nie mogę otworzyć planu</h1>
            <p className="plan-ostrzezenie" role="alert">{BLEDY[wynik.etap]}</p>
            <p><Link href="/" className="plan-link">Przejdź na stronę główną Frajdoplanu</Link></p>
          </>
        )}
        {plan && (
          <>
            <h1>{plan.nazwa}</h1>
            <p className="prawne-data">Plan udostępniony linkiem · wygenerowano {dataUtworzenia}</p>

            <div className="plan-strona-akcje">
              <button type="button" className="plan-przycisk glowny" disabled={!gotowy || !plan.pozycje.length} onClick={() => setPytanie(true)}>Dodaj do mojego planu</button>
              <button type="button" className="plan-przycisk" onClick={() => window.print()}>🖨 Drukuj / PDF</button>
            </div>

            {pytanie && (
              <div className="plan-import" role="alertdialog" aria-label="Wczytanie planu">
                {maWlasny ? (
                  <>
                    <p>Masz już własny plan ({mojPlan.pozycje.length} pozycji). Co zrobić z tym planem ({plan.pozycje.length} pozycji)?</p>
                    <div className="plan-import-przyciski">
                      <button type="button" className="plan-przycisk glowny" onClick={() => wczytaj('polacz')}>Dołącz do mojego planu</button>
                      <button type="button" className="plan-przycisk niebezpieczny" onClick={() => wczytaj('zastap')}>Zastąp mój plan</button>
                      <button type="button" className="plan-przycisk" onClick={() => setPytanie(false)}>Anuluj</button>
                    </div>
                    <small>Maksymalnie {MAKS_POZYCJI} pozycji. „Zastąp” usuwa Twój obecny plan.</small>
                  </>
                ) : (
                  <>
                    <p>Zapisać ten plan ({plan.pozycje.length} pozycji) w Twojej przeglądarce jako „Mój plan”?</p>
                    <div className="plan-import-przyciski">
                      <button type="button" className="plan-przycisk glowny" onClick={() => wczytaj('zastap')}>Tak, zapisz</button>
                      <button type="button" className="plan-przycisk" onClick={() => setPytanie(false)}>Anuluj</button>
                    </div>
                  </>
                )}
              </div>
            )}
            {zrobione && (
              <p className="plan-info" role="status">
                Gotowe: dodano {zrobione.dodano} pozycji{zrobione.pominieto > 0 ? ` (${zrobione.pominieto} pominięto: były już w planie albo plan sięga limitu ${MAKS_POZYCJI})` : ''}.
                Znajdziesz je pod przyciskiem „Mój plan” na dole ekranu.
              </p>
            )}

            {status === 'laduje' && <p className="plan-info" role="status">Ładuję aktualne dane…</p>}
            {status === 'blad' && (
              <p className="plan-info" role="alert">
                Nie udało się pobrać aktualnych danych. <button type="button" className="plan-link" onClick={ponow}>Spróbuj ponownie</button>
              </p>
            )}
            {!plan.pozycje.length && <p className="plan-pusty">Ten plan jest pusty.</p>}
            {gotowy && (
              <>
                {kolizje.length > 0 && (
                  <div className="plan-ostrzezenia">
                    {kolizje.map(({ a, b }) => (
                      <p className="plan-ostrzezenie" key={`${a.klucz}~${b.klucz}`}><b>Nakładają się godziny:</b> „{a.nazwa}” ({a.godzina}) i „{b.nazwa}” ({b.godzina}).</p>
                    ))}
                  </div>
                )}
                <PlanDni grupy={grupy} wKolizji={wKolizji} tryb="odczyt" />
              </>
            )}
            <p className="plan-druk-stopka">Godziny mogły się zmienić, sprawdź u organizatora. Wygenerowano {dataUtworzenia} z frajdoplan.pl</p>
          </>
        )}
      </article>
    </Uklad>
  );
}
