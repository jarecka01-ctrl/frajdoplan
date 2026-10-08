import Uklad from './Uklad';
import Okruszki from './Okruszki';
import { KONTAKT_EMAIL, NAZWA_ADMINISTRATORA } from '../lib/prawne';

/*
  Wspólny układ stron prawnych (polityka prywatności, regulamin, kontakt): okruszki, nagłówek,
  data ostatniej aktualizacji (`aktualizacja`) i treść w czytelnej kolumnie.
*/
export default function StronaPrawna({ seo, nazwa, aktualizacja, children }) {
  return (
    <Uklad seo={seo}>
      <Okruszki sciezka={[{ nazwa, href: seo.adres }]} siteUrl={seo.siteUrl} />
      <article className="prawne">
        <h1>{seo.h1}</h1>
        {aktualizacja && <p className="prawne-data">Ostatnia aktualizacja: {aktualizacja}</p>}
        {children}
      </article>
    </Uklad>
  );
}

// Imię i nazwisko administratora ze zmiennej środowiskowej; gdy jej brak, widoczny placeholder (żeby było widać, że czegoś brakuje).
export function Administrator() {
  return NAZWA_ADMINISTRATORA
    ? <strong>{NAZWA_ADMINISTRATORA}</strong>
    : <mark className="uzupelnij">[UZUPEŁNIJ: imię i nazwisko administratora]</mark>;
}

export function Email() {
  return <a href={`mailto:${KONTAKT_EMAIL}`}>{KONTAKT_EMAIL}</a>;
}
