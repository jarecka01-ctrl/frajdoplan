// Plik kalendarza .ics (RFC 5545) z planu, budowany w przeglądarce. Strefa Europe/Warsaw (z blokiem VTIMEZONE), stabilne UID
// (ponowny import tego samego planu aktualizuje wydarzenia zamiast je dublować), końce wierszy CRLF, składanie wierszy do 75 bajtów.
import { przedzialy, kluczPozycji } from './plan';

const STREFA = 'Europe/Warsaw';
const CRLF = '\r\n';
const DOMYSLNY_CZAS_MIN = 60;

const VTIMEZONE = [
  'BEGIN:VTIMEZONE', `TZID:${STREFA}`,
  'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'TZNAME:CEST', 'DTSTART:19700329T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'TZNAME:CET', 'DTSTART:19701025T030000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD',
  'END:VTIMEZONE',
];

const tekstIcs = (t) => String(t == null ? '' : t).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// Składanie długich wierszy: do 75 bajtów UTF-8, kolejne części zaczynają się od spacji; nie rozcinamy znaków wielobajtowych.
function zloz(wiersz) {
  const bajty = (znak) => new TextEncoder().encode(znak).length;
  const wynik = [];
  let biezacy = '';
  let dlugosc = 0;
  for (const znak of wiersz) {
    const b = bajty(znak);
    const limit = wynik.length === 0 ? 75 : 74; // kontynuacja ma jeden bajt na początkowa spację
    if (dlugosc + b > limit) { wynik.push(biezacy); biezacy = znak; dlugosc = b; } else { biezacy += znak; dlugosc += b; }
  }
  wynik.push(biezacy);
  return wynik.map((w, i) => (i === 0 ? w : ` ${w}`)).join(CRLF);
}

const dwie = (n) => String(n).padStart(2, '0');
const dataIcs = (iso) => iso.replace(/-/g, '');
const dzienPo = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const czasLokalny = (iso, minuty) => { // minuty od północy dnia `iso` (może przekroczyć dobę) → „RRRRMMDDTGGMMSS"
  const dni = Math.floor(minuty / 1440);
  const m = minuty - dni * 1440;
  return `${dataIcs(dzienPo(iso, dni))}T${dwie(Math.floor(m / 60))}${dwie(m % 60)}00`;
};
const dtstamp = (teraz) => `${teraz.getUTCFullYear()}${dwie(teraz.getUTCMonth() + 1)}${dwie(teraz.getUTCDate())}T${dwie(teraz.getUTCHours())}${dwie(teraz.getUTCMinutes())}${dwie(teraz.getUTCSeconds())}Z`;
const skrot = (t) => { let h = 5381; for (let i = 0; i < t.length; i += 1) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0; return h.toString(36); };

