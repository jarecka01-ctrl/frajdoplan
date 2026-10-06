import Papa from 'papaparse';
import { DZIALY, kategorieDzialu, kategoriaRodzaju, rodzajMiejsca, odmianaMiejsc } from './kategorie';
import { przytnij, przytnijTytul } from './tekst';
import { grupujTerminy, miesiacZDaty, najblizszyDzien } from './grupowanie';
import { seoStrony } from './seo';
import { slugMiejsca, SEKCJE_Z_KARTA, czyKartaIndeksowalna, wiekZOpisu, doListy } from './miejsca';
import repertuar from '../data/repertuar.json';

const SHEET_CSV_URL = process.env.SHEET_CSV_URL;
const SHEET_EVENTS_CSV_URL = process.env.SHEET_EVENTS_CSV_URL;

// Podkategorie z sekcji „Zajęcia". Reszta to miejsca „z marszu", Półkolonie mają osobną stronę.
export const PODKAT_ZAJECIA = new Set(['Zajęcia mama-dziecko', 'Zajęcia edukacyjne i artystyczne', 'Instytucja kultury']);
export const PODKAT_TRENINGI = new Set(['Szkoły pływania', 'Zajęcia sportowe', 'Sport / zajęcia ruchowe']);

const sekcjaZ = (row) => {
  if (PODKAT_TRENINGI.has(row.podkategoria)) return 'treningi'; // sport zawsze w Treningach, nawet ze starą kolumną `sekcja`
  if (row.sekcja) return row.sekcja;
  if (row.podkategoria === 'Półkolonie') return 'polkolonie';
  return PODKAT_ZAJECIA.has(row.podkategoria) ? 'zajecia' : 'z-marszu';
};

// Dyscyplina treningu z nazwy i typu miejsca (gdy arkusz nie ma kolumny `dyscyplina` albo jest pusta).
const DYSCYPLINY = [
  ['Pływanie', /pływ|plyw|swim|nurk/],
  ['Taniec', /dance|taniec|tańc|tanc|balet|ballet|hip.?hop|zumba|jazz|salsa/],
  ['Sztuki walki', /martial|judo|karate|taekw|box|bokse|capoeira|mma|jiu|aikido|kick|kung|grappl|krav|sambo|zapas|fight|samuraj|dojo|walki|hajime|irbis|szerm|fecht/],
  ['Piłka nożna', /soccer|football|piłk|pilk|futbol|akademia wisły|polonia|victoria|pogoń|prądniczanka|nadwiślan|garbarnia|płaszowianka|bieżanowianka|hutnik|wieczysta|orlik|mielcarski|player/],
  ['Gimnastyka i akrobatyka', /gymnast|gimnast|akrobat|trampolin|cheer|parkour|calisthen|tricker|hulahop/],
  ['Tenis i badminton', /tennis|tenis|badminton|squash|padel/],
  ['Wspinaczka', /climb|wspin|boulder/],
  ['Łyżwy i rolki', /skat|łyżw|lyzw|rolk|roller|hokej|hockey/],
  ['Narty i snowboard', /\bski|narc|narty|snowboard/],
  ['Żeglarstwo i kajaki', /sail|żegl|zegl|kajak|wiosł|rowing|jacht|water club/],
  ['Jazda konna', /horse|konn|jeźdz|jezdz|stadnin|equestr/],
  ['Zajęcia ogólnorozwojowe', /ruch|dynamiczn|whizzy|active kids|akademia sportu|sportsacademy|smok sport|pro-sport|ekoland|progres|olimp|after school|ninja|quidditch|latania|umiejętności/],
];
const dyscyplinaZ = (row, sekcja) => {
  if (row.dyscyplina) return row.dyscyplina;
  if (sekcja !== 'treningi') return '';
  if (row.podkategoria === 'Szkoły pływania') return 'Pływanie';
  const txt = `${row.name || ''} ${row.type || ''}`.toLowerCase();
  const traf = DYSCYPLINY.find(([, wzor]) => wzor.test(txt));
  return traf ? traf[0] : 'Kluby i inne sporty';
};

