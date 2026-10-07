import Uklad from './Uklad';
import Okruszki from './Okruszki';
import { wydarzeniaJsonLd } from '../lib/jsonld';
import { krotkaData } from '../lib/grupowanie';
import Bilet, { Nazwa, Szczegoly, godzinyPodTytulem } from './Bilet';

// Strony /koncerty i /spektakle: lista wszystkich przyszłych wydarzeń jednej kategorii, miesiąc po miesiącu.
// Tytuł wydarzenia jest linkiem do biletów, a godziny (gdy mają własne linki) prowadzą do konkretnych terminów.
export default function ListaWydarzen({ miesiace, liczba, seo, nazwaOkruszka, pusto, missingConfig, fetchError }) {
  const wiersze = miesiace.flatMap((m) => m.wiersze);
  return (
    <Uklad seo={seo} jsonLd={wydarzeniaJsonLd(wiersze, seo.canonical)} missingConfig={missingConfig} fetchError={fetchError}>
      <Okruszki sciezka={[{ nazwa: nazwaOkruszka, href: seo.adres }]} siteUrl={seo.siteUrl} />
      <section className="hero">
        <h1>{seo.h1}</h1>
        <p className="lead">{seo.wstep}</p>
      </section>
      {liczba === 0 ? (
        <p className="wyd-pusto">{pusto}</p>
      ) : (
        miesiace.map((m) => (
          <section key={m.klucz} className="wyd-miesiac" aria-label={m.nazwa}>
            <h2 className="sekcja">{m.nazwa.charAt(0).toUpperCase() + m.nazwa.slice(1)}</h2>
            <ul className="wyd-lista wyd-lista-strona tk-lista">
              {m.wiersze.map((w) => (
                <Bilet key={`${w.id}-${w.dzien}`} nad={krotkaData(w.dzien)} godzina={w.godziny[0] && w.godziny[0].godzina}>
                  <Nazwa nazwa={w.nazwa} href={w.link} />
                  <Szczegoly czesci={[godzinyPodTytulem(w.godziny, w.link), w.miejsce, w.wiek, w.cena]} />
                </Bilet>
              ))}
            </ul>
          </section>
        ))
      )}
    </Uklad>
  );
}
