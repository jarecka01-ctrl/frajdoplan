import Link from 'next/link';
import { adresKarty } from '../lib/miejsca';

const ocenaTekst = (r) => r.toFixed(1).replace('.', ',');

// Ranking najlepiej ocenianych miejsc kategorii (z ocen w Google), nad listą. Liczony na serwerze w `rankingMiejsc` (lib/dane.js).
export default function RankingKategorii({ ranking }) {
  if (!ranking || !ranking.pozycje?.length) return null;
  return (
    <section className="rank" aria-labelledby="rank-h">
      <h2 id="rank-h">{ranking.tytul}</h2>
      <p className="rank-opis">Ranking z ocen w Google, miejsca z co najmniej {ranking.min} opiniami. Pełną listę z filtrami i mapą znajdziesz niżej.</p>
      <ol>
        {ranking.pozycje.map((p) => (
          <li key={p.id}>
            <span className="rank-nr" aria-hidden="true" />
            <span className="rank-tekst">
              <Link href={adresKarty(p)}>{p.name}</Link>
              <small>{[p.adres, p.gmina].filter(Boolean).join(', ')}{p.urodziny ? ' · urodziny' : ''}</small>
            </span>
            <span className="ocena" title={`${p.reviews} opinii w Google`}>★ {ocenaTekst(p.rating)} <small>({p.reviews})</small></span>
          </li>
        ))}
      </ol>
    </section>
  );
}
