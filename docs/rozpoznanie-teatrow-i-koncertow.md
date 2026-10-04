# Rozpoznanie źródeł repertuaru teatrów i koncertów (etap 1)

Sprawdzono 4 października 2026 (niedziela). Zapytania szły po kolei, nie częściej niż raz na sekundę, z nagłówkiem `frajdoplan-rozpoznanie/1.0`. Nie omijano żadnych zabezpieczeń ani logowania. Nic nie zostało zapisane w serwisie, to tylko rozpoznanie.

**Ograniczenia tej sesji (ważne):**
- Sieć środowiska przepuszcza tylko część domen. **Nie dało się sprawdzić:** Groteska (`groteska.pl`, także `www.`), Teatr Słowackiego (`slowacki.krakow.pl`), Variété (`teatrvariete.pl`), Praska 52 (`teatrpraska52.pl`), Teatr Figur (`teatrfigur.pl`), `karnet.krakowculture.pl`, `radiokrakow.pl` i Auditorium Maximum (`uj.edu.pl`). Zostały oznaczone „nie sprawdzone”, bez zgadywania.
- Przy `ludowy.pl` pobranie `robots.txt` kilka razy kończyło się zerwaniem połączenia (strona repertuaru działała). Ocena Ludowego jest więc warunkowa.
- W trakcie wstępnego testu dostępności pobrałem stronę główną także czterech serwisów, które w `robots.txt` mają `Disallow: /` (Stary, Bagatela, KTO, Centrum Muzyki). Zrobiłem to raz na serwis, zanim przeczytałem ich robots. Dalej nic z nich nie pobierano.
- Terminów z dalszych miesięcy (np. kolejne strony Filharmonii) nie sprawdzano: oceniono układ strony, nie pełną liczbę wydarzeń.

## Podsumowanie

### Teatry (15 źródeł z zadania)

| Teatr | Źródło danych | robots.txt | Oznaczenie „dla dzieci” | Ocena |
|---|---|---|---|---|
| Współczesny (`teatrkrakow.pl`) | zwykły HTML `/repertuar/` (WordPress) | zakaz tylko `/wp-json/` | tak: „Dla dzieci” / „Dla młodzieży” + „od 4 lat” | **bezpieczne** |
| Szczęście (`teatrszczescie.pl`) | zwykły HTML `/repertuar/`, bilety w ekobilet.pl | zakaz tylko `/wp-admin/` | tak: kategoria „Dla dzieci, młodzieży i rodziców” | **bezpieczne** |
| Kultureska (`kultureska.pl`) | zwykły HTML w ramce `/rep/view_table.php` | zakaz tylko katalogów systemu (Joomla) | cały repertuar dla dzieci | **bezpieczne** |
| Ludowy (`ludowy.pl`) | zwykły HTML `/repertuar/` | nie udało się pobrać | pośrednio: scena TIM, wiek dopiero na stronie spektaklu | **bezpieczne** (warunkowo) |
| Łaźnia Nowa (`laznianowa.pl`) | HTML (Drupal), strona `/wydarzenia` | pobrany, bez zakazu repertuaru | tylko pojedyncze wydarzenia (przegląd „Mała Boska Komedia”) | **bezpieczne**, mało dzieci |
| Scena STU (`scenastu.pl`) | zwykły HTML `/calendar/` | zakaz tylko `/wp-admin/` | brak (repertuar dla dorosłych) | **bezpieczne**, 0 dla dzieci |
| Teatr w Krakowie (`teatrwkrakowie.pl`, strona Teatru Słowackiego / MOS) | lista terminów nie jest w kodzie strony (ładowana skryptem) | brak pliku (404) | nie ustalono | **wątpliwe** (nie zbadano, jak ładuje terminy) |
| Magic (`teatrmagic.pl`) | brak publicznego repertuaru, tylko „oferta bajek” dla przedszkoli i szkół | zakaz tylko `/wp-admin/` | tak (3–9 lat), ale bez dat | brak kalendarza |
| Bagatela (`bagatela.pl`) | HTML | **`Disallow: /` dla wszystkich** | — | **niemożliwe** |
| KTO (`teatrkto.pl`) | jest publiczne API kalendarza (Tribe Events) i iCal | **`Disallow: /` dla wszystkich** | jest dział „Dla dzieci” | **niemożliwe** |
| Stary (`stary.pl`) | HTML, bilety w `bilety.stary.pl` | **`Disallow: /` dla wszystkich** | — | **niemożliwe** |
| Groteska | — | — | — | nie sprawdzone (domena zablokowana) |
| Słowackiego (`slowacki.krakow.pl`) | — | — | — | nie sprawdzone (domena zablokowana) |
| Variété | — | — | — | nie sprawdzone (domena zablokowana) |
| Praska 52 | — | — | — | nie sprawdzone (domena zablokowana) |

