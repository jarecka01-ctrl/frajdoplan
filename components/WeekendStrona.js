import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Uklad from './Uklad';
import Okruszki from './Okruszki';
import PlanPlus from './PlanPlus';
import NewsletterForm from './NewsletterForm';
import { KATEGORIE } from './Kalendarz';
import { dzisWarszawa, najblizszyWeekend, trwaW, zakresDat, ladnaData } from './Wydarzenia';
import { adresKarty } from '../lib/miejsca';
import { grupujTerminy, scalLokalizacje } from '../lib/grupowanie';

// Strona /weekend: wszystkie wydarzenia najbliższego weekendu (bez seansów kinowych, te mają „Dziś w kinach"), osobno sobota i niedziela,
// w każdym dniu pogrupowane na Cały dzień / Rano (do 12:00) / Popołudnie (12:00–17:00) / Wieczór (od 17:00).
// Na górze „Nasze typy" (wydarzenia z kolumną wyrozniony = tak), pod nimi przyklejony pasek: przejście do dnia i filtr rodzaju.
// Daty liczy przeglądarka (jak „Dziś" na stronie głównej), bo strona jest budowana raz na godzinę.
const PORY = [
  { id: 'caly', nazwa: 'Cały dzień', opis: '' },
  { id: 'rano', nazwa: 'Rano', opis: 'do 12:00' },
  { id: 'popo', nazwa: 'Popołudnie', opis: '12:00–17:00' },
  { id: 'wieczor', nazwa: 'Wieczór', opis: 'od 17:00' },
];
export const godzinyZTekstu = (t) => (String(t || '').match(/\d{1,2}:\d{2}/g) || []).map((g) => g.padStart(5, '0'));
const poraId = (g) => (!g ? 'caly' : g < '12:00' ? 'rano' : g < '17:00' ? 'popo' : 'wieczor');
export const bezplatne = (w) => /bezp|wstęp wolny|wstęp bezpłatny|^0\s?zł/i.test(w.cena || '');
// nazwa rodzaju na kafelku w liczbie pojedynczej (chipy filtra używają nazw z KATEGORIE)
const NAZWA_KAT = { koncert: 'Koncert', spektakl: 'Spektakl', warsztaty: 'Warsztaty', pokaz: 'Pokaz', czytanie: 'Czytanie', wystawa: 'Wystawa', jarmark: 'Jarmark', festyn: 'Festyn', sport: 'Sport', spacer: 'Spacer', planszowki: 'Planszówki' };
const liczba = (n) => `${n} ${n === 1 ? 'wydarzenie' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? 'wydarzenia' : 'wydarzeń'}`;

// jeden wiersz = jedno wydarzenie w jednym dniu; godziny z osobnych wpisów o tym samym tytule i miejscu są połączone (grupujTerminy)
export function wierszeDnia(wydarzenia, iso) {
  const lista = wydarzenia.filter((w) => !w.kino && trwaW(w.data_regula, iso)).map((w) => ({ ...w, dzien: iso }));
  const wiersze = grupujTerminy(lista).map((w) => {
    const godziny = [...new Set(w.godziny.flatMap((g) => godzinyZTekstu(g.godzina)))].sort();
    // godzina → własny link do biletów, gdy terminy mają różne linki (np. dwa koncerty Filharmonii tego samego dnia)
    const linki = {};
    w.godziny.forEach((g) => { if (g.link) godzinyZTekstu(g.godzina).forEach((x) => { linki[x] = g.link; }); });
    const rozneLinki = new Set(Object.values(linki)).size > 1;
    // kilka godzin i jakikolwiek link: każda godzina jest linkiem (do własnych biletów albo do wspólnego linku wydarzenia)
    const linkiGodz = godziny.length > 1 && (rozneLinki || w.link) ? Object.fromEntries(godziny.map((g) => [g, linki[g] || w.link || ''])) : null;
    return { ...w, godz: godziny, linkiGodz, rozneLinki, pora: poraId(godziny[0]), planId: (w.godziny[0] && w.godziny[0].id) || w.id };
  });
  // to samo wydarzenie w kilku miejscach (np. filie biblioteki) = jeden wiersz z listą lokalizacji
  return scalLokalizacje(wiersze).map((w) => (w.lokalizacje ? { ...w, pora: poraId(w.godz[0]) } : w));
}

