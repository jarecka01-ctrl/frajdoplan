import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Uklad from './Uklad';
import Okruszki from './Okruszki';
import PlanPlus from './PlanPlus';
import { wydarzeniaJsonLd } from '../lib/jsonld';
import { dzisWarszawa, godzinaWarszawa } from './Wydarzenia';
import { opisMiejsc } from '../lib/grupowanie';

// Strony /koncerty i /spektakle: lista wszystkich przyszłych wydarzeń jednej kategorii, miesiąc po miesiącu, w dużych kartach.
// Karta: znaczek z datą (dzień tygodnia, numer, miesiąc, „za X dni"), tytuł (link do biletów), miejsce, wiek i cena,
// wszystkie godziny jako przyciski (z własnymi linkami do terminów), „Bilety" i „+" (Mój plan). Pierwsza karta jest wyróżniona.
// `kolor`: 'koncert' (zielony) albo 'spektakl' (ceglany), ustawia kolor znaczka z datą i cienia.
const DNI = ['niedz.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.'];
const MIES = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
const dzienUTC = (iso) => new Date(`${iso}T12:00:00Z`);
const roznicaDni = (od, doDnia) => Math.round((dzienUTC(doDnia) - dzienUTC(od)) / 86400000);
const liczba = (n) => `${n} ${n === 1 ? 'wydarzenie' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? 'wydarzenia' : 'wydarzeń'}`;
const wielka = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// dziś wszystkie godziny już minęły → wydarzenie znika (strona jest budowana raz na godzinę, więc sprawdzamy w przeglądarce)
const juzMinelo = (w, dzis, godz) => w.dzien === dzis && w.godziny.length > 0 && w.godziny.every((g) => g.godzina && g.godzina <= godz);

function Karta({ w, dzis, pierwsza, nazwaKategorii }) {
  const d = dzienUTC(w.dzien);
  const roznica = dzis ? roznicaDni(dzis, w.dzien) : null;
  const za = roznica === null ? null : roznica === 0 ? 'dziś' : roznica === 1 ? 'jutro' : `za ${roznica} dni`;
  const weekend = [0, 6].includes(d.getUTCDay());
  const link = w.link || (w.godziny.find((g) => g.link) || {}).link || '';
  const tytul = link
    ? <a href={link} target="_blank" rel="noreferrer">{w.nazwa}</a>
    : w.nazwa;
  return (
    <li className={`kk${pierwsza ? ' kk-naj' : ''}`}>
      <div className="kk-data" aria-hidden="true">
        <span className="kk-dt">{DNI[d.getUTCDay()]}</span>
        <b>{d.getUTCDate()}</b>
        <span className="kk-mi">{MIES[d.getUTCMonth()]}</span>
        {za && <span className="kk-za">{za}</span>}
      </div>
      <div className="kk-tresc">
        {pierwsza && <span className="kk-etyk">Najbliższy {nazwaKategorii}</span>}
        <h3>{tytul}</h3>
        <p className="kk-gdzie">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></svg>
          {opisMiejsc(w) || 'Kraków'}
        </p>
        <span className="sr-only">{`${DNI[d.getUTCDay()]} ${d.getUTCDate()} ${MIES[d.getUTCMonth()]}`}</span>
        {(w.wiek || w.cena || weekend) && (
          <div className="kk-tagi">
            {w.wiek && <span className="kk-tag kk-wiek">{w.wiek}</span>}
            {w.cena && <span className="kk-tag">{w.cena}</span>}
            {weekend && <span className="kk-tag kk-wk">weekend</span>}
          </div>
        )}
        <div className="kk-stopka">
          <div className="kk-godz">
            <span className="kk-etl">{w.godziny.length === 1 ? 'Godzina' : 'Godziny'}</span>
            {w.godziny.length ? w.godziny.map((g) => (
              g.link && g.link !== link
                ? <a key={g.godzina} className="kk-h" href={g.link} target="_blank" rel="noreferrer">{g.godzina}</a>
                : <span key={g.godzina} className="kk-h">{g.godzina}</span>
            )) : <span className="kk-h">cały dzień</span>}
          </div>
          <div className="kk-akcje">
            {link && <a className="kk-btn" href={link} target="_blank" rel="noreferrer">Bilety</a>}
            {!w.lokalizacje && <PlanPlus typ="wydarzenie" id={(w.godziny[0] && w.godziny[0].id) || w.id} dzien={w.dzien} tytul={w.nazwa} />}
          </div>
        </div>
      </div>
    </li>
  );
}