**Teatry: 6 bezpiecznych** (Współczesny, Szczęście, Kultureska, Ludowy, Łaźnia Nowa, STU; w tym STU bez żadnych spektakli dla dzieci i Łaźnia z niewieloma), **1 wątpliwe** (teatrwkrakowie.pl), **3 niemożliwe** (Bagatela, KTO, Stary: robots zabrania pobierania, więc nie pobieramy), **1 bez kalendarza** (Magic), **4 nie sprawdzone** (Groteska, Słowackiego, Variété, Praska 52).

### Koncerty (8 źródeł z zadania + 2 pomocnicze)

| Źródło | Źródło danych | robots.txt | Oznaczenie „dla dzieci” | Ocena |
|---|---|---|---|---|
| Filharmonia Krakowska (`filharmoniakrakow.pl`) | zwykły HTML `/public/program`, po 6 wydarzeń na stronę, ok. 36 stron | brak pliku (404); regulamin serwisu bez zakazu pobierania | filtr „Koncerty dla Dzieci / Koncert familijny” i cykle (Muzyczne boBasy, Bajki muzyką pisane, Przygody w Muzogrodzie, Nutka DaNutka…), ale na karcie wydarzenia jest tylko tytuł | **bezpieczne** |
| Sinfonietta Cracovia (`sinfonietta.pl`) | zwykły HTML `/kalendarium` | brak zakazów (tylko sitemap) | cykl „Sinfonietka” (np. „dla klas I–III”), 1 z 8 pozycji | **bezpieczne**, mało dzieci (regulamin strony to PDF, nie czytany) |
| Capella Cracoviensis (`capellacracoviensis.pl`) | zwykły HTML (agenda na stronie głównej) | zakaz tylko `/wp-admin/` | brak | **bezpieczne**, 0 dla dzieci |
| Opera Krakowska (`opera.krakow.pl`) | lista terminów ładowana skryptem (`/ajax/repertuar`) | brak pliku | filtr gatunku „Dla dzieci”, „Spektakl rodzinny (od 12 roku życia)” | **wątpliwe** (trzeba ustalić, czy da się użyć tego zapytania) |
| Opera Kameralna (`kok.art.pl`) | HTML `/repertuar/`, ale to głównie archiwum | zakaz tylko `/wp-admin/` | brak | bez bieżących wydarzeń |
| Centrum Muzyki (`centremusic.pl`) | HTML `/program` | **`Disallow: /` dla wszystkich** | — | **niemożliwe** |
| ICE Kraków (`icekrakow.pl`) | brak kalendarza w kodzie strony, tylko aktualności; bilety w zewnętrznych systemach | brak pliku | brak | **niemożliwe** (nie ma czego pobrać) |
| Auditorium Maximum UJ (`uj.edu.pl`) | — | — | — | nie sprawdzone (domena zablokowana) |
| `karnet.krakowculture.pl` (pomocniczo) | — | — | — | nie sprawdzone (domena zablokowana) |
| Studio Koncertowe Radia Kraków | — | — | — | nie sprawdzone (domena zablokowana) |

**Koncerty: 3 bezpieczne** (Filharmonia, Sinfonietta, Capella; tylko Filharmonia ma sporo dla dzieci), **1 wątpliwe** (Opera Krakowska), **2 niemożliwe** (Centrum Muzyki, ICE), **1 bez bieżących wydarzeń** (Opera Kameralna), **3 nie sprawdzone**.

## Które źródła dadzą najwięcej wydarzeń dla dzieci

Przybliżone, z pierwszej strony repertuaru każdego źródła:

