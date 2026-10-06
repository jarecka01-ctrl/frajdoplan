import { useEffect, useMemo, useState } from 'react';
import { dzisWarszawa, trwaW, poGodzinie, dzienTygodnia, MIESIACE } from './Wydarzenia';
import { grupujTerminy } from '../lib/grupowanie';

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
  { id: 'pokaz', nazwa: 'Pokazy', ikona: '✨' },
  { id: 'czytanie', nazwa: 'Czytanie', ikona: '📚' },
  { id: 'wystawa', nazwa: 'Wystawy', ikona: '🖼️' },
  { id: 'jarmark', nazwa: 'Jarmarki', ikona: '🎪' },
  { id: 'festyn', nazwa: 'Festyny', ikona: '🎈' },
  { id: 'sport', nazwa: 'Sport', ikona: '⚽' },
  { id: 'spacer', nazwa: 'Spacery', ikona: '🥾' },
  { id: 'planszowki', nazwa: 'Planszówki', ikona: '🎲' },
  { id: 'inne', nazwa: 'Inne', ikona: '➕' },
];
const pad = (n) => String(n).padStart(2, '0');
const NA_START = 30; // tyle wierszy w widoku miesiąca, reszta po przycisku Pokaż więcej
const MIESIAC_MIEJSCOWNIK = ['styczniu', 'lutym', 'marcu', 'kwietniu', 'maju', 'czerwcu', 'lipcu', 'sierpniu', 'wrześniu', 'październiku', 'listopadzie', 'grudniu'];
const DNI_SKROT = ['niedz.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.'];
// formy rzeczownika do nagłówka: 1 / 2–4 / 5 i więcej
const RZECZOWNIKI = {
  koncert: ['koncert', 'koncerty', 'koncertów'],
  spektakl: ['spektakl', 'spektakle', 'spektakli'],
  warsztaty: ['warsztat', 'warsztaty', 'warsztatów'],
  pokaz: ['pokaz', 'pokazy', 'pokazów'],
  czytanie: ['czytanie', 'czytania', 'czytań'],
  wystawa: ['wystawa', 'wystawy', 'wystaw'],
  jarmark: ['jarmark', 'jarmarki', 'jarmarków'],
  festyn: ['festyn', 'festyny', 'festynów'],
  sport: ['wydarzenie sportowe', 'wydarzenia sportowe', 'wydarzeń sportowych'],
  spacer: ['spacer', 'spacery', 'spacerów'],
  planszowki: ['planszówka', 'planszówki', 'planszówek'],
};
const WYDARZENIA = ['wydarzenie', 'wydarzenia', 'wydarzeń'];
const forma = (n, [jeden, kilka, wiele]) => {
  if (n === 1) return jeden;
  const d = n % 10;
  return d >= 2 && d <= 4 && !(n % 100 >= 12 && n % 100 <= 14) ? kilka : wiele;
};
// sob. 10 października
const naglowekDnia = (iso) => {
  const [, mm, dd] = iso.split('-').map(Number);
  return `${DNI_SKROT[dzienTygodnia(iso)]} ${dd} ${MIESIACE[mm - 1]}`;
};