const liczba = (v) => {
  const n = parseFloat(String(v || '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

// Przy budowie wiele stron czyta ten sam arkusz — trzymamy wynik w pamięci przez 5 minut.
let pamiec = null;
function pobierzMiejsca() {
  if (pamiec && Date.now() - pamiec.czas < 5 * 60 * 1000) return pamiec.dane;
  const dane = pobierzMiejscaZArkusza();
  pamiec = { czas: Date.now(), dane };
  dane.catch(() => { pamiec = null; });
  return dane;
}

async function pobierzMiejscaZArkusza() {
  const res = await fetch(SHEET_CSV_URL);
  if (!res.ok) throw new Error(`Arkusz: ${res.status}`);
  const rows = Papa.parse(await res.text(), { header: true, skipEmptyLines: true }).data;
  const miejsca = rows
    .filter((row) => row.name)
    .map((row, i) => ({
      id: row.place_id || String(i),
      name: row.name,
      kategoria: row.kategoria_glowna || '',
      podkategoria: row.podkategoria === 'Sport / zajęcia ruchowe' ? 'Zajęcia sportowe' : row.podkategoria || '',
      sekcja: sekcjaZ(row),
      dyscyplina: dyscyplinaZ(row, sekcjaZ(row)),
      adres: row.street || '',
      gmina: String(row.gmina_aglomeracja || 'Kraków').startsWith('Kraków') ? 'Kraków' : row.gmina_aglomeracja,
      rating: liczba(row.rating),
      reviews: liczba(row.reviews),
      website: /wikipedia\.org/.test(row.website || '') ? '' : row.website || '',
      urodziny: (row.organizuje_urodziny || '').toLowerCase() === 'tak',
      strefa: row.strefa || 'Kraków i okolice',
      km: liczba(row.odleglosc_km),
      lat: liczba(row.lat),
      lon: liczba(row.lon),
      // pola używane tylko na karcie miejsca (nie trafiają na listy)
      telefon: (row.phone || '').trim(),
      flaga: (row.flag || '').trim(),
      opis: (row.opis || '').trim(),
      godziny: (row.godziny || '').trim(),
      cennik: (row.cennik || '').trim(),
    }));
  // Adres karty: nazwa + 4 znaki place_id; gdy dwa miejsca wyszłyby tak samo, te miejsca dostają 8 znaków.
  const ile = {};
  miejsca.forEach((p) => { p.slug = slugMiejsca(p.name, p.id); ile[p.slug] = (ile[p.slug] || 0) + 1; });
  miejsca.forEach((p) => { if (ile[p.slug] > 1) p.slug = slugMiejsca(p.name, p.id, 8); });
  return miejsca;
}

// Kolumna `kategoria` w zakładce „Wydarzenia" (opcjonalna): koncert, spektakl, warsztaty, pokaz, czytanie, wystawa, jarmark, festyn, sport, spacer, planszowki, inne.
const KATEGORIE_WYD = ['koncert', 'spektakl', 'warsztaty', 'pokaz', 'czytanie', 'wystawa', 'jarmark', 'festyn', 'sport', 'spacer', 'planszowki', 'inne'];
// puste zostaje puste, wartość spoza listy = „inne"
const kategoriaWydarzenia = (tekst) => {
  const t = String(tekst || '').trim().toLowerCase().replace(/ó/g, 'o'); // „planszówki” z arkusza = planszowki
  if (!t) return '';
  return KATEGORIE_WYD.includes(t) ? t : 'inne';
};

async function pobierzWydarzeniaZArkusza(places) {
  if (!SHEET_EVENTS_CSV_URL) return [];
  try {
    const res = await fetch(SHEET_EVENTS_CSV_URL);
    const rows = Papa.parse(await res.text(), { header: true, skipEmptyLines: true }).data;
    const poId = Object.fromEntries(places.map((p) => [p.id, p]));
    const ok = new Set(['', 'aktywne', 'zatwierdzone']);
    return rows
      .filter((r) => r.nazwa && r.data_regula && ok.has(String(r.status || '').trim().toLowerCase()))
      .map((r, i) => {
        const miejsce = poId[r.powiazane_miejsce_id];
        return {
          id: r.id || `w${i}`,
          nazwa: r.nazwa,
          data_regula: r.data_regula,
          godzina: (r.godzina || '').trim(),
          miejsce: r.miejsce || (miejsce ? miejsce.name : ''),
          wiek: r.grupa_wiekowa || '',
          cena: r.cena || '',
          link: r.link_biletow || '',
          miejsceId: miejsce ? miejsce.id : '',
          miejscePodkat: miejsce ? miejsce.podkategoria : '', // z całej bazy, nie tylko z sekcji bieżącej strony
          kino: (miejsce && miejsce.podkategoria === 'Kino') || /kino|seans|film/i.test(r.kategoria || ''),
          kategoria: kategoriaWydarzenia(r.kategoria),
          wyrozniony: /^(tak|1|x)$/i.test(String(r.wyrozniony || '').trim()),
          obrazek: r.obrazek || '',
          opis: r.opis || '',
        };
      });
  } catch (e) {
    return [];
  }
}

// Seanse dla dzieci z kin studyjnych, teatry, koncerty i wydarzenia domów kultury: plik data/repertuar.json, który co kilka dni odświeża GitHub Actions
// (scripts/repertuar). Kino w bazie dopasowujemy po nazwie, gdy skrypt nie zna place_id.
const KINA_W_BAZIE = [
  ['Kino Mikro Bronowice', /mikro.*bronowic|bronowic.*mikro/i],
  ['Kino Mikro', /\bmikro\b/i],
  ['Kino Kijów', /kij[oó]w/i],
  ['Kino Agrafka', /agrafk/i],
  ['Kino Pod Baranami', /pod baranami/i],
  ['Kino Paradox', /paradox/i],
  ['Kino Sfinks', /sfinks/i],
];
export const dzisWarszawa = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw' }).format(new Date());

function seanseZRepertuaru(places) {
  const dzis = dzisWarszawa();
  const kina = places.filter((p) => p.podkategoria === 'Kino');
  const poId = Object.fromEntries(places.map((p) => [p.id, p]));
  const miejsceKina = (nazwa) => {
    const wzor = (KINA_W_BAZIE.find(([n]) => n === nazwa) || [])[1];
    return wzor ? kina.find((p) => wzor.test(p.name) && (nazwa !== 'Kino Mikro' || !/bronowic/i.test(p.name))) : null;
  };
  return (repertuar.wydarzenia || [])
    // minione dni pomijamy (dla zakresu dat liczy się jego koniec); poranki dla szkół nie są dla rodziców
    .filter((w) => ((String(w.data_regula).match(/\d{4}-\d{2}-\d{2}/g) || ['']).pop()) >= dzis && !w.dla_grup)
    .map((w) => {
      const p = poId[w.powiazane_miejsce_id] || (w.kino ? miejsceKina(w.miejsce) : null);
      return {
        id: w.id,
        nazwa: w.nazwa,
        data_regula: w.data_regula,
        godzina: w.godzina || '',
        miejsce: w.miejsce,
        wiek: w.grupa_wiekowa || '',
        cena: w.cena || '',
        link: w.link_biletow || '',
        miejsceId: p ? p.id : '',
        kino: w.kino !== false, // seanse z `data/repertuar.json` nie mają tego pola, inne wydarzenia mają `kino: false`
        typ: w.typ || '',
        kategoria: w.kategoria || '',
        zrodlo: w.zrodlo,
        wyrozniony: false,
        obrazek: '',
        opis: '',
      };
    });
}

// Do przeglądarki nie wysyłamy pustych pól (komponenty traktują brak jak pustą wartość).
const PUSTE_POLA = ['wyrozniony', 'obrazek', 'opis', 'typ', 'zrodlo', 'miejscePodkat'];
const odchudzWydarzenie = (w) => {
  const wynik = { ...w };
  PUSTE_POLA.forEach((k) => { if (!wynik[k]) delete wynik[k]; });
  return wynik;
};

async function pobierzWydarzenia(places) {
  return [...(await pobierzWydarzeniaZArkusza(places)), ...seanseZRepertuaru(places)];
}

// Informacje do kafelka „Dziś w kinach": kiedy zaktualizowano repertuar, stan źródeł
// i stałe linki do sieciówek (Cinema City, Multikino), których nie pobieramy.
const STALE_KINA = [
  ['Cinema City', /cinema city/i, 'https://www.cinema-city.pl/'],
  ['Multikino', /multikino/i, 'https://multikino.pl/'],
];
function kinaInfo(places) {
  const stale = STALE_KINA.map(([nazwa, wzor, domyslny]) => {
    const p = places
      .filter((x) => wzor.test(x.name) && x.website)
      .sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0))[0];
    return { nazwa, url: p ? p.website : domyslny };
  });
  const zrodla = Object.entries(repertuar.zrodla || {}).map(([id, z]) => ({
    id,
    nazwa: z.nazwa || id,
    url: z.url || '',
    ok: z.ok !== false,
    pobrano: z.pobrano || '',
  }));
  return { zaktualizowano: repertuar.zaktualizowano || '', zrodla, stale };
}

// Strony filharmonii, opery i Centrum Muzyki z bazy (linki w kafelku koncertów, gdy nie ma wydarzeń).
const STRONY_MUZYKI = [/filharmoni/i, /\boper[aąy]\b/i, /centrum muzyki/i];
function stronyMuzyki(places) {
  return STRONY_MUZYKI
    .map((wzor) => places.filter((p) => p.website && wzor.test(p.name)).sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0))[0])
    .filter((p, i, w) => p && w.indexOf(p) === i)
    .map((p) => ({ id: p.id, name: p.name, website: p.website }));
}

