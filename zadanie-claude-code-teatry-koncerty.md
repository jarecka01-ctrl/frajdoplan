# Zadanie dla Claude Code: repertuar teatrów i koncertów dla dzieci

Przeczytaj `CLAUDE.md` i `docs/rozpoznanie-kin.md` (wzór raportu). Nowa gałąź `repertuar-teatry-koncerty`, małe commity po polsku, po każdym etapie `npm run build`, na końcu pull request.

Skrypt kinowy już działa (`scripts/repertuar/`, `data/repertuar.json`, `data/wyjatki.json`, workflow w `.github/workflows/`). Rozbuduj go o teatry i koncerty w tym samym stylu i tym samym pliku danych.

## Etap 1: rozpoznanie (plik `docs/rozpoznanie-teatrow-i-koncertow.md`)
Źródła do sprawdzenia (strony z repertuarem, bez omijania zabezpieczeń):
- Teatry: Groteska (groteska.pl), Bagatela (bagatela.pl), Ludowy (ludowy.pl), Słowackiego (slowacki.krakow.pl), Teatr Współczesny (teatrkrakow.pl), Kultureska (kultureska.pl), KTO (teatrkto.pl), Stary (stary.pl), Łaźnia Nowa (laznianowa.pl), STU (scenastu.pl), Magic (teatrmagic.pl), Szczęście (teatrszczescie.pl), Variété (teatrvariete.pl), Praska 52 (teatrpraska52.pl), Małopolski Ogród Sztuki (teatrwkrakowie.pl).
- Koncerty dla dzieci: Filharmonia Krakowska (filharmoniakrakow.pl), Opera Krakowska (opera.krakow.pl), Centrum Muzyki (centremusic.pl), Sinfonietta Cracovia (sinfonietta.pl), Capella Cracoviensis (capellacracoviensis.pl), ICE Kraków (icekrakow.pl), Opera Kameralna (kok.art.pl), Auditorium Maximum UJ (uj.edu.pl).
- Pomocniczo: karnet.krakowculture.pl (kalendarz zbiorczy). Ocenia się go tylko jako uzupełnienie.
Dla każdego źródła zapisz: adres repertuaru, jak są dane (JSON, schema.org `Event`, HTML, ładowane skryptem), `robots.txt` i regulamin, czy repertuar ma oznaczenie „dla dzieci" / wiek / kategorię, z jakim wyprzedzeniem jest publikowany, ocena: „bezpieczne" / „wątpliwe" / „niemożliwe". Nie więcej niż jedno zapytanie na sekundę. Po raporcie zatrzymaj się i pokaż podsumowanie.

## Wyprzedzenie
Spektakle: 60 dni do przodu. **Koncerty: 180 dni do przodu** (na popularne wydarzenia bilety kupuje się z dużym wyprzedzeniem, a kafelek „Najbliższe koncerty" ma pokazywać także odleglejsze terminy).

## Etap 2: budowa (po moim potwierdzeniu, tylko źródła „bezpieczne")
- Nowe moduły w `scripts/repertuar/zrodla/`, ten sam wspólny format wydarzenia co dla kin (pola jak w `data/repertuar.json`), `typ`: `spektakl` lub `koncert`, `kino`: false.
- Filtr „dla dzieci": oznaczenie na stronie źródła (dla dzieci, wiek do 12 lat, nazwy cykli typu „bajka", „dla maluchów"), plus lista `wymus` / `ukryj` w `data/wyjatki.json`. Przy niepewności (nie wiadomo, czy dla dzieci) NIE publikuj: zapisz w osobnej sekcji `do_weryfikacji` w pliku i w podsumowaniu workflow (GitHub Actions summary), a właścicielka dopisuje tytuł do `wymus`.
- `powiazane_miejsce_id`: uzupełnij z `place_id` miejsc w CSV „Miejsca" (podkategorie „Teatr" i „Koncerty dla dzieci"), dopasowując po nazwie. Jeśli teatr ma kilka scen (np. Ludowy), użyj nazwy sceny w polu `miejsce`.
- Pola `grupa_wiekowa`, `cena`, `link_biletow` wypełniaj, gdy źródło je podaje. Link biletów musi działać: sprawdź go bez sesji, a niedziałające zastąp stroną spektaklu lub repertuaru (jak przy kinach).
- Seanse z minionych dni nie trafiają do pliku. Pokaż w logu tabelę: źródło, liczba wydarzeń dla dzieci na najbliższe 60 dni (koncerty: 180 dni), liczba w „do_weryfikacji".

## Etap 3: automat
- Osobny workflow (`repertuar-teatry-koncerty.yml`): raz w tygodniu (poniedziałek wieczorem) plus `workflow_dispatch`, wyprzedzenie 60 dni dla spektakli i 180 dni dla koncertów. Te same zasady co przy kinach: commit tylko przy zmianie pliku, błąd źródła nie nadpisuje poprzednich danych, status „failed" przy awarii.
- Strona czyta wydarzenia z `data/repertuar.json` (już zrobione dla kin). Sprawdź, że kafelki „Najbliższe spektakle" i „Najbliższe koncerty" dostają te dane, a kalendarz miesiąca pokazuje je razem z kinami.

## Czego NIE robić
Nie omijaj `robots.txt` ani regulaminów. Nie kopiuj opisów ani plakatów, tylko fakty (tytuł, data, godzina, miejsce, wiek, link). Nie używaj Claude API bez pytania. Nie zmieniaj wyglądu. Nie usuwaj `noindex`.
