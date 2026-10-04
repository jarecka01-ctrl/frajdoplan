# Rozpoznanie źródeł wydarzeń dla dzieci „Dziś w Krakowie” (etap 1, uzupełniony)

Sprawdzono 4 października 2026 (niedziela), w dwóch częściach: rano (większość domen była zablokowana) i po odblokowaniu domen. Zapytania szły po kolei, nie częściej niż raz na sekundę, z nagłówkiem `FrajdoplanBot`. **Zawsze najpierw czytano `robots.txt` danej domeny**, dopiero potem cokolwiek innego (wyjątek z rana: jednorazowy test dostępności czterech teatrów, opisany w `rozpoznanie-teatrow-i-koncertow.md`). Nie omijano zabezpieczeń, nie logowano się, nie pobierano Facebooka ani Instagrama. Kina, teatry i koncerty pominięto (mają osobne raporty).

**Co nadal nie dało się sprawdzić (blokada sieci środowiska lub błąd serwera):** `karnet.krakowculture.pl`, `krakownh.pl` (jego `robots.txt` odpowiada błędem 500, a przy błędzie serwera zgodnie z zasadami nie pobieramy), `mdkgal.edu.pl`, `mdk-lotnicza.pl`, `sckm.krakow.pl`, `mdkfort49.krakow.pl`, `micet.pl`, `kopieckosciuszki.pl`, `bunkier.art.pl` (403). Dla pozostałych domen odczytano `robots.txt`, ale kalendarza każdej z ~40 mniejszych stron nie analizowano szczegółowo (patrz „Nie zbadane”).

## Podsumowanie

| Ocena | Źródła | Liczba |
|---|---|---|
| **bezpieczne i proste** | Ośrodek Kultury Norwida, Centrum Kultury Podgórza, Biblioteka Kraków, ZIS „Dzieciaki na start” (krakow.pl: proste technicznie, ale niska jakość; patrz niżej) | **4** (+1) |
| **bezpieczne, ale wymaga AI** | Dworek Białoprądnicki (11 klubów i kilka wspólnych kalendarzy), Muzeum Inżynierii i Techniki (MIT) | **2 operatory** |
| **bezpieczne, do dalszego rozpoznania** (robots pozwala, kalendarz wygląda sensownie, nie zbudowano) | MNK, Muzeum Krakowa | 2 |
| wątpliwe | `krakow.pl` jako źródło wydarzeń (ogłoszenia, powtórki innych źródeł) | 1 |
| niemożliwe | `cep.uj.edu.pl` (`Disallow: /`), Nowohuckie Centrum Kultury (robots 500, więc nie pobieramy; do ponownej próby) | 2 |
| **nie sprawdzone** (blokada lub błąd) | Karnet, 4 młodzieżowe domy kultury, MICET, Muzeum Kościuszkowskie, Bunkier Sztuki | 8 |
| **nie zbadane szczegółowo** (robots pozwala, kalendarz nie analizowany) | ok. 30 małych źródeł: pozostałe MDK-i, domy kultury, muzea | ~30 |

## Grupa A: kalendarze zbiorcze

| Źródło | Dane | `robots.txt` | Dla dzieci | Ocena i wynik próby |
|---|---|---|---|---|
| **Biblioteka Kraków** (`biblioteka.krakow.pl/wydarzenia`) | lista ładuje się z `/front-api/events` (JSON z HTML; to samo zapytanie wysyła strona) | brak pliku (404), więc brak zakazów | tak: odbiorcy „Dzieci” i „Rodziny z dziećmi”, kategoria, godzina, filia z adresem | **bezpieczne i proste**; **zbudowane**; 66 wydarzeń w najbliższych tygodniach (m.in. czytanie, warsztaty, spacery) |
| **ZIS „Dzieciaki na start”** | tabela HTML (data, godzina, opis, zapisy) | zakaz tylko `/cms`, `/cmsd` | cały cykl dla 6–14 lat | **bezpieczne i proste**; **zbudowane**; 5 treningów do końca roku (bezpłatne; zapisy przez formularz) |
| **krakow.pl „Kraków dla dzieci”** | mapa dni z wydarzeniami w kodzie strony + zapytanie dnia `/ajax/KalendariumKom/data` | zakazany tylko bot AhrefsBot | kategoria 2431 prowadzona przez miasto, ale zawiera też ogłoszenia dla rodziców i konkursy | technicznie proste, **wątpliwe jakościowo**: brak godzin i miejsc, wiele powtórek innych źródeł. Moduł **gotowy, ale wyłączony** (`wlaczone: false`) do decyzji |
| **Karnet** (`karnet.krakowculture.pl`) | — | nie dało się pobrać | — | nie sprawdzone (domena zablokowana) |

