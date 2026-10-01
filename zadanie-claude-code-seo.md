# Zadanie dla Claude Code: przebudowa Frajdoplanu pod SEO

Przeczytaj najpierw `CLAUDE.md`. Pracuj na osobnej gałęzi `seo`, małe commity po polsku, po każdym etapie uruchom `npm run build` i napraw błędy. Na końcu otwórz pull request z krótkim opisem po polsku.

## Cel
Dziś Google widzi cztery strony, bo kategorie filtrują się w przeglądarce. Każda kategoria ma mieć własny adres, tytuł, nagłówek i treść widoczną w HTML bez JavaScriptu.

## Etap 1: adresy kategorii (SSG + ISR)
- `pages/atrakcje/[kategoria].js`: podkategorie z sekcji `z-marszu` (sale-zabaw, place-zabaw, parki, muzea, teatry, kina, baseny, kawiarnie, escape-room, klocki-lego, biblioteki, skateparki-i-boiska, kopalnie…), slug z nazwy podkategorii bez polskich znaków.
- `pages/sport/[dyscyplina].js` (sztuki-walki, taniec, plywanie, pilka-nozna, tenis, gimnastyka, jazda-konna…), `pages/zajecia/[kategoria].js`.
- `getStaticPaths` z `fallback: 'blocking'`, `getStaticProps` z `revalidate: 3600`, dane z `lib/dane.js`.
- Strony `/atrakcje`, `/sport`, `/zajecia`, `/polkolonie` zostają hubami. Strona główna `/` zostaje (tytuł z frazą „Atrakcje dla dzieci w Krakowie").
- Lista miejsc ma być w HTML od serwera (cała lista kategorii, nie tylko po kliknięciu), filtry działają dalej po stronie przeglądarki. Link „Pokaż kolejne" zastąp paginacją z linkami `?strona=2` albo wyrenderuj do 100 miejsc.
- Kafelki rodzajów w `Katalog` mają prowadzić na adres kategorii (to zwykłe `<a href>`), z zachowaniem wielokrotnego wyboru tylko na hubie.
- Przekierowania 301 w `next.config.js`: `/treningi` → `/sport`.

## Etap 2: treść i metadane
- Teksty (tytuł, opis, H1, wstęp) czytaj z nowej zakładki arkusza „Strony_SEO" (plik `Strony_SEO.csv`, kolumny: adres, tytul_seo, opis_meta, h1, wstep). Link CSV w zmiennej `SHEET_SEO_CSV_URL`. W `wstep` zastąp `{liczba}` liczbą miejsc. Jeśli zmiennej brak lub adresu nie ma w tabeli, użyj szablonu: tytuł „[Kategoria] w Krakowie | Frajdoplan".
- Na każdej stronie: `<title>`, `meta description`, `canonical`, Open Graph (tytuł, opis, obrazek domyślny).
- Okruszki nawigacji (komponent) + dane strukturalne `BreadcrumbList` i `ItemList` (pierwsze 20 miejsc).

## Etap 3: karta miejsca
- `pages/miejsce/[slug].js`, slug `nazwa-miejsca-<4 znaki place_id>`.
- Treść: nazwa, rodzaj, adres, link „Trasa" (Google Maps), ocena, strona www, mapa (statyczny link), „Podobne miejsca" (ta sama podkategoria, 6 sztuk, linki), okruszki.
- Dane strukturalne: `LocalBusiness`/`Place`. `<meta robots noindex>` dla kart bez adresu LUB bez strony www LUB z mniej niż 20 opiniami; resztę indeksujemy.

## Etap 4: indeksowanie
- `pages/sitemap.xml.js` (podział na kategorie i miejsca, `lastmod`), `public/robots.txt` ze wskazaniem sitemapy.
- Zmienna `SITE_URL`. Jeśli `SITE_URL` nie jest `https://frajdoplan.pl`, na każdej stronie `noindex, nofollow` (obecnie noindex jest na stałe w `components/Uklad.js`, zamień na tę logikę).
- Wydarzenia: dane strukturalne `Event` na sekcji „Dziś" (nazwa, data, miejsce, cena, link).

## Etap 5: wydajność
- Strona główna ładuje dane wszystkich miejsc. Przekazuj do przeglądarki tylko potrzebne pola, a mapę i „Blisko ciebie" ładuj leniwie (`dynamic`, `ssr:false` już jest dla mapy).
- Zdjęcia `loading="lazy"`, jawne wymiary.

## Czego NIE robić
Nie zmieniaj wyglądu, kolorów ani logiki dat wydarzeń. Nie cofaj produkcji do starszego wdrożenia. Nie usuwaj `noindex`, dopóki domena `frajdoplan.pl` nie wskazuje na stronę.

## Po stronie właścicielki (nie rób tego za nią)
Import „Strony_SEO" do arkusza i publikacja CSV, zmienne `SHEET_SEO_CSV_URL` i `SITE_URL` w Vercelu, rekordy DNS.
