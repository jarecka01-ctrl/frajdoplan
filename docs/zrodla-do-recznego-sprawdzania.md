# Źródła wydarzeń, których nie da się wykorzystać w skrypcie: lista i harmonogram ręcznego sprawdzania

Stan na 7 października 2026. Lista powstała z raportów rozpoznania (`docs/rozpoznanie-*.md`), z modułów w `scripts/repertuar/zrodla/` i z ostatniego przebiegu automatu. **Ta sama lista jako tabela do arkusza: `data/zrodla-reczne.csv`** (można ją wkleić do Arkusza Google i dopisywać w kolumnie „ostatnio_sprawdzone”).

## Co to znaczy „nie da się wykorzystać w skrypcie”
Powody są cztery, i od nich zależy, co możesz zrobić:
- **A. Zakaz:** serwis zabrania automatycznego pobierania (`robots.txt` albo zasada w projekcie). Czytasz je sama jak zwykły użytkownik. Skrypt ich nie ruszy bez zgody właściciela.
- **B. Blokada techniczna lub wątpliwa zgoda:** serwis odrzuca automaty (403, Cloudflare, błąd 500) albo regulamin jest niejasny. Nie omijamy zabezpieczeń.
- **C. Brak danych w formie dla skryptu:** brak kalendarza, brak oznaczenia „dla dzieci” albo dane tylko w aplikacji. Wymagałoby AI albo ręcznej listy.
- **D. Możliwe w przyszłości:** nic nie zabrania, ale nikt jeszcze tego nie zbudował albo nie zbadał. To najlepsi kandydaci, żeby przenieść je z ręcznego sprawdzania do automatu.

Źródła, które skrypt już obsługuje (kina Kijów, Mikro, Agrafka, Pod Baranami, Paradox, Sfinks; teatry Ludowy, Współczesny, Szczęście, Kultureska, Groteska, Figurki, Słowackiego; Filharmonia, Sinfonietta, Ośrodek Kultury Norwida, Centrum Kultury Podgórza, Biblioteka Kraków, ZIS, TAURON Arena, ICE, Klub Studio, Variété, KBF Bilety, Krakowskie Forum Kultury), **nie wymagają ręcznej pracy**: wystarczy przegląd wyniku (wiersz „Kontrola automatu” niżej). Ich lista i status są w `CLAUDE.md`. Z automatu wyłączone są dwa moduły: Opera Krakowska (403 z serwerów GitHuba) i krakow.pl.

## Rytm: ile to czasu
Tylko „Tak” (plan minimalny) to ok. **30 min tygodniowo + 115 min miesięcznie**. Wszystko razem (plan pełny) to ok. **30 min tygodniowo + 300 min miesięcznie + 50 min kwartalnie + sezonowo (135 min przy trzech sezonowych przeglądach w roku)**. Zacznij od planu minimalnego, a resztę dokładaj, gdy zobaczysz, że czytelnicy tego potrzebują.

| Rytm | Kiedy | Najbliższe terminy |
|---|---|---|
| **Co tydzień** | środa (po wtorkowym przebiegu automatu, który chodzi wt. i czw. wieczorem oraz w sob. rano) | 14.10, 21.10, 28.10, 4.11, 11.11, 18.11… |
| **Raz w miesiącu** | 20. dnia miesiąca, żeby zaplanować następny miesiąc (gdy wypada w weekend: piątek przed) | 20.10 (wt.), 20.11 (pt.), 18.12 (pt., bo 20.12 to niedziela), 20.01.2027 (śr.), 19.02.2027 (pt.) |
| **Co kwartał** | pierwszy poniedziałek kwartału (ponowne sprawdzenie zablokowanych, rzadkich i niskich źródeł) | 4.01.2027, 5.04.2027, 5.07.2027, 4.10.2027 |
| **Sezonowo** | 6–7 tygodni przed sezonem | 4.11.2026 (Mikołajki i święta), 18.11.2026 (ferie zimowe: daty z kuratorium), 5.04.2027 (wiosna i lato) |

**Uwaga:** częstotliwości to propozycje. Raporty nie mówią, w który dzień dane instytucje publikują nowy miesiąc (kina robią to zwykle we wtorek–środę przed piątkiem). **Przez pierwsze dwa miesiące notuj w kolumnie „ostatnio_sprawdzone”, kiedy dane źródło ma już następny miesiąc, i przesuń termin.**

