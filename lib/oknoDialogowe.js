import { useEffect } from 'react';

const NA_FOKUS = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Okno dialogowe: pułapka fokusu, Esc, blokada przewijania tła, powrót fokusu do przycisku, który je otworzył.
export function useOknoDialogowe(ref, onZamknij) {
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
