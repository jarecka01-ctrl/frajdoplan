import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { dzisWarszawa, godzinaWarszawa, trwaW, plusDni, juzPo } from './Wydarzenia';
import { grupujTerminy, krotkaDataBilet } from '../lib/grupowanie';
import Bilet, { Nazwa, Szczegoly } from './Bilet';

/*
  Kafelek „Najbliższe …" (spektakle, koncerty): najbliższe wiersze (każde wydarzenie raz, z najbliższym
  terminem; dzisiejsze, które już się odbyły, znikają, a ich miejsce zajmują kolejne; na szerokim ekranie pokazujemy
  tyle wierszy, ile mieści się na wysokość kafelka, na telefonie cztery; ten sam tytuł, dzień i miejsce = jeden wiersz z wieloma godzinami), z wyprzedzeniem, żeby można było zaplanować weekend. Bierze wydarzenia powiązane z miejscem
  z wybranej podkategorii albo z wzorem w nazwie. Kafelek jest zawsze widoczny: bez wydarzeń pokazuje
  krótką informację i linki do stron miejsc z bazy.
*/

const MAKS = 12; // tyle wierszy przygotowujemy; ile z nich widać, wynika z wysokości kafelka

// Pierwszy termin każdego wydarzenia od dziś do przodu; wydarzenia o tym samym tytule, w tym samym dniu
// i miejscu to jeden wiersz z wieloma godzinami („sob. 17.10 · 11:00, 13:00"). Bierzemy MAKS najbliższych wierszy.
function najblizsze(lista, dzis, godz, wyprzedzenie) {
  const terminy = [];
  const widziane = new Set();
  for (let i = 0; i <= wyprzedzenie; i += 1) {
    const d = plusDni(dzis, i);
    lista.forEach((w) => {
      if (i === 0 && juzPo(w, godz)) return; // dziś już po wszystkich godzinach: szukamy następnego terminu
      if (!widziane.has(w.id) && trwaW(w.data_regula, d)) { widziane.add(w.id); terminy.push({ ...w, dzien: d }); }
    });
  }
  return grupujTerminy(terminy).slice(0, MAKS);
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
  const [czas, setCzas] = useState(null);
  useEffect(() => {
    const odswiez = () => setCzas((c) => {
      const n = { dzis: dzisWarszawa(), godz: godzinaWarszawa() };
      return c && c.dzis === n.dzis && c.godz === n.godz ? c : n;
    });
    odswiez();
    const t = setInterval(odswiez, 60000);
    return () => clearInterval(t);
  }, []);
  const ramka = useRef(null);
  let wiersze = [];
  if (czas) {
    const poId = Object.fromEntries(places.map((p) => [p.id, p]));
    const pasujace = wydarzenia.filter((w) => {
      if (w.kino) return false;
      const m = w.miejsceId && poId[w.miejsceId];
      return (typ && [].concat(typ).includes(w.typ)) || (m && m.podkategoria === podkategoria) || w.miejscePodkat === podkategoria || wzorNazwy.test(w.nazwa);
    });
    wiersze = najblizsze(pasujace, czas.dzis, czas.godz, wyprzedzenie);
  }
  const klucz = wiersze.map((w) => `${w.id}-${w.dzien}`).join('|');

  // Na szerokim ekranie lista wypełnia wysokość kafelka (wyznacza ją najwyższy z trzech): chowamy wiersze, które się już nie mieszczą.
  useLayoutEffect(() => {
    const el = ramka.current;
    if (!el) return undefined;
    const dopasuj = () => {
      const li = Array.from(el.querySelectorAll(':scope > ul > li'));
      li.forEach((x) => { x.style.display = ''; });
      if (getComputedStyle(el.firstChild).position !== 'absolute') return; // telefon: kafelki jeden pod drugim, cztery wiersze z CSS
      const limit = el.clientHeight;
      let ukryj = false;
      li.forEach((x) => {
        if (!ukryj && x.offsetTop + x.offsetHeight > limit - 4) ukryj = true;
        if (ukryj) x.style.display = 'none';
      });
      if (li.length && li[0].style.display === 'none') li[0].style.display = ''; // zawsze przynajmniej jeden
    };
    dopasuj();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(dopasuj);
    ro.observe(el);
    return () => ro.disconnect();
  }, [klucz]);

  if (!czas) return <div className="k" aria-hidden="true" />;

  return (
    <section className={`k ${wariant === 'ceglany' ? 'k-spektakle' : 'k-koncerty'}`} aria-label={etykieta}>
      <h2 className="k-tytul">{tytul}</h2>
      <p className="k-pod">{podtytul}</p>
      {wiersze.length ? (
        <div className="k-ramka" ref={ramka}>
        <ul className="k-lista k-lista-fit">
          {wiersze.map((w) => (
            <Bilet key={`${w.id}-${w.dzien}`} nad={krotkaDataBilet(w.dzien)} godzina={w.godziny[0] && w.godziny[0].godzina} plan={{ id: (w.godziny[0] && w.godziny[0].id) || w.id, dzien: w.dzien, tytul: w.nazwa, godziny: w.godziny }}>
              <Nazwa nazwa={w.nazwa} href={w.link} />
              <Szczegoly czesci={[
                w.miejsce && `${w.miejsce}${w.wiek ? `, ${w.wiek}` : ''}`,
              ]} />
            </Bilet>
          ))}
        </ul>
        </div>
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
