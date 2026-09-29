import { useEffect, useRef } from 'react';
import { IKONY } from '../lib/ikony';

/*
  Mapa miejsc: Leaflet + kafelki OpenStreetMap (bez kluczy API).
  Punkty rysowane na canvasie, więc ponad 1000 miejsc działa płynnie.
  Żółty punkt = pod dachem, czerwony = na polu.
*/

const KRAKOW = [50.0617, 19.9373];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function dymek(p) {
  const ikona = IKONY[p.podkategoria] || (p.kategoria === 'Plener' ? '🌳' : '🏠');
  const trasa = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`;
  return `
    <div class="dymek">
      <p class="dymek-typ">${ikona} ${esc(p.podkategoria || (p.kategoria === 'Plener' ? 'Na polu' : 'Pod dachem'))}</p>
      <p class="dymek-nazwa">${esc(p.name)}</p>
      ${p.adres ? `<p class="dymek-adres">${esc(p.adres)}</p>` : ''}
      ${p.rating != null ? `<p class="dymek-ocena">★ ${p.rating.toFixed(1)} (${p.reviews ?? 0})</p>` : ''}
      <p class="dymek-linki">
        <a href="${trasa}" target="_blank" rel="noreferrer">Trasa</a>
        ${p.website ? `<a href="${esc(p.website)}" target="_blank" rel="noreferrer">Strona</a>` : ''}
      </p>
    </div>`;
}

export default function Mapa({ miejsca }) {
  const el = useRef(null);
  const mapa = useRef(null);
  const warstwa = useRef(null);
  const Lref = useRef(null);
  const aktualne = useRef(miejsca);
  aktualne.current = miejsca;

  const rysuj = () => {
    const L = Lref.current;
    if (!L || !warstwa.current) return;
    warstwa.current.clearLayers();
    const punkty = aktualne.current.filter((p) => p.lat != null && p.lon != null);
    punkty.forEach((p) => {
      const pole = p.kategoria === 'Plener';
      L.circleMarker([p.lat, p.lon], {
        radius: 7, weight: 2, color: '#20242B', fillOpacity: 1,
        fillColor: pole ? '#E4483A' : '#F7B32B',
      })
        .bindPopup(dymek(p), { maxWidth: 260 })
        .addTo(warstwa.current);
    });
    if (punkty.length) {
      mapa.current.fitBounds(L.latLngBounds(punkty.map((p) => [p.lat, p.lon])), { padding: [30, 30], maxZoom: 15 });
    }
  };

  useEffect(() => {
    let zyje = true;
    import('leaflet').then((mod) => {
      if (!zyje || mapa.current) return;
      const L = mod.default || mod;
      Lref.current = L;
      mapa.current = L.map(el.current, { preferCanvas: true, scrollWheelZoom: false }).setView(KRAKOW, 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapa.current);
      warstwa.current = L.layerGroup().addTo(mapa.current);
      rysuj();
    });
    return () => {
      zyje = false;
      if (mapa.current) { mapa.current.remove(); mapa.current = null; }
    };
  }, []);

  useEffect(() => { rysuj(); }, [miejsca]);

  const bezWspolrzednych = miejsca.filter((p) => p.lat == null || p.lon == null).length;

  return (
    <div className="mapa-wrap">
      <div ref={el} className="mapa" role="region" aria-label="Mapa miejsc" />
      <p className="mapa-legenda">
        <span className="kropka kropka-dach" /> pod dachem
        <span className="kropka kropka-pole" /> na polu
        {bezWspolrzednych > 0 && <span className="mapa-uwaga">{bezWspolrzednych} bez lokalizacji na mapie</span>}
      </p>
    </div>
  );
}