// Wspólne dla wszystkich stron: dane odświeżają się co godzinę bez przebudowy.
// `adres` i `teksty` (tytul, opis, h1, wstep) — teksty domyślne, gdy arkusz „Strony_SEO" ich nie ma.
export async function pobierzDane({ sekcja, zWydarzeniami = false, adres, teksty }) {
  if (!SHEET_CSV_URL) {
    const seo = await seoStrony(adres, teksty, 0);
    return { props: { places: [], wydarzenia: [], missingConfig: true, seo }, revalidate: 3600 };
  }
  try {
    const wszystkie = await pobierzMiejsca();
    const wydarzenia = zWydarzeniami ? (await pobierzWydarzenia(wszystkie)).map(odchudzWydarzenie) : [];
    const places = wszystkie.filter((p) => p.sekcja === sekcja).map(doListy);
    const seo = await seoStrony(adres, teksty, places.length);
    const kina = zWydarzeniami ? kinaInfo(wszystkie) : null;
    const muzyka = zWydarzeniami ? stronyMuzyki(wszystkie) : [];
    return { props: { places, wydarzenia, kina, muzyka, missingConfig: false, seo }, revalidate: 3600 };
  } catch (e) {
    const seo = await seoStrony(adres, teksty, 0);
    return { props: { places: [], wydarzenia: [], missingConfig: false, fetchError: true, seo }, revalidate: 600 };
  }
}

