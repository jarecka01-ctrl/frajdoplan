import { useEffect, useState } from 'react';
import s from '../styles/Spektakle.module.css';
import { dzisWarszawa, trwaW, plusDni, dzienTygodnia } from './Wydarzenia';

/*
  Kafelek „Najbliższe spektakle": cztery najbliższe spektakle dla dzieci (każdy tytuł raz, z najbliższym terminem),
  z wyprzedzeniem do 60 dni, żeby można było zaplanować weekend. Bierze wydarzenia powiązane z teatrem z bazy
  albo z „spektakl"/„teatr" w nazwie.
*/

const DZIEN = ['niedz.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.'];
const ILE = 4;
const WYPRZEDZENIE = 60;

const krotka = (iso) => {
  const [, m, d] = iso.split('-').map(Number);
  return `${DZIEN[dzienTygodnia(iso)]} ${d}.${String(m).padStart(2, '0')}`;
};

// Pierwszy termin każdego wydarzenia, od dziś do przodu, posortowane po dacie.
function najblizsze(lista, dzis) {
  const wynik = [];
  const widziane = new Set();
  for (let i = 0; i <= WYPRZEDZENIE && wynik.length < ILE * 3; i += 1) {
    const d = plusDni(dzis, i);
    lista.forEach((w) => {
      if (!widziane.has(w.id) && trwaW(w.data_regula, d)) { widziane.add(w.id); wynik.push({ ...w, dzien: d }); }
    });
  }
  return wynik
    .sort((a, b) => a.dzien.localeCompare(b.dzien) || (a.godzina || '99').localeCompare(b.godzina || '99'))
    .slice(0, ILE);
}

export default function Spektakle({ places, wydarzenia }) {
  const [dzis, setDzis] = useState(null);
  useEffect(() => setDzis(dzisWarszawa()), []);
  if (!dzis) return <div className={s.kafel} aria-hidden="true" />;

  const poId = Object.fromEntries(places.map((p) => [p.id, p]));
  const teatralne = wydarzenia.filter((w) => {
    if (w.kino) return false;
    const m = w.miejsceId && poId[w.miejsceId];
    return (m && m.podkategoria === 'Teatr') || /spektakl|teatr/i.test(w.nazwa);
  });
  const wiersze = najblizsze(teatralne, dzis);

  const teatry = places
    .filter((p) => p.podkategoria === 'Teatr' && p.website)
    .sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0))
    .slice(0, 5);

  return (
    <section className={s.kafel} aria-label="Najbliższe spektakle dla dzieci">
      <h2 className={s.tytul}>Najbliższe spektakle</h2>
      <p className={s.podtytul}>Dla dzieci, do zaplanowania na weekend</p>
      {wiersze.length ? (
        <ul className={s.lista}>
          {wiersze.map((w) => (
            <li key={`${w.id}-${w.dzien}`} className={s.wiersz}>
              <span className={s.data}>{krotka(w.dzien)}{w.godzina ? ` · ${w.godzina}` : ''}</span>
              {w.link ? <a href={w.link} target="_blank" rel="noreferrer" className={s.nazwa}>{w.nazwa}</a> : <strong className={s.nazwa}>{w.nazwa}</strong>}
              {w.miejsce && <small>{w.miejsce}{w.wiek ? `, ${w.wiek}` : ''}</small>}
            </li>
          ))}
        </ul>
      ) : (
        <>
          <p className={s.pusto}>Repertuar pojawi się tutaj, gdy włączymy automatyczne pobieranie. Na razie sprawdzisz go na stronach teatrów:</p>
          <ul className={s.linki}>
            {teatry.map((t) => (
              <li key={t.id}><a href={t.website} target="_blank" rel="noreferrer">{t.name}</a></li>
            ))}
          </ul>
        </>
      )}
      <p className={s.wiecej}><a href="/atrakcje/teatry">Wszystkie teatry →</a></p>
    </section>
  );
}
