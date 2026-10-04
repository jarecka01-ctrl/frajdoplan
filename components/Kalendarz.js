import { useEffect, useMemo, useState } from 'react';
import { dzisWarszawa, trwaW, poGodzinie, dzienTygodnia, MIESIACE } from './Wydarzenia';

/*
  Kalendarz na cały miesiąc (jak na krakow.pl): kropka przy dniach z wydarzeniami,
  kliknięcie dnia pokazuje listę. Można przejść do dwóch kolejnych miesięcy — żeby zapisać się z wyprzedzeniem.
*/

const MIANOWNIK = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
const DNI_KROTKO = ['pon', 'wt', 'śr', 'czw', 'pt', 'sob', 'niedz'];
const KATEGORIE = [
  { id: 'koncert', nazwa: 'Koncerty', ikona: '🎵' },
  { id: 'spektakl', nazwa: 'Spektakle', ikona: '🎭' },
  { id: 'warsztaty', nazwa: 'Warsztaty', ikona: '🎨' },
  { id: 'jarmark', nazwa: 'Jarmarki', ikona: '🛍️' },
  { id: 'festyn', nazwa: 'Festyny', ikona: '🎪' },
  { id: 'wystawa', nazwa: 'Wystawy', ikona: '🖼️' },
];
const pad = (n) => String(n).padStart(2, '0');

export default function Kalendarz({ wydarzenia: wszystkie }) {
  const [rodzaje, setRodzaje] = useState([]); // kilka kategorii naraz; pusto = wszystkie
  // seanse kinowe są tylko w kafelku „Dziś w kinach"
  const bezKin = useMemo(() => wszystkie.filter((w) => !w.kino), [wszystkie]);
  // filtry pokazujemy tylko, gdy arkusz ma wypełnioną kolumnę `kategoria`
  const dostepne = KATEGORIE.filter((k) => bezKin.some((w) => w.kategoria === k.id));
  const wydarzenia = rodzaje.length ? bezKin.filter((w) => rodzaje.includes(w.kategoria)) : bezKin;
  const ikonaKat = (w) => (KATEGORIE.find((k) => k.id === w.kategoria) || {}).ikona;

  const [dzis, setDzis] = useState(null);
  const [przesun, setPrzesun] = useState(0); // 0 = bieżący miesiąc, maks. 2
  const [wybrany, setWybrany] = useState(null);
  useEffect(() => { const d = dzisWarszawa(); setDzis(d); setWybrany(d); }, []);
  if (!dzis) return <section className="kalendarz" aria-hidden="true" />;

  const [r0, m0] = dzis.split('-').map(Number);
  const m = ((m0 - 1 + przesun) % 12) + 1;
  const r = r0 + Math.floor((m0 - 1 + przesun) / 12);
  const ileDni = new Date(Date.UTC(r, m, 0)).getUTCDate();
  const pierwszy = `${r}-${pad(m)}-01`;
  const przesuniecie = (dzienTygodnia(pierwszy) + 6) % 7; // poniedziałek = 0

  const dni = Array.from({ length: ileDni }, (_, i) => {
    const iso = `${r}-${pad(m)}-${pad(i + 1)}`;
    return { iso, n: i + 1, ile: wydarzenia.filter((w) => trwaW(w.data_regula, iso)).length };
  });
  const naWybrany = wybrany ? wydarzenia.filter((w) => trwaW(w.data_regula, wybrany)).sort(poGodzinie) : [];
  const d = wybrany ? new Date(`${wybrany}T12:00:00Z`) : null;

  return (
    <section className="kalendarz" aria-label="Kalendarz wydarzeń">
      <h2 className="sekcja">Kalendarz wydarzeń dla dzieci</h2>
      {dostepne.length > 0 && (
        <div className="rodzaje" role="group" aria-label="Rodzaj wydarzenia">
          <button className="rodzaj" aria-pressed={rodzaje.length === 0} onClick={() => setRodzaje([])}>
            <span className="rodzaj-nazwa">Wszystkie</span>
          </button>
          {dostepne.map((k) => (
            <button
              key={k.id}
              className="rodzaj"
              aria-pressed={rodzaje.includes(k.id)}
              onClick={() => setRodzaje((r) => (r.includes(k.id) ? r.filter((x) => x !== k.id) : [...r, k.id]))}
            >
              <span className="rodzaj-ikona" aria-hidden="true">{k.ikona}</span>
              <span className="rodzaj-nazwa">{k.nazwa}</span>
            </button>
          ))}
        </div>
      )}
      <div className="kal-wrap">
        <div className="kal-miesiac">
          <div className="kal-naglowek">
            <button className="kal-nav" onClick={() => setPrzesun((p) => Math.max(0, p - 1))} disabled={przesun === 0} aria-label="Poprzedni miesiąc">‹</button>
            <p className="kal-tytul">{MIANOWNIK[m - 1]} {r}</p>
            <button className="kal-nav" onClick={() => setPrzesun((p) => Math.min(2, p + 1))} disabled={przesun === 2} aria-label="Następny miesiąc">›</button>
          </div>
          <div className="kal-siatka">
            {DNI_KROTKO.map((x) => <span key={x} className="kal-dzien-nazwa">{x}</span>)}
            {Array.from({ length: przesuniecie }, (_, i) => <span key={`p${i}`} />)}
            {dni.map((x) => (
              <button
                key={x.iso}
                className={`kal-dzien ${x.iso === dzis ? 'kal-dzis' : ''} ${x.iso < dzis ? 'kal-minione' : ''}`}
                aria-pressed={x.iso === wybrany}
                aria-label={`${x.n} ${MIESIACE[m - 1]}${x.ile ? `, wydarzeń: ${x.ile}` : ''}`}
                onClick={() => setWybrany(x.iso)}
              >
                {x.n}
                {x.ile > 0 && <span className="kal-kropka" aria-hidden="true">{x.ile > 1 ? x.ile : ''}</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="kal-lista">
          {d && <p className="kal-lista-tytul">{d.getUTCDate()} {MIESIACE[d.getUTCMonth()]}</p>}
          {naWybrany.length ? (
            <ul className="wyd-lista">
              {naWybrany.map((w) => (
                <li key={w.id} className="wyd wyd-duza">
                  <span className="wyd-godz">{w.godzina || 'cały dzień'}</span>
                  <div className="wyd-tresc">
                    <p className="wyd-nazwa">{ikonaKat(w) && <span aria-hidden="true" title={w.kategoria}>{ikonaKat(w)} </span>}{w.nazwa}</p>
                    {w.miejsce && <p className="wyd-miejsce">{w.miejsce}</p>}
                    {(w.wiek || w.cena || w.link) && (
                      <p className="wyd-info">
                        {w.wiek && <span>{w.wiek}</span>}
                        {w.cena && <span>{w.cena}</span>}
                        {w.link && <a href={w.link} target="_blank" rel="noreferrer">Zapisy i szczegóły</a>}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="wyd-pusto">Na ten dzień nie mamy jeszcze wydarzeń w kalendarzu.</p>
          )}
        </div>
      </div>
    </section>
  );
}