1. **Ludowy**: 42 terminy na październik–grudzień w widoku, z czego 14 na scenie TIM (spektakle dla dzieci i młodzieży, m.in. „Lokomotywą przez świat”, „Trik Patryka”, „Calineczka”, „Pippi”, „Kulawa kaczka i ślepa kura”). Część poranków to rezerwacje grupowe.
2. **Kultureska**: 43 terminy (poranki w dni robocze 9:00–11:30, cena 40 zł), wszystko dla dzieci. Uwaga: to głównie spektakle dla grup szkolnych i przedszkolnych, rezerwacja mailowa, a zakończenie listy ma datę „26 lutego 2026” (prawdopodobnie błąd w roku, do sprawdzenia).
3. **Teatr Współczesny**: dziesięć dni października na pierwszej stronie, kilka terminów dla dzieci (np. „Dr Dolittle i jego zwierzęta”, od 4 lat) obok spektakli dla młodzieży.
4. **Filharmonia Krakowska**: na pierwszej stronie 6 koncertów, z czego 3 z cyklu „Muzyczne boBasy” (10 i 11.10). Źródło stałe i z długim wyprzedzeniem (koncertów do 180 dni naprzód nie brakuje).
5. **Teatr Szczęście**: 44 terminy do lutego 2027, z czego 4 w kategorii „Dla dzieci, młodzieży i rodziców” (10, 11 i 18.10).

Łaźnia Nowa i Sinfonietta wniosą po kilka pozycji w miesiącu, STU i Capella nic.

## Ile wymaga AI

**Obowiązkowo: 0.** Wszystkie „bezpieczne” źródła są zwykłym HTML-em, który da się odczytać zwykłym kodem.

Rozstrzyga się to inaczej niż „dla dzieci” w danych źródła, więc potrzebne są listy w `data/wyjatki.json` (`wymus`):
- Ludowy: tytuły z sceny TIM i tytuły dla dzieci z Dużej Sceny (np. „Calineczka”, „Pippi”, „Pyza na polskich dróżkach”). Wiek jest dopiero na stronie spektaklu.
- Filharmonia: lista nazw cykli dziecięcych (na karcie wydarzenia jest tylko tytuł cyklu).
- Łaźnia Nowa: pojedyncze tytuły dla dzieci.

**Opcjonalnie AI (2–3 źródła):** do rozpoznawania „dla dzieci?” po opisie na stronie spektaklu w Ludowym i Łaźni, gdyby listy ręczne okazały się za pracochłonne. Nie jest to potrzebne do startu.

## Szczegóły

### Teatr Współczesny
- **Repertuar:** https://teatrkrakow.pl/repertuar/, zwykły HTML. Każdy termin: data („5 października, poniedziałek”), scena („Przemysłowa 2, II piętro”), godziny, tytuł, oznaczenie („Dla dzieci”, „Dla młodzieży”), opis z wiekiem („od 4 lat”), status biletów.
- **robots.txt:** zakaz tylko `/wp-json/` i `/?rest_route=`.
- **Zakres:** pierwsza strona obejmuje 5–15 października. Dalszych miesięcy nie sprawdzano.
- **Uwaga:** część poranków to spektakle dla grup (godz. 9:00 i 11:00).

### Teatr Szczęście
- **Repertuar:** https://teatrszczescie.pl/repertuar/, zwykły HTML. Data, dzień tygodnia, kategoria, godzina, tytuł, link „Kup bilet” do ekobilet.pl (linki z parametrami śledzącymi trzeba oczyścić).
- **Zakres:** do 27 lutego 2027.
- **Filtr dla dzieci:** kategoria „Dla dzieci, młodzieży i rodziców”.

### Kultureska
- **Repertuar:** https://kultureska.pl/repertuar to ramka z https://kultureska.pl/rep/view_table.php. Tabela: data, godzina, tytuł, status rezerwacji („Brak wolnych miejsc”), cena (40 zł/os.). Jest też PDF z repertuarem.
- **robots.txt:** zakazane tylko katalogi systemowe, `/rep/` nie.
- **Uwaga:** spektakle w dni robocze rano, głównie dla grup; rezerwacja mailowa lub telefoniczna, nie ma linku do biletów.

### Ludowy
- **Repertuar:** https://ludowy.pl/repertuar/, zwykły HTML (miesiące: październik, listopad, grudzień). Data, dzień, godzina, scena (Duża Scena, Scena Pod Ratuszem, TIM/Scena Warsztatowa), tytuł, link „Kup bilet”, informacja „Rezerwacja grupowa” dla porannych spektakli.
- **robots.txt:** nie udało się pobrać (zrywane połączenie). Przed budową trzeba to potwierdzić.
- **Wiek:** na liście brak. Jest na stronie spektaklu („Czytaj więcej”), co wymagałoby dodatkowego zapytania na tytuł albo listy `wymus`.

