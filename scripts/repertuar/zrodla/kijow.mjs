// Kino Kijów.Centrum — system sprzedaży MSI (kupbilet.kijow.pl).
// Strona miesiąca ma w kodzie gotową listę `var RepertoireEvents = [{ 'Id', 'Name', 'Date', 'Hour', … }]`.
import * as cheerio from 'cheerio';
import { pobierz, dzisWarszawa, godzina, rozbierzTytul, pad, slugZ } from '../wspolne.mjs';

const BAZA = 'https://kupbilet.kijow.pl';
const tekstPola = (blok, pole) => {
  const m = blok.match(new RegExp(`'${pole}':\\s*'((?:\\\\'|[^'])*)'`));
  return m ? m[1].replace(/\\'/g, "'") : '';
};

// Krótki opis odpowiedzi do logu: miesiąc, rozmiar, tytuł strony i początek treści.
function opisOdpowiedzi(miesiac, html) {
  const $ = cheerio.load(html);
  const tytul = $('title').first().text().replace(/\s+/g, ' ').trim().slice(0, 80);
  const poczatek = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 120);
  return `${miesiac}: ${html.length} znaków, tytuł „${tytul || 'brak'}", początek „${poczatek || 'pusty'}"`;
}

// Strona filmu na kijow.pl (wpis WordPressa o tytule filmu) — link do kupbilet.kijow.pl nie działa bez sesji.
async function stronaFilmu(seans) {
  const wyniki = await pobierz(`https://kijow.pl/wp-json/wp/v2/search?subtype=post&per_page=10&search=${encodeURIComponent(seans.tytul)}`, { json: true });
  const szukany = slugZ(seans.tytul);
  const traf = wyniki.find((w) => slugZ(cheerio.load(w.title || '').text()) === szukany);
  return traf ? traf.url : '';
}

export default {
  id: 'kijow',
  nazwa: 'Kino Kijów',
  url: 'https://kijow.pl/repertuar/',
  stronaFilmu,
  async pobierz() {
    const [r, m] = dzisWarszawa().split('-').map(Number);
    const miesiace = [`${r}-${pad(m)}`, m === 12 ? `${r + 1}-01` : `${r}-${pad(m + 1)}`];
    const seanse = [];
    const bezListy = []; // opis odpowiedzi, w której nie było listy seansów (do komunikatu o błędzie)
    for (const miesiac of miesiace) {
      const html = await pobierz(`${BAZA}/MSI/mvc/pl?sort=Date&date=${miesiac}`);
      const lista = html.match(/var RepertoireEvents\s*=\s*\[([\s\S]*?)\];/);
      if (!lista) {
        bezListy.push(opisOdpowiedzi(miesiac, html));
        continue;
      }
      for (const blok of lista[1].split(/\},\s*\{/)) {
        const id = (blok.match(/'Id':\s*(\d+)/) || [])[1];
        const [dd, mm, rrrr] = tekstPola(blok, 'Date').split('.');
        if (!id || !rrrr) continue;
        const { tytul, wersja } = rozbierzTytul(tekstPola(blok, 'Name'));
        const opis = tekstPola(blok, 'Description');
        seanse.push({
          tytul,
          data: `${rrrr}-${mm}-${dd}`,
          godzina: godzina(tekstPola(blok, 'Hour')),
          miejsce: 'Kino Kijów',
          wersja,
          link: `${BAZA}/MSI/Default.aspx?event_id=${id}&typetran=0`,
          // Kijów nie podaje wieku ani gatunku. Seanse z dubbingiem to w praktyce filmy dla dzieci.
          dlaDzieci: wersja === 'dubbing' || /animowan|animacj|familijn|przedszkol|dla najmłodszych/i.test(opis),
          inne: /^(spektakl|opera)\b/i.test(tytul),
        });
      }
    }
    // Żaden miesiąc nie miał listy: strona odpowiada, ale inną treścią (blokada, przerwa techniczna, zmiana układu).
    // Mówimy to wprost, zamiast zwracać „0 seansów" bez wyjaśnienia.
    if (bezListy.length === miesiace.length) {
      throw new Error(`Kijów odpowiada stroną bez listy seansów (RepertoireEvents): ${bezListy.join('; ')}`);
    }
    return seanse.filter((s) => !s.inne);
  },
};