// Adresy kategorii działu do zbudowania z góry (reszta powstaje przy pierwszym wejściu).
export async function sciezkiKategorii(dzial, nazwaParametru) {
  if (!SHEET_CSV_URL) return { paths: [], fallback: 'blocking' };
  try {
    const places = (await pobierzMiejsca()).filter((p) => p.sekcja === DZIALY[dzial].sekcja);
    const paths = kategorieDzialu(dzial, places).map((k) => ({ params: { [nazwaParametru]: k.slug } }));
    return { paths, fallback: 'blocking' };
  } catch (e) {
    return { paths: [], fallback: 'blocking' };
  }
}

// Dane jednej kategorii: jej miejsca + lista wszystkich kategorii działu (do kafelków).
export async function pobierzKategorie(dzial, slug) {
  if (!SHEET_CSV_URL) return { notFound: true, revalidate: 600 };
  // Błąd pobierania rzucamy dalej: Next zostawi wtedy poprzednią, dobrą wersję strony.
  const wDziale = (await pobierzMiejsca()).filter((p) => p.sekcja === DZIALY[dzial].sekcja);
  const kategorie = kategorieDzialu(dzial, wDziale);
  const kategoria = kategorie.find((k) => k.slug === slug);
  if (!kategoria) return { notFound: true, revalidate: 3600 };
  const places = wDziale.filter((p) => kategoriaRodzaju(dzial, rodzajMiejsca(dzial, p)).slug === slug).map(doListy);
  const n = places.length;
  const cel = dzial === 'atrakcje' ? 'gdzie iść z dzieckiem' : 'gdzie zapisać dziecko';
  const seo = await seoStrony(kategoria.href, {
    tytul: `${kategoria.fraza} w Krakowie | Frajdoplan`,
    opis: `${kategoria.fraza} w Krakowie i okolicy: {liczba} ${odmianaMiejsc(n)} z adresami, ocenami z Google i mapą. Sprawdź, ${cel}.`,
    h1: `${kategoria.fraza} w Krakowie`,
    wstep: `${kategoria.fraza} w Krakowie i okolicy: {liczba} ${odmianaMiejsc(n)} z adresami, ocenami z Google i mapą. Zawęź listę filtrami albo wpisz nazwę ulicy.`,
  }, n);
  return { props: { places, kategorie, kategoria, seo, missingConfig: false }, revalidate: 3600 };
}