## Zasada pracy (ważne)
1. Zanim wpiszesz wydarzenie, **zobacz na stronie Frajdoplanu (kalendarz), czy już go nie ma** (automat mógł je pobrać z innego źródła). Wydarzenia wpisane ręcznie do arkusza nie są łączone z automatycznymi.
2. Wpisuj **tylko fakty**: nazwa, data, godzina, miejsce, wiek, cena, link do strony wydarzenia lub biletów. **Nie kopiuj opisów ani plakatów.**
3. Kolumny arkusza „Wydarzenia”: `id`, `nazwa`, `typ`, `data_regula` (`2026-10-03`, `2026-10-01 do 2026-10-05`, `co sobotę`, `codziennie`), `godzina`, `powiazane_miejsce_id` (z arkusza „Miejsca”), `grupa_wiekowa`, `cena`, `link_biletow`, `zrodlo` (np. `reczne-bagatela`), `status` (puste, `aktywne` albo `zatwierdzone` = widoczne), `kategoria` (koncert, spektakl, warsztaty, pokaz, czytanie, wystawa, jarmark, festyn, sport, spacer, planszowki, inne), `miejsce`, `wyrozniony` (`tak` = baner), `obrazek`, `opis`.
4. Półkolonie i zajęcia stałe nie są wydarzeniami: dopisuj je w arkuszu „Miejsca” (sekcje `polkolonie` i `zajecia`). Gotowy zestaw zajęć stałych Krakowskiego Forum Kultury jest w `data/kfk-zajecia.csv`.
5. Źródło, które pada albo zmienia układ, to sprawa automatu. Zobacz wiersz „Kontrola automatu”.

## Lista

### F. Kontrola automatu (nie źródło, ale stały obowiązek)

| Źródło | Dlaczego ręcznie | Czego szukać | Jak często i kiedy | Następny raz | Czas | Warto? |
|---|---|---|---|---|---|---|
| **Wynik automatu: GitHub → Actions → „Repertuar kin i wydarzeń” → Summary**<br>https://github.com/jarecka01-ctrl/frajdoplan/actions | to nie źródło, tylko przegląd tego, co zrobił skrypt | źródło z błędem (czerwony przebieg), lista „Do weryfikacji” (tytuły do `wymus` albo `ukryj` w data/wyjatki.json), sekcja „Miejsca bez place_id” | co tydzień: środa, po wtorkowym przebiegu automatu | 2026-10-14 | 10 min | Tak |
| | *Automat chodzi wt. i czw. wieczorem oraz w sob. rano. Rób przegląd w środę, żeby widzieć wtorkowy przebieg.* | | | | | |

### A. Zakaz pobierania (robots.txt albo regulamin)

