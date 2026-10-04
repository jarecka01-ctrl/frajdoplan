# Rozpoznanie źródeł wydarzeń dla dzieci „Dziś w Krakowie” (etap 1)

Sprawdzono 4 października 2026 (niedziela). Zapytania szły po kolei, nie częściej niż raz na sekundę, z nagłówkiem `frajdoplan-rozpoznanie/1.0`. Nie omijano zabezpieczeń, nie logowano się, nie pobierano Facebooka ani Instagrama. Nic nie zostało zapisane w serwisie. Kina, teatry i koncerty pominięto (mają osobne skrypty; patrz `docs/rozpoznanie-kin.md` i `docs/rozpoznanie-teatrow-i-koncertow.md`).

**Ograniczenie tej sesji (decydujące):** sieć środowiska przepuszcza tylko niewielką część domen. Z całej listy zadania **udało się sprawdzić jedno źródło: Ośrodek Kultury Norwida (`okn.edu.pl`)**. Zablokowane były wszystkie kalendarze grupy A (`krakow.pl`, `karnet.krakowculture.pl`, `biblioteka.krakow.pl`, `zis.krakow.pl`), wszystkie pozostałe domy kultury i wszystkie muzea. W sumie z 113 domen z kolumny `zrodlo_wydarzen` w CSV „Miejsca” dostępne były tylko kina, teatry, filharmonia i `okn.edu.pl` (patrz drugi raport). Te źródła są oznaczone „nie sprawdzone”, żeby nie zgadywać. Dlatego w tym raporcie **nie ma rzetelnego rankingu 5 najlepszych źródeł ani liczby wymagających AI**. Poniżej jest to, co ustalono, i konkretna lista tego, co trzeba odblokować.

## Podsumowanie

| Ocena | Liczba źródeł |
|---|---|
| bezpieczne i proste | **1** (Ośrodek Kultury Norwida) |
| bezpieczne, ale wymaga AI | 0 (nie ustalono) |
| wątpliwe | 0 (nie ustalono) |
| niemożliwe | 0 (nie ustalono) |
| **nie sprawdzone (domena zablokowana)** | **4 w grupie A + 17 operatorów/domów kultury w grupie B + wszystkie muzea z grupy C** |

Grupa B w CSV to 158 miejsc z `zrodlo_wydarzen = tak` na 113 domenach. Po zgrupowaniu po operatorze (poniżej) zostaje około 30 źródeł do oceny, a nie 113.

## Grupa A: kalendarze zbiorcze

| Źródło | Adres | Ocena |
|---|---|---|
| Kraków dla dzieci | `krakow.pl` | nie sprawdzone (domena zablokowana) |
| Karnet | `karnet.krakowculture.pl` | nie sprawdzone (domena zablokowana) |
| Biblioteka Kraków | `biblioteka.krakow.pl` | nie sprawdzone (domena zablokowana) |
| ZIS „Dzieciaki na start” | `zis.krakow.pl` | nie sprawdzone (domena zablokowana) |

To one z największym prawdopodobieństwem dadzą najwięcej wydarzeń, więc ich odblokowanie to najpilniejsza rzecz.

## Grupa B: domy kultury i instytucje, pogrupowane po operatorze

Z CSV „Miejsca” (wiersze z `zrodlo_wydarzen = tak`, oprócz kin, teatrów i filharmonii):

