import { useState } from 'react';

const Ikona = ({ typ }) => {
  if (typ === 'deszcz') return (<svg viewBox="0 0 40 40" className="wi" aria-hidden="true"><path d="M12 25h17a6 6 0 0 0 .6-12 8.5 8.5 0 0 0-16.2 2A5 5 0 0 0 12 25z" fill="#EFE7D6" stroke="#20242B" strokeWidth="2.4" strokeLinejoin="round" /><g stroke="#E4483A" strokeWidth="2.6" strokeLinecap="round"><path d="M14 30l-2 5M21 30l-2 5M28 30l-2 5" /></g></svg>);
  if (typ === 'slonce') return (<svg viewBox="0 0 40 40" className="wi" aria-hidden="true"><g stroke="#20242B" strokeWidth="2.4" strokeLinecap="round"><path d="M20 3v4M20 33v4M3 20h4M33 20h4M8 8l3 3M29 29l3 3M32 8l-3 3M11 29l-3 3" /></g><circle cx="20" cy="20" r="8.5" fill="#F7B32B" stroke="#20242B" strokeWidth="2.4" /></svg>);
  return (<svg viewBox="0 0 40 40" className="wi" aria-hidden="true"><g stroke="#20242B" strokeWidth="2.4" strokeLinecap="round"><path d="M14 4v3M4 14h3M7 7l2 2M24 7l-2 2" /></g><circle cx="15" cy="15" r="6.5" fill="#F7B32B" stroke="#20242B" strokeWidth="2.4" /><path d="M13 32h16a6 6 0 0 0 .6-12 8.5 8.5 0 0 0-16.2 2A5 5 0 0 0 13 32z" fill="#FFFDF7" stroke="#20242B" strokeWidth="2.4" strokeLinejoin="round" /></svg>);
};
const URL_MET = 'https://www.yr.no/en/forecast/daily-table/2-3094802/Poland/Lesser%20Poland/Krak%C3%B3w/Krak%C3%B3w'; // szczegóły prognozy (yr.no = MET Norway)
const URL_AIRLY = 'https://airly.org/map/pl/#50.0647,19.9450'; // mapa wszystkich czujników

export default function PogodaPowietrze({ pogoda, powietrze }) {
  const [otwarte, setOtwarte] = useState(false);
  if (!pogoda) return null;
  const teraz = pogoda.find((p) => p.id === 'popoludnie') || pogoda[0];
  return (
    <aside className={`pg${otwarte ? ' open' : ''}`} aria-label="Pogoda i powietrze w Krakowie dziś">
      <button type="button" className="strip" aria-expanded={otwarte} onClick={() => setOtwarte((o) => !o)}>
        <span className="s1"><Ikona typ={teraz.ikona} /><b>{teraz.temp}°</b></span>
        <span className="s2">Pogoda na dziś</span>
        {powietrze && <span className="s3"><i className="dot" style={{ background: powietrze.kolor }} />Powietrze: {powietrze.etykieta}</span>}
        <span className="chev" aria-hidden="true">⌄</span>
      </button>
      <div className="pgfull">
        <div className="wrow">
          {pogoda.map((p) => (
            <span className="wc" key={p.id}>
              <a className="sn" href={URL_MET} target="_blank" rel="noopener noreferrer" title={`Prognoza MET Norway, ${p.od}–${p.do}`}>{p.nazwa}</a>
              <Ikona typ={p.ikona} />
              <b className="st">{p.temp}°</b>
            </span>
          ))}
          {powietrze && (
            <span className="wc">
              <a className="sn" href={URL_AIRLY} target="_blank" rel="noopener noreferrer" title={`Powietrze w Krakowie: ${powietrze.etykieta} (GIOŚ). Mapa czujników: Airly`}>Powietrze</a>
              <i className="dot" style={{ background: powietrze.kolor }} aria-label={powietrze.etykieta} />
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
