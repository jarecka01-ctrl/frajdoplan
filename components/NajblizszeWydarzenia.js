import { useEffect, useState } from 'react';
import { dzisWarszawa, trwaW, plusDni } from './Wydarzenia';
import { grupujTerminy, krotkaDataBilet } from '../lib/grupowanie';
import Bilet, { Nazwa, Szczegoly } from './Bilet';

/*
  Kafelek „Najbliższe …" (spektakle, koncerty): cztery najbliższe wiersze (każde wydarzenie raz, z najbliższym
  terminem; ten sam tytuł, dzień i miejsce = jeden wiersz z wieloma godzinami), z wyprzedzeniem, żeby można było zaplanować weekend. Bierze wydarzenia powiązane z miejscem
  z wybranej podkategorii albo z wzorem w nazwie. Kafelek jest zawsze widoczny: bez wydarzeń pokazuje
  krótką informację i linki do stron miejsc z bazy.
*/

const ILE = 4;

// Pierwszy termin każdego wydarzenia od dziś do przodu; wydarzenia o tym samym tytule, w tym samym dniu
// i miejscu to jeden wiersz z wieloma godzinami („sob. 17.10 · 11:00, 13:00"). Bierzemy ILE najbliższych wierszy.
function najblizsze(lista, dzis, wyprzedzenie) {
  const terminy = [];
  const widziane = new Set();
  for (let i = 0; i <= wyprzedzenie; i += 1) {
    const d = plusDni(dzis, i);
    lista.forEach((w) => {
      if (!widziane.has(w.id) && trwaW(w.data_regula, d)) { widziane.add(w.id); terminy.push({ ...w, dzien: d }); }
    });
  }
  return grupujTerminy(terminy).slice(0, ILE);
}

/*
  Propsy:
    tytul, podtytul, etykieta — teksty kafelka;
    podkategoria, wzorNazwy   — które wydarzenia bierzemy (miejsce z podkategorii, nazwa pasuje do wzoru albo `typ` z data/repertuar.json; `typ` może być listą);
    wyprzedzenie              — ile dni do przodu szukamy;
    pusto                     — informacja, gdy nie ma wydarzeń; strony — [{ id, name, website }] linki pod nią;
    wiecej                    — { href, tekst } link na dole;
    wariant                   — wygląd kafelka: 'ceglany' (spektakle) albo 'kreda' (koncerty).
*/
export default function NajblizszeWydarzenia({
  places, wydarzenia, tytul, podtytul, etykieta, podkategoria, wzorNazwy, typ, wyprzedzenie, pusto, strony, wiecej, wariant,
}) {
  const [dzis, setDzis] = useState(null);
  useEffect(() => setDzis(dzisWarszawa()), []);
  if (!dzis) return <div className="k" aria-hidden="true" />;

  const poId = Object.fromEntries(places.map((p) => [p.id, p]));
  const pasujace = wydarzenia.filter((w) => {
    if (w.kino) return false;
    const m = w.miejsceId && poId[w.miejsceId];
    return (typ && [].concat(typ).includes(w.typ)) || (m && m.podkategoria === podkategoria) || w.miejscePodkat === podkategoria || wzorNazwy.test(w.nazwa);
  });
  const wiersze = najblizsze(pasujace, dzis, wyprzedzenie);

  return (
    <section className={`k ${wariant === 'ceglany' ? 'k-spektakle' : 'k-koncerty'}`} aria-label={etykieta}>
      <h2 className="k-tytul">{tytul}</h2>
      <p className="k-pod">{podtytul}</p>
      {wiersze.length ? (
        <ul className="k-lista">
          {wiersze.map((w) => (
            <Bilet key={`${w.id}-${w.dzien}`} nad={krotkaDataBilet(w.dzien)} godzina={w.godziny[0] && w.godziny[0].godzina}>
              <Nazwa nazwa={w.nazwa} href={w.link} />
              <Szczegoly czesci={[
                w.godziny.length > 1 && w.godziny.map((g) => g.godzina).join(', '),
                w.miejsce && `${w.miejsce}${w.wiek ? `, ${w.wiek}` : ''}`,
              ]} />
            </Bilet>
          ))}
        </ul>
      ) : (
        <>
          <p className="k-pusto">{pusto}</p>
          {strony.length > 0 && (
            <ul className="k-linki">
              {strony.map((t) => (
                <li key={t.id}><a href={t.website} target="_blank" rel="noreferrer">{t.name}</a></li>
              ))}
            </ul>
          )}
        </>
      )}
      <p className="k-wiecej"><a href={wiecej.href}>{wiecej.tekst}</a></p>
    </section>
  );
}
