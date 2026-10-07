// Krakowskie Forum Kultury (krakowskieforum.pl) — kalendarium klubów (Malwa, Olsza, Kazimierz, Strych), Piwnicy pod Baranami
// i Zespołu Pieśni i Tańca „Krakowiacy". Strona nie ma JSON-LD z godzinami (JSON-LD wydarzenia podaje tylko zakres dat), RSS
// obejmuje tylko aktualności, więc czytamy HTML: każdy dzień ma stały adres /wydarzenia-RRRR-MM-DD.html (tabela „Harmonogram":
// godzina, tytuł, kategorie, miejsce, link do strony wydarzenia), a dłuższe dni mają kolejne strony
// (/kalendarz_imprez/index/harmonogram/1/year/…/day/…/page/N.html). Strona wydarzenia ma cenę i adres organizatora.
// Filtr „Dla dzieci" (/wydarzenia-kategoria-119.html) działa na sesji (cookies), więc zamiast niego sami bierzemy kategorię
// „Dla dzieci" z tabeli dnia. robots.txt zakazuje tylko /uploads/, /css/, /images/, /js/ i kilku adresów AJAX
// (np. /kalendarz_imprez/kalendarzTopTydzien/), których nie używamy.
//
// Co publikujemy jako wydarzenia:
//  - wszystko z kategorią „Dla dzieci",
//  - wydarzenia nieregularne z wiekiem (dolna granica < 12 lat) w tytule („3-5 lat"), „dla dzieci" albo „rodzinn…" w tytule;
//    bez zajęć dla dorosłych, seniorów i kobiet w ciąży.
// Zajęcia cotygodniowe (≥ 3 terminy, ten dzień i godzina co najmniej 2 razy, bez kategorii „Dla dzieci") to oferta stała, nie wydarzenia: trafiają do
// data/kfk-zajecia.csv (skrypt kfk-zajecia.mjs), żeby nie zalać kalendarza setkami cotygodniowych terminów.
// Opisów i zdjęć nie kopiujemy: bierzemy fakty (tytuł, data, godzina, miejsce, wiek, cena, link).
import * as cheerio from 'cheerio';
import { pobierz, spacje, godzina, plusDni, dzisWarszawa, slugZ } from '../wspolne.mjs';

export const BAZA = 'https://krakowskieforum.pl';
const DNI = 180;
const PROG_CYKLU = 3; // tyle terminów w oknie = zajęcia cykliczne
const MAKS_STRON_DNIA = 6;

// Miejsce z kolumny „Miejsce" → nazwa, pod którą wydarzenie zapisujemy.
export const nazwaMiejsca = (surowa) => {
  const n = spacje(surowa);
  if (/krakowiacy/i.test(n)) return 'Zespół Pieśni i Tańca „Krakowiacy”';
  return n || 'Krakowskie Forum Kultury';
};

const liczba = (t) => parseFloat(String(t).replace(',', '.'));

// „(4-5 lat)", „(1-3 lata)", „(0-1,5 roku)", „w wieku 4-6 lat" → { tekst: '4–5 lat', od: 4, do: 5 }; „od 3 lat" → { tekst: '3+', od: 3 }
export function wiekZTytulu(tekst) {
  const t = spacje(tekst);
  const zakres = t.match(/(\d+(?:[.,]\d+)?)\s*[–-]\s*(\d+(?:[.,]\d+)?)\s*(lat\p{L}*|roku|rok\p{L}*|mies\p{L}*)/iu);
  if (zakres) {
    const jednostka = /rok/i.test(zakres[3]) ? 'roku' : /mies/i.test(zakres[3]) ? 'mies.' : 'lat';
    return { tekst: `${zakres[1]}–${zakres[2]} ${jednostka}`, od: liczba(zakres[1]), do: liczba(zakres[2]), miesiace: jednostka === 'mies.' };
  }
  const od = t.match(/od\s+(\d{1,2})\s*(?:lat|roku)/i);
  if (od) return { tekst: `${od[1]}+`, od: Number(od[1]) };
  return null;
}

const DLA_DOROSLYCH = /dla doros[łl]ych|dla senior|senior(?:ów|a|zy)|18\+|\bdoros[łl]ych\b|w ci[ąa][żz]y|ci[ąa][żz]owych|joga(?! dla dzieci)/i;
const SYGNAL_DZIECKA = /dla dzieci|dzieci(?:ęc|om|ach)|rodzinn|maluch|bobas|przedszkol|smyko|klub rodzic/i;

// Wydarzenie dla dzieci wg tytułu: wiek (dolna granica < 12) albo wyraźne słowa. Dorośli/seniorzy → nie.
export function sygnalDlaDzieci({ tytul, podtytul = '' }) {
  const tekst = `${tytul} ${podtytul}`;
  if (DLA_DOROSLYCH.test(tekst)) return false;
  const wiek = wiekZTytulu(tekst);
  if (wiek) return wiek.od < 12; // podany wiek rozstrzyga (także „dla dzieci i młodzieży (12-25 lat)" to już nie dzieci)
  return SYGNAL_DZIECKA.test(tekst);
}