### Łaźnia Nowa
- **Repertuar:** https://laznianowa.pl/wydarzenia, HTML. Terminy w postaci „Nadchodzące: 19 października 2026, 19:00”.
- **Dla dzieci:** tylko pojedyncze wydarzenia (np. przegląd „Mała Boska Komedia 2026”: spektakle dla dzieci i młodzieży). Regulamin: strona `/regulamin` (nie czytana).

### Scena STU
- **Repertuar:** https://scenastu.pl/calendar/, HTML. Wszystkie spektakle dla dorosłych (np. „Hamlet”, „Nasze żony”). Do pominięcia.

### Teatr Magic
- Brak publicznego repertuaru. Strona opisuje 5 bajek (3–9 lat) do zamówienia przez przedszkola i szkoły oraz cennik. Nie ma wydarzeń z datami.

### Teatr w Krakowie / Słowackiego (`teatrwkrakowie.pl`)
- Strona repertuaru (`/repertuar`) odpowiada, ale terminów nie ma w kodzie (ładowane skryptem). Nie badano, jak. Pole „Spektakle dostępne” sugeruje filtr. Do osobnego rozpoznania.

### Bagatela, KTO, Stary
- W `robots.txt` jest `Disallow: /` dla wszystkich robotów (w Bagateli i KTO to blok narzędzia Yoast, może pozostałość po budowie strony, ale tego nie mogę rozstrzygnąć). Zgodnie z zasadą nie omijamy robots, więc nie pobieramy. KTO ma publiczne API kalendarza i iCal, które technicznie by działały, ale robots to wyklucza.
- **Co można zrobić:** poprosić teatry o wyłączenie bloku albo o zgodę.

### Filharmonia Krakowska
- **Repertuar:** https://filharmoniakrakow.pl/public/program. Karta wydarzenia: dzień, miesiąc, godzina, tytuł (np. „Muzyczne boBasy”), podtytuł (np. „Kartonowy plac budowy”), wykonawcy, „KUP BILET”, „SZCZEGÓŁY”. Pierwsza strona to 6 wydarzeń, dalej paginacja (`?type=pagination`, 36 stron).
- **Filtr „dla dzieci”:** w formularzu jest rodzaj „Koncerty dla Dzieci / Koncert familijny” i abonament „D – koncerty dla dzieci”, ale zapytanie z filtrem (`fType`) zwróciło błąd 500, więc trzeba iść po stronach i filtrować po nazwach cykli.
- **robots.txt:** brak (404). **Regulamin korzystania z serwisu:** przeczytany, dotyczy cookies, zakazu pobierania nie ma.

### Sinfonietta Cracovia
- **Repertuar:** https://sinfonietta.pl/kalendarium, zwykły HTML (data, godzina, miejsce, tytuł, cykl, „Kup bilet”: Bilety24 / Filharmonia / Unsound / KBF). Pozycja „Od dźwięku do dzieła – dla klas I–III” (22.10, 10:00, Manggha, cykl Sinfonietka) to koncert edukacyjny.
- **Regulamin strony:** PDF (nie czytany). Przed budową sprawdzić.

### Capella Cracoviensis
- **Agenda:** na stronie głównej (data, tytuł, miejsce, godzina). Nie ma żadnych oznaczeń dla dzieci. Do pominięcia.

### Opera Krakowska
- **Repertuar:** https://opera.krakow.pl/repertuar, w kodzie strony jest tylko filtr (gatunek „Dla dzieci”, „Spektakl rodzinny (od 12 roku życia)”, miesiące) i adres `/ajax/repertuar`, z którego skrypt ładuje terminy. Nie wywoływano go, żeby nie zgadywać parametrów.
- **robots.txt:** brak.

### Opera Kameralna, ICE, Centrum Muzyki
- **Kameralna:** https://kok.art.pl/repertuar/ to głównie archiwum wydarzeń. Bieżących terminów dla dzieci nie ma.
- **ICE:** tylko aktualności (m.in. odwołane koncerty). Terminy i bilety są w zewnętrznych systemach.
- **Centrum Muzyki:** robots zabrania pobierania.

## Co dalej

1. Odblokować domeny z listy „nie sprawdzone” (albo dać środowisku szerszy dostęp do sieci) i dokończyć: Groteska, Variété, Praska 52, Słowackiego, Auditorium Maximum, Karnet.
2. Dwa teatry z grupy „niemożliwe” z zablokowaną całą stroną w robots (Bagatela, KTO) i Stary mają ciekawy repertuar dla dzieci. Warto zapytać o zgodę.
3. Dla etapu 2 najpierw: Współczesny, Szczęście, Ludowy, Kultureska, Filharmonia.