| Źródło | Dlaczego ręcznie | Czego szukać | Jak często i kiedy | Następny raz | Czas | Warto? |
|---|---|---|---|---|---|---|
| **Teatr Bagatela**<br>https://bagatela.pl | robots.txt: Disallow: / dla wszystkich; skrypt nie pobiera | spektakle dla dzieci i rodzin w repertuarze miesiąca | raz w miesiącu: 20. dnia miesiąca (planowanie następnego miesiąca) | 2026-10-20 | 15 min | Tak |
| | *Repertuar dla dzieci ocenione jako ciekawe. Do skryptu tylko za zgodą teatru.* | | | | | |
| **Teatr KTO**<br>https://teatrkto.pl | robots.txt: Disallow: / dla wszystkich (choć ma publiczne API i iCal) | dział „Dla dzieci”; terminy | raz w miesiącu: 20. dnia miesiąca (planowanie następnego miesiąca) | 2026-10-20 | 15 min | Tak |
| | *Część wydarzeń KTO jest już w KBF Bilety (np. SP4Kids); przed wpisem sprawdź kalendarz na stronie, żeby nie dublować. KTO jest w arkuszu „Miejsca”.* | | | | | |
| **Teatr Stary**<br>https://stary.pl | robots.txt: Disallow: / dla wszystkich | spektakle rodzinne / dla młodzieży; bilety w bilety.stary.pl | raz w miesiącu: 20. dnia miesiąca (planowanie następnego miesiąca) | 2026-10-20 | 10 min | Raczej tak |
| | *Repertuar głównie dla dorosłych; szukaj oznaczeń od 6–12 lat.* | | | | | |
| **Centrum Muzyki (centremusic.pl)**<br>https://centremusic.pl/program | robots.txt: Disallow: / dla wszystkich | koncerty rodzinne / dla dzieci | co kwartał: pierwszy poniedziałek kwartału | 2027-01-04 | 10 min | Niski |
| | *Głównie dorośli.* | | | | | |
| **Auditorium Maximum UJ i cep.uj.edu.pl**<br>https://uj.edu.pl | robots.txt: Disallow: / dla wszystkich | koncerty i wydarzenia rodzinne | co kwartał: pierwszy poniedziałek kwartału | 2027-01-04 | 10 min | Niski |
| | *Rzadko coś dla dzieci.* | | | | | |
| **kupbilecik.pl**<br>https://kupbilecik.pl | zakaz automatycznego pobierania (zasada w projekcie) | nie szukaj tu osobno; to sprzedawca biletów | co kwartał: pierwszy poniedziałek kwartału | 2027-01-04 | 5 min | Niski |
| | *Wydarzenia, które tu zobaczysz, sprawdzaj u organizatora i dopiero stamtąd wpisuj.* | | | | | |
| **biletomat.pl i serwisy KICKET**<br>https://biletomat.pl | czekamy na odpowiedź w sprawie współpracy (zasada w projekcie) | nie szukaj tu osobno; to sprzedawca biletów | co kwartał: pierwszy poniedziałek kwartału | 2027-01-04 | 5 min | Niski |
| | *Teatr Współczesny sprzedaje przez biletomat, ale terminy mamy już z jego strony.* | | | | | |
| **Facebook i Instagram instytucji**<br>https://facebook.com | zakaz pobierania w projekcie | 3 domy kultury, które mają ofertę tylko na Facebooku | raz w miesiącu: 20. dnia miesiąca (planowanie następnego miesiąca) | 2026-10-20 | 20 min | Raczej tak |
| | *Lista tych 3 wierszy jest w arkuszu „Miejsca” (domy kultury tylko na Facebooku). Czytasz ręcznie jak zwykły użytkownik.* | | | | | |

### B. Blokada techniczna lub wątpliwa zgoda

| Źródło | Dlaczego ręcznie | Czego szukać | Jak często i kiedy | Następny raz | Czas | Warto? |
|---|---|---|---|---|---|---|
| **Cinema City (Bonarka, Kazimierz, Zakopianka)**<br>https://www.cinema-city.pl | regulamin: „wszelkie inne dane” nie powinny być powielane bez zgody; skrypt nie pobiera (w kafelku są stałe linki) | czy linki w kafelku „Dziś w kinach” działają; odpowiedź kina na prośbę o zgodę | raz w miesiącu: 20. dnia miesiąca (planowanie następnego miesiąca) | 2026-10-20 | 5 min | Tak |
| | *Ok. 286 seansów dla dzieci tygodniowo: NIE wpisuj ich ręcznie. Najlepsze rozwiązanie to zgoda kina na pobieranie godzin (to dla nich darmowa reklama). Nowy tydzień kin zaczyna się w piątek.* | | | | | |
| **Multikino Kraków**<br>https://multikino.pl/repertuar/krakow | zabezpieczenie Cloudflare (403); nie omijamy | czy link w kafelku „Dziś w kinach” działa | raz w miesiącu: 20. dnia miesiąca (planowanie następnego miesiąca) | 2026-10-20 | 5 min | Raczej tak |
| | *Jak wyżej: nie wpisuj seansów.* | | | | | |
| **Opera Krakowska**<br>https://opera.krakow.pl/repertuar | HTTP 403 z serwerów GitHub Actions; moduł wyłączony (`wlaczone: false`) | rodzaje „Dla dzieci” i „Spektakl rodzinny”; warsztaty „Duszek w Operze” | raz w miesiącu: 20. dnia miesiąca (planowanie następnego miesiąca) | 2026-10-20 | 10 min | Tak |
| | *Jedna z największych pozycji świątecznych: „Nowa Opowieść Wigilijna” (listopad–grudzień). Co sezon sprawdź też w październiku i listopadzie.* | | | | | |
| **Opera Kameralna**<br>https://kok.art.pl/repertuar | głównie archiwum, brak bieżących terminów dla dzieci | bajki / spektakle rodzinne | co kwartał: pierwszy poniedziałek kwartału | 2027-01-04 | 5 min | Niski |
| **Bunkier Sztuki**<br>https://bunkier.art.pl | HTTP 403 (blokada ruchu automatów) | warsztaty rodzinne, niedziele | raz w miesiącu: 20. dnia miesiąca (planowanie następnego miesiąca) | 2026-10-20 | 10 min | Raczej tak |
| **Nowohuckie Centrum Kultury (12 miejsc)**<br>https://krakownh.pl | robots.txt zwraca błąd 500, więc nie pobieramy | kluby NCK: zajęcia i imprezy dla dzieci | raz w miesiącu: 20. dnia miesiąca (planowanie następnego miesiąca) | 2026-10-20 | 20 min | Tak |
| | *Kwartalnie sprawdzamy, czy robots.txt się naprawił (wtedy do skryptu).* | | | | | |
| **Młodzieżowe domy kultury (10 stron)**<br>https://mdk.krakow.pl | część odmawia (mdk-dh 403) lub jest niedostępna; reszta niezbadana | oferta i wydarzenia dla dzieci | raz w miesiącu: 20. dnia miesiąca (planowanie następnego miesiąca) | 2026-10-20 | 30 min | Raczej tak |
| | *Pozwalają: mdk.krakow.pl, mdkkorczak.pl, mdkgrunwaldzka5.pl, mdkna102.krakow.pl, cmjordan.krakow.pl. mdkna102 ma kalendarz Tribe Events (kandydat do automatu).* | | | | | |

