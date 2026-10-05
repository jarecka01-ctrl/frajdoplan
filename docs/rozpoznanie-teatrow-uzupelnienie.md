# Uzupełnienie rozpoznania teatrów i opery (Groteska, Teatr Figur, Słowackiego, Opera Krakowska)

Sprawdzono 5 października 2026 (poniedziałek). Zapytania szły po kolei, nie częściej niż raz na sekundę, z nagłówkiem `FrajdoplanBot`. **Dla każdego serwisu najpierw czytano `robots.txt` i szukano regulaminu**, dopiero potem cokolwiek innego. Bez logowania, bez Claude API i bez omijania zabezpieczeń. Ten raport uzupełnia `docs/rozpoznanie-teatrow-i-koncertow.md` i `docs/rozpoznanie-wydarzen-goscinnych.md`.

## Podsumowanie

| Źródło | Dane | `robots.txt` | Regulamin | Oznaczenie „dla dzieci" | Ocena | Dla dzieci (60 dni) |
|---|---|---|---|---|---|---|
| **Teatr Groteska** (`groteska.pl`) | zwykły HTML, strona na miesiąc (`/repertuar/10/2026`) | `User-agent: *` bez zakazów | tylko polityka prywatności (PDF) | tak: kategoria w adresie spektaklu (`/spektakle/dla-dzieci/…`) | **bezpieczne i proste** (zbudowane) | **29** (+45 poranków dla grup, ukrytych) |
| **Teatr Figur** (`teatrfigur.pl`) | ręcznie składana strona (Elementor): 6 dat bez roku, bilety przez biletomat.pl | zakaz tylko `/wp-admin/` | tylko polityka prywatności | brak; teatr gra dla dorosłych | **wątpliwe** (nie zbudowane) | 0 |
| **Teatr Figurki** (`teatrfigurki.pl`, siostrzany teatr dla dzieci, odkryty przy okazji) | podobna strona (Elementor), ale z godziną, wiekiem, miejscem i linkiem do biletów | zakaz tylko `/wp-admin/` | tylko polityka prywatności | tak: cały repertuar dla dzieci, wiek „4+" | **bezpieczne i proste, ale kruche** (zbudowane) | **9** |
| **Teatr Słowackiego** (`teatrwkrakowie.pl`) | zwykłe żądanie POST `/ajax/pl/repertoireList` zwraca JSON z fragmentem HTML | brak pliku (404) | tylko regulamin newslettera i polityka prywatności | brak; repertuar dla dorosłych | **bezpieczne** (zbudowane), ale **0 dla dzieci** | **0** (z 95 terminów) |
| **Opera Krakowska** (`opera.krakow.pl`) | publiczny JSON `GET /ajax/repertuar?year=…&month=…` | brak pliku (strona 404 zamiast pliku) | regulamin biletów i wstępu (przeczytany), o pobieraniu danych nic | tak: rodzaje „Dla dzieci" i „Spektakl rodzinny (od 12 roku życia)" | **bezpieczne i proste** (zbudowane) | **3** (+ 1 tytuł do weryfikacji) |

W żadnym z czterech źródeł nie potrzeba AI ani przeglądarki. Dwa z nich (Słowackiego i Opera) wcześniej oceniono jako „wątpliwe/ładowane skryptem"; okazało się, że dane dają się pobrać zwykłymi żądaniami, tymi samymi, które wysyła strona.

## Szczegóły