// Strony /koncerty i /spektakle: wszystkie przyszłe wydarzenia jednej kategorii (z arkusza „Wydarzenia" i z data/repertuar.json),
// bez limitu dat, od najbliższych, pogrupowane po miesiącach; ten sam tytuł, dzień i miejsce = jeden wiersz z wieloma godzinami.
export async function pobierzListeWydarzen({ kategoria, adres, teksty }) {
  if (!SHEET_CSV_URL) {
    const seo = await seoStrony(adres, teksty, 0);
    return { props: { miesiace: [], liczba: 0, seo, missingConfig: true }, revalidate: 3600 };
  }
  try {
    const wszystkie = await pobierzMiejsca();
    const dzis = dzisWarszawa();
    const terminy = (await pobierzWydarzenia(wszystkie))
      // widowiska (trasy, pokazy w halach) trafiają na listę koncertów
      .filter((w) => !w.kino && (w.kategoria === kategoria || w.typ === kategoria || (kategoria === 'koncert' && w.typ === 'widowisko')))
      .map((w) => ({ ...w, dzien: najblizszyDzien(w.data_regula, dzis) }))
      .filter((w) => w.dzien);
    const wiersze = grupujTerminy(terminy).map((w) => ({
      id: w.id,
      dzien: w.dzien,
      nazwa: w.nazwa,
      miejsce: w.miejsce || '',
      wiek: w.wiek || '',
      cena: w.cena || '',
      link: w.link || '',
      godziny: w.godziny.map((g) => ({ godzina: g.godzina, link: g.link || '' })),
    }));
    const miesiace = [];
    wiersze.forEach((w) => {
      const m = miesiacZDaty(w.dzien);
      if (!miesiace.length || miesiace[miesiace.length - 1].klucz !== m.klucz) miesiace.push({ ...m, wiersze: [] });
      miesiace[miesiace.length - 1].wiersze.push(w);
    });
    const seo = await seoStrony(adres, teksty, wiersze.length);
    return { props: { miesiace, liczba: wiersze.length, seo, missingConfig: false }, revalidate: 3600 };
  } catch (e) {
    const seo = await seoStrony(adres, teksty, 0);
    return { props: { miesiace: [], liczba: 0, seo, missingConfig: false, fetchError: true }, revalidate: 600 };
  }
}

// ---- Karty miejsc: /miejsce/[slug] ----

// Dział (adres, nazwa) miejsca na podstawie sekcji; półkolonie nie mają podstron kategorii.
const DZIAL_SEKCJI = { 'z-marszu': 'atrakcje', treningi: 'sport', zajecia: 'zajecia' };
const kartowe = (wszystkie) => wszystkie.filter((p) => SEKCJE_Z_KARTA.has(p.sekcja));

