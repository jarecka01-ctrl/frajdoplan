// Teatr Figurki (teatrfigurki.pl) — teatr dla dzieci (siostrzany Teatr Figur, teatrfigur.pl, gra dla dorosłych i nie ma
// oznaczeń dla dzieci). Repertuar to ręcznie składana strona (Elementor): wiersz = dzień tygodnia, data „04.10." (bez roku),
// tytuł, miejsce, godziny, wiek („4 +"), przycisk „Kup bilet" (link w atrybucie `data-ep-wrapper-link`). Całość jest dla dzieci.
// Bierzemy tylko wydarzenia w Krakowie (gościnne występy w Wadowicach, Wrocławiu itd. pomijamy). Rok wnioskujemy z daty:
// najbliższy termin nie wcześniejszy niż 60 dni temu. Zakresy dat (festiwale, „21-25.10.") pomijamy.
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina, pad, dzisWarszawa, plusDni, wiekZTekstu } from '../wspolne.mjs';

const BAZA = 'https://teatrfigurki.pl';
const DZIEN = /^(poniedzia[łl]ek|wtorek|[śs]roda|czwartek|pi[ąa]tek|sobota|niedziela)$/i;

const rokDaty = (dzien, miesiac, dzis) => {
  const rok = Number(dzis.slice(0, 4));
  const wczesniej = plusDni(dzis, -60);
  for (const r of [rok - 1, rok, rok + 1]) {
    const iso = `${r}-${pad(miesiac)}-${pad(dzien)}`;
    if (iso >= wczesniej) return iso;
  }
  return '';
};

const bilety = (el, $) => {
  const wzor = /ep-wrapper-link/;
  let adres = '';
  $(el).find('*').addBack().each((_, e) => {
    const dane = $(e).attr('data-ep-wrapper-link');
    if (dane && !adres && wzor.test('ep-wrapper-link')) {
      try { adres = JSON.parse(dane).url || ''; } catch (err) { /* pomijamy */ }
    }
  });
  return adres || $(el).find('a[href^="http"]').filter((_, a) => /kup bilet/i.test($(a).text())).first().attr('href') || '';
};

export function parsuj(html, dzis = dzisWarszawa()) {
  const $ = cheerio.load(html);
  const wydarzenia = [];
  const widziane = new Set();
  $('p').each((_, p) => {
    if (!DZIEN.test(spacje($(p).text()))) return;
    // wiersz wydarzenia: najbliższy przodek, który zawiera datę, tytuł i godzinę, ale tylko jeden dzień tygodnia
    let wiersz = $(p).parent();
    for (let i = 0; i < 12; i += 1) {
      const dni = wiersz.find('p').filter((__, e) => DZIEN.test(spacje($(e).text()))).length;
      if (dni > 1) { wiersz = null; break; }
      if (wiersz.find('h3').length >= 3) break;
      wiersz = wiersz.parent();
    }
    if (!wiersz || !wiersz.length || wiersz.find('h3').length < 3) return;
    const h3 = wiersz.find('h3').map((__, e) => spacje($(e).text())).get().filter(Boolean);
    const data = h3.find((t) => /^\d{1,2}\.\d{1,2}\.?$/.test(t));
    if (!data) return; // zakres dat (festiwal) albo inny układ
    const [d, m] = data.split('.').map(Number);
    const tytul = h3[h3.indexOf(data) + 1] || '';
    const godziny = h3.filter((t) => /^\d{1,2}:\d{2}$/.test(t)).map(godzina);
    // miejsce: tekst z miastem, który nie jest nagłówkiem
    const lisc = wiersz.find('div, h3, span, p').filter((__, e) => $(e).children().length === 0).map((__, e) => spacje($(e).text())).get();
    const miejsce = lisc.find((t) => /krak[óo]w|sławkowska|nowohuck|wadowic|wroc[łl]aw|gorlic|[a-ząćęłńóśźż]+\s+(centrum|dom)\s/i.test(t) && t.length < 90) || '';
    const wiekTekst = lisc.find((t) => /^\d{1,2}\s*\+$/.test(t) || /^\d{1,2}\s*[–-]\s*\d{1,2}\s*lat$/i.test(t)) || '';
    const wiek = wiekZTekstu(wiekTekst.replace(/\s+/g, ''));
    const link = bilety(wiersz, $);
    const iso = rokDaty(d, m, dzis);
    if (!tytul || !iso || !godziny.length) return;
    if (!/krak[óo]w|nowohuck|sławkowska/i.test(miejsce)) return; // występy poza Krakowem
    godziny.forEach((g) => {
      const klucz = `${iso}|${g}|${tytul}`;
      if (widziane.has(klucz)) return;
      widziane.add(klucz);
      wydarzenia.push({
        tytul,
        data: iso,
        godzina: g,
        miejsce: /nowohuck/i.test(miejsce) ? 'Nowohuckie Centrum Kultury' : 'Teatr Figur',
        kategoria: 'spektakl',
        typ: 'spektakl',
        wiek: wiek || '',
        link,
        strona: `${BAZA}/repertuar/`,
        dlaDzieci: true, // cały repertuar teatru jest dla dzieci
      });
    });
  });
  return wydarzenia;
}

export default {
  id: 'figurki',
  nazwa: 'Teatr Figurki',
  url: `${BAZA}/repertuar/`,
  rodzaj: 'wydarzenia',
  miejsca: [['Teatr Figur', /teatr figur$/i], ['Nowohuckie Centrum Kultury', /nowohuckie centrum kultury/i]],
  async pobierz() {
    return parsuj(await pobierz(this.url, { robots: true }));
  },
};
