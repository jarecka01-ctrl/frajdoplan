# Rozpoznanie źródeł repertuaru kin (etap 1)

Sprawdzono 2 października 2026 (piątek). Tego samego dnia, po odblokowaniu domen, dosprawdzono Kijów i Mikro. Zapytania szły po kolei, nie częściej niż raz na sekundę. Nie omijano żadnych zabezpieczeń ani logowania. Nic nie zostało zapisane w serwisie, to tylko rozpoznanie.

**Ograniczenie tej sesji:** sieć środowiska przepuszcza tylko część domen. Po dodaniu `kupbilet.kijow.pl`, `bilety.kinomikro.pl` i `okn.edu.pl` dało się sprawdzić Kijów i Mikro. Nadal zablokowane są `kinosfinks.okn.edu.pl` (wpis `okn.edu.pl` nie obejmuje poddomen), `kmk.systembiletowy.pl`, `bilety.kinoagrafka.pl`, `bilety.kinoparadox.pl` i `kijowcentrum.pl`. Kina, których nie dało się sprawdzić, oznaczono jako „nie sprawdzone” zamiast zgadywać. Nie było też dostępu do arkusza „Miejsca”, więc pod uwagę wzięto tylko kina wymienione w zadaniu.

## Podsumowanie

| Kino | Źródło danych | robots.txt | Regulamin strony | Ocena |
|---|---|---|---|---|
| Pod Baranami | zwykły HTML `repertuar.php` | wszystko dozwolone | nie znaleziono | **bezpieczne** |
| Agrafka | zwykły HTML `rep.php` | brak pliku (= brak zakazów) | brak (jest tylko regulamin konkursu z 2018) | **bezpieczne** |
| Paradox | zwykły HTML `/repertuar/` + strona filmu | dozwolone (poza `/wp-admin/`) | brak (jest tylko polityka prywatności) | **bezpieczne** |
| Kijów.Centrum | HTML + lista seansów w kodzie strony (`RepertoireEvents`) na `kupbilet.kijow.pl` | `kupbilet`: brak pliku; `kijow.pl`: wszystko dozwolone | tylko regulamin sprzedaży biletów, bez zakazu | **bezpieczne** |
| Mikro (Lea, Bronowice) | publiczny JSON `bilety.kinomikro.pl/service.php/repertoire/list.json` | reguły wykomentowane (brak zakazów) | nie znaleziono | **bezpieczne** |
| Cinema City (Bonarka, Kazimierz, Zakopianka) | publiczne JSON API, z którego korzysta sama strona | dozwolone (zakaz tylko `/booking`) | ogólny zapis: treści i „wszelkie inne dane” nie powinny być powielane bez zgody | **wątpliwe** |
| Multikino | — | dozwolone | — | **niemożliwe** (zabezpieczenie Cloudflare) |
| Sfinks | `kinosfinks.okn.edu.pl` | `okn.edu.pl`: repertuaru nie dotyczy | — | nie sprawdzone (poddomena zablokowana) |

**Bezpieczne: 5 kin (Pod Baranami, Agrafka, Paradox, Kijów.Centrum, Mikro).** Cinema City to technicznie najłatwiejsze źródło i ma najwięcej seansów dla dzieci, ale jego regulamin trzeba rozstrzygnąć.

## Szczegóły

### Pod Baranami
- **Repertuar:** https://www.kinopodbaranami.pl/repertuar.php, zwykły HTML w kodowaniu ISO-8859-2. Każdy seans ma w kodzie strony wywołanie z tytułem, datą, godziną i salą (np. `'Bolek i Lolek…','2026','10','04','11:00',…,'Sala Czerwona'`).
- **robots.txt:** `Allow: /` dla wszystkich (zakaz tylko dla semrushbot).
- **Regulamin:** na stronie nie ma regulaminu korzystania z serwisu ani zakazu pobierania.
- **Pola:** tytuł, data, godzina, sala (także „seans w MOS” w innym obiekcie), link do biletu (`rezerwacja_start.php?event_id=…`), cykl (np. „Baranki Dzieciom”). Wersja tylko czasem w tytule (np. `[PL&EN SUB]`). Kategorii wiekowej i gatunku na liście nie ma.
- **Filtr dla dzieci:** po cyklu „Baranki Dzieciom” (pokazy bajek z warsztatami, niedziele 11:00). Ogólna reguła „wiek 0–7 / animacja” tu nie zadziała, potrzebny jest wyjątek dla tego cyklu.
- **Zakres:** pełny tydzień piątek–czwartek (2–8.10: 17–23 seanse dziennie), dalej pojedyncze wydarzenia specjalne aż do grudnia.
- **Dla dzieci w najbliższym tygodniu:** 1 seans (4.10, „Bolek i Lolek – zestaw IV”). Kolejne niedziele są już zapowiedziane: 11, 18 i 25.10.

