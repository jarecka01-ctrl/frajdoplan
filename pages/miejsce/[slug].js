import Link from 'next/link';
import Uklad from '../../components/Uklad';
import Okruszki from '../../components/Okruszki';
import { IKONY } from '../../lib/ikony';
import { miejsceJsonLd } from '../../lib/jsonld';
import { wiekZOpisu } from '../../lib/miejsca';
import { sciezkiKart, pobierzKarte } from '../../lib/dane';

export async function getStaticPaths() {
  return sciezkiKart();
}

export async function getStaticProps({ params }) {
  return pobierzKarte(params.slug);
}

const ladnyTelefon = (t) => String(t).trim();

export default function KartaMiejsca({ miejsce: p, podobne, kategoria, seo, missingConfig, fetchError }) {
  const pole = p.kategoria === 'Plener';
  const rodzaj = p.podkategoria || (pole ? 'Na polu' : 'Pod dachem');
  const adres = [p.adres, p.gmina !== 'Kraków' || !p.adres ? p.gmina : null].filter(Boolean).join(', ');
  const maWspolrzedne = p.lat != null && p.lon != null;
  const cel = maWspolrzedne ? `${p.lat},${p.lon}` : encodeURIComponent(`${p.name} ${p.adres || ''} ${p.gmina || ''}`.trim());
  const trasa = `https://www.google.com/maps/dir/?api=1&destination=${cel}`;
  const mapa = `https://www.google.com/maps/search/?api=1&query=${cel}`;
  const wiek = wiekZOpisu(p.opis);
  return (
    <Uklad seo={seo} jsonLd={[miejsceJsonLd(p, seo.canonical)]} missingConfig={missingConfig} fetchError={fetchError}>
      <Okruszki sciezka={[kategoria, { nazwa: p.name, href: `/miejsce/${p.slug}` }]} siteUrl={seo.siteUrl} />
      <section className="hero">
        <h1>{p.name}</h1>
        <p className="lead">
          <span aria-hidden="true">{IKONY[rodzaj] || (pole ? '🌳' : '🏠')}</span> {rodzaj}
          {p.dyscyplina && p.dyscyplina !== rodzaj ? `, ${p.dyscyplina.toLowerCase()}` : ''}
        </p>
      </section>
      <article className={`karta karta-szczegoly ${pole ? 'karta-pole' : 'karta-dach'}`}>
        {adres && <p className="adres">{adres}</p>}
        {p.rating != null && (
          <p className="ocena">★ {p.rating.toFixed(1).replace('.', ',')} <small>({p.reviews ?? 0} opinii w Google)</small></p>
        )}
        {p.opis && <p>{p.opis}</p>}
        {wiek && <p className="info">Wiek: {wiek}</p>}
        <p className="dol">
          <a className="link" href={trasa} target="_blank" rel="noreferrer">Trasa</a>
          <a className="link" href={mapa} target="_blank" rel="noreferrer">Zobacz na mapie</a>
          {p.website && <a className="link" href={p.website} target="_blank" rel="noreferrer">Strona miejsca</a>}
          {p.telefon && <a className="link" href={`tel:${ladnyTelefon(p.telefon).replace(/[^\d+]/g, '')}`}>{ladnyTelefon(p.telefon)}</a>}
        </p>
      </article>
      {podobne.length > 0 && (
        <section aria-label="Podobne miejsca">
          <h2 className="sekcja">Podobne miejsca</h2>
          <ul className="podobne">
            {podobne.map((x) => (
              <li key={x.slug}>
                <Link href={`/miejsce/${x.slug}`}>{x.name}</Link>
                {x.adres && <span className="info"> · {x.adres}</span>}
                {x.rating != null && <span className="info"> · ★ {x.rating.toFixed(1).replace('.', ',')}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </Uklad>
  );
}