export default function Kalendarz({ wydarzenia: wszystkie }) {
  const [rodzaje, setRodzaje] = useState([]); // kilka kategorii naraz; pusto = wszystkie
  // seanse kinowe są tylko w kafelku „Dziś w kinach"
  const bezKin = useMemo(() => wszystkie.filter((w) => !w.kino), [wszystkie]);
  const ikonaKat = (w) => (KATEGORIE.find((k) => k.id === w.kategoria) || {}).ikona;

  const [dzis, setDzis] = useState(null);
  const [przesun, setPrzesun] = useState(0); // 0 = bieżący miesiąc, maks. 2
  const [wybrany, setWybrany] = useState(null);
  const [widok, setWidok] = useState(null); // null = automat: z filtrem kategorii otwiera się Cały miesiąc, bez filtra Dzień
  const [limit, setLimit] = useState({ klucz: '', n: NA_START });
  useEffect(() => { const d = dzisWarszawa(); setDzis(d); setWybrany(d); }, []);
  if (!dzis) return <section className="kalendarz" aria-hidden="true" />;

  const [r0, m0] = dzis.split('-').map(Number);
  const m = ((m0 - 1 + przesun) % 12) + 1;
  const r = r0 + Math.floor((m0 - 1 + przesun) / 12);
  const ileDni = new Date(Date.UTC(r, m, 0)).getUTCDate();
  const pierwszy = `${r}-${pad(m)}-01`;
  const przesuniecie = (dzienTygodnia(pierwszy) + 6) % 7; // poniedziałek = 0

  // filtry: tylko kategorie z wydarzeniami w oglądanym miesiącu (gdy arkusz nie ma kolumny `kategoria`, ich nie ma)
  const wMiesiacu = bezKin.filter((w) => Array.from({ length: ileDni }, (_, i) => `${r}-${pad(m)}-${pad(i + 1)}`).some((iso) => trwaW(w.data_regula, iso)));
  const dostepne = KATEGORIE.filter((k) => wMiesiacu.some((w) => w.kategoria === k.id));
  const aktywne = rodzaje.filter((id) => dostepne.some((k) => k.id === id));
  const wydarzenia = aktywne.length ? bezKin.filter((w) => aktywne.includes(w.kategoria)) : bezKin;

  const dni = Array.from({ length: ileDni }, (_, i) => {
    const iso = `${r}-${pad(m)}-${pad(i + 1)}`;
    return { iso, n: i + 1, ile: wydarzenia.filter((w) => trwaW(w.data_regula, iso)).length };
  });
  const naWybrany = wybrany ? wydarzenia.filter((w) => trwaW(w.data_regula, wybrany)).sort(poGodzinie) : [];
  const d = wybrany ? new Date(`${wybrany}T12:00:00Z`) : null;

  // widok Cały miesiąc: wszystkie wydarzenia (bez seansów) z oglądanego miesiąca od dziś, pogrupowane po dniach;
  // ten sam tytuł, dzień i miejsce = jeden wiersz z kilkoma godzinami
  const widokAktywny = widok || (aktywne.length ? 'miesiac' : 'dzien');
  const terminy = dni.filter((x) => x.iso >= dzis).flatMap((x) => wydarzenia.filter((w) => trwaW(w.data_regula, x.iso)).map((w) => ({
    id: w.id, nazwa: w.nazwa, miejsce: w.miejsce, dzien: x.iso, godzina: w.godzina, link: w.link, wiek: w.wiek, cena: w.cena, kategoria: w.kategoria,
  })));
  const wiersze = grupujTerminy(terminy);
  const klucz = `${r}-${m}-${aktywne.join(',')}`;
  const ile = limit.klucz === klucz ? limit.n : NA_START;
  const poDniach = [];
  wiersze.slice(0, ile).forEach((w) => {
    if (!poDniach.length || poDniach[poDniach.length - 1].dzien !== w.dzien) poDniach.push({ dzien: w.dzien, wiersze: [] });
    poDniach[poDniach.length - 1].wiersze.push(w);
  });
  const rzeczownik = aktywne.length === 1 && RZECZOWNIKI[aktywne[0]] ? RZECZOWNIKI[aktywne[0]] : WYDARZENIA;
  const naglowekMiesiaca = wiersze.length
    ? `${wiersze.length} ${forma(wiersze.length, rzeczownik)} w ${MIESIAC_MIEJSCOWNIK[m - 1]}`
    : `Brak wydarzeń w ${MIESIAC_MIEJSCOWNIK[m - 1]}`;

  return (
    <section className="kalendarz" aria-label="Kalendarz wydarzeń">
      <h2 className="sekcja">Kalendarz wydarzeń dla dzieci</h2>
      {dostepne.length > 0 && (
        <div className="rodzaje kal-filtry" role="group" aria-label="Rodzaj wydarzenia">
          <button className="rodzaj" aria-pressed={aktywne.length === 0} onClick={() => setRodzaje([])}>
            <span className="rodzaj-nazwa">Wszystkie</span>
          </button>
          {dostepne.map((k) => (
            <button
              key={k.id}
              className="rodzaj"
              aria-pressed={aktywne.includes(k.id)}
              onClick={() => setRodzaje(aktywne.includes(k.id) ? aktywne.filter((x) => x !== k.id) : [...aktywne, k.id])}
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
                onClick={() => { setWybrany(x.iso); setWidok('dzien'); }}
              >
                {x.n}
                {x.ile > 0 && <span className="kal-kropka" aria-hidden="true">{x.ile > 1 ? x.ile : ''}</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="kal-lista">
          <div className="kal-pasek">
            <p className="kal-lista-tytul">
              {widokAktywny === 'miesiac' ? naglowekMiesiaca : d && `${d.getUTCDate()} ${MIESIACE[d.getUTCMonth()]}`}
            </p>
            <div className="widok" role="group" aria-label="Widok kalendarza">
              <button type="button" className="widok-btn" aria-pressed={widokAktywny === 'dzien'} onClick={() => setWidok('dzien')}>Dzień</button>
              <button type="button" className="widok-btn" aria-pressed={widokAktywny === 'miesiac'} onClick={() => setWidok('miesiac')}>Cały miesiąc</button>
            </div>
          </div>
          {widokAktywny === 'miesiac' ? (
            wiersze.length ? (
              <>
                {poDniach.map((g) => (
                  <section key={g.dzien} className="kal-dzien-grupa" aria-label={naglowekDnia(g.dzien)}>
                    <h3 className="kal-dzien-naglowek">{naglowekDnia(g.dzien)}</h3>
                    <ul className="kal-wiersze">
                      {g.wiersze.map((w) => (
                        <li key={`${w.id}-${w.dzien}`} className="kal-wiersz">
                          <p className="wyd-nazwa">
                            {ikonaKat(w) && <span aria-hidden="true" title={w.kategoria}>{ikonaKat(w)} </span>}
                            {w.link ? <a href={w.link} target="_blank" rel="noreferrer">{w.nazwa}</a> : w.nazwa}
                          </p>
                          <p className="wyd-miejsce">
                            {w.godziny.length ? w.godziny.map((g2, i) => (
                              <span key={g2.godzina}>
                                {i > 0 && ', '}
                                {g2.link && (w.godziny.length > 1 || g2.link !== w.link) ? <a href={g2.link} target="_blank" rel="noreferrer">{g2.godzina}</a> : g2.godzina}
                              </span>
                            )) : 'cały dzień'}
                            {w.miejsce && ` · ${w.miejsce}`}
                          </p>
                          {(w.wiek || w.cena) && (
                            <p className="wyd-info">
                              {w.wiek && <span>{w.wiek}</span>}
                              {w.cena && <span>{w.cena}</span>}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
                {wiersze.length > ile && (
                  <div className="wiecej">
                    <button type="button" className="przycisk" onClick={() => setLimit({ klucz, n: ile + NA_START })}>
                      Pokaż więcej ({wiersze.length - ile})
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="wyd-pusto">W tym miesiącu nie mamy jeszcze wydarzeń w kalendarzu.</p>
            )
          ) : naWybrany.length ? (
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
                        {w.link && <a href={w.link} target="_blank" rel="noreferrer">Szczegóły</a>}
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
