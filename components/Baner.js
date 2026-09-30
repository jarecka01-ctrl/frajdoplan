import { useEffect, useState } from 'react';
import { dzisWarszawa, ladnaData, zakresDat } from './Wydarzenia';

/*
  Baner z 2–3 głównymi wydarzeniami (w przyszłości: miejsca promowane).
  Wydarzenie trafia tu, gdy w arkuszu „Wydarzenia" ma w kolumnie `wyrozniony` wpisane „tak".
  Opcjonalnie: `obrazek` (adres obrazka) i `opis` (jedno zdanie).
*/

const zakres = (regula) => {
  const d = String(regula || '').match(/\d{4}-\d{2}-\d{2}/g) || [];
  return d.length ? [d[0], d[1] || d[0]] : null;
};
const tekstDat = ([od, doo]) => (od === doo ? ladnaData(od) : zakresDat(od, doo));
const KOLORY = ['baner-slonce', 'baner-mak', 'baner-tusz'];

export default function Baner({ wydarzenia }) {
  const [dzis, setDzis] = useState(null);
  const [akt, setAkt] = useState(0);
  const [pauza, setPauza] = useState(false);
  useEffect(() => setDzis(dzisWarszawa()), []);

  const lista = !dzis ? [] : wydarzenia
    .filter((w) => w.wyrozniony)
    .map((w) => ({ ...w, daty: zakres(w.data_regula) }))
    .filter((w) => w.daty && w.daty[1] >= dzis)
    .sort((a, b) => a.daty[0].localeCompare(b.daty[0]))
    .slice(0, 3);

  useEffect(() => {
    if (lista.length < 2 || pauza) return undefined;
    const t = setInterval(() => setAkt((a) => (a + 1) % lista.length), 6000);
    return () => clearInterval(t);
  }, [lista.length, pauza]);

  if (!lista.length) return null;
  const w = lista[akt % lista.length];

  return (
    <section className="baner" aria-roledescription="karuzela" aria-label="Najważniejsze wydarzenia"
      onMouseEnter={() => setPauza(true)} onMouseLeave={() => setPauza(false)}>
      <div className={`baner-slajd ${KOLORY[akt % KOLORY.length]} ${w.obrazek ? 'z-obrazkiem' : ''}`}>
        <div className="baner-tekst">
          <p className="baner-data">{tekstDat(w.daty)}{w.miejsce ? `, ${w.miejsce}` : ''}</p>
          <h2 className="baner-tytul">{w.nazwa}</h2>
          {w.opis && <p className="baner-opis">{w.opis}</p>}
          <p className="baner-info">
            {w.wiek && <span>{w.wiek}</span>}
            {w.cena && <span>{w.cena}</span>}
          </p>
          {w.link && <a className="przycisk baner-przycisk" href={w.link} target="_blank" rel="noreferrer">Bilety i szczegóły</a>}
        </div>
        {w.obrazek && <img className="baner-obrazek" src={w.obrazek} alt="" loading="lazy" />}
      </div>
      {lista.length > 1 && (
        <div className="baner-kropki">
          {lista.map((x, i) => (
            <button key={x.id} className="baner-kropka" aria-label={`Pokaż: ${x.nazwa}`} aria-pressed={i === akt % lista.length} onClick={() => setAkt(i)} />
          ))}
        </div>
      )}
    </section>
  );
}
