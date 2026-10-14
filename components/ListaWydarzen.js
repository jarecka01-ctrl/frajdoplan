import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Uklad from './Uklad';
import Okruszki from './Okruszki';
import PlanPlus from './PlanPlus';
import { wydarzeniaJsonLd, listaWydarzenJsonLd } from '../lib/jsonld';
import { dzisWarszawa, godzinaWarszawa } from './Wydarzenia';
import { opisMiejsc } from '../lib/grupowanie';

// Strony /koncerty i /spektakle: lista wszystkich przyszłych wydarzeń jednej kategorii w układzie jak /weekend:
// miesiąc → dzień (znaczek z datą, nazwa dnia, „za X dni") → wiersze (godziny po lewej, kolorowy pasek, tytuł jako link do biletów,
// miejsce · wiek · cena, „Bilety" i „+" (Mój plan)). Na górze przyklejony pasek: miesiące, miejsca i „Bezpłatne".
// To samo wydarzenie w kilku miejscach (`lokalizacje`) to jeden wiersz bez „+". `kolor`: 'koncert' (zielony) albo 'spektakl' (ceglany).
const DNI = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];
const MIES = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
const dzienUTC = (iso) => new Date(`${iso}T12:00:00Z`);
const roznicaDni = (od, doDnia) => Math.round((dzienUTC(doDnia) - dzienUTC(od)) / 86400000);
const liczba = (n) => `${n} ${n === 1 ? 'wydarzenie' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? 'wydarzenia' : 'wydarzeń'}`;
const wielka = (t) => t.charAt(0).toUpperCase() + t.slice(1);
// jak `bezplatne` na /weekend
const darmowe = (w) => /bezp|wstęp wolny|wstęp bezpłatny|^0\s?zł/i.test(w.cena || '');

// dziś wszystkie godziny już minęły → wydarzenie znika (strona jest budowana raz na godzinę, więc sprawdzamy w przeglądarce)
const juzMinelo = (w, dzis, godz) => w.dzien === dzis && w.godziny.length > 0 && w.godziny.every((g) => g.godzina && g.godzina <= godz);

function Wiersz({ w }) {
  const link = w.link || (w.godziny.find((g) => g.link) || {}).link || '';
  const tytul = link ? <a href={link} target="_blank" rel="noreferrer">{w.nazwa}</a> : w.nazwa;
  const miejsce = opisMiejsc(w);
  return (
    <li className="wk-r">
      <div className="wk-g">
        {w.godziny.length ? w.godziny.slice(0, 3).map((g) => <b key={g.godzina}>{g.godzina}</b>) : <b className="wk-cd">cały dzień</b>}
        {w.godziny.length > 3 && <small>+{w.godziny.length - 3}</small>}
      </div>
      <div className="wk-t">
        <h3>{tytul}</h3>
        <p className="wk-m">
          {miejsce && <span>{miejsce}</span>}
          {w.wiek && <span className="kk-wiek">{w.wiek}</span>}
          {w.cena && <span>{w.cena}</span>}
        </p>
      </div>
      <div className="kk-akcje">
        {link && <a className="kk-bilety" href={link} target="_blank" rel="noreferrer" aria-label={`Bilety: ${w.nazwa}`}>Bilety</a>}
        {!w.lokalizacje && <PlanPlus typ="wydarzenie" id={(w.godziny[0] && w.godziny[0].id) || w.id} dzien={w.dzien} tytul={w.nazwa} />}
      </div>
    </li>
  );
}

function Dzien({ dzien, wiersze, dzis }) {
  const d = dzienUTC(dzien);
  const r = dzis ? roznicaDni(dzis, dzien) : null;
  const za = r === null ? null : r === 0 ? 'dziś' : r === 1 ? 'jutro' : `za ${r} dni`;
  const weekend = [0, 6].includes(d.getUTCDay());
  return (
    <section className={`kk-dzien${weekend ? ' kk-we' : ''}`} aria-label={`${DNI[d.getUTCDay()]} ${d.getUTCDate()} ${MIES[d.getUTCMonth()]}`}>
      <div className="kk-dh">
        <span className="kk-data" aria-hidden="true"><i>{DNI[d.getUTCDay()].slice(0, 3)}.</i><b>{d.getUTCDate()}</b></span>
        <h3>{wielka(DNI[d.getUTCDay()])}, {d.getUTCDate()} {MIES[d.getUTCMonth()]}</h3>
        {za && <em>{za}</em>}
      </div>
      <ul className="wk-lista">
        {wiersze.map((w) => <Wiersz key={`${w.id}-${w.dzien}`} w={w} />)}
      </ul>
    </section>
  );
}

