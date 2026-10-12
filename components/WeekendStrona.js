import { useEffect, useMemo, useState } from 'react';
import Uklad from './Uklad';
import Okruszki from './Okruszki';
import PlanPlus from './PlanPlus';
import { KATEGORIE } from './Kalendarz';
import { dzisWarszawa, najblizszyWeekend, trwaW, zakresDat, ladnaData } from './Wydarzenia';
import { adresKarty } from '../lib/miejsca';
import { grupujTerminy } from '../lib/grupowanie';

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
const godzinyZTekstu = (t) => (String(t || '').match(/\d{1,2}:\d{2}/g) || []).map((g) => g.padStart(5, '0'));
const poraId = (g) => (!g ? 'caly' : g < '12:00' ? 'rano' : g < '17:00' ? 'popo' : 'wieczor');
const bezplatne = (w) => /bezp|wstęp wolny|wstęp bezpłatny|^0\s?zł/i.test(w.cena || '');
// nazwa rodzaju na kafelku w liczbie pojedynczej (chipy filtra używają nazw z KATEGORIE)
const NAZWA_KAT = { koncert: 'Koncert', spektakl: 'Spektakl', warsztaty: 'Warsztaty', pokaz: 'Pokaz', czytanie: 'Czytanie', wystawa: 'Wystawa', jarmark: 'Jarmark', festyn: 'Festyn', sport: 'Sport', spacer: 'Spacer', planszowki: 'Planszówki' };
const liczba = (n) => `${n} ${n === 1 ? 'wydarzenie' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? 'wydarzenia' : 'wydarzeń'}`;

// jeden wiersz = jedno wydarzenie w jednym dniu; godziny z osobnych wpisów o tym samym tytule i miejscu są połączone (grupujTerminy)
function wierszeDnia(wydarzenia, iso) {
  const lista = wydarzenia.filter((w) => !w.kino && trwaW(w.data_regula, iso)).map((w) => ({ ...w, dzien: iso }));
  return grupujTerminy(lista).map((w) => {
    const godziny = [...new Set(w.godziny.flatMap((g) => godzinyZTekstu(g.godzina)))].sort();
    return { ...w, godz: godziny, pora: poraId(godziny[0]), planId: (w.godziny[0] && w.godziny[0].id) || w.id };
  });
}

function Karta({ w, miejsca }) {
  const href = w.link || (w.miejsceId && miejsca.has(w.miejsceId) ? miejsca.get(w.miejsceId) : '');
  const zewn = !!w.link;
  const kat = NAZWA_KAT[w.kategoria];
  const nadmiar = w.godz.length > 3;
  return (
    <li className={`wk-k wk-${w.kategoria || 'inne'}`}>
      <div className="wk-g">
        {w.godz.length ? w.godz.slice(0, 3).map((g) => <b key={g}>{g}</b>) : <b className="wk-cd">cały dzień</b>}
        {nadmiar && <small>+{w.godz.length - 3}</small>}
      </div>
      <div className="wk-t">
        {kat && <span className="wk-kat">{kat}</span>}
        <h3>{href ? <a href={href} {...(zewn ? { target: '_blank', rel: 'noreferrer' } : {})}>{w.nazwa}</a> : w.nazwa}</h3>
        {w.miejsce && <p className="wk-m">{w.miejsce}</p>}
        <div className="wk-w">
          {w.wiek && <span className="wk-tag">{w.wiek}</span>}
          {w.cena && <span className={`wk-tag${bezplatne(w) ? ' wk-free' : ''}`}>{w.cena}</span>}
          <PlanPlus typ="wydarzenie" id={w.planId} dzien={w.dzien} tytul={w.nazwa} />
        </div>
      </div>
    </li>
  );
}

export default function WeekendStrona({ wydarzenia = [], places = [], seo, missingConfig, fetchError }) {
  const [teraz, setTeraz] = useState(null);
  const [kat, setKat] = useState('');
  const [tylkoBezplatne, setTylkoBezplatne] = useState(false);
  useEffect(() => setTeraz(dzisWarszawa()), []);

  const miejsca = useMemo(() => new Map(places.map((p) => [p.id, adresKarty(p)])), [places]);
  const dane = useMemo(() => {
    if (!teraz) return null;
    const { sob, nd, wWeekend } = najblizszyWeekend(teraz);
    return { sob, nd, wWeekend, dni: [{ id: 'sobota', nazwa: 'Sobota', iso: sob, wiersze: wierszeDnia(wydarzenia, sob) }, { id: 'niedziela', nazwa: 'Niedziela', iso: nd, wiersze: wierszeDnia(wydarzenia, nd) }] };
  }, [teraz, wydarzenia]);

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
          <div className="wk-meta">
            <span>{zakresDat(dane.sob, dane.nd)}</span>
            <span>{liczba(wszystkie.length)}</span>
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
                        <span>{[w.miejsce, w.wiek].filter(Boolean).join(' · ')}</span>
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
              {dane.dni.map((d) => {
                const wiersze = filtruj(d.wiersze);
                return (
                  <section key={d.id} id={d.id} className="wk-dzien" aria-label={d.nazwa}>
                    <div className="wk-dh"><h2>{d.nazwa}</h2><span>{ladnaData(d.iso)} · {liczba(wiersze.length)}</span></div>
                    {wiersze.length === 0 && <p className="wyd-pusto">{d.wiersze.length ? 'Brak wydarzeń pasujących do filtra.' : 'Na ten dzień nie mamy jeszcze wydarzeń.'}</p>}
                    {PORY.map((p) => {
                      const w = wiersze.filter((x) => x.pora === p.id);
                      if (!w.length) return null;
                      return (
                        <div key={p.id}>
                          <h3 className="wk-pora">{p.nazwa} {p.opis && <em>{p.opis}</em>}</h3>
                          <ul className="wk-siatka">{w.map((x) => <Karta key={`${x.id}-${x.dzien}-${x.nazwa}`} w={x} miejsca={miejsca} />)}</ul>
                        </div>
                      );
                    })}
                  </section>
                );
              })}
              <p className="wk-podpowiedz">Chcesz ułożyć plan? Przyciskiem „+” dodasz wydarzenie do „Mojego planu”, a stamtąd pobierzesz je do kalendarza, wydrukujesz lub wyślesz znajomym.</p>
            </>
          )}
        </div>
      )}
    </Uklad>
  );
}