### Teatr Groteska
- **Repertuar:** https://www.groteska.pl/repertuar , osobna strona na miesiąc (`/repertuar/{miesiąc}/{rok}`, na trzy miesiące do przodu). Wiersz: dzień i dzień tygodnia, godzina, tytuł z adresem spektaklu, sala, link do biletów (`kup-bilet.groteska.pl`) albo informacja „Rezerwacja biletów tel. 12 633 48 22".
- **Dla dzieci:** z kategorii w adresie spektaklu: `dla-dzieci` (publikujemy), `dla-doroslych` (pomijamy). Pozostałe kategorie (`wydarzenia`, `CZYTANKI`, `Nowe Sztuki`, `kod-mistrzow`) trafiają do „do weryfikacji" (6 tytułów, niżej).
- **Poranki dla grup szkolnych:** terminy w dni robocze przed 13:00 bez biletów online, z samą rezerwacją telefoniczną, oznaczamy `dla_grup` i ukrywamy (45 terminów). Termin z biletami online jest dla wszystkich, także rano (np. wtorek 6.10 o 11:30), a „Dostępne czwartki" (spektakle dla osób z niepełnosprawnościami) nie są dla grup. Ta reguła jest dokładniejsza niż w Kultureskach, bo Groteska sama pokazuje, które terminy mają sprzedaż online.
- **Linki:** 3 z 29 linków do biletów zastąpiono stroną spektaklu, bo system sprzedaży ich nie obsługiwał (sprawdzanie jak przy kinach).
- **Miejsce:** `powiazane_miejsce_id` z CSV „Miejsca" (Teatr Groteska), uzupełnione dla wszystkich.

### Teatr Figur i Teatr Figurki
- **`teatrfigur.pl/repertuar`:** ręcznie złożona strona w Elementorze, ok. 6 terminów („9.10.", „16.10.") bez roku, z dorosłymi spektaklami („Rozkład jazdy", „Materia Nomada"), bilety przez `biletomat.pl` (z tego serwisu niczego nie pobieramy). Nie ma oznaczeń dla dzieci ani stałej struktury. **Nie zbudowano.** Strona wprost odsyła do „Teatru Figurki".
- **`teatrfigurki.pl/repertuar`:** to teatr dla dzieci (siostrzany). Wiersz: dzień tygodnia, data bez roku („04.10."), tytuł, miejsce, godziny, wiek („4 +"), przycisk „Kup bilet". Występy poza Krakowem (Wadowice, Wrocław) pomijamy, rok wnioskujemy z daty. **Zbudowano**, bo to dokładnie repertuar dla dzieci, ale to układ kruchy: zmiana szablonu strony może wymagać poprawki parsera, a skrypt przy 0 wydarzeń po wcześniejszych wynikach zgłasza awarię (poprzednie dane zostają).
- Terminy Figurki mają bilety w `biletyna.pl` i `biletomat.pl`; linki zostają w danych bez odpytywania `biletomat.pl`.

### Teatr Słowackiego (`teatrwkrakowie.pl`)
- Lista terminów nie jest w kodzie strony: skrypt `/static/dist/js/script.js` pobiera ją zwykłym żądaniem **POST** na `/ajax/pl/repertoireList` (parametry `filters[…]`, `startDate`, `lastDate`, odpowiedź JSON z polem `template`). Jedno żądanie zwraca dni od `startDate` do końca miesiąca.
- **Zbudowano moduł**, ale cały repertuar to spektakle dla dorosłych (Wesele, Dziady, Wyspa, Wielki Gatsby…) bez żadnych oznaczeń dla dzieci: **0 z 95 terminów na 60 dni**. Moduł będzie wychwytywać ewentualny spektakl rodzinny z sygnałem „dla dzieci" w tytule. Teatr ma też dział edukacji DEMOS, ale jego ofert nie ma w repertuarze.
- Regulaminu serwisu nie znaleziono (tylko newsletter i polityka prywatności).

