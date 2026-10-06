// Wspólne narzędzia dla modułów źródeł: grzeczne pobieranie, daty w strefie Europe/Warsaw, porządkowanie tytułów.

const KONTAKT = (process.env.CONTACT_EMAIL || '').trim();
export const USER_AGENT = KONTAKT
  ? `FrajdoplanBot/1.0 (+https://frajdoplan.pl; ${KONTAKT})`
  : 'FrajdoplanBot/1.0 (+https://frajdoplan.pl)';

// Nie częściej niż jedno zapytanie na sekundę (dla wszystkich źródeł razem).
const ODSTEP_MS = 1100;
let ostatnie = 0;
const czekaj = (ms) => new Promise((r) => setTimeout(r, ms));

// Opcje: kodowanie, json (odpowiedź jako JSON), metoda + cialo (POST: obiekt wysyłany jako JSON albo
// URLSearchParams jako formularz), robots (najpierw sprawdź robots.txt serwisu; zakaz = wyjątek).
export async function pobierz(url, opcje = {}) {
  zakazanySerwis(url);
  if (opcje.robots) await upewnijSieZeDozwolone(url);
  // do trzech prób po chwilowym błędzie serwera (5xx) albo zerwanym połączeniu: po 5 i po 20 sekundach (błąd 4xx od razu przerywa)
  const przerwy = [5000, 20000];
  for (let proba = 0; ; proba += 1) {
    try {
      return await pobierzRaz(url, opcje);
    } catch (e) {
      if (/HTTP 4\d\d/.test(e.message) || proba >= przerwy.length) throw e;
      await czekaj(przerwy[proba]);
    }
  }
}

// --- robots.txt (RFC 9309, w uproszczeniu): najpierw czytamy robots.txt serwisu, dopiero potem cokolwiek innego.
// Brak pliku (4xx) = wolno. Błąd serwera (5xx) albo brak połączenia = nie pobieramy. Grupa dla `FrajdoplanBot`
// ma pierwszeństwo przed grupą `*`; wygrywa najdłuższa pasująca reguła, przy remisie `Allow`.
const NAZWA_BOTA = 'frajdoplanbot';
const robotsPamiec = new Map(); // adres serwisu → lista reguł albo { blad }

export function reguly(tekst) {
  const grupy = [];
  let biezaca = null;
  for (const wiersz of String(tekst || '').split(/\r?\n/)) {
    const l = wiersz.split('#')[0].trim();
    if (!l.includes(':')) continue;
    const [k, ...reszta] = l.split(':');
    const klucz = k.trim().toLowerCase();
    const wartosc = reszta.join(':').trim();
    if (klucz === 'user-agent') {
      if (!biezaca || biezaca.reguly.length) { biezaca = { agenci: [], reguly: [] }; grupy.push(biezaca); }
      biezaca.agenci.push(wartosc.toLowerCase());
    } else if (biezaca && (klucz === 'disallow' || klucz === 'allow')) {
      biezaca.reguly.push([klucz, wartosc]);
    }
  }
  const moja = grupy.filter((g) => g.agenci.some((a) => a && NAZWA_BOTA.includes(a) && a !== '*'));
  const wspolna = grupy.filter((g) => g.agenci.includes('*'));
  return (moja.length ? moja : wspolna).flatMap((g) => g.reguly).filter(([, v]) => v !== '');
}

const wzorzecRegu = (v) => new RegExp(`^${v.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$')}`);
export function dozwolone(lista, sciezka) {
  let najlepsza = null;
  for (const [rodzaj, wartosc] of lista) {
    if (!wzorzecRegu(wartosc).test(sciezka)) continue;
    if (!najlepsza || wartosc.length > najlepsza[1].length || (wartosc.length === najlepsza[1].length && rodzaj === 'allow')) najlepsza = [rodzaj, wartosc];
  }
  return !najlepsza || najlepsza[0] === 'allow';
}

