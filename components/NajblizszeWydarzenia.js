import { useEffect, useState } from 'react';
import s from '../styles/NajblizszeWydarzenia.module.css';
import { dzisWarszawa, trwaW, plusDni, dzienTygodnia } from './Wydarzenia';

/*
  Kafelek „Najbliższe …" (spektakle, koncerty): cztery najbliższe wydarzenia dla dzieci (każde raz, z najbliższym
  terminem), z wyprzedzeniem, żeby można było zaplanować weekend. Bierze wydarzenia powiązane z miejscem
  z wybranej podkategorii albo z wzorem w nazwie. Kafelek jest zawsze widoczny: bez wydarzeń pokazuje
  krótką informację i linki do stron miejsc z bazy.
*/

const DZIEN = ['niedz.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.'];
const ILE = 4;

const krotka = (iso) => {
  const [, m, d] = iso.split('-').map(Number);
  return `${DZIEN[dzienTygodnia(iso)]} ${d}.${String(m).padStart(2, '0')}`;
};

// Pierwszy termin każdego wydarzenia, od dziś do przodu, posortowane po dacie.
function najblizsze(lista, dzis, wyprzedzenie) {
  const wynik = [];
  const widziane = new Set();
  for (let i = 0; i <= wyprzedzenie && wynik.length < ILE * 3; i += 1) {
    const d = plusDni(dzis, i);
    lista.forEach((w) => {
      if (!widziane.has(w.id) && trwaW(w.data_regula, d)) { widziane.add(w.id); wynik.push({ ...w, dzien: d }); }
    });
  }
  return wynik
    .sort((a, b) => a.dzien.localeCompare(b.dzien) || (a.godzina || '99').localeCompare(b.godzina || '99'))
    .slice(0, ILE);
}

/*
  Propsy:
    tytul, podtytul, etykieta — teksty kafelka;
    podkategoria, wzorNazwy   — które wydarzenia bierzemy (miejsce z podkategorii, nazwa pasuje do wzoru albo `typ` z data/repertuar.json);
    wyprzedzenie              — ile dni do przodu szukamy;
    pusto                     — informacja, gdy nie ma wydarzeń; strony — [{ id, name, website }] linki pod nią;
    wiecej                    — { href, tekst } link na dole.
*/
export default function NajblizszeWydarzenia({
  places, wydarzenia, tytul, podtytul, etykieta, podkategoria, wzorNazwy, typ, wyprzedzenie, pusto, strony, wiecej,
}) {
  const [dzis, setDzis] = useState(null);
  useEffect(() => setDzis(dzisWarszawa()), []);
  if (!dzis) return <div className={s.kafel} aria-hidden="true" />;

  const poId = Object.fromEntries(places.map((p) => [p.id, p]));
  const pasujace = wydarzenia.filter((w) => {
    if (w.kino) return false;
    const m = w.miejsceId && poId[w.miejsceId];
    return (typ && w.typ === typ) || (m && m.podkategoria === podkategoria) || w.miejscePodkat === podkategoria || wzorNazwy.test(w.nazwa);
  });
  const wiersze = najblizsze(pasujace, dzis, wyprzedzenie);

  return (
    <section className={s.kafel} aria-label={etykieta}>
      <h2 className={s.tytul}>{tytul}</h2>
      <p className={s.podtytul}>{podtytul}</p>
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
          <p className={s.pusto}>{pusto}</p>
          {strony.length > 0 && (
            <ul className={s.linki}>
              {strony.map((t) => (
                <li key={t.id}><a href={t.website} target="_blank" rel="noreferrer">{t.name}</a></li>
              ))}
            </ul>
          )}
        </>
      )}
      <p className={s.wiecej}><a href={wiecej.href}>{wiecej.tekst}</a></p>
    </section>
  );
}