// Kategoria z listy (koncert, spektakl, warsztaty, pokaz, czytanie, wystawa, jarmark, festyn, sport, spacer, planszowki, inne).
export function kategoriaZ({ tytul, tagi = [] }) {
  const t = `${tytul}`;
  if (/koncert|recital/i.test(t)) return 'koncert';
  if (/spektakl|przedstawieni|teatrzyk|o!teatr|bajka/i.test(t)) return 'spektakl';
  if (/planszówk|gier planszowych|szachy/i.test(t)) return 'planszowki';
  if (tagi.includes('Spacery') || /spacer/i.test(t)) return 'spacer';
  if (tagi.includes('Wystawy') || /wystaw|wernisa/i.test(t)) return 'wystawa';
  if (tagi.includes('Literatura') || /czytani|bajkowani|spotkanie z autor/i.test(t)) return 'czytanie';
  if (/warsztat|zajęci|kurs|klub rodziców|plastyk|muzykowani|multisensor|sensoplastyk|taneczn|balet|capoeira|teatr/i.test(t) || tagi.includes('Zajęcia')) return 'warsztaty';
  if (tagi.includes('Kino') || /pokaz|kino/i.test(t)) return 'pokaz';
  return 'inne';
}
const typZKategorii = (k) => (k === 'koncert' ? 'koncert' : k === 'spektakl' ? 'spektakl' : 'wydarzenie');

const adresDnia = (iso) => `${BAZA}/wydarzenia-${iso}.html`;
const numerSerii = (href) => (String(href).match(/\/wydarzenie-(\d+)-/) || [])[1] || '';