| Operator (źródło) | Liczba miejsc w CSV | Domeny | Ocena |
|---|---|---|---|
| **Ośrodek Kultury Norwida** | 4 (Norwid, Kuźnia, ARTzona, Sfinks) | `okn.edu.pl` (wspólny kalendarz dla wszystkich) | **bezpieczne i proste** (opis niżej) |
| Centrum Kultury Podgórza | 17 (kluby: Aleksandry, Borek, Czeczów, Iskierka, Kostrze, Piaskownica, Płaszów, Przewóz, Rybitwy, Ruczaj, Skotniki, Soboniowice, Solvay, Swoszowice, Tyniec, Wola Duchacka, Wróblowice) | `*.ckpodgorza.pl` | nie sprawdzone. To jeden operator, więc prawdopodobnie jeden wspólny kalendarz |
| Nowohuckie Centrum Kultury | 12 | `krakownh.pl` | nie sprawdzone |
| Dworek Białoprądnicki | 8 (kluby: Chełm, Łokietek, Mydlniki, Paleta, Przegorzały, Wena, Wola, sam Dworek) | `*.dworek.eu` | nie sprawdzone. Jeden operator |
| Młodzieżowe domy kultury | 14 | osobne strony: `mdk.krakow.pl`, `mdkgal.edu.pl`, `mdkkorczak.pl`, `mdk-dh.krakow.pl`, `mdk-lotnicza.pl`, `mdkgrunwaldzka5.pl`, `mdkna102.krakow.pl`, `sckm.krakow.pl`, `mdkfort49.krakow.pl`, `cmjordan.krakow.pl` | nie sprawdzone. Każdy MDK ma własną stronę, więc każdy trzeba oceniać osobno |
| Pojedyncze domy kultury | ok. 10 | m.in. `krakowskieforum.pl`, `krakowiacy.art.pl`, `mck.krakow.pl`, `dknowybiezanow.pl`, `zacheta.nowyprokocim.pl`, `calasanz.wieczysta.pijarzy.pl`, `bunkier.art.pl` | nie sprawdzone |
| Domy kultury tylko na Facebooku | 3 | `facebook.com` (Dom Kultury Czerwonoprądnicki, Klub Kazimierz) | **pomijamy** (Facebook jest wyłączony zadaniem) |

**Źródła bez własnej strony kalendarza:** tego w tej sesji nie dało się ustalić (domeny zablokowane). Na pewno bez strony WWW są trzy wiersze z Facebooka powyżej i trzy wiersze bez adresu (m.in. Centrum Interpretacji Niematerialnego Dziedzictwa Krakowa).

### Ośrodek Kultury Norwida (jedyne sprawdzone źródło)

- **Kalendarz:** https://okn.edu.pl/wydarzenia-RRRR-MM-DD.html (strona dnia) i https://okn.edu.pl/wydarzenia-RRRR-MM.html (miesiąc). Strony są zwykłym HTML-em, z tabelą: termin, godzina, tytuł, miejsce, kategorie. Jest też „Pobierz zestawienie w pliku PDF” i widoki tygodnia i miesiąca.
- **Pokrycie:** jeden kalendarz obejmuje całą placówkę: Kuźnię, ARTzonę, Nowohuckie Laboratorium Dziedzictwa, biblioteki, galerie i Kino Sfinks (kina pomijamy). Poddomeny (`kuznia.okn.edu.pl`, `artzona.okn.edu.pl`, `kinosfinks.okn.edu.pl`) są w tym środowisku zablokowane, ale ich wydarzenia są też w kalendarzu na `okn.edu.pl`.
- **Oznaczenie „dla dzieci”:** tak, wprost. Kategorie: „Dla dzieci”, „Dla rodzin”, „Dla rodziców z maluszkami”, „Dla dorosłych”, a do tego tematyczne (Warsztaty, Film, Koncerty, Literatura, Sztuka, Festiwale, Kluby Rodziców, W Galeriach…). Wieku w liczbach nie ma.
- **robots.txt:** zakazane tylko katalogi techniczne (`/uploads/`, `/css/`, `/js/`, `/images/`) i widżet `/kalendarz_imprez/kalendarzTopTydzien/`. Strony `wydarzenia-…` nie są zakazane.
- **Regulamin:** jest tylko polityka prywatności i deklaracja dostępności, zakazu pobierania nie znaleziono.
- **Wyprzedzenie:** kalendarz pokazuje dni z kilkunastodniowym wyprzedzeniem i ma stronę miesiąca. Ile miesięcy naprzód — nie sprawdzano.
- **Przykład (10 października 2026):** 6 pozycji w dniu, z tego dla dzieci: „Sensory Sztuki – warsztaty plastyczno-sensoryczne dla dzieci” (10:00) i „Festiwal Brzechwałki” (10:00–11:30, kategorie Festiwale i Warsztaty). Reszta to seanse Sfinksa i wydarzenia dla dorosłych.
- **Szacunek:** kilka wydarzeń dla dzieci tygodniowo, czyli rząd 10–30 miesięcznie (szacunek z jednego dnia, trzeba zweryfikować na pełnym miesiącu).
- **Ocena: bezpieczne i proste.** Wystarczy kod czytający HTML i filtrujący po kategorii „Dla dzieci” / „Dla rodzin” / „Dla rodziców z maluszkami”. AI niepotrzebne.
- **Dodatkowo:** kanał Atom z aktualnościami (`/aktualnosci.xml`), ale to wiadomości, a nie kalendarz, więc nie nadaje się jako źródło wydarzeń.

