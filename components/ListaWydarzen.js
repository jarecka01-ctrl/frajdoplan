import Uklad from './Uklad';
import Okruszki from './Okruszki';
import { wydarzeniaJsonLd } from '../lib/jsonld';
import { krotkaData } from '../lib/grupowanie';

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
            <ul className="wyd-lista wyd-lista-strona">
              {m.wiersze.map((w) => (
                <li key={`${w.id}-${w.dzien}`} className="wyd wyd-duza">
                  <span className="wyd-godz">{krotkaData(w.dzien)}</span>
                  <div className="wyd-tresc">
                    <p className="wyd-nazwa">
                      {w.link ? <a href={w.link} target="_blank" rel="noreferrer">{w.nazwa}</a> : w.nazwa}
                    </p>
                    {w.godziny.length > 0 && (
                      <p className="wyd-miejsce">
                        {w.godziny.map((g, i) => (
                          <span key={g.godzina}>
                            {i > 0 && ', '}
                            {g.link && (w.godziny.length > 1 || g.link !== w.link) ? <a href={g.link} target="_blank" rel="noreferrer">{g.godzina}</a> : g.godzina}
                          </span>
                        ))}
                      </p>
                    )}
                    {w.miejsce && <p className="wyd-miejsce">{w.miejsce}</p>}
                    {(w.wiek || w.cena) && (
                      <p className="wyd-info">
                        {w.wiek && <span>{w.wiek}</span>}
                        {w.cena && <span>{w.cena}</span>}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </Uklad>
  );
}