## Grupa B: operatorzy domów kultury

| Operator | Miejsc w CSV | Dane | `robots.txt` | Ocena i wynik |
|---|---|---|---|---|
| **Ośrodek Kultury Norwida** (`okn.edu.pl`) | 4 | strony kategorii `wydarzenia-kategoria-N.html` (225 „Dla dzieci”, 223 „Dla rodzin”, 224 „Dla rodziców z maluszkami”); wiek i cena w opisie obrazka | zakazane tylko katalogi techniczne | **bezpieczne i proste**; **zbudowane**; dziś 1 wydarzenie dla dzieci w kalendarzu (seanse Sfinksa pomijamy) |
| **Centrum Kultury Podgórza** (`ckpodgorza.pl`) | 17 klubów + Praska 52 | `POST /oferta/wydarzenia/filterAjax` (JSON z HTML) z filtrem grupy „dla dzieci” (id 1); w kalendarzu są też spektakle Teatru Praska 52 | zakaz tylko 3 wzorców adresów (zdjęcia, papier firmowy, marketing) | **bezpieczne i proste**; **zbudowane**; 32 wydarzenia (w tym cykle tygodniowe rozpisane na dni); część oznaczona „dla dzieci” przez operatora wygląda na dorosłą, więc w `data/wyjatki.json` jest lista propozycji do ukrycia |
| **Dworek Białoprądnicki** (`dworek.eu`, 8 klubów) | 8 | tablica wydarzeń w kodzie strony (data, kategoria, tytuł, link), REST WordPressa bez dat | zezwala na wszystko | **bezpieczne, ale wymaga AI**: dla dzieci brak oznaczenia (tylko rodzaj: koncert, warsztat, festiwal…), więc wybór po tytule wymagałby klasyfikacji lub ręcznej listy |
| **Nowohuckie Centrum Kultury** (`krakownh.pl`, 12 miejsc) | 12 | — | `robots.txt` zwraca błąd 500 | **niemożliwe teraz** (przy błędzie serwera nie pobieramy); spróbować później |
| Młodzieżowe domy kultury (14 miejsc w CSV, 10 osobnych stron) | 14 | — | `mdk.krakow.pl`, `mdkkorczak.pl`, `mdkgrunwaldzka5.pl`, `mdkna102.krakow.pl`, `cmjordan.krakow.pl`: pozwala; `mdkgal.edu.pl`, `mdk-lotnicza.pl`, `sckm.krakow.pl`, `mdkfort49.krakow.pl`: nie dało się pobrać; `mdk-dh.krakow.pl`: odmowa (403) | nie zbadane szczegółowo; `mdkna102.krakow.pl` ma w kodzie strony znaczniki kalendarza (Tribe Events), więc może być proste |
| Pojedyncze domy kultury | ok. 10 | — | pozwala: `krakowskieforum.pl`, `krakowiacy.art.pl`, `mck.krakow.pl`, `dknowybiezanow.pl` (ma schema.org `Event` i Tribe Events, więc prawdopodobnie najłatwiejszy), `zacheta.nowyprokocim.pl`, `calasanz.wieczysta.pijarzy.pl` | nie zbadane szczegółowo |
| Domy kultury tylko na Facebooku (3 wiersze) | 3 | `facebook.com` | — | pomijamy (zakaz w zadaniu) |

## Grupa C: muzea (60 miejsc w CSV)