// `rozwiazane`: pozycje z rozwiazPozycje (lib/plan.js); `origin`: adres serwisu do linków do kart miejsc.
// Zwraca { ics, dodano, pominieto: { bezDnia, odbyly, niedostepne } }; `ics` jest pustym tekstem, gdy nie ma czego dodać.
export function planDoIcs(nazwaPlanu, rozwiazane, origin, teraz = new Date()) {
  const pominieto = { bezDnia: 0, odbyly: 0, niedostepne: 0 };
  const zdarzenia = [];
  // wydarzenie z kilkoma godzinami = osobny wpis w kalendarzu na każdą godzinę (każdy z własnym UID)
  const wpisy = rozwiazane.flatMap((r) => {
    const godziny = r.poz.typ === 'wydarzenie' ? String(r.godzina || '').split(/\s*[,;]\s*/).filter(Boolean) : [];
    return godziny.length > 1 && r.status !== 'odbylo' && r.status !== 'niedostepne' ? godziny.map((g, i) => ({ ...r, godzina: g, uidDodatek: `-${i}` })) : [r];
  });
  wpisy.forEach((r) => {
    if (r.status === 'odbylo') { pominieto.odbyly += 1; return; }
    if (r.status === 'niedostepne') { pominieto.niedostepne += 1; return; }
    const miejsce = r.poz.typ === 'miejsce';
    if (!r.dzien) { pominieto.bezDnia += 1; return; } // miejsca bez dnia nie mają terminu
    const uid = `${skrot(kluczPozycji(r.poz))}${r.uidDodatek || ''}-${dataIcs(r.dzien)}@frajdoplan.pl`;
    const opis = [];
    const wiersze = [`UID:${uid}`, `DTSTAMP:${dtstamp(teraz)}`, `SUMMARY:${tekstIcs(r.tytul)}`];
    if (miejsce) {
      wiersze.push(`DTSTART;VALUE=DATE:${dataIcs(r.dzien)}`, `DTEND;VALUE=DATE:${dataIcs(dzienPo(r.dzien, 1))}`); // miejsce bez godziny: wydarzenie całodniowe
      if (r.adres) wiersze.push(`LOCATION:${tekstIcs([r.tytul, r.adres].join(', '))}`);
      if (r.rodzaj) opis.push(`Rodzaj: ${r.rodzaj}`);
      if (r.href) { const url = `${origin}${r.href}`; opis.push(`Karta miejsca: ${url}`); wiersze.push(`URL:${tekstIcs(url)}`); }
    } else {
      const okno = przedzialy(r.godzina)[0];
      if (okno) {
        const jawnyKoniec = /\d{1,2}:\d{2}\s*[–—-]\s*\d{1,2}:\d{2}/.test(r.godzina) && okno.do - okno.od !== DOMYSLNY_CZAS_MIN;
        wiersze.push(`DTSTART;TZID=${STREFA}:${czasLokalny(r.dzien, okno.od)}`, `DTEND;TZID=${STREFA}:${czasLokalny(r.dzien, okno.do)}`);
        if (!jawnyKoniec) opis.push(`Godzina zakończenia orientacyjna (${DOMYSLNY_CZAS_MIN} minut).`);
      } else {
        wiersze.push(`DTSTART;VALUE=DATE:${dataIcs(r.dzien)}`, `DTEND;VALUE=DATE:${dataIcs(dzienPo(r.dzien, 1))}`); // wydarzenie bez godziny: całodniowe
      }
      const gdzie = [r.miejsce, r.adres].filter(Boolean).join(', ');
      if (gdzie) wiersze.push(`LOCATION:${tekstIcs(gdzie)}`);
      if (r.wiek) opis.push(`Wiek: ${r.wiek}`);
      if (r.cena) opis.push(`Cena: ${r.cena}`);
      if (r.href) { opis.push(`Link do wydarzenia: ${r.href}`); wiersze.push(`URL:${tekstIcs(r.href)}`); }
    }
    opis.push('Godziny mogły się zmienić, sprawdź u organizatora. Plan z frajdoplan.pl');
    wiersze.push(`DESCRIPTION:${tekstIcs(opis.join('\n'))}`);
    zdarzenia.push(['BEGIN:VEVENT', ...wiersze, 'END:VEVENT']);
  });
  if (!zdarzenia.length) return { ics: '', dodano: 0, pominieto };
  const linie = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Frajdoplan//Moj plan//PL', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${tekstIcs(nazwaPlanu)}`, `X-WR-TIMEZONE:${STREFA}`, ...VTIMEZONE, ...zdarzenia.flat(), 'END:VCALENDAR',
  ];
  return { ics: `${linie.map(zloz).join(CRLF)}${CRLF}`, dodano: zdarzenia.length, pominieto };
}

// Podsumowanie dla użytkownika po pobraniu pliku: ile trafiło do kalendarza i co pominięto.
export function opisPominietych(p) {
  const czesci = [];
  if (p.bezDnia) czesci.push(`${p.bezDnia} bez wybranego dnia`);
  if (p.odbyly) czesci.push(`${p.odbyly} już się odbyło`);
  if (p.niedostepne) czesci.push(`${p.niedostepne} już niedostępne`);
  return czesci.join(', ');
}
