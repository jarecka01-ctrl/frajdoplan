// MOCAK, Muzeum Sztuki Współczesnej w Krakowie (mocak.pl, ul. Lipowa 4). Kalendarz /kalendarz?page=N to zwykły HTML,
// 10 wydarzeń na stronę, od najnowszych (przyszłych) do najstarszych, więc czytamy strony, aż trafimy na stronę wyłącznie
// z minionymi dniami. Każdy wpis ma datę „18.10.2026 godz. 11:15" (albo kilka godzin: „11.15, 12.30"; albo zakres dat
// „18.10.2026 - 31.10.2026" bez godziny), tytuł i krótki opis. Godziny z jednego dnia rozpisujemy na osobne wpisy.
// Strona nie ma kategorii „dla dzieci", ale wiek i adresatów podaje w tytule i opisie („dla dzieci w wieku od 4 do 6 lat",
// „zajęcia rodzinne", „dzieci do trzeciego roku życia"), więc ocenaGoscinna po tytule i opisie; niepewne = undefined.
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina, wiekZTekstu, dzisWarszawa } from '../wspolne.mjs';
import { ocenaGoscinna } from '../dla-dzieci.mjs';

const BAZA = 'https://mocak.pl';
const MIEJSCE = 'MOCAK Muzeum Sztuki Współczesnej';
const ROKI = { pierwszego: 1, drugiego: 2, trzeciego: 3, czwartego: 4, piątego: 5, szóstego: 6 };

const iso = (d) => { const m = String(d).match(/(\d{2})\.(\d{2})\.(\d{4})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : ''; };

// Godziny z „godz. 11.15, 12.30" / „godz. 17" / „godz. 11:15" → ['11:15', '12:30'].
export function godziny(tekst) {
  const po = String(tekst).split(/godz\./i)[1] || '';
  return (po.match(/\d{1,2}(?:[.:]\d{2})?/g) || []).map((g) => { const [h, m] = g.split(/[.:]/); return godzina(`${h}:${m || '00'}`); });
}

// Tytuł bez dopisków „WYPRZEDANE", „NOWY TERMIN: 10.10" i końcowej daty („… 14.11.", „… 20.12.2026").
export function czystyTytul(t) {
  return spacje(t)
    .replace(/^(WYPRZEDANE|NOWY TERMIN:?\s*\d{1,2}\.\d{1,2}\.?)\s*/i, '')
    .replace(/\s+\d{1,2}\.\d{1,2}(?:\.\d{2,4})?\.?$/, '')
    .trim();
}

// Wiek z tytułu i opisu: „od 4 do 6 lat", „do trzeciego roku życia", „od roku do trzech lat".
export function wiek(tekst) {
  const t = spacje(tekst);
  const r = t.match(/do\s+(pierwszego|drugiego|trzeciego|czwartego|piątego|szóstego)\s+roku\s+życia/i);
  if (r) return `0–${ROKI[r[1].toLowerCase()]} lat`;
  if (/od\s+roku\s+do\s+trzech\s+lat/i.test(t)) return '1–3 lat';
  return wiekZTekstu(t);
}

export function kategoria(tytul, opis) {
  const t = `${tytul} ${opis}`.toLowerCase();
  if (/spacer|oprowadzani|zwiedzani/.test(t)) return 'spacer';
  if (/warsztat|zajęcia|zajęć/.test(t)) return 'warsztaty';
  if (/wystaw|fort sztuki|finisaż/.test(t)) return 'wystawa';
  return 'inne';
}

// Jedna strona kalendarza → wpisy (jeden na datę i godzinę).
export function parsuj(html) {
  const $ = cheerio.load(html);
  const wynik = [];
  $('.item[data-id]').each((_, el) => {
    const x = $(el);
    const naglowek = x.find('h3').first();
    const strona = (naglowek.find('a').attr('href') || '').replace(/#.*$/, '');
    const tytul = czystyTytul(naglowek.text());
    const opis = spacje(x.find('p').first().text());
    const termin = spacje(x.find('.event_open').text());
    const daty = termin.match(/\d{2}\.\d{2}\.\d{4}/g) || [];
    if (!strona || !tytul || !daty.length) return;
    const dataOd = iso(daty[0]);
    const dataDo = daty[1] ? iso(daty[1]) : '';
    const godz = dataDo ? [''] : (godziny(termin).length ? godziny(termin) : ['']);
    for (const g of godz) wynik.push({ tytul, opis, data: dataOd, dataDo, godzina: g, strona: new URL(strona, BAZA).href });
  });
  return wynik;
}

export function ocena(w) {
  const o = ocenaGoscinna({ tytul: w.tytul, opis: w.opis });
  const wk = wiek(`${w.tytul} ${w.opis}`);
  if (o.dlaDzieci === true) return { dlaDzieci: true, wiek: wk || o.wiek };
  return o;
}

export default {
  id: 'mocak',
  nazwa: 'MOCAK',
  url: `${BAZA}/kalendarz`,
  rodzaj: 'wydarzenia',
  miejsca: [[MIEJSCE, /mocak/i]],
  async pobierz() {
    const dzis = dzisWarszawa();
    const wynik = [];
    for (let strona = 1; strona <= 12; strona += 1) {
      const wpisy = parsuj(await pobierz(`${BAZA}/kalendarz?page=${strona}`, { robots: true }));
      if (!wpisy.length) break;
      for (const w of wpisy) {
        if ((w.dataDo || w.data) < dzis) continue;
        const o = ocena(w);
        wynik.push({
          tytul: w.tytul,
          data: w.data,
          ...(w.dataDo ? { dataDo: w.dataDo } : {}),
          godzina: w.godzina,
          miejsce: MIEJSCE,
          kategoria: kategoria(w.tytul, w.opis),
          typ: 'wydarzenie',
          wiek: o.wiek,
          cena: '',
          strona: w.strona,
          link: '',
          dlaDzieci: o.dlaDzieci,
        });
      }
      // kalendarz idzie od najnowszych: strona bez żadnego przyszłego dnia kończy czytanie
      if (wpisy.every((w) => (w.dataDo || w.data) < dzis)) break;
    }
    // ten sam tytuł, dzień i godzina (zdarza się podwójny wpis tego samego terminu) = jedno wydarzenie
    return [...new Map(wynik.map((w) => [`${w.tytul}|${w.data}|${w.godzina}`, w])).values()];
  },
};