export default function ListaWydarzen({ miesiace, liczba: ile, seo, nazwaOkruszka, pusto, missingConfig, fetchError, kolor = 'koncert' }) {
  const [czas, setCzas] = useState(null);
  const [miejsce, setMiejsce] = useState('');
  useEffect(() => { setCzas({ dzis: dzisWarszawa(), godz: godzinaWarszawa() }); }, []);

  const wszystkie = miesiace.flatMap((m) => m.wiersze);
  const widoczne = useMemo(() => miesiace
    .map((m) => ({ ...m, wiersze: m.wiersze.filter((w) => (!czas || !juzMinelo(w, czas.dzis, czas.godz)) && (!miejsce || (w.lokalizacje ? w.lokalizacje.some((l) => l.miejsce === miejsce) : w.miejsce === miejsce))) }))
    .filter((m) => m.wiersze.length), [miesiace, czas, miejsce]);
  const miejsca = useMemo(() => {
    const licz = {};
    wszystkie.forEach((w) => (w.lokalizacje ? w.lokalizacje.map((l) => l.miejsce) : [w.miejsce]).forEach((m) => { if (m) licz[m] = (licz[m] || 0) + 1; }));
    return Object.entries(licz).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([m]) => m);
  }, [wszystkie]);
  const nazwaKategorii = kolor === 'spektakl' ? 'spektakl' : 'koncert';
  let pierwsza = !miejsce; // wyróżniona karta tylko na pełnej liście

  return (
    <Uklad seo={seo} jsonLd={wydarzeniaJsonLd(wszystkie.flatMap((w) => (w.lokalizacje ? w.lokalizacje.map((l) => ({ ...w, miejsce: l.miejsce, link: l.link || w.link, godziny: l.godziny, lokalizacje: undefined })) : [w])), seo.canonical)} missingConfig={missingConfig} fetchError={fetchError}>
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
              {widoczne.map((m) => <a key={m.klucz} href={`#m-${m.klucz}`}>{wielka(m.nazwa.split(' ')[0])} <i>{m.wiersze.length}</i></a>)}
            </nav>
            {miejsca.length > 1 && (
              <div className="kk-filtry" role="group" aria-label="Filtr miejsca">
                <button type="button" aria-pressed={!miejsce} onClick={() => setMiejsce('')}>Wszystkie</button>
                {miejsca.map((m) => <button key={m} type="button" aria-pressed={miejsce === m} onClick={() => setMiejsce(miejsce === m ? '' : m)}>{m}</button>)}
              </div>
            )}
          </div>
          {widoczne.map((m) => (
            <section key={m.klucz} id={`m-${m.klucz}`} className="kk-miesiac" aria-label={m.nazwa}>
              <div className="kk-mh">
                <h2>{wielka(m.nazwa)}</h2>
                <span>{liczba(m.wiersze.length)}</span>
              </div>
              <ul className="kk-siatka">
                {m.wiersze.map((w) => {
                  const naj = pierwsza; pierwsza = false;
                  return <Karta key={`${w.id}-${w.dzien}`} w={w} dzis={czas && czas.dzis} pierwsza={naj} nazwaKategorii={nazwaKategorii} />;
                })}
              </ul>
            </section>
          ))}
          {widoczne.length === 0 && <p className="wyd-pusto">Nie ma już nadchodzących wydarzeń{miejsce ? ' w tym miejscu' : ''}.</p>}
          <p className="dodaj-przypis">Brakuje wydarzenia? <Link href="/dodaj/wydarzenie">Dodaj je</Link></p>
        </div>
      )}
    </Uklad>
  );
}
