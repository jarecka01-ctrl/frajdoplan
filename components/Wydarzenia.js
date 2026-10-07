import { useEffect, useState } from 'react';
import { adresKarty } from '../lib/miejsca';
import Bilet, { Nazwa, Szczegoly } from './Bilet';

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
export const MIESIACE = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
export const NAZWY_DNI = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];

// Dzisiejsza data w Krakowie jako YYYY-MM-DD (niezależnie od strefy czasowej telefonu).
export const dzisWarszawa = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw' }).format(new Date());
// Godzina w Krakowie jako HH:MM (do porównań z godziną seansu).
export const godzinaWarszawa = () => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
export const plusDni = (iso, n) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const dzienTygodnia = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay();
export const ladnaData = (iso) => {
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

export const zakresDat = (a, b) => {
  const da = new Date(`${a}T12:00:00Z`), db = new Date(`${b}T12:00:00Z`);
  return da.getUTCMonth() === db.getUTCMonth()
    ? `${da.getUTCDate()}–${db.getUTCDate()} ${MIESIACE[db.getUTCMonth()]}`
    : `${ladnaData(a)} – ${ladnaData(b)}`;
};

export const poGodzinie = (a, b) => (a.godzina || '99').localeCompare(b.godzina || '99');

function Karta({ w }) {
  return (
    <Bilet godzina={w.godzina}>
      <Nazwa nazwa={w.nazwa} />
      <Szczegoly czesci={[w.miejsce, w.wiek, w.cena, w.link && <a className="tk-link" href={w.link} target="_blank" rel="noreferrer">Szczegóły</a>]} />
    </Bilet>
  );
}

// Tytuł wydarzenia jako link: do biletów (link_biletow), a gdy go brak — do karty miejsca (/miejsce/…)
// (powiazane_miejsce_id); gdy i tego brak, zwykły tekst.
function Tytul({ w, miejsca }) {
  if (w.link) return <Nazwa nazwa={w.nazwa} href={w.link} />;
  if (w.miejsceId && miejsca.has(w.miejsceId)) return <Nazwa nazwa={w.nazwa} href={miejsca.get(w.miejsceId)} zewnetrzny={false} />;
  return <Nazwa nazwa={w.nazwa} />;
}

// Małe kafelki „Jutro" i „Weekend": stała wysokość, po 3 wydarzenia na slajd, strzałki ‹ › i przesunięcie palcem.
const NA_SLAJD = 3;
function Slajdy({ pozycje, miejsca, pusto, etykieta }) {
  const [nr, setNr] = useState(0);
  const [start, setStart] = useState(null);
  const ile = Math.max(1, Math.ceil(pozycje.length / NA_SLAJD));
  const biezacy = Math.min(nr, ile - 1);
  const idz = (krok) => setNr(Math.min(ile - 1, Math.max(0, biezacy + krok)));
  if (!pozycje.length) return <p className="wyd-pusto">{pusto}</p>;
  const widoczne = pozycje.slice(biezacy * NA_SLAJD, (biezacy + 1) * NA_SLAJD);
  return (
    <div className="slajdy" aria-roledescription="karuzela" aria-label={etykieta}>
      <div
        className="slajdy-okno"
        onTouchStart={(e) => setStart(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (start === null) return;
          const dx = e.changedTouches[0].clientX - start;
          setStart(null);
          if (Math.abs(dx) > 40) idz(dx < 0 ? 1 : -1);
        }}
      >
        <ul className="wyd-lista slajdy-lista" aria-live="polite">
          {widoczne.map((w) => (
            <Bilet key={`${w.id}-${w.dzien || ''}`} className="tk-s" nad={w.dzien} godzina={w.godzina}>
              <Tytul w={w} miejsca={miejsca} />
              <Szczegoly czesci={[w.miejsce]} />
            </Bilet>
          ))}
        </ul>
      </div>
      {ile > 1 && (
        <div className="slajdy-nav">
          <button type="button" className="slajdy-strzalka" onClick={() => idz(-1)} disabled={biezacy === 0} aria-label="Poprzednie wydarzenia">‹</button>
          <span className="slajdy-licznik" aria-label={`Strona ${biezacy + 1} z ${ile}`}>{biezacy + 1} / {ile}</span>
          <button type="button" className="slajdy-strzalka" onClick={() => idz(1)} disabled={biezacy === ile - 1} aria-label="Następne wydarzenia">›</button>
        </div>
      )}
    </div>
  );
}

export default function Wydarzenia({ wydarzenia, places = [] }) {
  const [teraz, setTeraz] = useState(null); // liczone w przeglądarce, żeby „dziś" zawsze było dzisiaj
  const [glowny, setGlowny] = useState('dzis'); // co pokazuje duża sekcja: dziś albo (po kliknięciu) jutro

  useEffect(() => setTeraz(dzisWarszawa()), []);

  if (!teraz) return <section className="wydarzenia wydarzenia-ladowanie" aria-hidden="true" />;
  const miejsca = new Map(places.map((p) => [p.id, adresKarty(p)])); // karty miejsc, do których można linkować na stronie głównej

  const jutro = plusDni(teraz, 1);
  // najbliższa sobota po dzisiejszym dniu (w piątek to jutro; w weekend — kolejny tydzień)
  let sob = plusDni(teraz, 1);
  while (dzienTygodnia(sob) !== 6) sob = plusDni(sob, 1);
  const wWeekend = [0, 6].includes(dzienTygodnia(teraz));
  const nd = plusDni(sob, 1);

  // seanse kinowe mają własną sekcję „Dziś w kinach"
  const naDzien = (iso) => wydarzenia.filter((w) => !w.kino && trwaW(w.data_regula, iso)).sort(poGodzinie);
  // „Dziś" to tylko to, co jeszcze się nie zaczęło (albo trwa cały dzień), tak samo jak w kafelku „Dziś w kinach"
  const godz = godzinaWarszawa();
  const dzis = naDzien(teraz).filter((w) => !w.godzina || w.godzina > godz);
  const jutroLista = naDzien(jutro);
  const weekend = [...naDzien(sob).map((w) => ({ ...w, dzien: 'sob.' })), ...naDzien(nd).map((w) => ({ ...w, dzien: 'niedz.' }))];

  return (
    <section className="wydarzenia" aria-label="Wydarzenia">
      <div className="wyd-glowna">
        <span className="stempel">{glowny === 'dzis' ? 'Dziś' : 'Jutro'}</span>
        {glowny === 'dzis' ? (
          <>
            <h2 className="wyd-tytul">Dziś dla dzieci w Krakowie</h2>
            <p className="wyd-data">{NAZWY_DNI[dzienTygodnia(teraz)]}, {ladnaData(teraz)}</p>
            {dzis.length ? (
              <ul className="wyd-lista">{dzis.slice(0, 6).map((w) => <Karta key={w.id} w={w} />)}</ul>
            ) : (
              <>
                <p className="wyd-pusto">Na dziś to już wszystko. Zobacz, co jest jutro</p>
                <p><button type="button" className="przycisk" onClick={() => setGlowny('jutro')}>Jutro dla dzieci w Krakowie</button></p>
              </>
            )}
          </>
        ) : (
          <>
            <h2 className="wyd-tytul">Jutro dla dzieci w Krakowie</h2>
            <p className="wyd-data">{NAZWY_DNI[dzienTygodnia(jutro)]}, {ladnaData(jutro)}</p>
            {jutroLista.length ? (
              <ul className="wyd-lista">{jutroLista.slice(0, 6).map((w) => <Karta key={w.id} w={w} />)}</ul>
            ) : (
              <p className="wyd-pusto">Na jutro też nie mamy jeszcze wydarzeń w kalendarzu.</p>
            )}
            <p><button type="button" className="przycisk" onClick={() => setGlowny('dzis')}>Wróć do dziś</button></p>
          </>
        )}
      </div>

      <div className="wyd-boczne">
        <div className="wyd-mala">
          <span className="stempel">Jutro</span>
          <h2 className="wyd-tytul-maly">Jutro dla dzieci w Krakowie</h2>
          <p className="wyd-data">{NAZWY_DNI[dzienTygodnia(jutro)]}, {ladnaData(jutro)}</p>
          <Slajdy
            key={`jutro-${jutroLista.length}`}
            pozycje={jutroLista}
            miejsca={miejsca}
            pusto="Brak wydarzeń w kalendarzu."
            etykieta="Wydarzenia jutro"
          />
        </div>
        <div className="wyd-mala">
          <span className="stempel stempel-weekend">Weekend</span>
          <h2 className="wyd-tytul-maly">{wWeekend ? 'Kolejny weekend dla dzieci w Krakowie' : 'Najbliższy weekend dla dzieci w Krakowie'}</h2>
          <p className="wyd-data">{zakresDat(sob, nd)}</p>
          <Slajdy
            key={`weekend-${weekend.length}`}
            pozycje={weekend}
            miejsca={miejsca}
            pusto="Brak wydarzeń w kalendarzu."
            etykieta="Wydarzenia w najbliższy weekend"
          />
        </div>
      </div>
    </section>
  );
}
