import Papa from 'papaparse';
import { DZIALY, kategorieDzialu, kategoriaRodzaju, rodzajMiejsca, odmianaMiejsc, TEKSTY_KATEGORII, slugZ } from './kategorie';
import { przytnij, przytnijTytul } from './tekst';
import { grupujTerminy, scalMiejsca, miesiacZDaty, najblizszyDzien, dzienTygodniaISO, plusDniISO } from './grupowanie';
import { scalZArkuszem } from './scalanie';
import { seoStrony } from './seo';
import { czyMiejsceWidoczne, przypiszSlugi, SEKCJE_Z_KARTA, czyKartaIndeksowalna, wiekZOpisu, doListy, adresKarty } from './miejsca';
import repertuar from '../data/repertuar.json';

const SHEET_CSV_URL = process.env.SHEET_CSV_URL;
const SHEET_EVENTS_CSV_URL = process.env.SHEET_EVENTS_CSV_URL;

// Podkategorie z sekcji „Zajęcia". Reszta to miejsca „z marszu", Półkolonie mają osobną stronę.
export const PODKAT_ZAJECIA = new Set(['Zajęcia mama-dziecko', 'Zajęcia edukacyjne i artystyczne', 'Instytucja kultury']);
export const PODKAT_TRENINGI = new Set(['Szkoły pływania', 'Zajęcia sportowe', 'Sport / zajęcia ruchowe']);

const sekcjaZ = (row) => {
  if (row.sekcja === 'archiwum') return 'archiwum'; // ukryte w katalogu: ważniejsze niż podkategoria (inaczej szkoły sportowe wracały do treningów)
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
  // Jedyne miejsce, które decyduje, co jest widoczne: listy, strona główna, karty, sitemapa i podobne miejsca widzą tylko te miejsca.
  const widoczne = miejsca.filter(czyMiejsceWidoczne);
  przypiszSlugi(widoczne); // unikalny adres karty każdego widocznego miejsca (lib/miejsca.js)
  return widoczne;
}

// Kolumna `kategoria` w zakładce „Wydarzenia" (opcjonalna): koncert, spektakl, warsztaty, pokaz, czytanie, wystawa, jarmark, festyn, sport, spacer, planszowki, inne.
const KATEGORIE_WYD = ['koncert', 'spektakl', 'warsztaty', 'pokaz', 'czytanie', 'wystawa', 'jarmark', 'festyn', 'sport', 'spacer', 'planszowki', 'inne'];
// puste zostaje puste, wartość spoza listy = „inne"
const kategoriaWydarzenia = (tekst) => {
  const t = String(tekst || '').trim().toLowerCase().replace(/ó/g, 'o'); // „planszówki” z arkusza = planszowki
  if (!t) return '';
  return KATEGORIE_WYD.includes(t) ? t : 'inne';
};

// Deterministyczne ID wydarzenia z arkusza, które nie ma własnego: z daty/reguły, godziny i tytułu (ten sam wiersz = to samo ID).
// Zmiana tych trzech pól to dla planu użytkownika inne wydarzenie, a stare wpisy w planach oznaczają się wtedy jako niedostępne.
function stabilneIdWydarzenia(r) {
  const tekst = [r.data_regula, r.godzina, r.nazwa].map((x) => String(x || '').trim().toLowerCase()).join('|');
  let h = 5381;
  for (let i = 0; i < tekst.length; i += 1) h = ((h * 33) ^ tekst.charCodeAt(i)) >>> 0;
  return `e-${h.toString(36)}`;
}

