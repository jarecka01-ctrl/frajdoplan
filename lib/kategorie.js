// Adresy kategorii (np. /atrakcje/sale-zabaw). Bez pobierania danych — działa też w przeglądarce.

export const slugZ = (tekst) =>
  String(tekst || '')
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const odmianaMiejsc = (n) => {
  if (n === 1) return 'miejsce';
  const r10 = n % 10, r100 = n % 100;
  return r10 >= 2 && r10 <= 4 && !(r100 >= 12 && r100 <= 14) ? 'miejsca' : 'miejsc';
};

// rodzaj z arkusza → [slug, nazwa (okruszki), fraza (tytuł i nagłówek)]
const ATRAKCJE = {
  'Sala zabaw': ['sale-zabaw', 'Sale zabaw', 'Sale zabaw dla dzieci'],
  'Plac zabaw': ['place-zabaw', 'Place zabaw', 'Place zabaw'],
  'Park': ['parki', 'Parki', 'Parki dla dzieci'],
  'Muzeum': ['muzea', 'Muzea', 'Muzea dla dzieci'],
  'Teatr': ['teatry', 'Teatry', 'Teatry dla dzieci'],
  'Kino': ['kina', 'Kina', 'Kina dla dzieci'],
  'Basen': ['baseny', 'Baseny', 'Baseny dla dzieci'],
  'Kawiarnie i restauracje dla rodzin': ['kawiarnie', 'Kawiarnie', 'Kawiarnie i restauracje dla rodzin'],
  'Escape room': ['escape-room', 'Escape roomy', 'Escape roomy dla dzieci'],
  'Klocki LEGO': ['klocki-lego', 'Klocki LEGO', 'Klocki LEGO dla dzieci'],
  'Biblioteka': ['biblioteki', 'Biblioteki', 'Biblioteki dla dzieci'],
  'Skatepark i street workout': ['skateparki-i-boiska', 'Skateparki i boiska', 'Skateparki i boiska'],
  'Boiska i sport na polu': ['skateparki-i-boiska', 'Skateparki i boiska', 'Skateparki i boiska'],
  'Kopalnia': ['kopalnie', 'Kopalnie', 'Kopalnie do zwiedzania z dziećmi'],
  'Salony gier i VR': ['salony-gier-i-vr', 'Salony gier i VR', 'Salony gier i VR'],
  'Laser tag': ['laser-tag', 'Laser tag', 'Laser tag dla dzieci'],
  'Gospodarstwo edukacyjne': ['zagrody', 'Zagrody', 'Zagrody edukacyjne'],
  'Zbiornik wodny': ['kapieliska', 'Kąpieliska', 'Kąpieliska'],
  'Wesołe miasteczko': ['parki-rozrywki', 'Parki rozrywki', 'Parki rozrywki'],
  'Park linowy': ['parki-linowe', 'Parki linowe', 'Parki linowe dla dzieci'],
  'Tor saneczkowy': ['tory-saneczkowe', 'Tory saneczkowe', 'Tory saneczkowe'],
  'Ścieżka edukacyjna': ['sciezki-edukacyjne', 'Ścieżki edukacyjne', 'Ścieżki edukacyjne'],
  'Zdrowie i relaks': ['groty-solne', 'Groty solne', 'Groty solne dla dzieci'],
  'Koncerty dla dzieci': ['koncerty', 'Koncerty', 'Koncerty dla dzieci'],
  'Filharmonia / koncerty': ['koncerty', 'Koncerty', 'Koncerty dla dzieci'],
};

const SPORT = {
  'Pływanie': ['plywanie', 'Pływanie', 'Nauka pływania dla dzieci'],
  'Taniec': ['taniec', 'Taniec', 'Taniec dla dzieci'],
  'Sztuki walki': ['sztuki-walki', 'Sztuki walki', 'Sztuki walki dla dzieci'],
  'Piłka nożna': ['pilka-nozna', 'Piłka nożna', 'Piłka nożna dla dzieci'],
  'Tenis i badminton': ['tenis', 'Tenis i badminton', 'Tenis i badminton dla dzieci'],
  'Gimnastyka i akrobatyka': ['gimnastyka', 'Gimnastyka', 'Gimnastyka i akrobatyka dla dzieci'],
  'Jazda konna': ['jazda-konna', 'Jazda konna', 'Jazda konna dla dzieci'],
  'Wspinaczka': ['wspinaczka', 'Wspinaczka', 'Wspinaczka dla dzieci'],
  'Łyżwy i rolki': ['lyzwy-i-rolki', 'Łyżwy i rolki', 'Łyżwy i rolki dla dzieci'],
  'Narty i snowboard': ['narty-i-snowboard', 'Narty i snowboard', 'Narty i snowboard dla dzieci'],
  'Żeglarstwo i kajaki': ['zeglarstwo-i-kajaki', 'Żeglarstwo i kajaki', 'Żeglarstwo i kajaki dla dzieci'],
  'Zajęcia ogólnorozwojowe': ['ogolnorozwojowe', 'Ogólnorozwojowe', 'Zajęcia ogólnorozwojowe dla dzieci'],
  'Kluby i inne sporty': ['inne-sporty', 'Inne sporty', 'Kluby sportowe dla dzieci'],
};

const ZAJECIA = {
  'Zajęcia mama-dziecko': ['mama-i-dziecko', 'Mama i dziecko', 'Zajęcia dla maluchów z rodzicami'],
  'Zajęcia edukacyjne i artystyczne': ['edukacyjne-i-artystyczne', 'Edukacja i sztuka', 'Zajęcia edukacyjne i artystyczne dla dzieci'],
  'Instytucja kultury': ['domy-kultury', 'Domy kultury', 'Domy kultury'],
};

// Działy z podstronami kategorii. `pole` = po czym grupujemy miejsca.
export const DZIALY = {
  atrakcje: { sekcja: 'z-marszu', pole: 'podkategoria', hub: '/atrakcje', nazwa: 'Atrakcje', mapa: ATRAKCJE },
  sport: { sekcja: 'treningi', pole: 'dyscyplina', hub: '/sport', nazwa: 'Sport', mapa: SPORT },
  zajecia: { sekcja: 'zajecia', pole: 'podkategoria', hub: '/zajecia', nazwa: 'Zajęcia', mapa: ZAJECIA },
};

// Opis kategorii dla rodzaju z arkusza (nieznane rodzaje dostają slug z nazwy).
export function kategoriaRodzaju(dzial, rodzaj) {
  const d = DZIALY[dzial];
  const [slug, nazwa, fraza] = d.mapa[rodzaj] || [slugZ(rodzaj), rodzaj, rodzaj];
  return { slug, nazwa, fraza, href: `${d.hub}/${slug}` };
}

export const rodzajMiejsca = (dzial, p) => p[DZIALY[dzial].pole] || p.podkategoria;

// Wszystkie kategorie działu, które mają miejsca, od najliczniejszej.
export function kategorieDzialu(dzial, places) {
  const po = {};
  places.forEach((p) => {
    const r = rodzajMiejsca(dzial, p);
    if (!r) return;
    const k = kategoriaRodzaju(dzial, r);
    if (!k.slug) return;
    po[k.slug] = po[k.slug] || { ...k, rodzaj: r, liczba: 0 };
    po[k.slug].liczba += 1;
  });
  return Object.values(po).sort((a, b) => b.liczba - a.liczba);
}
