import { useEffect, useRef, useState } from 'react';
import { IKONY } from '../lib/ikony';
import { promienOkolicy, PROMIEN_OKOLICY_KM } from '../lib/geo';

/*
  Mapa miejsc: Leaflet + kafelki OpenStreetMap (bez kluczy API).
  Punkty rysowane na canvasie, więc ponad 1000 miejsc działa płynnie.
  Żółty punkt = pod dachem, czerwony = na polu. Po kliknięciu „Blisko mnie" (prop `ja`) mapa przybliża się na okolicę
  użytkownika (zoom 14, ok. 2–3 km; gdy w promieniu 2,5 km jest mniej niż 5 miejsc, oddala tak, by objąć 5 najbliższych) i pokazuje punkt „jesteś tutaj"; „Pokaż cały Kraków" wraca do widoku miasta.
*/

const KRAKOW = [50.0617, 19.9373];
const ZOOM_OKOLICY = 14; // zoom 14 pokazuje ok. 2–3 km wokół użytkownika
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

export default function Mapa({ miejsca, ja = null }) {
  const el = useRef(null);
  const mapa = useRef(null);
  const warstwa = useRef(null);
  const Lref = useRef(null);
  const rowery = useRef(null);
  const [pokazRowery, setPokazRowery] = useState(false);
  const aktualne = useRef(miejsca);
  aktualne.current = miejsca;
  const warstwaJa = useRef(null);
  const jaRef = useRef(ja);
  jaRef.current = ja;
  const [calyWidok, setCalyWidok] = useState(false); // true = użytkownik wrócił do widoku całego miasta
  const calyRef = useRef(false);

  // Widok mapy: przy „Blisko mnie" okolica użytkownika, inaczej wszystkie miejsca z listy.
  const ustawWidok = () => {
    const L = Lref.current;
    if (!L || !mapa.current) return;
    const punkty = aktualne.current.filter((p) => p.lat != null && p.lon != null);
    const gdzie = jaRef.current;
    if (gdzie && !calyRef.current) {
      const promien = promienOkolicy(gdzie, punkty);
      if (promien <= PROMIEN_OKOLICY_KM) {
        mapa.current.setView([gdzie.lat, gdzie.lon], ZOOM_OKOLICY); // dzielnica i najbliższe okolice
      } else {
        // w okolicy jest mniej niż 5 miejsc: oddalamy, żeby objąć najbliższe
        mapa.current.fitBounds(L.latLng(gdzie.lat, gdzie.lon).toBounds(promien * 2000), { padding: [24, 24], maxZoom: ZOOM_OKOLICY });
      }
    } else if (punkty.length) {
      mapa.current.fitBounds(L.latLngBounds(punkty.map((p) => [p.lat, p.lon])), { padding: [30, 30], maxZoom: 15 });
    }
  };

  // Punkt „jesteś tutaj": inny kształt niż pinezki miejsc (kółka na canvasie), ponad nimi.
  const rysujJa = () => {
    const L = Lref.current;
    if (!L || !warstwaJa.current) return;
    warstwaJa.current.clearLayers();
    const gdzie = jaRef.current;
    if (!gdzie) return;
    L.marker([gdzie.lat, gdzie.lon], {
      icon: L.divIcon({ className: 'ja-pin', html: '<span></span>', iconSize: [26, 26], iconAnchor: [13, 13] }),
      title: 'Jesteś tutaj', alt: 'Jesteś tutaj', keyboard: false, zIndexOffset: 1000,
    }).addTo(warstwaJa.current);
  };

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
    rysujJa();
    ustawWidok();
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
      warstwaJa.current = L.layerGroup().addTo(mapa.current);
      // Drogi rowerowe: przezroczysta nakładka CyclOSM (dane OpenStreetMap), włączana przełącznikiem.
      rowery.current = L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm-lite/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: 'drogi rowerowe: <a href="https://www.cyclosm.org">CyclOSM</a>',
      });
      rysuj();
    });
    return () => {
      zyje = false;
      if (mapa.current) { mapa.current.remove(); mapa.current = null; }
    };
  }, []);

  useEffect(() => { rysuj(); }, [miejsca]);

  // Nowe położenie (albo jego wyłączenie): punkt „jesteś tutaj" i przybliżenie na okolicę.
  useEffect(() => {
    calyRef.current = false;
    setCalyWidok(false);
    rysujJa();
    ustawWidok();
  }, [ja]);

  const przelaczWidok = () => {
    calyRef.current = !calyRef.current;
    setCalyWidok(calyRef.current);
    ustawWidok();
  };

  useEffect(() => {
    if (!mapa.current || !rowery.current) return;
    if (pokazRowery) rowery.current.addTo(mapa.current);
    else rowery.current.remove();
  }, [pokazRowery]);

  const bezWspolrzednych = miejsca.filter((p) => p.lat == null || p.lon == null).length;

  return (
    <div className="mapa-wrap">
      <div ref={el} className="mapa" role="region" aria-label="Mapa miejsc" />
      {ja && (
        <button type="button" className="mapa-caly" onClick={przelaczWidok}>
          {calyWidok ? 'Pokaż moją okolicę' : 'Pokaż cały Kraków'}
        </button>
      )}
      <label className="mapa-rowery">
        <input type="checkbox" checked={pokazRowery} onChange={(e) => setPokazRowery(e.target.checked)} />
        🚲 Pokaż drogi rowerowe
      </label>
      <p className="mapa-legenda">
        <span className="kropka kropka-dach" /> pod dachem
        <span className="kropka kropka-pole" /> na polu
        {ja && <><span className="kropka kropka-ja" /> jesteś tutaj</>}
        {bezWspolrzednych > 0 && <span className="mapa-uwaga">{bezWspolrzednych} bez lokalizacji na mapie</span>}
      </p>
    </div>
  );
}