## Grupa C: muzea

W CSV jest 60 miejsc z podkategorii „Muzeum” oznaczonych `zrodlo_wydarzen = tak`. Żadna z ich domen nie była dostępna z tego środowiska. Po zgrupowaniu:

| Operator | Miejsca | Domena | Ocena |
|---|---|---|---|
| Muzeum Krakowa | 14 (oddziały, m.in. Podziemia Rynku, Fabryka Schindlera, Pałac Krzysztofory) | `muzeumkrakowa.pl` | nie sprawdzone |
| Muzeum Narodowe | 8 | `mnk.pl` | nie sprawdzone |
| Muzeum Inżynierii i Techniki | 3 | `mit.krakow.pl` | nie sprawdzone |
| Pozostałe muzea, każde z własną stroną | ok. 35 (m.in. Cogiteon, MOCAK, Cricoteka, Wawel, Manggha, Muzeum Lotnictwa, Muzeum Etnograficzne, muzea prywatne i interaktywne) | osobne domeny | nie sprawdzone |

**Wystawy i warsztaty (do kafelka „Wystawy dla dzieci”):** nie dało się zobaczyć, jak muzea publikują wystawy (daty od–do) i warsztaty. Do ustalenia po odblokowaniu domen. Zapisano jedynie założenie, że kolumna `kategoria` w „Wydarzeniach” (koncert, spektakl, warsztaty, pokaz, czytanie, wystawa, jarmark, festyn, sport, spacer, inne) i data w formacie `data od do` w `data_regula` pokryją oba przypadki.

## Co trzeba zrobić, żeby skończyć rozpoznanie

Najprościej: w ustawieniach środowiska dać szerszy dostęp do sieci (pełny dostęp tylko do odczytu stron) albo dopisać domeny. Domeny trzeba wpisywać pojedynczo (wpis `okn.edu.pl` nie obejmuje poddomen). Lista dla grupy A i najważniejszych operatorów:

- Grupa A: `krakow.pl`, `www.krakow.pl`, `karnet.krakowculture.pl`, `biblioteka.krakow.pl`, `zis.krakow.pl`
- Operatorzy: `ckpodgorza.pl` (oraz klub: np. `borek.ckpodgorza.pl`), `krakownh.pl`, `dworek.eu`, `mdk.krakow.pl`, `mdkgal.edu.pl`, `mdkkorczak.pl`
- Muzea: `muzeumkrakowa.pl`, `mnk.pl`, `mit.krakow.pl`, `cogiteon.pl`, `mocak.pl`, `wawel.krakow.pl`, `manggha.pl`

Pełna lista domen z blokadą jest w CSV „Miejsca” (kolumna `website` dla wierszy z `zrodlo_wydarzen = tak`).

## Proponowana kolejność budowy (na podstawie tego, co już wiadomo)

1. **Ośrodek Kultury Norwida**: prosty HTML, wprost oznaczona kategoria „Dla dzieci”, gotowe do budowy od razu.
2. Kalendarz miejski `krakow.pl` i `karnet.krakowculture.pl` (grupa A): po rozpoznaniu, bo prawdopodobnie dadzą najwięcej wydarzeń z jednego miejsca.
3. Centrum Kultury Podgórza, Nowohuckie Centrum Kultury, Dworek Białoprądnicki: trzy operatory obejmujące łącznie 37 miejsc w CSV.
4. Muzea (Muzeum Krakowa, MNK) razem z kafelkiem „Wystawy dla dzieci”.
5. Młodzieżowe domy kultury i pojedyncze domy kultury: dużo źródeł, mało wydarzeń z każdego, więc na końcu.

## Czego jeszcze nie ustalono (do uzupełnienia po odblokowaniu)

Dla każdego źródła: adres kalendarza, forma danych (JSON, schema.org, iCal, HTML, skrypt), `robots.txt` i regulamin, oznaczenie wieku, wyprzedzenie, liczba wydarzeń dla dzieci na miesiąc, ocena. Dopiero wtedy da się podać, ile źródeł wymaga AI (czyli kosztu Claude API).