| Operator | Miejsc | Dane | `robots.txt` | Ocena |
|---|---|---|---|---|
| **MNK** (`mnk.pl`) | 8 | lista `/wydarzenia/` w HTML, filtr „Dla kogo: Rodzice i dzieci” i typy („Warsztat”, „Oprowadzanie”, „Bajeczne i słoneczne”); daty od–do w jednej linii | zakaz tylko `/wp-admin/` | **bezpieczne, do dalszego rozpoznania** (struktura nie rozpisana do końca) |
| **Muzeum Krakowa** (`muzeumkrakowa.pl`) | 14 | `/kalendarium`, filtr rodzaju („spotkanie dla dzieci”, „warsztaty”) i lokalizacji | pozwala | **bezpieczne, do dalszego rozpoznania** |
| **MIT** (`mit.krakow.pl`) | 3 | `/wydarzenia/` w HTML | zakaz tylko `/wp-admin/` | **bezpieczne, ale wymaga AI**: brak oznaczenia wieku |
| Pozostałe muzea (ok. 35, własne domeny) | ~35 | — | pozwala (m.in. Cogiteon, MOCAK, Cricoteka, Manggha, Muzeum Lotnictwa, Muzeum AK, Muzeum Archeologiczne (Tribe Events), Muzeum Farmacji, MuFo, Muzeum Witrażu, Apilandia); `cep.uj.edu.pl`: **`Disallow: /`**; `wawel.krakow.pl`, `etnomuzeum.eu`: brak pliku; `bunkier.art.pl`: 403; `micet.pl`, `kopieckosciuszki.pl`: niedostępne | nie zbadane szczegółowo |

**Wystawy i warsztaty (kafelek „Wystawy dla dzieci”):** MNK podaje daty od–do w jednej linii („10 października 2026 – 11 października 2026”), a Muzeum Krakowa ma filtr rodzaju wydarzeń, który obejmuje „wydarzenia towarzyszące wystawom” i „warsztaty”. Obie formy da się zapisać jako `data_regula` w formacie `RRRR-MM-DD do RRRR-MM-DD` i kategorię `wystawa` albo `warsztaty` (kolumna `kategoria` już obsługuje obie wartości).

## Co zbudowano (4 października)

Moduły: Ośrodek Kultury Norwida, Centrum Kultury Podgórza, Biblioteka Kraków, ZIS (oraz `krakow-pl.mjs` wyłączony). Wynik próby (wszystkie sieci przez curl, bo Node w tym środowisku nie dochodził do trzech z tych domen; w GitHub Actions nie będzie tego problemu): Biblioteka 66, CKP 31 (+1 dla grup), ZIS 5, OKN 1. Linki: wydarzenia bez linku do biletów dostają link do strony wydarzenia. `powiazane_miejsce_id` uzupełniane z arkusza „Miejsca”: filie biblioteki po numerze, kluby CKP po nazwie, OKN po nazwie.

## Ile wymaga AI (koszt Claude API)

**Dla zbudowanych źródeł: 0.** Wszystkie rozpoznają „dla dzieci” po oznaczeniu na stronie. AI byłoby potrzebne tylko dla Dworku Białoprądnickiego i MIT, czyli tych, których nie zbudowano.

## Proponowana kolejność dalszych prac

1. Odblokować Karnet i NCK (robots 500: spróbować ponownie albo napisać do instytucji), sprawdzić wygląd kalendarza w MNK i Muzeum Krakowa i zbudować je razem z kafelkiem „Wystawy dla dzieci”.
2. `dknowybiezanow.pl` i `mdkna102.krakow.pl` (schema.org / Tribe Events): prawdopodobnie najłatwiejsze z małych źródeł.
3. Groteska (kategoria „dla dzieci” w adresie spektaklu) jest gotowa do zbudowania i dałaby sporo spektakli.
4. Dworek Białoprądnicki dopiero, gdy zdecydujesz o kosztach AI (albo ręcznej liście tytułów).

## Nie zbadane

Dla każdego z ok. 30 małych źródeł brakuje: adresu kalendarza, formy danych, oznaczenia wieku, szacunku liczby wydarzeń. Wiemy tylko, że `robots.txt` im nie zabrania, albo że nie dało się go pobrać.
