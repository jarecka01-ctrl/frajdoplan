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
- `components/` — `Uklad` (menu, stopka, meta i Open Graph), `Okruszki`, `StronaKategorii`, `Katalog` (filtry, kafelki rodzajów z wielokrotnym wyborem, przycisk „Blisko mnie", lista, mapa), `Mapa`, `Wydarzenia` (Dziś / Jutro / Weekend + pomocnicze funkcje dat), `BliskoIKina` (kafelki: Dziś w kinach z przełącznikiem Dziś/Jutro, spektakle, koncerty), `NajblizszeWydarzenia` (ogólny kafelek spektakli i koncertów), `Baner`, `Kalendarz` (bez seansów kinowych; filtry kategorii, gdy arkusz ma kolumnę `kategoria`).
- `pages/` — `index` (Gdzie iść), huby `atrakcje`, `sport` (dawne `/treningi`, przekierowanie 301), `zajecia`, `polkolonie`, listy `koncerty` i `spektakle` (wszystkie przyszłe wydarzenia kategorii, po miesiącach, z danymi Event; `components/ListaWydarzen`, `lib/grupowanie.js` łączy godziny tego samego wydarzenia), `sitemap.xml` oraz podstrony kategorii `atrakcje/[kategoria]`, `sport/[dyscyplina]`, `zajecia/[kategoria]`.
- `styles/globals.css` — cały wygląd.
- `scripts/repertuar/` — skrypt repertuaru kin studyjnych oraz wydarzeń dla dzieci (`npm run repertuar`): moduł na każde źródło w `zrodla/` (kina, teatry Ludowy / Współczesny / Szczęście / Kultureska, Filharmonia, Sinfonietta, Ośrodek Kultury Norwida, Centrum Kultury Podgórza, Biblioteka Kraków, ZIS „Dzieciaki na start", wydarzenia gościnne w halach i klubach: TAURON Arena, ICE Kraków, Klub Studio, Teatr Variété; teatry i opera: Groteska, Teatr Figurki, Teatr Słowackiego, Opera Krakowska; `krakow-pl.mjs` jest gotowy, ale wyłączony), wynik w `data/repertuar.json` (seanse z `kino: true`, inne wydarzenia z `typ`, `kategoria` i opcjonalnym `dla_grup: true` — poranki dla szkół, których strona nie pokazuje), lista „do weryfikacji" w tym samym pliku, wyjątki w `data/wyjatki.json` (`wymus` / `ukryj` ogólne oraz `zrodla.<id>` dla jednego źródła). Przed pobraniem czegokolwiek z serwisu skrypt czyta jego `robots.txt` (zakaz = nie pobiera). Uruchamia go `.github/workflows/repertuar-kin.yml` (wt. i czw. wieczorem, sob. rano); wynik jest w zakładce Summary uruchomienia. Wydarzenia dla dzieci wybieramy po oznaczeniu na stronie źródła (kategoria, wiek, cykl), a gdy go nie ma — po listach `wymus` / `ukryj`; przy niepewności nic nie publikujemy, tylko wpisujemy do `do_weryfikacji`. Spektakle: 60 dni do przodu, koncerty i widowiska (`typ: widowisko`, pokazywane w „Najbliższych koncertach"): 180. Źródła gościnne oceniają „dla dzieci" w `scripts/repertuar/dla-dzieci.mjs` (hale mają głównie wydarzenia dla dorosłych: publikujemy tylko przy wyraźnym sygnale, niepewne idą do `do_weryfikacji`; duże widowiska rodzinne dostają `kandydat_banera: true`, o `wyrozniony` decyduje właścicielka). Ten sam tytuł, dzień i miejsce z dwóch źródeł = jedno wydarzenie. Skrypt nie pobiera kupbilecik.pl, biletomat.pl, serwisów KICKET, Facebooka ani Instagrama (`zakazanyAdres` w `wspolne.mjs`). Raport źródeł gościnnych: `docs/rozpoznanie-wydarzen-goscinnych.md`, teatrów i opery: `docs/rozpoznanie-teatrow-uzupelnienie.md`. `node scripts/repertuar/kontrola.mjs [poprzedni-plik.json]` pokazuje tabelę: ile wydarzeń dla dzieci ma każde źródło na 60 i 180 dni, ile ukrytych poranków dla grup, ile do weryfikacji i ile bez `powiazane_miejsce_id`. Kategorie nadaje `scripts/repertuar/kategorie.mjs` (planszówki przed sportem; sport tylko przy sportowych słowach); `przeklasyfikuj.mjs` stosuje je do istniejącego pliku, `uzupelnij-miejsca.mjs <plik.csv>` uzupełnia `powiazane_miejsce_id` z CSV „Miejsca". Cinema City i Multikino nie są pobierane — w „Dziś w kinach" mają stałe linki. Raport źródeł: `docs/rozpoznanie-kin.md`. Skrypt sprawdza każdy link do seansu (`linki.mjs`; niedziałający zastępuje stroną filmu albo repertuarem kina) i uzupełnia `powiazane_miejsce_id` z arkusza „Miejsca" (`miejsca.mjs`, potrzebuje `SHEET_CSV_URL` jako zmiennej lub sekretu repozytorium GitHub). Wiek i cenę wpisuje tylko wtedy, gdy źródło je podaje.

## Dane
Kolumny „Miejsca": place_id, name, type, street, city, gmina_aglomeracja, rating, reviews, phone, website, photo, lat, lon, flag, queries, kategoria_glowna (Pod dachem / Plener), podkategoria, pogoda, strefa (Kraków i okolice / Pod Krakowem), odleglosc_km, sekcja, dyscyplina, zrodlo_wydarzen, organizuje_urodziny.
Kolumny „Wydarzenia": id, nazwa, typ, data_regula (`2026-10-03` / `2026-10-01 do 2026-10-05` / `co sobotę` / `codziennie`), godzina, powiazane_miejsce_id, grupa_wiekowa, cena, link_biletow, zrodlo, status (puste / aktywne / zatwierdzone = widoczne), kategoria (opcjonalna: koncert, spektakl, warsztaty, pokaz, czytanie, wystawa, jarmark, festyn, sport, spacer, planszowki (pokazywane jako „Planszówki”), inne — filtry w kalendarzu; wartość spoza listy = inne), poziom_pewnosci, miejsce, wyrozniony (tak = baner), obrazek, opis.
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