### C. Brak użytecznych danych dla skryptu

| Źródło | Dlaczego ręcznie | Czego szukać | Jak często i kiedy | Następny raz | Czas | Warto? |
|---|---|---|---|---|---|---|
| **eBilet (rodzina → dla dzieci)**<br>https://www.ebilet.pl/rodzina/miasto/krakow | regulamin szary (zakaz botów do zakupu), trasy ogólnopolskie z listą miast | trasy dla dzieci w Krakowie (np. Teatr Baniek Mydlanych, Szaleni Naukowcy) | raz w miesiącu: 20. dnia miesiąca (planowanie następnego miesiąca) | 2026-10-20 | 15 min | Tak |
| | *Kategorie „Dla dzieci / Teatr dla dzieci / Widowiska dla dzieci”. Sprawdzaj też przed sezonem. Do rozważenia: prośba o feed partnerski.* | | | | | |
| **Eventim**<br>https://www.eventim.pl | nie sprawdzony (nie udało się pobrać robots.txt) | widowiska rodzinne, trasy (Disney, widowiska na lodzie) | raz w miesiącu: 20. dnia miesiąca (planowanie następnego miesiąca) | 2026-10-20 | 10 min | Raczej tak |
| **Going**<br>https://going.pl | brak publicznej listy (tylko aplikacja) | nie szukaj | co kwartał: pierwszy poniedziałek kwartału | 2027-01-04 | 5 min | Niski |
| | *Możesz pominąć.* | | | | | |
| **Teatr Magic**<br>https://teatrmagic.pl | brak kalendarza, tylko oferta bajek dla przedszkoli i szkół | czy pojawiły się terminy otwarte | co kwartał: pierwszy poniedziałek kwartału | 2027-01-04 | 5 min | Niski |
| **Kijów.Centrum: wydarzenia inne niż seanse**<br>https://kijow.pl/wydarzenia/ | wpisy blogowe bez stałych pól (data w tytule); wymagałoby AI | poranki i wydarzenia dla dzieci poza seansami | raz w miesiącu: 20. dnia miesiąca (planowanie następnego miesiąca) | 2026-10-20 | 10 min | Niski |
| | *Dotąd nic dla dzieci tam nie było.* | | | | | |
| **Dworek Białoprądnicki (8 klubów)**<br>https://dworek.eu | brak oznaczenia „dla dzieci”, wymagałoby AI lub ręcznej listy | warsztaty, koncerty, zajęcia dla dzieci w klubach | raz w miesiącu: 20. dnia miesiąca (planowanie następnego miesiąca) | 2026-10-20 | 20 min | Tak |
| **Muzeum Inżynierii i Techniki (MIT)**<br>https://mit.krakow.pl/wydarzenia/ | brak oznaczenia wieku, wymagałoby AI | warsztaty rodzinne, zajęcia dla dzieci | raz w miesiącu: 20. dnia miesiąca (planowanie następnego miesiąca) | 2026-10-20 | 10 min | Raczej tak |

