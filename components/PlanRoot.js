import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { inicjuj, usePlan, useKomunikat } from '../lib/planStore';

// Panel ładuje się i renderuje dopiero po otwarciu (nie spowalnia list wydarzeń).
const PlanPanel = dynamic(() => import('./PlanPanel'), { ssr: false });

/*
  Stały element strony dla „Mojego planu": uruchamia magazyn po zamontowaniu, pokazuje pasek „Mój plan (N) · Zobacz i wyślij"
  (tylko gdy plan ma pozycję), krótkie komunikaty (dla czytników ekranu przez aria-live) i otwiera panel.
*/
export default function PlanRoot() {
  const plan = usePlan();
  const kom = useKomunikat();
  const [otwarty, setOtwarty] = useState(false);
  const [toast, setToast] = useState(false);
  const przycisk = useRef(null);
  const liczba = plan.pozycje.length;
  const pasek = plan.zamontowany && liczba > 0;

  useEffect(() => { inicjuj(); }, []);

  // dolny odstęp, żeby pasek nie zasłaniał treści ani stopki
  useEffect(() => {
    document.body.classList.toggle('ma-pasek-planu', pasek);
    return () => document.body.classList.remove('ma-pasek-planu');
  }, [pasek]);

  // krótki widoczny komunikat (czytnik ekranu dostaje ten sam tekst z regionu aria-live)
  useEffect(() => {
    if (!kom.tekst) return undefined;
    setToast(true);
    const t = setTimeout(() => setToast(false), 2600);
    return () => clearTimeout(t);
  }, [kom.nr, kom.tekst]);

  return (
    <>
      <div className="sr-only" role="status" aria-live="polite">{kom.tekst}{kom.nr % 2 ? ' ' : ''}</div>
      {toast && kom.tekst && <div className="plan-toast" aria-hidden="true">{kom.tekst}</div>}
      {pasek && (
        <div className="plan-pasek">
          <button ref={przycisk} type="button" aria-haspopup="dialog" onClick={() => setOtwarty(true)}>
            <span className="plan-pasek-n" aria-hidden="true">{liczba}</span>
            <span>Mój plan ({liczba})</span>
            <span className="plan-pasek-go">Zobacz i wyślij ›</span>
          </button>
        </div>
      )}
      {otwarty && <PlanPanel onZamknij={() => setOtwarty(false)} />}
    </>
  );
}