### Agrafka
- **Repertuar:** http://kinoagrafka.pl/rep.php, zwykły HTML w UTF-8, tylko przez http (https zrywa połączenie). Na stronie zostały w komentarzach stare repertuary, przy odczycie trzeba je pominąć.
- **robots.txt:** `www.kinoagrafka.pl/robots.txt` daje 404, czyli brak zakazów.
- **Regulamin:** jedyny regulamin na stronie dotyczy konkursu z 2018 r. Regulaminu strony brak.
- **Pola:** tytuł (polski | oryginalny), data, dzień tygodnia, godzina, reżyser, kraj, rok, czas trwania, wersja (dubbing / lektor / napisy) i gatunek (animacja / aktorski), opisane przy części filmów (zwłaszcza festiwalowych), link „Kup bilet” do `bilety.kinoagrafka.pl`. Sali nie ma (jedna sala). Kategorii wiekowej brak.
- **Filtr dla dzieci:** słowa „animacja”, „dla najmłodszych”, cykl „Czytamy i oglądamy” i festiwal „Młode Horyzonty”.
- **Zakres:** tydzień piątek–czwartek (2–8.10).
- **Dla dzieci w najbliższym tygodniu:** 4 seanse (3–4.10, festiwal Młode Horyzonty, m.in. „Dzieci z Bullerbyn”, „Vincent. Legenda oceanu”, „Niesamowite przygody skarpetek 4”).

### Paradox
- **Repertuar:** https://kinoparadox.pl/repertuar/, zwykły HTML (WordPress). Każdy seans ma `data-date`, godzinę, tytuł, reżysera, kraj, rok, czas i link do biletu.
- **robots.txt:** zakaz tylko `/wp-admin/`.
- **Regulamin:** jest tylko polityka prywatności, zakazu pobierania brak.
- **Pola:** tytuł, data, godzina, link do biletu (`bilety.kinoparadox.pl/…repertoire.html?id=…`). Gatunek i wersja językowa są na stronie filmu (`/naekranie/<film>/`), więc trzeba wykonać jedno dodatkowe zapytanie na każdy film. Sali i kategorii wiekowej brak.
- **Zakres:** tydzień piątek–czwartek (2–8.10, 2–4 seanse dziennie) i pojedyncze wydarzenia do listopada.
- **Dla dzieci w najbliższym tygodniu:** 0 (repertuar studyjny dla dorosłych). Źródło łatwe, ale wnosi mało.

### Cinema City (Bonarka 1090, Kazimierz 1076, Zakopianka 1064)
- **Repertuar:** publiczne JSON API, z którego korzysta strona kina:
  - dni z seansami: `/pl/data-api-service/v1/quickbook/10103/dates/in-cinema/<id>/until/<data>`
  - seanse dnia: `/pl/data-api-service/v1/quickbook/10103/film-events/in-cinema/<id>/at-date/<RRRR-MM-DD>`

  Jedno zapytanie daje jedno kino i jeden dzień, więc tydzień dla trzech kin to 21 zapytań.