### D. Możliwe w przyszłości, dziś nie zbudowane

| Źródło | Dlaczego ręcznie | Czego szukać | Jak często i kiedy | Następny raz | Czas | Warto? |
|---|---|---|---|---|---|---|
| **Muzeum Narodowe w Krakowie (MNK)**<br>https://mnk.pl/wydarzenia/ | robots pozwala, ale moduł niezbudowany (filtr „Rodzice i dzieci”) | warsztaty rodzinne, oprowadzania dla rodzin, weekendy | co tydzień: środa, po wtorkowym przebiegu automatu | 2026-10-14 | 10 min | Tak |
| | *Kandydat do automatu (razem z kafelkiem „Wystawy dla dzieci”).* | | | | | |
| **Muzeum Krakowa**<br>https://muzeumkrakowa.pl/kalendarium | robots pozwala, moduł niezbudowany (filtr „spotkanie dla dzieci”, „warsztaty”) | warsztaty i spotkania dla dzieci (14 oddziałów) | co tydzień: środa, po wtorkowym przebiegu automatu | 2026-10-14 | 10 min | Tak |
| | *Kandydat do automatu.* | | | | | |
| **Pozostałe muzea (ok. 35: Cogiteon, MOCAK, Cricoteka, Manggha, Muzeum Lotnictwa, Muzeum AK, Muzeum Archeologiczne, Muzeum Farmacji, MuFo, Muzeum Witrażu, Apilandia, Wawel, Etnograficzne i inne)** | niezbadane szczegółowo | warsztaty rodzinne, zajęcia dla dzieci | raz w miesiącu: 20. dnia miesiąca (planowanie następnego miesiąca) | 2026-10-20 | 40 min | Raczej tak |
| | *Rób rundę rotacyjnie: co miesiąc inne 8–10 muzeów, żeby w kwartale przejść wszystkie.* | | | | | |
| **Pojedyncze domy kultury (DK Nowy Bieżanów, Zacheta Nowy Prokocim, MCK, Krakowiacy, Calasanz)**<br>https://dknowybiezanow.pl | niezbadane szczegółowo; dknowybiezanow.pl ma schema.org Event (łatwy do automatu) | imprezy i zajęcia dla dzieci | raz w miesiącu: 20. dnia miesiąca (planowanie następnego miesiąca) | 2026-10-20 | 20 min | Raczej tak |
| | *Krakowiacy: krakowiacy.art.pl; Zacheta: zacheta.nowyprokocim.pl; MCK: mck.krakow.pl.* | | | | | |
| **Karnet (karnet.krakowculture.pl)**<br>https://karnet.krakowculture.pl | domena nie była dostępna podczas rozpoznania | miejska agenda: część „dla dzieci” | raz w miesiącu: 20. dnia miesiąca (planowanie następnego miesiąca) | 2026-10-20 | 15 min | Tak |
| | *Dobry „przegląd z lotu ptaka” przed zaplanowaniem miesiąca.* | | | | | |
| **MICET, Muzeum Kościuszkowskie (kopieckosciuszki.pl)**<br>https://micet.pl | niedostępne podczas rozpoznania | warsztaty i imprezy rodzinne | raz w miesiącu: 20. dnia miesiąca (planowanie następnego miesiąca) | 2026-10-20 | 10 min | Raczej tak |
| **Łaźnia Nowa**<br>https://laznianowa.pl/wydarzenia | robots pozwala, ale prawie nic dla dzieci (nie zbudowano) | przegląd „Mała Boska Komedia” i pojedyncze spektakle | co kwartał: pierwszy poniedziałek kwartału | 2027-01-04 | 5 min | Niski |
| **krakow.pl „Kraków dla dzieci”**<br>https://www.krakow.pl | moduł gotowy, ale wyłączony (powtórki innych źródeł, brak godzin i miejsc) | duże imprezy miejskie dla rodzin (np. plenerowe) | raz w miesiącu: 20. dnia miesiąca (planowanie następnego miesiąca) | 2026-10-20 | 10 min | Raczej tak |
| | *Przeglądaj pod kątem dużych imprez; drobnych nie wpisuj.* | | | | | |