### Opera Krakowska (`opera.krakow.pl`)
- **Dane:** `GET /ajax/repertuar?year=2026&month=10` zwraca JSON (`performances`: data, godzina, tytuł, rodzaj, scena, dopisek, adres biletów). Serwer dokleja do odpowiedzi skrypty odświeżające stronę, więc moduł wycina z niej sam JSON.
- **Dla dzieci:** rodzaje „Dla dzieci" i „Spektakl rodzinny (od 12 roku życia)". Dziś: **„Nowa Opowieść Wigilijna"** (26–28.11, 12+) = 3 terminy. Rodzaj „Dla dzieci" w październiku i listopadzie jest pusty.
- **„Duszek w Operze"** (warsztaty z działu edukacji, 7, 11 i 22.10) nie ma oznaczenia wieku, więc trafia do „do weryfikacji". Terminy z dopiskiem „Spektakl zamknięty" (22.10 rano) to występy dla grup (`dla_grup`).
- Regulamin (https://opera.krakow.pl/regulamin) to zasady sprzedaży biletów i wstępu; o pobieraniu danych nic nie ma.

## Kontrola danych (uruchomienie lokalne, 5 października 2026, wszystkie źródła)

Skrypt `node scripts/repertuar/uruchom.mjs` (kina, teatry, koncerty, Biblioteka, CKP, ZIS, Norwid, hale), potem `node scripts/repertuar/kontrola.mjs <poprzedni-plik>`. „Dla dzieci" to wydarzenia widoczne na stronie (bez poranków dla grup). Spektakle mają wyprzedzenie 60 dni, koncerty i widowiska 180, kina to kilkanaście dni repertuaru, stąd te same liczby w obu oknach.

| źródło | dla dzieci 60 dni | dla dzieci 180 dni | ukryte (poranki dla grup) | do weryfikacji (tytuły) | bez powiazane_miejsce_id | status |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Kino Kijów | 25 | 25 | 0 | 0 | 0 | BŁĄD (stare dane) |
| Kino Mikro | 3 | 3 | 0 | 0 | 0 | ok |
| Kino Agrafka | 0 | 0 | 0 | 0 | 0 | ok |
| Kino Pod Baranami | 3 | 3 | 0 | 0 | 0 | ok |
| Kino Paradox | 1 | 1 | 0 | 0 | 0 | ok |
| Kino Sfinks | 1 | 1 | 0 | 0 | 0 | ok |
| Ośrodek Kultury Norwida | 1 | 1 | 0 | 0 | 0 | ok |
| Teatr Ludowy | 19 | 19 | 14 | 0 | 0 | ok |
| Teatr Kultureska | 0 | 0 | 29 | 0 | 0 | ok |
| Teatr Współczesny | 1 | 1 | 47 | 0 | 0 | ok |
| Teatr Szczęście | 4 | 4 | 0 | 0 | 0 | ok |
| Filharmonia Krakowska | 16 | 49 | 15 | 0 | 0 | ok |
| Sinfonietta Cracovia | 0 | 0 | 2 | 0 | 0 | ok |
| Biblioteka Kraków | 66 | 66 | 0 | 0 | 55 | ok |
| Centrum Kultury Podgórza | 19 | 19 | 1 | 0 | 6 | ok |
| Dzieciaki na start (ZIS Kraków) | 5 | 5 | 0 | 0 | 5 | ok |
| TAURON Arena Kraków | 0 | 0 | 0 | 2 | 0 | ok |
| ICE Kraków | 0 | 0 | 0 | 0 | 0 | ok |
| Klub Studio | 0 | 0 | 0 | 0 | 0 | ok |
| Krakowski Teatr VARIETE | 5 | 10 | 26 | 0 | 0 | ok |
| Teatr Groteska | 29 | 29 | 45 | 6 | 0 | ok |
| Teatr Figurki | 9 | 9 | 0 | 0 | 0 | ok |
| Teatr im. Słowackiego | 0 | 0 | 0 | 0 | 0 | ok |
| Opera Krakowska | 3 | 3 | 0 | 1 | 0 | ok |
| **razem** | 210 | 248 | 179 | 9 | 66 |  |

Źródła z 0 wydarzeń dla dzieci mimo wcześniejszych wyników albo z błędem: Kino Kijów (błąd)

**Uwagi do tabeli:**
- **Kino Kijów:** system sprzedaży `kupbilet.kijow.pl` odpowiada błędem HTTP 503 (potwierdzone w dwóch kolejnych uruchomieniach tego dnia), więc skrypt zachował poprzednie dane (25 seansów) i oznaczył źródło jako awaryjne. Workflow w takiej sytuacji kończy się „failed". Do ponownego sprawdzenia.
- **0 mimo wcześniejszych wyników:** żadne źródło nie spadło do zera względem poprzedniego pliku (porównano liczbę „dla dzieci", „wszystkich" i „dla grup" każdego źródła przed i po). Źródła z 0 dla dzieci mają to samo 0 co wcześniej: Kultureska (wszystkie 29 terminów to poranki dla grup w dni robocze, ukryte celowo), Sinfonietta (cykl „Sinfonietka" to poranki dla klas), Agrafka, ICE, Klub Studio, TAURON Arena (2 do weryfikacji), Teatr Słowackiego. Teatr Współczesny ma tylko 1 wydarzenie dla dzieci przy 47 ukrytych porankach dla grup i 129 terminach: to ten sam wynik co przed zmianą, ale warto go przejrzeć (czy znaczek „Dla dzieci" nie jest pomijany).
- **Bez `powiazane_miejsce_id`:** Biblioteka Kraków (55 filii), Centrum Kultury Podgórza (6), ZIS „Dzieciaki na start" (5). Dla nowych teatrów miejsca są uzupełnione (Groteska, Opera Krakowska, Teatr Figur, Słowackiego, Variété). Błąd z poprzedniego PR poprawiony: nazwa „Teatr Variété" ma „é", więc wzór nazwy w module Variété go nie łapał; teraz łapie.

## Wyjątki (`data/wyjatki.json`) i co czeka na zatwierdzenie

Plik zawiera listy `wymus` (zawsze dla dzieci) i `ukryj` (zawsze pomijane), ogólne oraz w `zrodla.<id>` dla jednego źródła. Stan na dziś:

| Gdzie | `wymus` | `ukryj` | Status |
|---|---|---|---|
| ogólne (wszystkie źródła) | Dzieci z Bullerbyn | Folwark zwierzęcy | wpisane wcześniej w pracach nad kinami; w repozytorium nie ma oznaczenia „do zatwierdzenia" |
| `ludowy` | Pippi, Calineczka, Pyza na polskich dróżkach, Królowa Śniegu, Kulawa kaczka i ślepa kura, Lokomotywą przez świat, Trik Patryka, Mały Książę | – | **czeka na zatwierdzenie** (propozycja z 4.10; to ona decyduje o 19 spektaklach dla dzieci w kafelku) |
| `ckpodgorza` | – | Debata: Czy życie literackie, Poezja z Podgórza, Kryminalna Poezja Migowa, Wernisaż wystawy, Podgórski spacer literacki, Kiszonki - fermentacja, Pracownia drugiego obiegu | **czeka na zatwierdzenie** (propozycja; ostatnio uzupełniona 5.10) |
| `filharmonia` | – | – | **czeka na zatwierdzenie**: zamiast listy tytułów moduł sam bierze rodzaje koncertów z oznaczeniem dziecięcym (Koncerty dla Dzieci / familijny, Dzieci dzieciom, Bajki muzyką pisane, Przygody w Muzogrodzie, Nutka DaNutka, Muzyczne Bobasy, Kamishibai-ka, Brundibár) i pomija „Audycje muzyczne"; do akceptacji jest ten dobór cykli |
| `kultureska`, `wspolczesny`, `szczescie` | – | – | tylko opis zasad, nic do zatwierdzenia (poza zasadą ukrywania poranków dla grup) |

Znacznik `_uwaga: PROPOZYCJA DO ZATWIERDZENIA…` w pliku nadal jest, a w historii repozytorium nie ma śladu zatwierdzenia. Nie zmieniałem tego pliku w tym PR.

**Nowe pozycje do weryfikacji z tego PR** (dopisz do `wymus` albo `ukryj`; moja propozycja w nawiasie):
- Groteska: *Halloween w Grotesce* 31.10 (nie wiadomo), *Klops. Koło Lokalnych Obrońców Polskich Smoków* 25.10 (czytanki; nie wiadomo), *Kołysanka dla myszy* 10.10 (nowa sztuka, 13:30; nie wiadomo, sprawdź opis), *Krakowski Salon Literacki* (wygląda na dorosłe), *Synchronizacja w Birkenwald* (wygląda na dorosłe, spektakl gościnny), *Michał Korkosz - Rozkoszny* (wygląda na dorosłe, cykl „Kod mistrzów").
- Opera Krakowska: *Duszek w Operze* (warsztaty edukacyjne z działu edukacji, bez podanego wieku; terminy 22.10 rano są zamknięte dla grup).
- TAURON Arena: *Harlem Globetrotters* 21.10 i *Home Alone Live in Concert* 17.12 (z poprzedniego PR).

## Workflow „Repertuar kin i wydarzeń"

- **Plik:** `.github/workflows/repertuar-kin.yml`. **Ręczne uruchomienie (`workflow_dispatch`): jest.**
- **Harmonogram (UTC):** wtorek 19:00 (21:00 latem), czwartek 19:00 (21:00 latem), sobota 06:00 (08:00 latem). Dzienne zasady: commit tylko przy zmianie `data/repertuar.json`, błąd źródła nie nadpisuje poprzednich danych i kończy workflow jako „failed".
- **Limit czasu:** 60 minut (po dodaniu źródeł; lokalnie pełny przebieg trwa kilka minut).
- **Ostatnie przebiegi (z listy uruchomień w GitHub Actions):** (4) **5.10.2026 09:17 UTC, ręcznie (`workflow_dispatch`), sukces**, zmieniły się dane (commit „Repertuar kin: aktualizacja" 09:23); (3) 4.10 19:52 UTC ręcznie, sukces; (2) 3.10 06:15 UTC wg harmonogramu (sobota), sukces; (1) 2.10 12:13 UTC ręcznie, sukces. Wszystkie 4 przebiegi zakończyły się sukcesem. Najbliższy zaplanowany przebieg: wtorek 6.10.2026 o 19:00 UTC (21:00).
- **Uwaga:** przy utrzymującym się błędzie 503 `kupbilet.kijow.pl` najbliższy przebieg zakończy się „failed" (e-mail do właścicielki), mimo że dane są zachowane.

## Co zbudowano

Moduły w `scripts/repertuar/zrodla/`: `groteska.mjs`, `figurki.mjs`, `slowacki.mjs`, `opera-krakowska.mjs`; `miesiaceOkna` we wspólnych narzędziach; `scripts/repertuar/kontrola.mjs` (tabela kontroli danych); lista „miejsca bez place_id" w podsumowaniu workflow obejmuje teraz wszystkie źródła, nie tylko gościnne; poprawka wzoru nazwy Variété. Dane w `data/repertuar.json` odświeżone (kina i pozostałe źródła bez zmian poza zwykłym odświeżeniem, nowe: Groteska, Figurki, Opera, Słowackiego).

## Pytania do decyzji
1. Zatwierdzić (albo poprawić) listy `wymus` / `ukryj` dla Ludowego, Centrum Kultury Podgórza i dobór cykli Filharmonii?
2. Co z sześcioma tytułami Groteski, „Duszkiem w Operze" i dwoma tytułami TAURON Areny (powyżej)?
3. Czy zostawić moduł Teatru Słowackiego (dziś 0 dla dzieci), czy wyłączyć go (`wlaczone: false`), żeby nie robić zbędnych zapytań?
4. Kino Kijów: sprawdzić `kupbilet.kijow.pl` (HTTP 503) lub zmienić źródło.
5. Teatr Współczesny: przejrzeć, dlaczego dla dzieci jest tylko 1 wydarzenie z 129 terminów.