- **robots.txt:** zakazane `/booking`, `/tsr/assets` i zasoby Facebooka. API (`/pl/data-api-service/`) nie jest zakazane.
- **Regulamin** („Regulamin świadczenia usług drogą elektroniczną”, rozdz. „Prawa autorskie”): „Żadna część publikacji (w tym: tekst, grafika, logo, ikony, obrazy, zdjęcia, pliki audio, pliki wideo z danymi, prezentacje, programy i wszelkie inne dane) prezentowane w Witrynie nie powinny być powielane ani rozpowszechniane bez uprzedniej zgody Cinema City”. Wprost zakazu pobierania automatycznego nie ma. Godziny seansów to fakty, ale zapis „wszelkie inne dane” jest szeroki, stąd ocena **wątpliwe**.
- **Pola:** tytuł, data i godzina, sala (np. „Sala 14”), wersja (dubbing / napisy / oryginał oraz języki), format (2D / 3D / 4DX / VIP), gatunek (`animation`, `family`…), kategoria wiekowa (`bez-ograniczen`, `10-plus`, `13-plus`…; często brak, wtedy `na`), link do biletu (`tickets.cinema-city.pl/api/order/<id>`).
- **Zakres:** pełne dni do ok. 10 dni naprzód (2–12.10), dalej pojedyncze pokazy specjalne aż do grudnia.
- **Dla dzieci w najbliższym tygodniu (2–8.10):** 286 seansów (Bonarka 166, Kazimierz 62, Zakopianka 58), m.in. „Psi patrol i dinozaury”, „Minionki i straszydła”, „Pucio kocha zwierzaki”, „Marsupilami”. Uwaga: „Folwark zwierzęcy” (animacja, 10+) wpada do filtra „animacja”. To 8 seansów, warto go dać na listę `ukryj`.

### Multikino
- `robots.txt` jest dostępny (zakazy m.in. `/showing/`, `/screening/`, `/zamowienie/`), ale każda strona repertuaru (`/repertuar/krakow`) zwraca 403 z ekranem „Just a moment…” (Cloudflare, `cf-mitigated: challenge`). Ten ekran ma zatrzymywać automaty, a jego omijanie jest wykluczone. Ocena: **niemożliwe**, chyba że Multikino udostępni dane w inny sposób, np. na prośbę.

### Kijów.Centrum
- **Repertuar:** https://kupbilet.kijow.pl/MSI/mvc/pl (system sprzedaży MSI). Strona `kijow.pl/repertuar/` tylko do niego odsyła. Dane są w HTML (oś czasu: „03 paź 10:30”, tytuł, krótki opis) i dodatkowo w kodzie strony jako gotowa lista `var RepertoireEvents = [{ 'Id', 'Name', 'Date': '02.10.2026', 'Hour': '12:30', … }]`. Najwygodniej czytać tę listę, bo ma pełną datę z rokiem.
- **robots.txt:** `kupbilet.kijow.pl/robots.txt` daje 404 (brak zakazów), `kijow.pl` pozwala na wszystko.
- **Regulamin:** jest tylko regulamin sprzedaży biletów online (zakaz kopiowania samych biletów). O pobieraniu repertuaru nic nie mówi.
- **Pola:** tytuł, data, godzina, wersja w tytule („2D DUBBING”), link do biletu (`/MSI/Default.aspx?event_id=…`), strona opisu (`/MSI/mvc/pl/details/<id>`). Sali, gatunku i kategorii wiekowej brak. W repertuarze są też spektakle i transmisje oper (tytuły zaczynają się od „SPEKTAKL” / „OPERA”).
- **Filtr dla dzieci:** „dubbing” w tytule plus lista `wymus`/`ukryj`.
- **Zakres:** tydzień piątek–czwartek (2–8.10: 14–26 seansów dziennie), dalej pojedyncze wydarzenia do końca miesiąca.
- **Dla dzieci w najbliższym tygodniu:** 45 seansów („Zapomniana wyspa”, „Tedi i magiczna lampa”, „Luna i rozgadana świnka”, „Pucio kocha zwierzaki”, wszystkie z dubbingiem).