### E. Sezonowe (nie jedno źródło)

| Źródło | Dlaczego ręcznie | Czego szukać | Jak często i kiedy | Następny raz | Czas | Warto? |
|---|---|---|---|---|---|---|
| **Ferie zimowe i wakacje** | oferty feryjne i półkolonie ogłaszane z wyprzedzeniem; nie ma jednego źródła | daty ferii, półkolonie, warsztaty feryjne | sezonowo: 6–7 tygodni przed feriami lub wakacjami | 2026-11-18 | 60 min | Tak |
| | *Daty ferii sprawdź na stronie kuratorium. Półkolonie dodawaj do arkusza „Miejsca”, nie „Wydarzenia”.* | | | | | |
| **Mikołajki, jarmark bożonarodzeniowy, Boże Narodzenie** | imprezy świąteczne ogłaszane od listopada | Mikołajki 6 grudnia, jarmark, spektakle świąteczne, koncerty | sezonowo: ok. 5 tygodni przed Mikołajkami (6 grudnia) | 2026-11-04 | 45 min | Tak |
| | *Pierwszy termin: 4 listopada.* | | | | | |
| **Duże imprezy plenerowe (Dzień Dziecka, Noc Muzeów, piknik, festyny)** | daty i programy ogłaszane z wyprzedzeniem | imprezy rodzinne (festyn, jarmark, pokaz) | sezonowo: 6–7 tygodni przed wiosną i latem | 2027-04-05 | 30 min | Raczej tak |
| | *Sprawdzaj ok. 6 tygodni przed wiosną i latem.* | | | | | |

## Decyzje, które zmniejszą ręczną pracę (kolejność wg zysku)
1. **Cinema City (ok. 286 seansów dla dzieci tygodniowo):** napisać do kina z prośbą o zgodę na pobieranie godzin seansów z linkiem do zakupu biletu. Przy zgodzie moduł jest gotowy do zbudowania, a ręczna praca spada do zera.
2. **eBilet:** prośba o feed partnerski. To najlepsze źródło „widowisk dla dzieci” (trasy, Disney), ale dziś wątpliwe.
3. **Teatry Bagatela, KTO i Stary:** poprosić o wyłączenie bloku `Disallow: /` albo o zgodę. KTO ma publiczne API i iCal, więc technicznie wystarczy zgoda.
4. **Opera Krakowska:** prośba o zgodę lub odblokowanie serwerów GitHuba (moduł jest gotowy, wystarczy usunąć `wlaczone: false`).
5. **Muzeum Narodowe (MNK) i Muzeum Krakowa:** zbudować moduły (robots pozwala) razem z kafelkiem „Wystawy dla dzieci”.
6. **Małe źródła z gotowymi znacznikami:** `dknowybiezanow.pl` (schema.org Event) i `mdkna102.krakow.pl` (kalendarz Tribe Events).
7. **Kijów.Centrum (wydarzenia), Dworek Białoprądnicki, MIT:** automatyzacja wymaga AI (Claude API) albo ręcznej listy tytułów. Decyzja o koszcie po Twojej stronie.
8. **Nowohuckie Centrum Kultury:** co kwartał sprawdź, czy `krakownh.pl/robots.txt` odpowiada (dziś błąd 500). Jeśli tak, można je dodać do automatu (12 miejsc).

## Dane uzupełniające
- **Miejsca bez dopasowania** (wydarzenia z automatu bez powiązanego miejsca): `docs/miejsca-bez-dopasowania.md`. Do arkusza „Miejsca” warto dopisać Piwnicę pod Baranami, TAURON Arenę, ZIS, Strefę Sokolską i Teatr Praska 52 (bez nich wydarzenia nie mają powiązanego miejsca). Przed ręcznym wpisem wydarzeń z Bagateli, Starego i innych sprawdź, czy dany teatr jest w „Miejsca”, i wklej jego `place_id` do `powiazane_miejsce_id`.
- **Kluby Krakowskiego Forum Kultury:** `data/kfk-kluby.csv`. **Zajęcia stałe:** `data/kfk-zajecia.csv` (odświeżysz poleceniem `node scripts/repertuar/kfk-zajecia.mjs`).
