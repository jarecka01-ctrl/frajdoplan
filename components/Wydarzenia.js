import { useEffect, useState } from 'react';

/*
  Wydarzenia z zakładki „Wydarzenia" w Arkuszu Google.
  Kolumna data_regula przyjmuje:
    - jedną datę:          2026-10-03
    - zakres dat:          2026-10-01 do 2026-10-05
    - dzień tygodnia:      co sobotę / każdy wtorek / sobota, niedziela / codziennie
  Pokazujemy tylko wiersze ze statusem pustym, „aktywne" lub „zatwierdzone".
*/

const DNI = [
  [/niedziel/, 0], [/poniedzia/, 1], [/wtor/, 2], [/środ|sród|srod/, 3],
  [/czwart/, 4], [/piąt|piat/, 5], [/sobot/, 6],
];
const MIESIACE = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
const NAZWY_DNI = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];

// Dzisiejsza data w Krakowie jako YYYY-MM-DD (niezależnie od strefy czasowej telefonu).
export const dzisWarszawa = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw' }).format(new Date());
const plusDni = (iso, n) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const dzienTygodnia = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay();
const ladnaData = (iso) => {
  const d = new Date(`${iso}T12:00:00Z`);
  return `${d.getUTCDate()} ${MIESIACE[d.getUTCMonth()]}`;
};

export function trwaW(regula, iso) {
  const r = String(regula || '').toLowerCase().trim();
  if (!r) return false;
  const daty = r.match(/\d{4}-\d{2}-\d{2}/g);
  if (daty && daty.length >= 2) return iso >= daty[0] && iso <= daty[1];
  if (daty && daty.length === 1) return iso === daty[0];
  if (/codziennie|każdego dnia|kazdego dnia/.test(r)) return true;
  const dz = dzienTygodnia(iso);
  return DNI.some(([wzor, nr]) => wzor.test(r) && nr === dz);
}

const zakresDat = (a, b) => {
  const da = new Date(`${a}T12:00:00Z`), db = new Date(`${b}T12:00:00Z`);
  return da.getUTCMonth() === db.getUTCMonth()
    ? `${da.getUTCDate()}–${db.getUTCDate()} ${MIESIACE[db.getUTCMonth()]}`
    : `${ladnaData(a)} – ${ladnaData(b)}`;
};

export const poGodzinie = (a, b) => (a.godzina || '99').localeCompare(b.godzina || '99');

function Karta({ w, duza }) {
  return (
    <li className={duza ? 'wyd wyd-duza' : 'wyd'}>
      <span className="wyd-godz">{w.godzina || 'cały dzień'}</span>
      <div className="wyd-tresc">
        <p className="wyd-nazwa">{w.nazwa}</p>
        {w.miejsce && <p className="wyd-miejsce">{w.miejsce}</p>}
        {duza && (w.wiek || w.cena || w.link) && (
          <p className="wyd-info">
            {w.wiek && <span>{w.wiek}</span>}
            {w.cena && <span>{w.cena}</span>}
            {w.link && <a href={w.link} target="_blank" rel="noreferrer">Bilety i szczegóły</a>}
          </p>
        )}
      </div>
    </li>
  );
}

export default function Wydarzenia({ wydarzenia }) {
  const [teraz, setTeraz] = useState(null); // liczone w przeglądarce, żeby „dziś" zawsze było dzisiaj

  useEffect(() => setTeraz(dzisWarszawa()), []);

  if (!teraz) return <section className="wydarzenia wydarzenia-ladowanie" aria-hidden="true" />;

  const jutro = plusDni(teraz, 1);
  // najbliższa sobota po dzisiejszym dniu (w piątek to jutro; w weekend — kolejny tydzień)
  let sob = plusDni(teraz, 1);
  while (dzienTygodnia(sob) !== 6) sob = plusDni(sob, 1);
  const wWeekend = [0, 6].includes(dzienTygodnia(teraz));
  const nd = plusDni(sob, 1);

  // seanse kinowe mają własną sekcję „Dziś w kinach"
  const naDzien = (iso) => wydarzenia.filter((w) => !w.kino && trwaW(w.data_regula, iso)).sort(poGodzinie);
  const dzis = naDzien(teraz);
  const jutroLista = naDzien(jutro);
  const weekend = [...naDzien(sob).map((w) => ({ ...w, dzien: 'sob.' })), ...naDzien(nd).map((w) => ({ ...w, dzien: 'niedz.' }))];

  return (
    <section className="wydarzenia" aria-label="Wydarzenia">
      <div className="wyd-glowna">
        <h2 className="wyd-tytul">Dziś dla dzieci w Krakowie</h2>
        <p className="wyd-data">{NAZWY_DNI[dzienTygodnia(teraz)]}, {ladnaData(teraz)}</p>
        {dzis.length ? (
          <ul className="wyd-lista">{dzis.slice(0, 6).map((w) => <Karta key={w.id} w={w} duza />)}</ul>
        ) : (
          <p className="wyd-pusto">Na dziś nie mamy jeszcze wydarzeń w kalendarzu. Poniżej znajdziesz miejsca, które są otwarte na co dzień.</p>
        )}
      </div>

      <div className="wyd-boczne">
        <div className="wyd-mala">
          <h2 className="wyd-tytul-maly">Jutro dla dzieci w Krakowie</h2>
          <p className="wyd-data">{NAZWY_DNI[dzienTygodnia(jutro)]}, {ladnaData(jutro)}</p>
          {jutroLista.length ? (
            <ul className="wyd-lista">{jutroLista.slice(0, 4).map((w) => <Karta key={w.id} w={w} />)}</ul>
          ) : (
            <p className="wyd-pusto">Brak wydarzeń w kalendarzu.</p>
          )}
        </div>
        <div className="wyd-mala">
          <h2 className="wyd-tytul-maly">{wWeekend ? 'Kolejny weekend dla dzieci w Krakowie' : 'Najbliższy weekend dla dzieci w Krakowie'}</h2>
          <p className="wyd-data">{zakresDat(sob, nd)}</p>
          {weekend.length ? (
            <ul className="wyd-lista">
              {weekend.slice(0, 5).map((w) => <Karta key={`${w.id}-${w.dzien}`} w={{ ...w, godzina: `${w.dzien} ${w.godzina || ''}`.trim() }} />)}
            </ul>
          ) : (
            <p className="wyd-pusto">Brak wydarzeń w kalendarzu.</p>
          )}
        </div>
      </div>
    </section>
  );
}