// Jedna strona tabeli dnia → wiersze + adresy kolejnych stron.
export function parsujDzien(html, iso) {
  const $ = cheerio.load(html);
  const wiersze = [];
  $('table.widok_listy tbody tr').each((_, tr) => {
    const onclick = $(tr).attr('onclick') || '';
    const href = (onclick.match(/\('([^']+\.html)'\)/) || [])[1];
    if (!href || !/\/wydarzenie-/.test(href)) return;
    const komorki = $(tr).find('td.info');
    const godz = spacje($(komorki[2]).text()).match(/(\d{1,2}:\d{2})/);
    const tytulKom = $(tr).find('td.title').first();
    const podtytul = spacje(tytulKom.find('span').text());
    const tytul = spacje(tytulKom.clone().children().remove().end().text());
    wiersze.push({
      data: iso,
      godzina: godz ? godzina(godz[1]) : '',
      tytul,
      podtytul,
      tagi: $(tr).find('td.kategorie span').map((__, s) => spacje($(s).text())).get(),
      miejsce: spacje($(tr).find('td.miejsce').first().text()),
      adres: new URL(href, BAZA).href,
      seria: numerSerii(href),
    });
  });
  const nastepne = $('.page_bar .num_pages a[href]').map((_, a) => $(a).attr('href')).get();
  return { wiersze, nastepne };
}

// Cena i organizator ze strony wydarzenia: „40 zł", klub + ulica + kod.
export function parsujSzczegoly(html) {
  const $ = cheerio.load(html);
  const pole = (klasa) => spacje($(`.aside_kal .box-iobiekt.${klasa} .obiekt_dane`).first().text());
  const org = $('.aside_kal .box-iobiekt').filter((_, e) => /organizator/i.test($(e).find('.obiekt_typ').text())).first().find('.obiekt_dane a').first();
  const linie = org.length ? org.html().split(/<br\s*\/?>/i).map((x) => spacje(cheerio.load(`<p>${x}</p>`)('p').text())).filter(Boolean) : [];
  return { cena: pole('cena').replace(/\s*Kup bilet\s*$/i, ''), godzina: pole('godzina'), termin: pole('termin'), organizator: linie[0] || '', ulica: linie[1] || '', kod: linie[2] || '' };
}

// Wszystkie terminy z dni od `od` przez `dni` dni. Błąd któregokolwiek zapytania przerywa całość
// (źródło zostaje wtedy z poprzednimi danymi — patrz `lagodny`).
export async function pobierzTerminy(od = dzisWarszawa(), dni = DNI, loguj = () => {}) {
  const wszystkie = [];
  for (let i = 0; i <= dni; i += 1) {
    const iso = plusDni(od, i);
    let adres = adresDnia(iso);
    const odwiedzone = new Set();
    for (let strona = 0; adres && strona < MAKS_STRON_DNIA && !odwiedzone.has(adres); strona += 1) {
      odwiedzone.add(adres);
      const { wiersze, nastepne } = parsujDzien(await pobierz(adres, { robots: true }), iso);
      wszystkie.push(...wiersze);
      const kolejna = nastepne.map((h) => new URL(h, BAZA).href).find((h) => !odwiedzone.has(h));
      adres = kolejna || '';
    }
    if (i % 30 === 0) loguj(`  kfk: dzień ${iso} (${wszystkie.length} terminów do tej pory)`);
  }
  return wszystkie;
}

// Podział terminów na wydarzenia do publikacji i serie cotygodniowe (oferta stała).
// Seria cotygodniowa = co najmniej 3 terminy i ten sam dzień tygodnia z tą samą godziną co najmniej 2 razy.
// Seria nieregularna (np. spotkania w rozrzuconych dniach) zostaje wydarzeniami.
const dzienTyg = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay();
export function podziel(terminy) {
  const poSeriach = new Map();
  for (const t of terminy) {
    if (!poSeriach.has(t.seria)) poSeriach.set(t.seria, []);
    poSeriach.get(t.seria).push(t);
  }
  const tygodniowe = new Set();
  for (const [seria, lista] of poSeriach) {
    const dni = new Set(lista.map((t) => t.data));
    const grupy = new Map();
    for (const t of lista) { const k = `${dzienTyg(t.data)}|${t.godzina}`; grupy.set(k, (grupy.get(k) || new Set()).add(t.data)); }
    if (dni.size >= PROG_CYKLU && [...grupy.values()].some((d) => d.size >= 2)) tygodniowe.add(seria);
  }
  const dlaDzieci = (t) => !DLA_DOROSLYCH.test(`${t.tytul} ${t.podtytul}`) && (t.tagi.includes('Dla dzieci') || sygnalDlaDzieci(t));
  const wydarzenia = terminy.filter((t) => dlaDzieci(t) && (t.tagi.includes('Dla dzieci') || !tygodniowe.has(t.seria)));
  const serie = new Map();
  for (const t of terminy.filter((x) => dlaDzieci(x) && tygodniowe.has(x.seria))) {
    if (!serie.has(t.seria)) serie.set(t.seria, []);
    serie.get(t.seria).push(t);
  }
  return { wydarzenia, serie };
}

// Dopasowanie klubu do arkusza „Miejsca": po nazwie, a siedziba Forum po adresie (Mikołajska 2).
const WZORY_ARKUSZA = [
  [/^klub malwa/i, (r) => /klub malwa/i.test(r.name)],
  [/^klub olsza/i, (r) => /^klub olsza/i.test(r.name)],
  [/^klub kazimierz/i, (r) => /^klub kazimierz/i.test(r.name)],
  [/^klub strych/i, (r) => /klub strych/i.test(r.name)],
  [/krakowiacy/i, (r) => /krakowiacy/i.test(r.name)],
  [/^krakowskie forum kultury/i, (r) => /^miko[łl]ajska 2\b/i.test(String(r.street || ''))],
];
export function dopasujMiejsce(wydarzenie, wiersze) {
  const regula = WZORY_ARKUSZA.find(([wzor]) => wzor.test(wydarzenie.miejsce));
  const pasuje = regula ? wiersze.filter(regula[1]) : wiersze.filter((r) => slugZ(r.name) === slugZ(wydarzenie.miejsce));
  return (pasuje.sort((a, b) => (parseFloat(b.reviews) || 0) - (parseFloat(a.reviews) || 0))[0] || {}).place_id || '';
}

export default {
  id: 'kfk',
  nazwa: 'Krakowskie Forum Kultury',
  url: `${BAZA}/wydarzenia.html`,
  rodzaj: 'wydarzenia',
  wyprzedzenieDni: DNI,
  moznaPusto: true, // brak wydarzeń dla dzieci w oknie nie jest awarią
  lagodny: true, // awaria tego źródła to ostrzeżenie: poprzednie dane zostają, workflow nie robi się czerwony
  dopasujMiejsce,
  async pobierz() {
    const terminy = await pobierzTerminy(dzisWarszawa(), DNI, (t) => console.log(t));
    const { wydarzenia } = podziel(terminy);
    // cena i adres: jedno zapytanie na serię (cena jest taka sama dla wszystkich terminów serii)
    const szczegoly = new Map();
    const wynik = [];
    for (const t of wydarzenia) {
      if (!szczegoly.has(t.seria)) szczegoly.set(t.seria, parsujSzczegoly(await pobierz(t.adres, { robots: true })));
      const s = szczegoly.get(t.seria);
      const wiek = wiekZTytulu(`${t.tytul} ${t.podtytul}`);
      const kategoria = kategoriaZ(t);
      wynik.push({
        tytul: t.tytul,
        data: t.data,
        godzina: t.godzina,
        miejsce: nazwaMiejsca(t.miejsce || s.organizator),
        kategoria,
        typ: typZKategorii(kategoria),
        wiek: wiek ? wiek.tekst : '',
        cena: s.cena,
        link: t.adres,
        strona: t.adres,
        dlaDzieci: true,
      });
    }
    return wynik;
  },
};
