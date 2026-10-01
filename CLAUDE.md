# Frajdoplan — instrukcja dla Claude Code

Serwis dla rodziców: co robić z dzieckiem w Krakowie (dziś, w weekend, stałe miejsca, treningi, zajęcia, półkolonie).
Właścicielka nie jest programistką. Odpowiadaj po polsku, prosto, bez żargonu. Przed większą zmianą krótko powiedz, co zrobisz.

## Stack
- Next.js 14 (pages router), React 18, Papa Parse, Leaflet 1.9.4 (mapa, kafelki OpenStreetMap, nakładka CyclOSM na drogi rowerowe).
- Hosting: Vercel, projekt `frajdoplan` (zespół `meand-c`). Każdy commit na `main` = nowe wdrożenie produkcyjne.
- Brak bazy danych: dane czytane z Arkusza Google opublikowanego jako CSV, odświeżanie co godzinę (ISR, `revalidate: 3600`).

## Zmienne środowiskowe (Vercel)
- `SHEET_CSV_URL` — zakładka „Miejsca" (CSV).
- `SHEET_EVENTS_CSV_URL` — zakładka „Wydarzenia" (CSV).
- `SHEET_SEO_CSV_URL` — zakładka „Strony_SEO" (CSV, kolumny: adres, tytul_seo, opis_meta, h1, wstep; `{liczba}` = liczba miejsc). Bez niej działają teksty domyślne.
- `SITE_URL` — adres serwisu do canonical i Open Graph (domyślnie https://frajdoplan.pl).

## Struktura
- `lib/dane.js` — pobieranie miejsc i wydarzeń, przypisanie sekcji (`z-marszu`, `treningi`, `zajecia`, `polkolonie`) i dyscyplin.
- `lib/ikony.js` — ikony podkategorii/dyscyplin i skróty nazw na kafelkach.
- `lib/kategorie.js` — adresy kategorii (slugi, nazwy do tytułów) dla działów atrakcje / sport / zajecia.
- `lib/seo.js` — teksty stron z „Strony_SEO" + canonical; `lib/jsonld.js` — dane strukturalne (BreadcrumbList, ItemList).
- `components/` — `Uklad` (menu, stopka, meta i Open Graph), `Okruszki`, `StronaKategorii`, `Katalog` (filtry, kafelki rodzajów z wielokrotnym wyborem, lista, mapa), `Mapa`, `Wydarzenia` (Dziś / Jutro / Weekend + pomocnicze funkcje dat), `BliskoIKina`, `Baner`, `Kalendarz`.
- `pages/` — `index` (Gdzie iść), huby `atrakcje`, `sport` (dawne `/treningi`, przekierowanie 301), `zajecia`, `polkolonie` oraz podstrony kategorii `atrakcje/[kategoria]`, `sport/[dyscyplina]`, `zajecia/[kategoria]`.
- `styles/globals.css` — cały wygląd.

## Dane
Kolumny „Miejsca": place_id, name, type, street, city, gmina_aglomeracja, rating, reviews, phone, website, photo, lat, lon, flag, queries, kategoria_glowna (Pod dachem / Plener), podkategoria, pogoda, strefa (Kraków i okolice / Pod Krakowem), odleglosc_km, sekcja, dyscyplina, zrodlo_wydarzen, organizuje_urodziny.
Kolumny „Wydarzenia": id, nazwa, typ, data_regula (`2026-10-03` / `2026-10-01 do 2026-10-05` / `co sobotę` / `codziennie`), godzina, powiazane_miejsce_id, grupa_wiekowa, cena, link_biletow, zrodlo, status (puste / aktywne / zatwierdzone = widoczne), poziom_pewnosci, miejsce, wyrozniony (tak = baner), obrazek, opis.
Daty liczymy w strefie Europe/Warsaw, w przeglądarce.

## Wygląd („Plac Zabaw")
Kolory: papier #FFFDF7, tusz #20242B, słońce #F7B32B (pod dachem), mak #E4483A (na polu), kreda #EFE7D6.
Czcionki: Baloo 2 (nagłówki), Inter (tekst). Karty jak naklejki: kontur 2px + twardy kolorowy cień, jeden ścięty róg.
Teksty po polsku, wielka litera tylko na początku nagłówka. Regionalizm: „Na polu" zamiast „Na dworze" (w danych nadal `Plener`).

## Zasady
- Nie dodawaj zależności bez potrzeby; jeśli trzeba, zaktualizuj `package.json`.
- Po zmianach uruchom `npm run build` i napraw błędy przed commitem.
- Commity małe, z opisem po polsku.
- Strona jest testowa: `noindex` w `components/Uklad.js` zostaje, dopóki nie podepniemy domeny frajdoplan.pl.
- Nigdy nie cofaj produkcji do starszego wdrożenia. Do odświeżenia danych wystarczy nowe wdrożenie najnowszego commita.
- Plan i lista zadań: dokument „frajdomat-struktura-i-roadmapa.md" (u właścicielki).
