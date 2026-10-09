import { useState } from 'react';

const Ikona = ({ typ }) => {
  if (typ === 'deszcz') return (<svg viewBox="0 0 40 40" className="wi" aria-hidden="true"><path d="M12 25h17a6 6 0 0 0 .6-12 8.5 8.5 0 0 0-16.2 2A5 5 0 0 0 12 25z" fill="#EFE7D6" stroke="#20242B" strokeWidth="2.4" strokeLinejoin="round" /><g stroke="#E4483A" strokeWidth="2.6" strokeLinecap="round"><path d="M14 30l-2 5M21 30l-2 5M28 30l-2 5" /></g></svg>);
  if (typ === 'slonce') return (<svg viewBox="0 0 40 40" className="wi" aria-hidden="true"><g stroke="#20242B" strokeWidth="2.4" strokeLinecap="round"><path d="M20 3v4M20 33v4M3 20h4M33 20h4M8 8l3 3M29 29l3 3M32 8l-3 3M11 29l-3 3" /></g><circle cx="20" cy="20" r="8.5" fill="#F7B32B" stroke="#20242B" strokeWidth="2.4" /></svg>);
  return (<svg viewBox="0 0 40 40" className="wi" aria-hidden="true"><g stroke="#20242B" strokeWidth="2.4" strokeLinecap="round"><path d="M14 4v3M4 14h3M7 7l2 2M24 7l-2 2" /></g><circle cx="15" cy="15" r="6.5" fill="#F7B32B" stroke="#20242B" strokeWidth="2.4" /><path d="M13 32h16a6 6 0 0 0 .6-12 8.5 8.5 0 0 0-16.2 2A5 5 0 0 0 13 32z" fill="#FFFDF7" stroke="#20242B" strokeWidth="2.4" strokeLinejoin="round" /></svg>);
};
const Kropla = () => (<svg viewBox="0 0 16 16" className="ic" aria-hidden="true"><path d="M8 1.5C5.5 5 3.5 7.2 3.5 9.8a4.5 4.5 0 0 0 9 0C12.5 7.2 10.5 5 8 1.5z" fill="#E4483A" /></svg>);
const Ptak = () => (<svg viewBox="0 0 16 16" className="ic" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="#2F5D3A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>);

const URL_MET = 'https://www.yr.no/en/forecast/daily-table/2-3094802/Poland/Lesser%20Poland/Krak%C3%B3w/Krak%C3%B3w'; // szczegóły prognozy (yr.no = MET Norway)
const URL_AIRLY = 'https://airly.org/map/pl/#50.0647,19.9450'; // mapa wszystkich czujników

// Dla zwiniętego paska na telefonie: najbliższa pora, w której będzie padać
function podsumowanie(pogoda) {
  const pada = pogoda.find((p) => p.pada);
  if (!pada) return 'Bez deszczu dziś';
  return `Deszcz ${pada.nazwa.toLowerCase() === 'rano' ? 'rano' : `od ${pada.od}:00`}`;
}

export default function PogodaPowietrze({ pogoda, powietrze }) {
  const [otwarte, setOtwarte] = useState(false);
  if (!pogoda) return null;
  const teraz = pogoda.find((p) => p.id === 'popoludnie') || pogoda[0];
  return (
    <aside className={`pg${otwarte ? ' open' : ''}`} aria-label="Pogoda i powietrze w Krakowie dziś">
      <button type="button" className="strip" aria-expanded={otwarte} onClick={() => setOtwarte((o) => !o)}>
        <span className="s1"><Ikona typ={teraz.ikona} /><b>{teraz.temp}°</b></span>
        <span className="s2">{podsumowanie(pogoda)}</span>
        {powietrze && <span className="s3"><i className="dot" style={{ background: powietrze.kolor }} />Powietrze: {powietrze.etykieta}</span>}
        <span className="chev" aria-hidden="true">⌄</span>
      </button>
      <div className="pgfull">
        <div className="wcard">
          <div className="segs">
            {pogoda.map((p) => (
              <div className="seg" key={p.id}>
                <div className="sh"><div className="sn">{p.nazwa} <small>{p.od}–{p.do}</small></div><Ikona typ={p.ikona} /></div>
                <div className="st">{p.temp}°</div>
                <div className={`pchip ${p.pada ? 'wet' : 'dry'}`}>{p.pada ? <Kropla /> : <Ptak />}{p.pada ? 'Będzie padać' : 'Bez deszczu'}</div>
              </div>
            ))}
          </div>
          <div className="l1"><span>Prognoza: MET Norway</span><a href={URL_MET} target="_blank" rel="noopener noreferrer">Szczegóły ›</a></div>
          {powietrze && (
            <div className="air">
              <div className="a1"><span className="gauge"><i className="dot" style={{ background: powietrze.kolor }} /><b>Powietrze: {powietrze.etykieta}</b></span></div>
              <div className="a2"><span>średnia ze stacji GIOŚ w Krakowie</span><a href={URL_AIRLY} target="_blank" rel="noopener noreferrer">Sprawdź wszystko (Airly) ›</a></div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
