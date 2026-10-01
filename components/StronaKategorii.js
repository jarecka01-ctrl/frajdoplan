import Uklad from './Uklad';
import Katalog from './Katalog';
import Okruszki from './Okruszki';
import { DZIALY } from '../lib/kategorie';
import { listaMiejscJsonLd } from '../lib/jsonld';

// Wspólny wygląd podstron kategorii: /atrakcje/…, /sport/…, /zajecia/…
export default function StronaKategorii({ dzial, places, kategorie, kategoria, seo, missingConfig, fetchError }) {
  const d = DZIALY[dzial];
  const atrakcje = dzial === 'atrakcje';
  return (
    <Uklad seo={seo} jsonLd={[listaMiejscJsonLd(places, seo.h1)]} missingConfig={missingConfig} fetchError={fetchError}>
      <Okruszki
        sciezka={[{ nazwa: d.nazwa, href: d.hub }, { nazwa: kategoria.nazwa, href: kategoria.href }]}
        siteUrl={seo.siteUrl}
      />
      <section className="hero">
        <h1>{seo.h1}</h1>
        <p className="lead">{seo.wstep}</p>
      </section>
      <Katalog
        places={places}
        dzial={dzial}
        kategorie={kategorie}
        kategoria={kategoria}
        naStrone={100}
        tytul={atrakcje ? 'Lista miejsc' : 'Gdzie zapisać dziecko'}
        grupuj={d.pole}
        pokazDachPole={atrakcje}
        pokazStrefy={atrakcje}
      />
    </Uklad>
  );
}
