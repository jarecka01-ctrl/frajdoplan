// Wspólne narzędzia dla modułów źródeł: grzeczne pobieranie, daty w strefie Europe/Warsaw, porządkowanie tytułów.

const KONTAKT = (process.env.CONTACT_EMAIL || '').trim();
export const USER_AGENT = KONTAKT
  ? `FrajdoplanBot/1.0 (+https://frajdoplan.pl; ${KONTAKT})`
  : 'FrajdoplanBot/1.0 (+https://frajdoplan.pl)';

// Nie częściej niż jedno zapytanie na sekundę (dla wszystkich źródeł razem).
const ODSTEP_MS = 1100;
let ostatnie = 0;
const czekaj = (ms) => new Promise((r) => setTimeout(r, ms));

export async function pobierz(url, opcje = {}) {
  try {
    return await pobierzRaz(url, opcje);
  } catch (e) {
    // jedna ponowna próba po chwilowym błędzie serwera (5xx) albo zerwanym połączeniu
    if (/HTTP 4\d\d/.test(e.message)) throw e;
    await czekaj(5000);
    return pobierzRaz(url, opcje);
  }
}

async function pobierzRaz(url, { kodowanie = 'utf-8', json = false } = {}) {
  const teraz = Date.now();
  if (teraz - ostatnie < ODSTEP_MS) await czekaj(ODSTEP_MS - (teraz - ostatnie));
  ostatnie = Date.now();
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: json ? 'application/json' : 'text/html,*/*' },
    redirect: 'follow',
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  const bufor = await res.arrayBuffer();
  const tekst = new TextDecoder(kodowanie).decode(bufor);
  return json ? JSON.parse(tekst) : tekst;
}

// Data i czas w Krakowie.
const czesci = (d) => Object.fromEntries(
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(d).map((p) => [p.type, p.value]),
);
export const dzisWarszawa = (d = new Date()) => { const c = czesci(d); return `${c.year}-${c.month}-${c.day}`; };
// „2026-10-06T21:05:00+02:00"
export function terazWarszawa(d = new Date()) {
  const c = czesci(d);
  const lokalnie = Date.UTC(+c.year, +c.month - 1, +c.day, +c.hour, +c.minute, +c.second);
  const min = Math.round((lokalnie - Math.floor(d.getTime() / 1000) * 1000) / 60000);
  const znak = min >= 0 ? '+' : '-';
  const hh = String(Math.floor(Math.abs(min) / 60)).padStart(2, '0');
  const mm = String(Math.abs(min) % 60).padStart(2, '0');
  return `${c.year}-${c.month}-${c.day}T${c.hour}:${c.minute}:${c.second}${znak}${hh}:${mm}`;
}

export const pad = (n) => String(n).padStart(2, '0');
export const godzina = (t) => {
  const m = String(t || '').match(/(\d{1,2})[:.](\d{2})/);
  return m ? `${pad(m[1])}:${m[2]}` : '';
};

export const MIESIACE_DOPELNIACZ = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];

export const spacje = (t) => String(t || '').replace(/\s+/g, ' ').trim();

// Wersja językowa zapisana w tytule („Zapomniana wyspa 2D DUBBING", „Marsupilami- dubbing", „Lalka (+ ENG sub)").
export function rozbierzTytul(surowy) {
  let t = spacje(surowy);
  let wersja = '';
  if (/dubbing/i.test(t)) wersja = 'dubbing';
  else if (/napisy|sub\b|\bsub\]/i.test(t)) wersja = 'napisy';
  t = t
    .replace(/\s*[-–]?\s*\b(2d|3d)\b/gi, ' ')
    .replace(/\s*[-–]?\s*\bdubbing\b/gi, ' ')
    .replace(/\s*\((\+\s*)?eng\.?\s*sub\)/gi, ' ')
    .replace(/\s*\[pl&en sub\]/gi, ' ');
  return { tytul: spacje(t).replace(/[\s\-–]+$/, ''), wersja };
}

// Tytuł pisany wersalikami („KIM JEST JULIAN?") → zdaniowo („Kim jest Julian?").
// Wielką literę dostają: początek, słowo po kropce/pytajniku i słowa, które w `wzorzec`
// (np. tytule oryginalnym „Alla vi barn i Bullerbyn") zaczynają się wielką literą.
const bezOgonkow = (t) => t.toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
export function zdaniowo(t, wzorzec = '') {
  const s = spacje(t);
  if (s !== s.toUpperCase()) return s;
  const wielkie = new Set(
    (wzorzec.match(/\p{L}+/gu) || []).filter((w) => w[0] !== w[0].toLowerCase() && w.slice(1) !== w.slice(1).toUpperCase()).map(bezOgonkow),
  );
  const duza = (w) => w.charAt(0).toLocaleUpperCase('pl') + w.slice(1);
  return s.toLocaleLowerCase('pl').replace(/\p{L}+/gu, (w, i, calosc) => {
    const przed = calosc.slice(0, i).trimEnd();
    return i === 0 || /[.?!]$/.test(przed) || wielkie.has(bezOgonkow(w)) ? duza(w) : w;
  });
}

// „Zapomniana wyspa" → „zapomniana-wyspa" (do identyfikatorów seansów)
export const slugZ = (t) => String(t || '').toLowerCase().replace(/ł/g, 'l').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
