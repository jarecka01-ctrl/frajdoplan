// Sprawdzanie linków do seansów: każdy link musi prowadzić na działającą stronę.
// Niedziałający zastępujemy stroną filmu, a gdy jej nie ma — repertuarem kina.
import { sprawdz } from './wspolne.mjs';

// Linki, o których wiemy, że bez sesji kończą się błędem — nie tracimy na nie zapytań.
const ZNANE_BLEDNE = [
  [/kupbilet\.kijow\.pl\/MSI\/Default\.aspx/i, 'system sprzedaży Kijowa wymaga sesji (Error.aspx)'],
];

const wyniki = new Map(); // adres → wynik sprawdzenia (każdy adres sprawdzamy raz na uruchomienie)
async function sprawdzRaz(url) {
  const znany = ZNANE_BLEDNE.find(([wzor]) => wzor.test(url));
  if (znany) return { ok: false, powod: znany[1] };
  if (!wyniki.has(url)) wyniki.set(url, await sprawdz(url));
  return wyniki.get(url);
}

// Zwraca { zastapione, niesprawdzone, uwagi }; zmienia `link` w podanych seansach.
// `zrodlo.stronaFilmu(seans)` (opcjonalne) podaje stronę filmu; ostatnia deska ratunku to `zrodlo.url`.
export async function naprawLinki(zrodlo, seanse) {
  const stronyFilmow = new Map(); // tytuł → adres (źródło pyta o film raz)
  const film = async (s) => {
    if (s.film) return s.film;
    if (!zrodlo.stronaFilmu) return '';
    if (!stronyFilmow.has(s.tytul)) {
      try { stronyFilmow.set(s.tytul, (await zrodlo.stronaFilmu(s)) || ''); } catch (e) { stronyFilmow.set(s.tytul, ''); }
    }
    return stronyFilmow.get(s.tytul);
  };

  let zastapione = 0;
  let niesprawdzone = 0;
  const uwagi = [];
  for (const s of seanse) {
    const wynik = s.link ? await sprawdzRaz(s.link) : { ok: false, powod: 'brak linku' };
    if (wynik.ok === null) { niesprawdzone += 1; continue; } // nie wiemy — zostawiamy link
    if (wynik.ok) continue;

    const kandydaci = [await film(s), zrodlo.url].filter(Boolean);
    let wybrany = '';
    for (const adres of kandydaci) {
      if ((await sprawdzRaz(adres)).ok !== false) { wybrany = adres; break; }
    }
    wybrany = wybrany || zrodlo.url;
    uwagi.push(`${s.tytul} ${s.data} ${s.godzina}: ${wynik.powod} → ${wybrany === zrodlo.url ? 'repertuar kina' : 'strona filmu'}`);
    s.link = wybrany;
    zastapione += 1;
  }
  return { zastapione, niesprawdzone, uwagi };
}