// Adresy do mapy strony: kategorie z co najmniej 3 miejscami i karty, które mogą się indeksować.
export async function adresyDoMapy() {
  if (!SHEET_CSV_URL) return { kategorie: [], miejsca: [] };
  const wszystkie = await pobierzMiejsca();
  const kategorie = Object.keys(DZIALY).flatMap((dzial) =>
    kategorieDzialu(dzial, wszystkie.filter((p) => p.sekcja === DZIALY[dzial].sekcja)).filter((k) => k.liczba >= 3).map((k) => k.href));
  const miejsca = kartowe(wszystkie).filter(czyKartaIndeksowalna).map((p) => `/miejsce/${p.slug}`);
  return { kategorie, miejsca, zaktualizowanoWydarzenia: repertuar.zaktualizowano || '' };
}

// Z góry budujemy 100 najpopularniejszych indeksowalnych kart, resztę przy pierwszym wejściu.
export async function sciezkiMiejsc() {
  if (!SHEET_CSV_URL) return { paths: [], fallback: 'blocking' };
  try {
    const paths = kartowe(await pobierzMiejsca())
      .filter(czyKartaIndeksowalna)
      .sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0))
      .slice(0, 100)
      .map((p) => ({ params: { slug: p.slug } }));
    return { paths, fallback: 'blocking' };
  } catch (e) {
    return { paths: [], fallback: 'blocking' };
  }
}

export async function pobierzMiejsce(slug) {
  if (!SHEET_CSV_URL) return { notFound: true, revalidate: 600 };
  // Błąd pobierania rzucamy dalej: Next zostawi wtedy poprzednią, dobrą wersję strony.
  const wszystkie = kartowe(await pobierzMiejsca());
  const p = wszystkie.find((x) => x.slug === slug);
  if (!p) return { notFound: true, revalidate: 3600 };

  const dzial = DZIAL_SEKCJI[p.sekcja] || '';
  const pole = dzial ? DZIALY[dzial].pole : 'podkategoria';
  const rodzaj = p[pole] || p.podkategoria || '';
  const kategoria = dzial && rodzaj ? kategoriaRodzaju(dzial, rodzaj) : null;
  const sciezka = dzial
    ? [...(kategoria ? [{ nazwa: kategoria.nazwa, href: kategoria.href }] : [{ nazwa: DZIALY[dzial].nazwa, href: DZIALY[dzial].hub }])]
    : [{ nazwa: 'Półkolonie', href: '/polkolonie' }];

  // Podobne: ta sama kategoria (rodzaj), najpierw z tej samej gminy, potem z największą liczbą opinii.
  const podobne = wszystkie
    .filter((x) => x.id !== p.id && x.sekcja === p.sekcja && (x[pole] || x.podkategoria) === rodzaj)
    .sort((a, b) => (Number(b.gmina === p.gmina) - Number(a.gmina === p.gmina)) || ((b.reviews ?? 0) - (a.reviews ?? 0)))
    .slice(0, 6)
    .map((x) => ({ id: x.id, name: x.name, slug: x.slug, ...(x.adres ? { adres: x.adres } : {}), ...(x.rating != null ? { rating: x.rating } : {}), ...(x.reviews != null ? { reviews: x.reviews } : {}) }));

  const miasto = p.gmina || 'Kraków';
  const nazwaRodzaju = rodzaj || 'Miejsce dla dzieci';
  const ocena = p.rating != null ? ` Ocena ${String(p.rating.toFixed(1)).replace('.', ',')} (${p.reviews ?? 0} opinii w Google).` : '';
  const seo = await seoStrony(`/miejsce/${p.slug}`, {
    tytul: przytnijTytul(`${p.name} – ${nazwaRodzaju}, ${miasto}`),
    opis: przytnij(p.opis || `${p.name}: ${nazwaRodzaju.toLowerCase()} dla dzieci${p.adres ? `, ${p.adres}` : ''}, ${miasto}.${ocena} Adres, trasa i podobne miejsca na Frajdoplanie.`, 155),
    h1: p.name,
    wstep: '',
  }, 0, { noindex: !czyKartaIndeksowalna(p) });

  const miejsce = { ...p, rodzaj, wiek: wiekZOpisu(p.opis) };
  return { props: { miejsce, podobne, sciezka, seo, missingConfig: false }, revalidate: 3600 };
}