async function pobierzWydarzeniaZArkusza(places) {
  if (!SHEET_EVENTS_CSV_URL) return [];
  try {
    const res = await fetch(SHEET_EVENTS_CSV_URL);
    const rows = Papa.parse(await res.text(), { header: true, skipEmptyLines: true }).data;
    const poId = Object.fromEntries(places.map((p) => [p.id, p]));
    const ok = new Set(['', 'aktywne', 'zatwierdzone']);
    return rows
      .filter((r) => r.nazwa && r.data_regula && ok.has(String(r.status || '').trim().toLowerCase()))
      .map((r) => {
        const miejsce = poId[r.powiazane_miejsce_id];
        return {
          id: (r.id || '').trim() || stabilneIdWydarzenia(r), // numer wiersza zmieniałby się przy każdej edycji arkusza, a plan użytkownika trzyma ID
          nazwa: r.nazwa,
          data_regula: r.data_regula,
          godzina: (r.godzina || '').trim(),
          miejsce: r.miejsce || (miejsce ? miejsce.name : ''),
          adres: (r.adres || '').trim(), // opcjonalna kolumna `adres`; gdy pusta, strona /weekend bierze ulicę z karty miejsca
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
        // wydarzenia Biblioteki Kraków są z zasady bezpłatne (decyzja właścicielki, 12.10.2026); cena podana przez źródło ma pierwszeństwo
        cena: w.cena || (w.zrodlo === 'biblioteka' ? 'bezpłatne' : ''),
        link: w.link_biletow || '',
        linkStrony: w.link_strony || '', // strona wydarzenia u organizatora (opis), gdy link biletów prowadzi tylko do zakupu
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
const PUSTE_POLA = ['linkStrony', 'adres', 'wyrozniony', 'obrazek', 'opis', 'typ', 'zrodlo', 'miejscePodkat'];
const odchudzWydarzenie = (w) => {
  const wynik = { ...w };
  PUSTE_POLA.forEach((k) => { if (!wynik[k]) delete wynik[k]; });
  return wynik;
};

// Wiersze z arkusza (ręczne) i ze skryptu; to samo wydarzenie w obu miejscach zostaje jednym wierszem z arkusza (lib/scalanie.js).
async function pobierzWydarzenia(places) {
  return scalZArkuszem(await pobierzWydarzeniaZArkusza(places), seanseZRepertuaru(places));
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
// `adres` i `teksty` (tytul, opis, h1, wstep) — teksty domyślne, gdy arkusz „Strony_SEO" ich nie ma. `noindex: true` = strona robocza poza wyszukiwarką.
export async function pobierzDane({ sekcja, zWydarzeniami = false, zAdresami = false, adres, teksty, noindex = false }) {
  if (!SHEET_CSV_URL) {
    const seo = await seoStrony(adres, teksty, 0, { noindex });
    return { props: { places: [], wydarzenia: [], missingConfig: true, seo }, revalidate: 3600 };
  }
  try {
    const wszystkie = await pobierzMiejsca();
    const wydarzenia = zWydarzeniami ? (await pobierzWydarzenia(wszystkie)).map(odchudzWydarzenie) : [];
    const places = wszystkie.filter((p) => p.sekcja === sekcja).map(doListy);
    const seo = await seoStrony(adres, teksty, places.length, { noindex });
    const kina = zWydarzeniami ? kinaInfo(wszystkie) : null;
    const muzyka = zWydarzeniami ? stronyMuzyki(wszystkie) : [];
    // ulice miejsc, do których odsyłają wydarzenia (strona /weekend pokazuje adres pod nazwą miejsca)
    const adresy = {};
    if (zAdresami) {
      const poId = Object.fromEntries(wszystkie.map((p) => [p.id, p]));
      wydarzenia.forEach((w) => { const p = poId[w.miejsceId]; if (p && p.adres) adresy[p.id] = p.adres; });
    }
    return { props: { places, wydarzenia, kina, muzyka, ...(zAdresami ? { adresy } : {}), missingConfig: false, seo }, revalidate: 3600 };
  } catch (e) {
    const seo = await seoStrony(adres, teksty, 0, { noindex });
    return { props: { places: [], wydarzenia: [], missingConfig: false, fetchError: true, seo }, revalidate: 600 };
  }
}

// Kategoria z mniejszą liczbą miejsc jest za uboga dla Google: noindex i brak w mapie strony.
const MIN_MIEJSC_KATEGORII = 3;

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
// Ranking z ocen w Google: miejsca w Krakowie z co najmniej 50 opinii (gdy takich za mało, z 20), od najwyższej oceny; remis rozstrzyga liczba opinii.
// Mniej niż 5 miejsc = bez rankingu (lepiej nic niż przypadkowa lista).
export function rankingMiejsc(places, tytul, limit = 10) {
  // tylko miejsca w samym Krakowie (okoliczne gminy mają `gmina`, strefa „Pod Krakowem” ma `strefa`), bo strona i tytuł mówią „w Krakowie”
  const wKrakowie = places.filter((p) => !p.gmina && !p.strefa);
  const wybierz = (min) => wKrakowie.filter((p) => p.rating != null && (p.reviews ?? 0) >= min);
  let lista = wybierz(50);
  if (lista.length < 5) lista = wybierz(20);
  if (lista.length < 5) return null;
  const pozycje = lista
    .sort((a, b) => b.rating - a.rating || (b.reviews ?? 0) - (a.reviews ?? 0))
    .slice(0, limit)
    .map((p) => ({ id: p.id, name: p.name, rating: p.rating, reviews: p.reviews ?? 0, adres: p.adres || '', gmina: p.gmina || '', urodziny: Boolean(p.urodziny), ...(p.slug ? { slug: p.slug } : {}) }));
  return { tytul, pozycje, min: lista.length >= 5 && pozycje.every((x) => x.reviews >= 50) ? 50 : 20 };
}

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
  const wlasne = TEKSTY_KATEGORII[`${dzial}/${slug}`];
  const seo = await seoStrony(kategoria.href, {
    tytul: wlasne ? przytnijTytul(wlasne.tytul) : przytnijTytul(`${kategoria.fraza} w Krakowie`),
    opis: wlasne ? przytnij(wlasne.opis, 155) : przytnij(`${kategoria.fraza} w Krakowie i okolicy: {liczba} ${odmianaMiejsc(n)} z adresami, ocenami z Google i mapą. Sprawdź, ${cel}.`, 155),
    h1: wlasne ? wlasne.h1 : `${kategoria.fraza} w Krakowie`,
    wstep: wlasne ? wlasne.wstep : `${kategoria.fraza} w Krakowie i okolicy: {liczba} ${odmianaMiejsc(n)} z adresami, ocenami z Google i mapą. Zawęź listę filtrami albo wpisz nazwę ulicy.`,
  }, n, { noindex: n < MIN_MIEJSC_KATEGORII });
  // ranking i poradnik tylko dla kategorii z własnymi tekstami; ranking liczymy tu, żeby do przeglądarki nie szły dodatkowe dane
  const dodatki = wlasne ? { ranking: rankingMiejsc(places, wlasne.ranking), poradnik: wlasne.poradnik } : {};
  return { props: { places, kategorie, kategoria, seo, missingConfig: false, ...dodatki }, revalidate: 3600 };
}

// Strony /koncerty i /spektakle: wszystkie przyszłe wydarzenia jednej kategorii (z arkusza „Wydarzenia" i z data/repertuar.json),
// bez limitu dat, od najbliższych, pogrupowane po miesiącach; ten sam tytuł, dzień i miejsce = jeden wiersz z wieloma godzinami.
// Teksty strony listy: przy braku wydarzeń tytuł i opis bez liczby (`tytulPusty`, `opisPusty`), żeby w Google nie było „0 terminów".
const tekstyDlaLiczby = (teksty, n) => (n === 0 && teksty.tytulPusty
  ? { ...teksty, tytul: teksty.tytulPusty, opis: teksty.opisPusty || teksty.opis }
  : teksty);

// Przyszłe terminy jednej kategorii jako wiersze (ten sam tytuł, dzień i miejsce = jeden wiersz z wieloma godzinami; to samo wydarzenie
// w kilku miejscach tego samego dnia = jeden wiersz z listą lokalizacji). Wspólne dla list, stron teatrów i strony „w weekend".
async function surowaListaKategorii(kategoria) {
  const wszystkie = await pobierzMiejsca();
  const dzis = dzisWarszawa();
  const terminy = (await pobierzWydarzenia(wszystkie))
    // widowiska (trasy, pokazy w halach) trafiają na listę koncertów
    .filter((w) => !w.kino && (w.kategoria === kategoria || w.typ === kategoria || (kategoria === 'koncert' && w.typ === 'widowisko')))
    .map((w) => ({ ...w, dzien: najblizszyDzien(w.data_regula, dzis) }))
    .filter((w) => w.dzien);
  return { wszystkie, dzis, surowe: scalMiejsca(grupujTerminy(terminy)) };
}

const zgodzinami = (godziny) => godziny.map((g) => ({ godzina: g.godzina, link: g.link || '', id: g.id })); // id potrzebne przyciskowi plusa (Mój plan)
const doWiersza = (w) => ({
  id: w.id,
  dzien: w.dzien,
  nazwa: w.nazwa,
  miejsce: w.miejsce || '',
  wiek: w.wiek || '',
  cena: w.cena || '',
  link: w.link || '',
  ...(w.linkStrony ? { strona: w.linkStrony } : {}),
  godziny: zgodzinami(w.godziny),
  ...(w.lokalizacje ? {
    wspolneMiejsce: w.wspolneMiejsce || '',
    lokalizacje: w.lokalizacje.map((l) => ({ miejsce: l.miejsce, nazwaMiejsca: l.nazwaMiejsca, link: l.link || '', id: l.id, godziny: zgodzinami(l.godziny) })),
  } : {}),
});
const naMiesiace = (wiersze) => {
  const miesiace = [];
  wiersze.forEach((w) => {
    const m = miesiacZDaty(w.dzien);
    if (!miesiace.length || miesiace[miesiace.length - 1].klucz !== m.klucz) miesiace.push({ ...m, wiersze: [] });
    miesiace[miesiace.length - 1].wiersze.push(w);
  });
  return miesiace;
};

export async function pobierzListeWydarzen({ kategoria, adres, teksty, zTeatrami = false }) {
  if (!SHEET_CSV_URL) {
    const seo = await seoStrony(adres, tekstyDlaLiczby(teksty, 0), 0);
    return { props: { miesiace: [], liczba: 0, seo, missingConfig: true }, revalidate: 3600 };
  }
  try {
    const { surowe } = await surowaListaKategorii(kategoria);
    const wiersze = surowe.map(doWiersza);
    const seo = await seoStrony(adres, tekstyDlaLiczby(teksty, wiersze.length), wiersze.length);
    const teatry = zTeatrami ? teatryZ(surowe).map((t) => ({ slug: t.slug, nazwa: t.nazwa, n: t.wiersze.length })) : null;
    return { props: { miesiace: naMiesiace(wiersze), liczba: wiersze.length, seo, missingConfig: false, ...(teatry ? { teatry } : {}) }, revalidate: 3600 };
  } catch (e) {
    const seo = await seoStrony(adres, tekstyDlaLiczby(teksty, 0), 0);
    return { props: { miesiace: [], liczba: 0, seo, missingConfig: false, fetchError: true }, revalidate: 600 };
  }
}

// ---- Strony teatrów /spektakle/[teatr] i /spektakle/weekend ----
// Strona teatru powstaje (i trafia do mapy strony) tylko wtedy, gdy ma co najmniej 3 przyszłe terminy spektakli: mniej to „cienka" strona.
// Tekst wstępu składamy z danych (liczba terminów, daty, tytuły, adres z karty miejsca), niczego nie wymyślamy.
export const MIN_TERMINOW_TEATRU = 3;
const MIESIACE_DOPELNIACZ = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
const dataSlownie = (iso) => { const [, m, d] = iso.split('-').map(Number); return `${d} ${MIESIACE_DOPELNIACZ[m - 1]}`; };
const odmianaTerminow = (n) => {
  const r10 = n % 10, r100 = n % 100;
  return n === 1 ? 'termin' : (r10 >= 2 && r10 <= 4 && !(r100 >= 12 && r100 <= 14) ? 'terminy' : 'terminów');
};

// Miejsca (nazwa z wydarzenia → slug) z co najmniej 3 przyszłymi terminami spektakli, od największej liczby terminów.
function teatryZ(surowe) {
  const mapa = new Map();
  surowe.forEach((w) => {
    if (w.lokalizacje || !w.miejsce) return;
    const slug = slugZ(w.miejsce);
    if (!slug || slug === 'weekend') return;
    const t = mapa.get(slug) || { slug, nazwa: w.miejsce, wiersze: [] };
    t.wiersze.push(w);
    mapa.set(slug, t);
  });
  return [...mapa.values()].filter((t) => t.wiersze.length >= MIN_TERMINOW_TEATRU).sort((a, b) => b.wiersze.length - a.wiersze.length);
}

export async function sciezkiTeatrow() {
  if (!SHEET_CSV_URL) return { paths: [], fallback: 'blocking' };
  try {
    const { surowe } = await surowaListaKategorii('spektakl');
    return { paths: teatryZ(surowe).map((t) => ({ params: { teatr: t.slug } })), fallback: 'blocking' };
  } catch (e) {
    return { paths: [], fallback: 'blocking' };
  }
}

export async function pobierzTeatr(slug) {
  if (!SHEET_CSV_URL) return { notFound: true, revalidate: 600 };
  // Błąd pobierania rzucamy dalej: Next zostawi poprzednią, dobrą wersję strony.
  const { wszystkie, surowe } = await surowaListaKategorii('spektakl');
  const teatry = teatryZ(surowe);
  const t = teatry.find((x) => x.slug === slug);
  if (!t) return { notFound: true, revalidate: 3600 };
  const n = t.wiersze.length;
  const od = t.wiersze[0].dzien;
  const doDnia = t.wiersze[n - 1].dzien;
  const tytuly = [...new Set(t.wiersze.map((w) => w.nazwa))];
  const przyklady = tytuly.slice(0, 4).map((x) => `„${x}”`).join(', ');
  // karta miejsca: najczęstsze powiazane_miejsce_id terminów tego teatru
  const licz = {};
  t.wiersze.forEach((w) => { if (w.miejsceId) licz[w.miejsceId] = (licz[w.miejsceId] || 0) + 1; });
  const idMiejsca = Object.keys(licz).sort((a, b) => licz[b] - licz[a])[0];
  const miejsce = idMiejsca ? wszystkie.find((p) => p.id === idMiejsca) : null;
  const maKarte = Boolean(miejsce) && kartowe(wszystkie).some((p) => p.id === miejsce.id);
  const adresTekst = miejsce && miejsce.adres ? `${miejsce.adres}, ${miejsce.gmina && miejsce.gmina !== 'Kraków' ? miejsce.gmina : 'Kraków'}` : '';
  const seo = await seoStrony(`/spektakle/${slug}`, {
    tytul: przytnijTytul(`${t.nazwa}: repertuar dla dzieci`),
    opis: przytnij(`Repertuar dla dzieci: ${t.nazwa}. ${n} ${odmianaTerminow(n)} od ${dataSlownie(od)} do ${dataSlownie(doDnia)}, z godzinami i linkami do biletów. W repertuarze m.in. ${przyklady}.`, 155),
    h1: `${t.nazwa}: repertuar dla dzieci`,
    wstep: `${t.nazwa}: ${n} ${odmianaTerminow(n)} spektakli dla dzieci od ${dataSlownie(od)} do ${dataSlownie(doDnia)}. W repertuarze m.in. ${przyklady}. Przy każdym terminie są godziny, wiek, cena i link do biletów.${adresTekst ? ` Adres: ${adresTekst}.` : ''}`,
  }, n);
  return {
    props: {
      miesiace: naMiesiace(t.wiersze.map(doWiersza)),
      liczba: n,
      seo,
      teatr: { nazwa: t.nazwa, adres: adresTekst, karta: maKarte ? adresKarty(miejsce) : '' },
      inne: teatry.filter((x) => x.slug !== slug).map((x) => ({ slug: x.slug, nazwa: x.nazwa, n: x.wiersze.length })),
      missingConfig: false,
    },
    revalidate: 3600,
  };
}

// Najbliższy weekend: od dziś (gdy dziś jest sobota albo niedziela) do niedzieli; w tygodniu: najbliższa sobota i niedziela.
export function dniWeekendu(dzis) {
  const dz = dzienTygodniaISO(dzis);
  let sob = dzis;
  if (dz !== 6 && dz !== 0) while (dzienTygodniaISO(sob) !== 6) sob = plusDniISO(sob, 1);
  const nd = dz === 0 ? dzis : plusDniISO(sob, 1);
  return { od: dz === 0 ? dzis : sob, nd };
}
const jakDzien = (iso) => `${dzienTygodniaISO(iso) === 6 ? 'sobotę' : 'niedzielę'} ${dataSlownie(iso)}`;

export async function pobierzSpektakleWeekend() {
  const adres = '/spektakle/weekend';
  const domyslne = {
    tytul: przytnijTytul('Spektakle dla dzieci w weekend w Krakowie'),
    opis: 'Spektakle dla dzieci w Krakowie w najbliższy weekend: godziny, miejsca, wiek i linki do biletów w jednym miejscu.',
    h1: 'Spektakle dla dzieci w weekend w Krakowie',
    wstep: 'Spektakle dla dzieci w Krakowie w najbliższy weekend, z godzinami, miejscami i linkami do biletów.',
  };
  if (!SHEET_CSV_URL) return { props: { miesiace: [], liczba: 0, seo: await seoStrony(adres, domyslne, 0), missingConfig: true }, revalidate: 3600 };
  try {
    const { surowe, dzis } = await surowaListaKategorii('spektakl');
    const { od, nd } = dniWeekendu(dzis);
    const wiersze = surowe.filter((w) => w.dzien >= od && w.dzien <= nd).map(doWiersza);
    const n = wiersze.length;
    const kiedy = od === nd ? `w ${jakDzien(od).replace('niedzielę', 'niedzielę')}` : `w ${jakDzien(od)} i ${jakDzien(nd)}`;
    const teksty = n ? {
      ...domyslne,
      opis: przytnij(`Spektakle dla dzieci w Krakowie ${kiedy}: ${n} ${odmianaTerminow(n)} z godzinami, miejscami i linkami do biletów.`, 155),
      wstep: `Co zobaczyć w teatrze z dzieckiem ${kiedy}? Mamy ${n} ${odmianaTerminow(n)} spektakli, z godzinami, wiekiem, ceną i linkami do biletów. Lista odświeża się kilka razy w tygodniu.`,
    } : domyslne;
    // pusta strona nie trafia do Google (noindex) i wraca, gdy pojawią się terminy
    const seo = await seoStrony(adres, teksty, n, { noindex: n === 0 });
    return { props: { miesiace: naMiesiace(wiersze), liczba: n, seo, missingConfig: false }, revalidate: 3600 };
  } catch (e) {
    return { props: { miesiace: [], liczba: 0, seo: await seoStrony(adres, domyslne, 0, { noindex: true }), missingConfig: false, fetchError: true }, revalidate: 600 };
  }
}

// ---- Karty miejsc: /miejsce/[slug] ----

// Dział (adres, nazwa) miejsca na podstawie sekcji; półkolonie nie mają podstron kategorii.
const DZIAL_SEKCJI = { 'z-marszu': 'atrakcje', treningi: 'sport', zajecia: 'zajecia' };
const kartowe = (wszystkie) => wszystkie.filter((p) => SEKCJE_Z_KARTA.has(p.sekcja));

// Adresy do mapy strony: kategorie z co najmniej 3 miejscami i karty, które mogą się indeksować.
// Dane do funkcji Mój plan: wszystkie widoczne miejsca i wydarzenia w zwartej postaci (jedna odpowiedź dla wszystkich, nie zależy od niczyjego planu).
// Panel planu pobiera ją i po ID odnajduje aktualną treść pozycji; w przeglądarce użytkownika zostają tylko ID.
export async function daneDoPlanu() {
  if (!SHEET_CSV_URL) return { miejsca: [], wydarzenia: [] };
  const wszystkie = await pobierzMiejsca();
  const maKarte = new Set(kartowe(wszystkie).map((p) => p.id));
  const wydarzenia = await pobierzWydarzenia(wszystkie);
  return {
    miejsca: wszystkie.map((p) => ({ id: p.id, nazwa: p.name, adres: p.adres || undefined, rodzaj: p.podkategoria || undefined, href: maKarte.has(p.id) ? adresKarty(p) : undefined })),
    wydarzenia: wydarzenia.map((w) => ({
      id: w.id, nazwa: w.nazwa, data_regula: w.data_regula, godzina: w.godzina || undefined, miejsce: w.miejsce || undefined, miejsceId: w.miejsceId || undefined,
      wiek: w.wiek || undefined, cena: w.cena || undefined, link: w.link || undefined,
    })),
  };
}

export async function adresyDoMapy() {
  if (!SHEET_CSV_URL) return { kategorie: [], miejsca: [] };
  const wszystkie = await pobierzMiejsca();
  const kategorie = Object.keys(DZIALY).flatMap((dzial) =>
    kategorieDzialu(dzial, wszystkie.filter((p) => p.sekcja === DZIALY[dzial].sekcja)).filter((k) => k.liczba >= MIN_MIEJSC_KATEGORII).map((k) => k.href));
  const miejsca = kartowe(wszystkie).filter(czyKartaIndeksowalna).map((p) => `/miejsce/${p.slug}`);
  // strony teatrów (min. 3 terminy) i „w weekend" (tylko gdy są terminy); błąd tego fragmentu nie psuje całej mapy
  let spektakle = [];
  try {
    const { surowe, dzis } = await surowaListaKategorii('spektakl');
    const { od, nd } = dniWeekendu(dzis);
    spektakle = teatryZ(surowe).map((t) => `/spektakle/${t.slug}`);
    if (surowe.some((w) => w.dzien >= od && w.dzien <= nd)) spektakle.push('/spektakle/weekend');
  } catch (e) { /* zostaje pusta lista */ }
  return { kategorie, miejsca, spektakle, zaktualizowanoWydarzenia: repertuar.zaktualizowano || '' };
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
    tytul: [`${p.name} – ${nazwaRodzaju}, ${p.adres || miasto}`, `${p.name}, ${p.adres || miasto}`]
      .map((t) => `${t} | Frajdoplan`).concat([`${p.name}, ${p.adres || miasto}`]).find((t) => t.length <= 60) || przytnijTytul(`${p.name}, ${p.adres || miasto}`),
    opis: przytnij(p.opis || `${p.name}: ${nazwaRodzaju.toLowerCase()} dla dzieci${p.adres ? `, ${p.adres}` : ''}, ${miasto}.${ocena} Adres, trasa i podobne miejsca na Frajdoplanie.`, 155),
    h1: p.name,
    wstep: '',
  }, 0, { noindex: !czyKartaIndeksowalna(p) });

  const miejsce = { ...p, rodzaj, wiek: wiekZOpisu(p.opis) };
  return { props: { miejsce, podobne, sciezka, seo, missingConfig: false }, revalidate: 3600 };
}
