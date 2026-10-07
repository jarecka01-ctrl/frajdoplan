import { Fragment } from 'react';

/*
  Kafelek wydarzenia w kształcie biletu (styl .tk w styles/globals.css): po lewej odcinek z godziną (duża) i datą (mała, nad godziną),
  po prawej tytuł (do 2 linii) i szczegóły. Wcięcia przy linii perforacji mają kolor tła sekcji (--nb ustawia sekcja w CSS).
    nad     — mała linia nad godziną: data albo „od"; bez niej odcinek pokazuje samą godzinę;
    godzina — duża linia; puste = „cały dzień"; kilka godzin w jednym tekście = jedna pod drugą;
    children — prawa strona: <Nazwa …/> i <Szczegoly …/>.
*/
// Godzina z arkusza bywa wpisana jako kilka godzin („10:00, 12:00", „9:00; 11:30") albo zakres („10:00–12:00"):
// każda godzina dostaje własną linię na odcinku, a zakres może się złamać po myślniku (znak niewidocznego odstępu).
const godzinyOdcinka = (godzina) => String(godzina || '').split(/\s*[,;]\s*|\s+i\s+/).map((g) => g.trim()).filter(Boolean);
const zLamaniemPoMyslniku = (g) => g.replace(/([–—-])(?=\d)/g, '$1\u200b');

export default function Bilet({ nad, godzina, className = '', children }) {
  const godziny = godzinyOdcinka(godzina);
  return (
    <li className={`tk ${className}`.trim()}>
      <span className="tt">
        {nad && <span className="td">{nad}</span>}
        {godziny.length
          ? godziny.map((g, i) => <b key={`${g}-${i}`}>{zLamaniemPoMyslniku(g)}</b>)
          : <b className="dl">cały dzień</b>}
      </span>
      <span className="tn">{children}</span>
    </li>
  );
}

// Tytuł wydarzenia. Z `href` jest linkiem, który rozciąga się na cały bilet (.tk-link), bez `href` zwykłym tekstem.
export function Nazwa({ nazwa, href, przed, zewnetrzny = true }) {
  const tekst = href
    ? <a className="tk-link" href={href} {...(zewnetrzny ? { target: '_blank', rel: 'noreferrer' } : {})}>{nazwa}</a>
    : nazwa;
  return <span className="tk-nazwa" title={nazwa}>{przed}{tekst}</span>;
}

// Mała linia pod tytułem: kawałki (tekst albo linki) rozdzielone kropką; puste pomijamy.
export function Szczegoly({ czesci }) {
  const niepuste = czesci.filter(Boolean);
  if (!niepuste.length) return null;
  return (
    <small>
      {niepuste.map((c, i) => <Fragment key={i}>{i > 0 && ' · '}{c}</Fragment>)}
    </small>
  );
}

// Godziny wydarzenia pod tytułem (z osobnymi linkami do terminów), gdy dużej godziny z odcinka nie wystarczy:
// kilka terminów albo termin z własnym linkiem. Jedna godzina bez własnego linku jest tylko na odcinku, wtedy zwraca null.
export function godzinyPodTytulem(godziny, link) {
  if (!godziny.length) return null;
  const wlasny = (g) => g.link && (godziny.length > 1 || g.link !== link);
  if (godziny.length === 1 && !wlasny(godziny[0])) return null;
  return godziny.map((g, i) => (
    <Fragment key={g.godzina}>
      {i > 0 && ', '}
      {wlasny(g) ? <a href={g.link} target="_blank" rel="noreferrer">{g.godzina}</a> : g.godzina}
    </Fragment>
  ));
}
