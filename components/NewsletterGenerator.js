import { useEffect, useMemo, useRef, useState } from 'react';
import Uklad from './Uklad';
import { dzisWarszawa, najblizszyWeekend } from './Wydarzenia';
import { wierszeDnia, bezplatne } from './WeekendStrona';
import { zbudujNewsletter } from '../lib/newsletterTresc';

// Ukryty widok dla właścicielki (/newsletter/generator, bez indeksowania, bez linków w serwisie): z wydarzeń najbliższego weekendu
// układa gotowy newsletter przed weekendem (czwartek rano). Można odznaczyć wydarzenia, a potem skopiować HTML do Brevo albo sam tekst.
const klucz = (w) => `${w.dzien}|${w.nazwa}`;

async function kopiuj(tekst) {
  try { await navigator.clipboard.writeText(tekst); return true; } catch (e) { /* starsza przeglądarka: wersja zapasowa poniżej */ }
  try {
    const t = document.createElement('textarea');
    t.value = tekst; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(t);
    return ok;
  } catch (e) { return false; }
}

export default function NewsletterGenerator({ wydarzenia = [], adresy = {}, seo, missingConfig, fetchError }) {
  const [teraz, setTeraz] = useState(null);
  const [wybrane, setWybrane] = useState(null); // Set kluczy
  const [komunikat, setKomunikat] = useState('');
  const czasKomunikatu = useRef(null);
  useEffect(() => setTeraz(dzisWarszawa()), []);

  const weekend = useMemo(() => {
    if (!teraz) return null;
    const { sob, nd } = najblizszyWeekend(teraz);
    const dni = [{ nazwa: 'Sobota', iso: sob }, { nazwa: 'Niedziela', iso: nd }].map((d) => ({
      ...d,
      wiersze: wierszeDnia(wydarzenia, d.iso).map((w) => ({ ...w, ulica: w.adres || adresy[w.miejsceId] || '', bezplatne: bezplatne(w), ...(w.lokalizacje ? { lokalizacje: w.lokalizacje.map((l) => ({ ...l, ulica: l.adres || adresy[l.miejsceId] || '' })) } : {}) })).sort((a, b) => (a.godz[0] || '').localeCompare(b.godz[0] || '')),
    }));
    return { sob, nd, dni };
  }, [teraz, wydarzenia, adresy]);

  // domyślny wybór: wszystkie wydarzenia weekendu (mail ma być kompletny); odznaczasz to, czego nie chcesz
  useEffect(() => {
    if (!weekend || wybrane) return;
    setWybrane(new Set(weekend.dni.flatMap((d) => d.wiersze).map(klucz)));
  }, [weekend, wybrane]);

  const tresc = useMemo(() => {
    if (!weekend || !wybrane) return null;
    const widziane = new Set();
    const typy = weekend.dni.flatMap((d) => d.wiersze).filter((w) => w.wyrozniony && wybrane.has(klucz(w)) && !widziane.has(w.nazwa) && widziane.add(w.nazwa)).slice(0, 3).map((w) => ({ ...w, dzienNazwa: w.dzien === weekend.sob ? 'Sobota' : 'Niedziela' }));
    const dni = weekend.dni.map((d) => ({ nazwa: d.nazwa, iso: d.iso, wiersze: d.wiersze.filter((w) => wybrane.has(klucz(w))) }));
    const wszystkie = weekend.dni.flatMap((d) => d.wiersze);
    const wMailu = dni.flatMap((d) => d.wiersze);
    return zbudujNewsletter({ sob: weekend.sob, nd: weekend.nd, adres: seo.siteUrl, dni, typy, ileWszystkich: wMailu.length, ileBezplatnych: wMailu.filter((w) => w.bezplatne).length });
  }, [weekend, wybrane, seo.siteUrl]);

  const powiedz = (t) => { setKomunikat(t); clearTimeout(czasKomunikatu.current); czasKomunikatu.current = setTimeout(() => setKomunikat(''), 3500); };
  const kopiujCo = async (co, nazwa) => powiedz((await kopiuj(co)) ? `Skopiowano: ${nazwa}.` : 'Nie udało się skopiować. Zaznacz tekst ręcznie.');
  const pobierz = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([tresc.html], { type: 'text/html;charset=utf-8' }));
    a.download = `newsletter-weekend-${weekend.sob}.html`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  // zapis maila jako PDF: otwiera wiadomość w nowym oknie i uruchamia okno drukowania (tam wybierasz „Zapisz jako PDF")
  const zapiszPdf = () => {
    const okno = window.open('', '_blank');
    if (!okno) { powiedz('Przeglądarka zablokowała nowe okno. Zezwól na wyskakujące okna dla tej strony.'); return; }
    okno.document.open();
    okno.document.write(tresc.html.replace('</body>', '<script>window.addEventListener("load",function(){setTimeout(function(){window.print()},600)})</script></body>'));
    okno.document.close();
  };
  const przelacz = (k) => setWybrane((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  return (
    <Uklad seo={seo} missingConfig={missingConfig} fetchError={fetchError}>
      <section className="hero">
        <h1>Newsletter na weekend</h1>
        <p className="lead">Wydarzenia najbliższego weekendu ułożone w gotowy e-mail. Odznacz to, czego nie chcesz, i skopiuj do Brevo.</p>
      </section>
      {!weekend || !wybrane || !tresc ? <div className="wydarzenia-ladowanie" aria-hidden="true" /> : (
        <div className="ng">
          <div className="ng-kolumna">
            <h2>1. Wybierz wydarzenia</h2>
            <p className="ng-nota">Zaznaczone trafią do maila (na start wszystkie, żeby wiadomość była kompletna). „Nasze typy” to wydarzenia z kolumną <code>wyrozniony = tak</code> w arkuszu (do trzech).</p>
            {weekend.dni.map((d) => (
              <fieldset className="ng-dzien" key={d.iso}>
                <legend>{d.nazwa} ({d.wiersze.length})</legend>
                {d.wiersze.length === 0 && <p className="ng-nota">Brak wydarzeń w kalendarzu.</p>}
                {d.wiersze.map((w) => (
                  <label className="ng-wiersz" key={klucz(w)}>
                    <input type="checkbox" checked={wybrane.has(klucz(w))} onChange={() => przelacz(klucz(w))} />
                    <span><b>{w.godz.length ? w.godz[0] : 'cały dzień'}</b> {w.nazwa}{w.wyrozniony ? ' ★' : ''}{w.bezplatne ? ' (bezpłatne)' : ''}</span>
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
          <div className="ng-kolumna">
            <h2>2. Skopiuj do Brevo</h2>
            <div className="ng-pole">
              <label htmlFor="ng-temat">Temat wiadomości</label>
              <input id="ng-temat" className="zgl-pole" readOnly value={tresc.temat} onFocus={(e) => e.target.select()} />
              <button type="button" className="przycisk ng-maly" onClick={() => kopiujCo(tresc.temat, 'temat')}>Kopiuj temat</button>
            </div>
            <div className="ng-pole">
              <label htmlFor="ng-pre">Krótki podgląd (widać go w skrzynce obok tematu)</label>
              <input id="ng-pre" className="zgl-pole" readOnly value={tresc.preheader} onFocus={(e) => e.target.select()} />
              <button type="button" className="przycisk ng-maly" onClick={() => kopiujCo(tresc.preheader, 'podgląd')}>Kopiuj podgląd</button>
            </div>
            <div className="ng-przyciski">
              <button type="button" className="przycisk" onClick={() => kopiujCo(tresc.html, 'kod HTML')}>Kopiuj kod HTML</button>
              <button type="button" className="przycisk" onClick={() => kopiujCo(tresc.tekst, 'wersja tekstowa')}>Kopiuj sam tekst</button>
              <button type="button" className="przycisk" onClick={pobierz}>Pobierz plik .html</button>
              <button type="button" className="przycisk" onClick={zapiszPdf}>Zapisz jako PDF</button>
            </div>
            <p className="ng-komunikat" role="status" aria-live="polite">{komunikat}</p>
            <h2>Podgląd</h2>
            <iframe className="ng-podglad" title="Podgląd newslettera" sandbox="" srcDoc={tresc.html} />
          </div>
        </div>
      )}
    </Uklad>
  );
}