async function upewnijSieZeDozwolone(url) {
  const u = new URL(url);
  const serwis = u.origin;
  if (!robotsPamiec.has(serwis)) {
    await odstep();
    try {
      const pobierzRobots = () => fetch(`${serwis}/robots.txt`, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
      let res = await pobierzRobots();
      if (res.status >= 500) { await czekaj(5000); res = await pobierzRobots(); } // chwilowy błąd serwera: jedna ponowna próba
      if (res.status >= 500) robotsPamiec.set(serwis, { blad: `robots.txt: HTTP ${res.status}` });
      else if (!res.ok) robotsPamiec.set(serwis, []); // brak pliku = brak zakazów
      else {
        const tekst = await res.text();
        const html = /^\s*</.test(tekst); // strona błędu zamiast pliku
        robotsPamiec.set(serwis, html ? [] : reguly(tekst));
      }
    } catch (e) {
      robotsPamiec.set(serwis, { blad: `robots.txt: nie udało się pobrać (${e.cause?.code || e.message})` });
    }
  }
  const lista = robotsPamiec.get(serwis);
  if (lista.blad) throw new Error(`${serwis}: ${lista.blad}, więc nic stamtąd nie pobieramy`);
  if (!dozwolone(lista, u.pathname + u.search)) throw new Error(`${url}: zabronione w robots.txt`);
}

async function odstep() {
  const teraz = Date.now();
  if (teraz - ostatnie < ODSTEP_MS) await czekaj(ODSTEP_MS - (teraz - ostatnie));
  ostatnie = Date.now();
}

async function pobierzRaz(url, { kodowanie = 'utf-8', json = false, metoda = 'GET', cialo } = {}) {
  await odstep();
  const naglowki = { 'User-Agent': USER_AGENT, Accept: json ? 'application/json' : 'text/html,*/*' };
  let tresc;
  if (cialo !== undefined) {
    if (cialo instanceof URLSearchParams) tresc = cialo;
    else { tresc = JSON.stringify(cialo); naglowki['Content-Type'] = 'application/json'; }
  }
  const res = await fetch(url, {
    method: tresc === undefined ? metoda : 'POST',
    headers: naglowki,
    body: tresc,
    redirect: 'follow',
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  const bufor = await res.arrayBuffer();
  const tekst = new TextDecoder(kodowanie).decode(bufor);
  return json ? JSON.parse(tekst) : tekst;
}

// Serwisy, z których nie pobieramy niczego (zakaz automatycznego pobierania albo brak zgody na współpracę):
// kupbilecik.pl, biletomat.pl i serwisy KICKET, Facebook, Instagram. Linki do nich zostają w danych, ale ich nie odpytujemy.
const ZAKAZANE_SERWISY = /(^|\.)(kupbilecik\.pl|biletomat\.pl|kicket\.pl|facebook\.com|fb\.com|fb\.me|instagram\.com)$/i;
export const zakazanyAdres = (url) => { try { return ZAKAZANE_SERWISY.test(new URL(url).hostname); } catch (e) { return false; } };
function zakazanySerwis(url) {
  if (zakazanyAdres(url)) throw new Error(`${url}: z tego serwisu niczego nie pobieramy`);
}

// Czy adres zwraca działającą stronę. Zwraca { ok: true } albo { ok: false, powod }, a gdy nie udało się
// sprawdzić (brak połączenia, przekroczony czas) — { ok: null, powod }: wtedy nie ruszamy linku.
// Niedziałające: kod 4xx/5xx, przekierowanie na stronę błędu (np. Error.aspx) albo na stronę główną.
export async function sprawdz(url) {
  if (zakazanyAdres(url)) return { ok: null, powod: 'serwis, z którego niczego nie pobieramy' };
  await odstep();
  let res;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,*/*' },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    });
  } catch (e) {
    return { ok: null, powod: `nie udało się połączyć (${e.cause?.code || e.message})` };
  }
  try { await res.body?.cancel(); } catch (e) { /* bez znaczenia */ }
  // 401/403/429: serwer nie wpuszcza botów — dla człowieka link może działać, więc go nie ruszamy
  if ([401, 403, 429].includes(res.status)) return { ok: null, powod: `serwer odmawia dostępu botom (HTTP ${res.status})` };
  if (!res.ok) return { ok: false, powod: `HTTP ${res.status}` };
  const koniec = new URL(res.url);
  const poczatek = new URL(url);
  if (/error|b[lł]ad|not[-_]?found|404/i.test(koniec.pathname)) return { ok: false, powod: `przekierowanie na stronę błędu (${koniec.pathname})` };
  if (koniec.pathname === '/' && poczatek.pathname !== '/') return { ok: false, powod: 'przekierowanie na stronę główną' };
  return { ok: true };
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

// „3 października 2026", „5 października" (rok z `rok`), „03.10.2026", „03-10-2026" → „2026-10-03" (albo '').
export function dataPL(tekst, rok = new Date().getFullYear()) {
  const t = spacje(tekst).toLowerCase();
  let m = t.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/);
  if (m) return `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
  m = t.match(/(\d{1,2})\s+([a-ząćęłńóśźż]+)(?:\s+(\d{4}))?/);
  if (!m) return '';
  const mies = MIESIACE_DOPELNIACZ.indexOf(m[2]) + 1;
  return mies ? `${m[3] || rok}-${pad(mies)}-${pad(m[1])}` : '';
}

// Dzień tygodnia daty „RRRR-MM-DD": 0 = niedziela … 6 = sobota.
export const dzienTygodnia = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay();

// Wiek z opisu: „od 4 lat", „dla dzieci 3–9 lat", „5+" → „4+", „3–9 lat"; brak → ''.
export function wiekZTekstu(tekst) {
  const t = spacje(tekst);
  let m = t.match(/(\d{1,2})\s*[–-]\s*(\d{1,2})\s*lat/i);
  if (m) return `${m[1]}–${m[2]} lat`;
  m = t.match(/od\s+(\d{1,2})\s*(?:do\s*(\d{1,2})\s*)?(?:roku\s+życia|lat|r\.\s*ż\.)/i) || t.match(/\b(\d{1,2})\+/);
  if (m) return m[2] ? `${m[1]}–${m[2]} lat` : `${m[1]}+`;
  return '';
}

// Czy wiek („4+", „3–9 lat") obejmuje dzieci do 12 lat (dolna granica ≤ 12).
export const wiekDlaDzieci = (wiek) => {
  const n = parseInt((String(wiek || '').match(/\d+/) || [])[0], 10);
  return Number.isFinite(n) && n <= 12;
};

// „2026-10-04" + n dni
export const plusDni = (iso, n) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// Miesiące, które obejmuje okno od dziś (RRRR-MM-DD) do `dni` dni naprzód: [[rok, miesiąc], …]
export function miesiaceOkna(dzis, dni = 60) {
  const koniec = plusDni(dzis, dni);
  const wynik = [];
  let [r, m] = dzis.split('-').map(Number);
  const [rk, mk] = koniec.split('-').map(Number);
  while (r < rk || (r === rk && m <= mk)) {
    wynik.push([r, m]);
    m += 1;
    if (m > 12) { m = 1; r += 1; }
  }
  return wynik;
}