export default function ListaWydarzen({ miesiace, liczba: ile, seo, nazwaOkruszka, pusto, missingConfig, fetchError, kolor = 'koncert', children }) {
  const [czas, setCzas] = useState(null);
  const [miejsce, setMiejsce] = useState('');
  const [tylkoDarmo, setTylkoDarmo] = useState(false);
  useEffect(() => { setCzas({ dzis: dzisWarszawa(), godz: godzinaWarszawa() }); }, []);

  const wszystkie = miesiace.flatMap((m) => m.wiersze);
  const maMiejsce = (w, m) => (w.lokalizacje ? w.lokalizacje.some((l) => l.miejsce === m) : w.miejsce === m);
  // miesiąc → dni → wiersze, po odfiltrowaniu minionych, miejsca i „Bezpłatne"
  const widoczne = useMemo(() => miesiace.map((m) => {
    const dni = [];
    m.wiersze
      .filter((w) => (!czas || !juzMinelo(w, czas.dzis, czas.godz)) && (!miejsce || maMiejsce(w, miejsce)) && (!tylkoDarmo || darmowe(w)))
      .forEach((w) => {
        if (!dni.length || dni[dni.length - 1].dzien !== w.dzien) dni.push({ dzien: w.dzien, wiersze: [] });
        dni[dni.length - 1].wiersze.push(w);
      });
    return { ...m, dni, n: dni.reduce((suma, d) => suma + d.wiersze.length, 0) };
  }).filter((m) => m.n), [miesiace, czas, miejsce, tylkoDarmo]);
  const miejsca = useMemo(() => {
    const licz = {};
    wszystkie.forEach((w) => (w.lokalizacje ? w.lokalizacje.map((l) => l.miejsce) : [w.miejsce]).forEach((m) => { if (m) licz[m] = (licz[m] || 0) + 1; }));
    return Object.entries(licz).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [wszystkie]);
  const sa = wszystkie.some(darmowe);

  return (
    <Uklad seo={seo} jsonLd={[...(wydarzeniaJsonLd(wszystkie.flatMap((w) => (w.lokalizacje ? w.lokalizacje.map((l) => ({ ...w, miejsce: l.miejsce, link: l.link || w.link, godziny: l.godziny, lokalizacje: undefined })) : [w])), seo.canonical)), listaWydarzenJsonLd(wszystkie, seo.canonical, seo.h1)]} missingConfig={missingConfig} fetchError={fetchError}>
      <Okruszki sciezka={[{ nazwa: nazwaOkruszka, href: seo.adres }]} siteUrl={seo.siteUrl} />
      <section className="hero">
        <h1>{seo.h1}</h1>
        <p className="lead">{seo.wstep}</p>
      </section>
      {ile === 0 ? (
        <p className="wyd-pusto">{pusto}</p>
      ) : (
        <div className={`kk-strona kk-${kolor}`}>
          <div className="kk-pasek">
            <nav className="kk-mies" aria-label="Przejdź do miesiąca">
              {widoczne.map((m) => <a key={m.klucz} href={`#m-${m.klucz}`}>{wielka(m.nazwa.split(' ')[0])}<small>{m.n}</small></a>)}
            </nav>
            {(miejsca.length > 1 || sa) && (
              <div className="kk-filtry" role="group" aria-label="Filtry">
                <button type="button" aria-pressed={!miejsce && !tylkoDarmo} onClick={() => { setMiejsce(''); setTylkoDarmo(false); }}>Wszystkie</button>
                {miejsca.length > 1 && miejsca.map(([m, n]) => <button key={m} type="button" aria-pressed={miejsce === m} onClick={() => setMiejsce(miejsce === m ? '' : m)}>{m}<i>{n}</i></button>)}
                {sa && <button type="button" aria-pressed={tylkoDarmo} onClick={() => setTylkoDarmo(!tylkoDarmo)}>Bezpłatne</button>}
              </div>
            )}
          </div>
          {widoczne.map((m) => (
            <section key={m.klucz} id={`m-${m.klucz}`} className="kk-miesiac" aria-label={m.nazwa}>
              <div className="kk-mh">
                <h2>{wielka(m.nazwa)}</h2>
                <span>{liczba(m.n)}</span>
              </div>
              {m.dni.map((d) => <Dzien key={d.dzien} dzien={d.dzien} wiersze={d.wiersze} dzis={czas && czas.dzis} />)}
            </section>
          ))}
          {widoczne.length === 0 && <p className="wyd-pusto">Nie ma już nadchodzących wydarzeń{miejsce || tylkoDarmo ? ' dla wybranych filtrów' : ''}.</p>}
          {children}
          <p className="dodaj-przypis">Brakuje wydarzenia? <Link href="/dodaj/wydarzenie">Dodaj je</Link></p>
        </div>
      )}
    </Uklad>
  );
}