const liczbaLok = (n) => `${n} ${n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'lokalizacje' : 'lokalizacji'}`;

function Karta({ w, miejsca, adresy }) {
  const ulica = w.adres || adresy[w.miejsceId] || '';
  const href = w.linkStrony || w.link || (w.miejsceId && miejsca.has(w.miejsceId) ? miejsca.get(w.miejsceId) : '');
  const zewn = !!(w.linkStrony || w.link);
  const kat = NAZWA_KAT[w.kategoria];
  const nadmiar = w.godz.length > 3;
  const darmo = bezplatne(w);
  return (
    <li className={`wk-r wk-${w.kategoria || 'inne'}`}>
      <div className="wk-g">
        {w.godz.length ? w.godz.slice(0, 3).map((g) => (w.linkiGodz && w.linkiGodz[g]
          ? <a key={g} className="wk-gl" href={w.linkiGodz[g]} target="_blank" rel="noreferrer" title={`${g}: przejdź do wydarzenia`} aria-label={`${w.nazwa}, ${g}: przejdź do wydarzenia`}><b>{g}</b></a>
          : <b key={g}>{g}</b>)) : <b className="wk-cd">cały dzień</b>}
        {nadmiar && <small>+{w.godz.length - 3}</small>}
      </div>
      <div className="wk-t">
        <h3>
          {href ? <a href={href} {...(zewn ? { target: '_blank', rel: 'noreferrer' } : {})}>{w.nazwa}</a> : w.nazwa}
          {darmo && <span className="wk-tag wk-free">bezpłatne</span>}
        </h3>
        <p className="wk-m">
          {kat && <span className="wk-kat">{kat}</span>}
          {w.lokalizacje ? <span>{liczbaLok(w.lokalizacje.length)}{w.wspolneMiejsce ? `: ${w.wspolneMiejsce}` : ''}</span> : w.miejsce && <span>{w.miejsce}</span>}
          {!w.lokalizacje && ulica && <a className="wk-ulica" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ulica}, Kraków`)}`} target="_blank" rel="noreferrer" title="Pokaż na mapie">{ulica}</a>}
          {w.wiek && <span>{w.wiek}</span>}
          {w.cena && !darmo && <span>{w.cena}</span>}
        </p>
        {w.lokalizacje && (
          <ul className="wk-lok">
            {w.lokalizacje.map((l) => {
              const u = l.adres || adresy[l.miejsceId] || '';
              const h = l.link || (l.miejsceId && miejsca.has(l.miejsceId) ? miejsca.get(l.miejsceId) : '');
              const rozneGodz = w.lokalizacje.some((x) => x.godz.join() !== l.godz.join());
              return (
                <li key={l.miejsce}>
                  {h ? <a href={h} target={l.link ? '_blank' : undefined} rel={l.link ? 'noreferrer' : undefined}>{l.nazwaMiejsca}</a> : l.nazwaMiejsca}
                  {rozneGodz && l.godz.length > 0 && <span className="wk-lok-g"> · {l.godz.join(', ')}</span>}
                  {u && <> · <a className="wk-lok-u" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${u}, Kraków`)}`} target="_blank" rel="noreferrer" title="Pokaż na mapie">{u}</a></>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {!w.lokalizacje && <PlanPlus typ="wydarzenie" id={w.planId} dzien={w.dzien} tytul={w.nazwa} />}
    </li>
  );
}

export default function WeekendStrona({ wydarzenia = [], places = [], adresy = {}, seo, missingConfig, fetchError }) {
  const [teraz, setTeraz] = useState(null);
  const [kat, setKat] = useState('');
  const [tylkoBezplatne, setTylkoBezplatne] = useState(false);
  useEffect(() => setTeraz(dzisWarszawa()), []);
  const drukuj = useCallback(() => { try { window.print(); } catch (e) { /* brak drukowania w tej przeglądarce */ } }, []);

  const miejsca = useMemo(() => new Map(places.map((p) => [p.id, adresKarty(p)])), [places]);
  const dane = useMemo(() => {
    if (!teraz) return null;
    const { sob, nd, wWeekend } = najblizszyWeekend(teraz);
    return { sob, nd, wWeekend, dni: [{ id: 'sobota', nazwa: 'Sobota', iso: sob, wiersze: wierszeDnia(wydarzenia, sob) }, { id: 'niedziela', nazwa: 'Niedziela', iso: nd, wiersze: wierszeDnia(wydarzenia, nd) }] };
  }, [teraz, wydarzenia]);

  // adres z ?pdf=1 (np. z newslettera) od razu otwiera okno zapisu do PDF
  const gotowe = !!dane;
  useEffect(() => {
    if (!gotowe) return undefined;
    if (new URLSearchParams(window.location.search).get('pdf') !== '1') return undefined;
    const t = setTimeout(drukuj, 700);
    return () => clearTimeout(t);
  }, [gotowe, drukuj]);

  const wszystkie = dane ? dane.dni.flatMap((d) => d.wiersze) : [];
  const rodzaje = KATEGORIE.map((k) => ({ ...k, ile: wszystkie.filter((w) => w.kategoria === k.id).length })).filter((k) => k.ile > 0);
  const ileBezplatnych = wszystkie.filter(bezplatne).length;
  const filtruj = (l) => l.filter((w) => (!kat || w.kategoria === kat) && (!tylkoBezplatne || bezplatne(w)));
  const typy = (() => {
    const widziane = new Set();
    return wszystkie.filter((w) => w.wyrozniony && !widziane.has(w.nazwa) && widziane.add(w.nazwa)).slice(0, 3);
  })();
  const dzien = (iso) => `${['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'][new Date(`${iso}T12:00:00Z`).getUTCDay()]}`;

  return (
    <Uklad seo={seo} missingConfig={missingConfig} fetchError={fetchError}>
      <Okruszki sciezka={[{ nazwa: 'Weekend', href: seo.adres }]} siteUrl={seo.siteUrl} />
      <section className="hero">
        <h1>{seo.h1}</h1>
        <p className="lead">{seo.wstep}</p>
      </section>
      {!dane ? <div className="wydarzenia-ladowanie" aria-hidden="true" /> : (
        <div className="wk-strona">
          <img className="plan-druk-logo" src="/brand/nowe/logo-header.png" alt="Frajdoplan – co robić z dzieckiem w Krakowie" width="1528" height="449" />
          <div className="wk-meta">
            <span>{zakresDat(dane.sob, dane.nd)}</span>
            <span>{liczba(wszystkie.length)}</span>
            {wszystkie.length > 0 && (
              <button type="button" className="wk-pdf" onClick={drukuj}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M6 9V3h12v6" /><rect x="3" y="9" width="18" height="8" rx="2" /><path d="M6 14h12v7H6z" /></svg>
                Zapisz jako PDF
              </button>
            )}
          </div>
          {wszystkie.length === 0 ? (
            <p className="wyd-pusto">Na ten weekend nie mamy jeszcze wydarzeń w kalendarzu. Zajrzyj tu za kilka dni.</p>
          ) : (
            <>
              {typy.length > 0 && (
                <section className="wk-typy" aria-label="Nasze typy">
                  <span className="stempel">Weekend</span>
                  <h2>Nasze typy</h2>
                  <ul>
                    {typy.map((w) => (
                      <li key={w.id}>
                        <small>{dzien(w.dzien)}{w.godz[0] ? ` · ${w.godz[0]}` : ''}</small>
                        <b>{w.link ? <a href={w.link} target="_blank" rel="noreferrer">{w.nazwa}</a> : w.nazwa}</b>
                        <span>{[w.lokalizacje ? `${liczbaLok(w.lokalizacje.length)}${w.wspolneMiejsce ? `: ${w.wspolneMiejsce}` : ''}` : w.miejsce, w.wiek].filter(Boolean).join(' · ')}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <div className="wk-pasek">
                <nav className="wk-dni" aria-label="Przejdź do dnia">
                  {dane.dni.map((d) => <a key={d.id} href={`#${d.id}`}>{d.nazwa} <small>{ladnaData(d.iso)} · {d.wiersze.length}</small></a>)}
                </nav>
                {(rodzaje.length > 1 || ileBezplatnych > 0) && (
                  <div className="wk-filtry" role="group" aria-label="Filtr rodzaju">
                    <button type="button" aria-pressed={!kat && !tylkoBezplatne} onClick={() => { setKat(''); setTylkoBezplatne(false); }}>Wszystko</button>
                    {rodzaje.length > 1 && rodzaje.map((k) => (
                      <button key={k.id} type="button" aria-pressed={kat === k.id} onClick={() => setKat(kat === k.id ? '' : k.id)}>{k.nazwa} <i>{k.ile}</i></button>
                    ))}
                    {ileBezplatnych > 0 && <button type="button" aria-pressed={tylkoBezplatne} onClick={() => setTylkoBezplatne(!tylkoBezplatne)}>Bezpłatne <i>{ileBezplatnych}</i></button>}
                  </div>
                )}
              </div>
              {dane.dni.map((d, nr) => {
                const wiersze = filtruj(d.wiersze);
                return (
                  <section key={d.id} id={d.id} className={`wk-dzien wk-dz-${nr}`} aria-label={d.nazwa}>
                    <div className="wk-dh"><h2>{d.nazwa}</h2><span>{ladnaData(d.iso)} · {liczba(wiersze.length)}</span></div>
                    {wiersze.length === 0 && <p className="wyd-pusto">{d.wiersze.length ? 'Brak wydarzeń pasujących do filtra.' : 'Na ten dzień nie mamy jeszcze wydarzeń.'}</p>}
                    {PORY.map((p) => {
                      const w = wiersze.filter((x) => x.pora === p.id);
                      if (!w.length) return null;
                      return (
                        <div key={p.id}>
                          <h3 className="wk-pora">{p.nazwa} {p.opis && <em>{p.opis}</em>}</h3>
                          <ul className="wk-lista">{w.map((x) => <Karta key={`${x.id}-${x.dzien}-${x.nazwa}`} w={x} miejsca={miejsca} adresy={adresy} />)}</ul>
                        </div>
                      );
                    })}
                  </section>
                );
              })}
              <p className="wk-druk-stopka">Lista z serwisu frajdoplan.pl, stan na dzień wydruku. Godziny i ceny sprawdź na stronie organizatora.</p>
              <p className="wk-podpowiedz">Chcesz ułożyć plan? Przyciskiem „+” dodasz wydarzenie do „Mojego planu”, a stamtąd pobierzesz je do kalendarza, wydrukujesz lub wyślesz znajomym.</p>
            </>
          )}
        </div>
      )}
      <section className="nl-blok" aria-labelledby="nl-weekend-h">
        <h2 id="nl-weekend-h">Plan weekendu w skrzynce</h2>
        <p>Co tydzień, przed weekendem, jeden krótki e-mail: nasze typy i wydarzenia na sobotę i niedzielę. Bez reklam.</p>
        <NewsletterForm id="nl-weekend" zwarty />
      </section>
      <p className="dodaj-przypis">Brakuje wydarzenia? <Link href="/dodaj/wydarzenie">Dodaj je</Link></p>
    </Uklad>
  );
}
