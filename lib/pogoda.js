// Prognoza na dziś dla Krakowa z MET Norway (api.met.no), tylko na serwerze (getStaticProps).
// Warunki serwisu: opisany User-Agent z kontaktem, źródło podane na stronie, ten sam adres nie częściej niż co godzinę.
// Błąd lub brak danych = zwracamy null, a widżet po prostu się nie pokazuje.
const URL_PROGNOZY = 'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=50.0647&lon=19.9450';
const AGENT = 'frajdoplan.pl https://frajdoplan.pl'; // MET wymaga identyfikacji aplikacji (adres strony wystarcza)
const PORY = [
  { id: 'rano', nazwa: 'Rano', od: 6, do: 12 },
  { id: 'popoludnie', nazwa: 'Popołudnie', od: 12, do: 18 },
  { id: 'wieczor', nazwa: 'Wieczór', od: 18, do: 22 },
];
const PROG_DESZCZU_MM = 0.3; // łącznie w porze dnia

const formatDnia = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit' });
const formatGodziny = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Warsaw', hour: '2-digit', hourCycle: 'h23' });

// Ikona: 'slonce' | 'chmury' | 'deszcz' (z kodu symbolu MET, np. „partlycloudy_day", „lightrain")
export function ikonaZSymbolu(kod) {
  const s = String(kod || '');
  if (/rain|sleet|snow|thunder|shower/.test(s)) return 'deszcz';
  if (/^(clearsky|fair)/.test(s)) return 'slonce';
  return 'chmury';
}

export async function pobierzPogode(teraz = new Date()) {
  try {
    const res = await fetch(URL_PROGNOZY, { headers: { 'User-Agent': AGENT } });
    if (!res.ok) return null;
    const dane = await res.json();
    const dzis = formatDnia.format(teraz);
    const wpisy = (dane?.properties?.timeseries || []).map((w) => {
      const t = new Date(w.time);
      return { dzien: formatDnia.format(t), godz: Number(formatGodziny.format(t)), temp: w.data?.instant?.details?.air_temperature,
        deszcz: w.data?.next_1_hours?.details?.precipitation_amount, symbol: w.data?.next_1_hours?.summary?.symbol_code || w.data?.next_6_hours?.summary?.symbol_code };
    }).filter((w) => w.dzien === dzis);
    const pory = PORY.map((p) => {
      const w = wpisy.filter((x) => x.godz >= p.od && x.godz < p.do && typeof x.temp === 'number');
      if (!w.length) return null;
      const deszcz = w.reduce((s, x) => s + (Number(x.deszcz) || 0), 0);
      const srodek = w[Math.floor(w.length / 2)];
      const pada = deszcz >= PROG_DESZCZU_MM;
      return { id: p.id, nazwa: p.nazwa, od: p.od, do: p.do, temp: Math.round(w.reduce((s, x) => s + x.temp, 0) / w.length),
        pada, ikona: pada ? 'deszcz' : (ikonaZSymbolu(srodek.symbol) === 'deszcz' ? 'chmury' : ikonaZSymbolu(srodek.symbol)) };
    });
    // jeśli to już wieczór i brakuje poranka, pokazujemy to, co zostało
    const lista = pory.filter(Boolean);
    return lista.length ? lista : null;
  } catch (e) {
    return null;
  }
}