### Mikro (Lea 5, Galeria Bronowice)
- **Repertuar:** strona `kinomikro.pl/repertuar/` ładuje dane skryptem z publicznego JSON https://bilety.kinomikro.pl/service.php/repertoire/list.json?limit=300&advanced=1. Jedno zapytanie daje cały repertuar (99 seansów).
- **robots.txt:** na `bilety.kinomikro.pl` reguły są wykomentowane (`#Disallow:`), czyli brak zakazów. `kinomikro.pl` blokuje tylko `/wp-admin/`.
- **Regulamin:** na stronie i w systemie biletowym nie znaleziono regulaminu korzystania z serwisu.
- **Pola:** tytuł (wersja czasem w tytule, np. „Marsupilami- dubbing”), data i godzina z strefą czasową, sala / lokalizacja (Sala Mikro, Sala Mikroffala, Galeria Bronowice) z adresem, link do biletu (`/kup-bilet/…`), cena, liczba wolnych miejsc. Pola `category`, `year`, `country` są puste, kategorii wiekowej brak. Opis jest w HTML, ale go nie bierzemy.
- **Filtr dla dzieci:** po tytule („dubbing”) plus lista `wymus`.
- **Zakres:** tydzień piątek–czwartek (2–8.10: 10–14 seansów dziennie), dalej pojedyncze wydarzenia do końca listopada.
- **Dla dzieci w najbliższym tygodniu:** 8 seansów („Marsupilami” w Bronowicach, „Pucio kocha zwierzaki” w Sali Mikroffala).
- Agrafka i Paradox mają adresy biletów w tym samym stylu (`…/repertoire.html?id=…`). Jeśli to ten sam system, ich `bilety.*` mogą mieć podobny plik `list.json`, prostszy od HTML. Do sprawdzenia po odblokowaniu `bilety.kinoagrafka.pl` i `bilety.kinoparadox.pl`.

### Sfinks
- `okn.edu.pl` (Ośrodek Kultury Norwida) jest już dostępny, ale strona ośrodka tylko odsyła do serwisu kina. Repertuar jest na `kinosfinks.okn.edu.pl`, a ta poddomena nadal jest zablokowana. `okn.edu.pl/robots.txt` nie zakazuje stron z repertuarem. Nie sprawdzone.

## Dni publikacji i harmonogram

Wszystkie sprawdzone kina mają tydzień repertuarowy piątek–czwartek. 2 października (piątek) Pod Baranami, Agrafka, Paradox, Kijów i Mikro miały pełny program do czwartku 8.10, a Cinema City do poniedziałku 12.10.

Jednorazowe sprawdzenie nie pokazuje, w który dzień kino publikuje następny tydzień. Zwyczajowo kina robią to we wtorek–środę przed piątkiem. Proponowany harmonogram z zadania (wtorek wieczorem, czwartek wieczorem, opcjonalnie sobota rano) do tego pasuje. Dokładny dzień można potwierdzić, zapisując przez 2 tygodnie, kiedy pojawia się kolejny piątek.

## Do decyzji właścicielki

1. **Cinema City:** w regulaminie jest ogólny zapis o „danych” bez zgody. Do wyboru:
   - napisać do Cinema City z prośbą o zgodę na pokazywanie godzin seansów z linkiem do zakupu biletu (to dla nich darmowa reklama),
   - albo zaakceptować ryzyko, bo pobieramy tylko fakty, bez plakatów i opisów.

   Bez Cinema City zostaje ok. 58 seansów dla dzieci tygodniowo (głównie Kijów i Mikro) zamiast ok. 340.
2. **Multikino:** jedyna droga to prośba o dane (np. plik z repertuarem albo zgoda na dostęp).
3. **Sfinks:** żeby go ocenić, trzeba dopuścić `kinosfinks.okn.edu.pl` (sam `okn.edu.pl` nie wystarcza). Opcjonalnie `bilety.kinoagrafka.pl` i `bilety.kinoparadox.pl`, żeby sprawdzić, czy mają wygodniejszy JSON. GitHub Actions nie ma tych blokad, one dotyczą tylko tej sesji.
4. **Lista `ukryj`:** na start „Folwark zwierzęcy” (animacja, ale 10+).
5. **Kina bez kategorii wiekowej** (Pod Baranami, Kijów, Mikro, Agrafka): filtr dla dzieci trzeba oprzeć na dubbingu, cyklach („Baranki Dzieciom”, „Czytamy i oglądamy”) i liście `wymus`, bo reguła „wiek 0–7” tam nie zadziała.
