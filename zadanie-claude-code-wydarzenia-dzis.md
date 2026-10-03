# Zadanie dla Claude Code: wydarzenia dla dzieci „Dziś w Krakowie" (rozpoznanie źródeł)

Przeczytaj `CLAUDE.md`, `docs/rozpoznanie-kin.md` (wzór raportu) i `docs/rozpoznanie-teatrow-i-koncertow.md`, jeśli istnieje. Nowa gałąź `wydarzenia-dzis`, małe commity po polsku, na końcu pull request.

Cel: główny kalendarz „Dziś / Jutro / Weekend dla dzieci w Krakowie" ma być zasilany automatycznie wydarzeniami z kalendarzy miejskich, domów kultury, bibliotek, muzeów i sportu. Kina, teatry i koncerty mają osobne skrypty, więc pomiń je tutaj.

## Etap 1: tylko rozpoznanie (plik `docs/rozpoznanie-wydarzen.md`), potem zatrzymaj się
**Grupa A: kalendarze zbiorcze**
- krakow.pl, „Kraków dla dzieci": https://krakow.pl/nasze_miasto/301055,artykul,krakow-dla-dzieci.html (kalendarz miejski, wydarzenia dla dzieci)
- karnet.krakowculture.pl (kalendarz zbiorczy; tylko wydarzenia dla dzieci)
- Biblioteka Kraków: https://biblioteka.krakow.pl/oferta/dla-dzieci
- ZIS Kraków „Dzieciaki na start": https://zis.krakow.pl/dzieciaki-na-start

**Grupa B: domy kultury i instytucje.** W CSV „Miejsca" są wiersze z `zrodlo_wydarzen = tak` (ok. 144 miejsc, ok. 110 domen). Pogrupuj je po domenie i operatorze (np. Nowohuckie Centrum Kultury i jego kluby to jedno źródło, Centrum Kultury Podgórza podobnie) i oceń per operator, nie per klub.

**Grupa C: muzea.** Wystawy i warsztaty dla dzieci (muzea z podkategorii „Muzeum" w CSV, flaga „do weryfikacji (wystawy dla dzieci?)" lub bez niej). Zapisz osobno, jak wyglądają dane o wystawach (daty od-do) i warsztatach, bo posłużą kafelkowi „Wystawy dla dzieci".

Dla każdego źródła (wiersz tabeli): adres kalendarza, forma danych (API/JSON, schema.org Event, iCal/RSS, prosty HTML, HTML ładowany skryptem, trzeba AI), `robots.txt` i regulamin, czy jest oznaczenie „dla dzieci" / wiek / kategoria, wyprzedzenie publikacji, szacowana liczba wydarzeń dla dzieci na miesiąc, ocena: „bezpieczne i proste" / „bezpieczne, ale wymaga AI" / „wątpliwe" / „niemożliwe". Wypisz też źródła, w których nie ma kalendarza w ogóle (miejsca bez wydarzeń).
Nie więcej niż jedno zapytanie na sekundę, nie omijaj zabezpieczeń, nie loguj się, nie pobieraj Facebooka ani Instagrama. Przy ponad 100 stronach pobieraj tylko stronę kalendarza każdego operatora, nie całe serwisy.

## Na końcu etapu 1: podsumowanie dla właścicielki
Ile źródeł w każdej ocenie, które 5 daje najwięcej wydarzeń dla dzieci, ile wymaga AI (to koszt, bo Claude API jest rozliczane osobno od subskrypcji claude.ai). Zaproponuj kolejność budowy od największego zysku do najmniejszego.

## Czego NIE robić
Nie buduj jeszcze skryptu. Nie używaj Claude API. Nie zmieniaj strony. Nie zapisuj opisów ani zdjęć wydarzeń, tylko fakty.
