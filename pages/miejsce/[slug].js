import Link from 'next/link';
import Uklad from '../../components/Uklad';
import Okruszki from '../../components/Okruszki';
import { IKONY } from '../../lib/ikony';
import { miejsceJsonLd } from '../../lib/jsonld';
import { sciezkiMiejsc, pobierzMiejsce } from '../../lib/dane';

export async function getStaticPaths() {
  return sciezkiMiejsc();
}

export async function getStaticProps({ params }) {
  return pobierzMiejsce(params.slug);
}

const ocenaTekst = (r) => r.toFixed(1).replace('.', ',');

export default function KartaMiejsca({ miejsce: m, podobne = [], sciezka = [], seo, missingConfig, fetchError }) {
  if (!m) return null;
  const pole = m.kategoria === 'Plener';
  const adresPelny = [m.adres, m.gmina && m.gmina !== 'Kraków' ? m.gmina : m.adres ? 'Kraków' : null].filter(Boolean).join(', ');
  const trasa = m.lat != null && m.lon != null ? `https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lon}` : '';
  const naMapie = m.lat != null && m.lon != null ? `https://www.google.com/maps/search/?api=1&query=${m.lat},${m.lon}` : '';
  const rodzajeNazwa = [m.rodzaj, m.dyscyplina && m.dyscyplina !== m.rodzaj ? m.dyscyplina : null].filter(Boolean).join(' · ');
  return (
    <Uklad seo={seo} jsonLd={[miejsceJsonLd(m, seo.canonical)]} missingConfig={missingConfig} fetchError={fetchError}>
      <Okruszki sciezka={[...sciezka, { nazwa: m.name, href: seo.adres }]} siteUrl={seo.siteUrl} />
      <section className="hero">
        <h1>{m.name}</h1>
        <p className="lead">{[rodzajeNazwa, adresPelny].filter(Boolean).join(' · ')}</p>
      </section>
      <article className={`karta karta-miejsce ${pole ? 'karta-pole' : ''}`}>
        <div className="karta-gora">
          <span className="typ">
            <span aria-hidden="true">{IKONY[m.dyscyplina] || IKONY[m.rodzaj] || (pole ? '🌳' : '🏠')}</span>
            {m.rodzaj || (pole ? 'Na polu' : 'Pod dachem')}
          </span>
          {m.urodziny && <span className="znaczek">urodziny</span>}
        </div>
        <dl className="miejsce-dane">
          {adresPelny && <><dt>Adres</dt><dd>{adresPelny}</dd></>}
          {m.rating != null && <><dt>Ocena</dt><dd className="ocena">★ {ocenaTekst(m.rating)} <small>({m.reviews ?? 0} opinii w Google)</small></dd></>}
          {m.wiek && <><dt>Wiek</dt><dd>{m.wiek}</dd></>}
          {m.godziny && <><dt>Godziny</dt><dd>{m.godziny}</dd></>}
          {m.cennik && <><dt>Cennik</dt><dd>{m.cennik}</dd></>}
          {m.telefon && <><dt>Telefon</dt><dd><a className="link" href={`tel:${m.telefon.replace(/[^+\d]/g, '')}`}>{m.telefon}</a></dd></>}
          {m.website && <><dt>Strona</dt><dd><a className="link" href={m.website} target="_blank" rel="noreferrer">{m.website.replace(/^https?:\/\/(www\.)?/, '').replace(/[/?#].*$/, '')}</a></dd></>}
        </dl>
        {m.opis && <p className="miejsce-opis">{m.opis}</p>}
        {(trasa || naMapie) && (
          <p className="miejsce-linki">
            {trasa && <a className="link" href={trasa} target="_blank" rel="noreferrer">Trasa</a>}
            {naMapie && <a className="link" href={naMapie} target="_blank" rel="noreferrer">Zobacz na mapie</a>}
          </p>
        )}
      </article>
      {podobne.length > 0 && (
        <section aria-label="Podobne miejsca" className="miejsce-podobne">
          <h2 className="sekcja">Podobne miejsca</h2>
          <ul className="miejsce-podobne-lista">
            {podobne.map((x) => (
              <li key={x.id}>
                <Link className="link" href={`/miejsce/${x.slug}`}>{x.name}</Link>
                {(x.adres || x.rating != null) && (
                  <small>{[x.adres, x.rating != null ? `★ ${ocenaTekst(x.rating)}` : null].filter(Boolean).join(' · ')}</small>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </Uklad>
  );
}
