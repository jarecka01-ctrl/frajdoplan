# Rozpoznanie źródła: KBF Bilety (kbfbilety.krakow.pl)

Sprawdzono 7 października 2026. Zapytania szły po kolei, nie częściej niż raz na sekundę, bez logowania i bez omijania zabezpieczeń. Najpierw `robots.txt` i regulaminy, dopiero potem strony wydarzeń. Nic nie zostało zapisane w serwisie.

## Ocena: bezpieczne i proste

| Element | Co mówi | Wniosek |
|---|---|---|
| `robots.txt` | `User-agent: *` zakazuje tylko `/*?*language=`, `/*?*miasto=`, `/*?*wojewodztwo=`, `/admin`. Podaje też `Sitemap`. | Lista z filtrem „Dla dzieci" (`/wydarzenia/filtruj?type["children"]=on&location=0`) i strony `/kup-bilet/…` są dozwolone. Skrypt nie używa żadnego z zakazanych parametrów. |
| Regulamin platformy sprzedażowej (`/regulamin-platformy-sprzedazowej`) | Reguluje konto i zakup biletów. Jedyny zapis o korzystaniu z serwisu (§ 2 ust. 2): użytkownik nie może zamieszczać treści bezprawnych ani „podejmować działań mogących wywołać zakłócenia lub uszkodzenia w Systemie". | Nic o automatycznym pobieraniu, robotach, kopiowaniu treści ani ponownym wykorzystaniu danych. Zakaz zakłócania systemu nie dotyczy kilku zapytań na minutę (u nas 1 zapytanie na sekundę, tylko odczyt). |
| Regulamin sprzedaży (`/regulamin-sprzedazy`) | Zasady zakupu, zwroty, odwołanie wydarzeń, zgoda uczestnika na utrwalanie wizerunku, zakaz odsprzedaży biletów z zyskiem. | Nic o pobieraniu danych ani o prawach do treści strony. Zakaz odsprzedaży dotyczy biletów, nie informacji o wydarzeniach. |
| Regulaminy zawierają wyszukiwane słowa: automatyczn…, robot, scraping, crawl, kopiowan…, baza danych, własność intelektualna, prawa autorskie | Jedyne trafienia to „automatycznie anulowane/zwrot" (zamówienia) i „pola eksploatacji" (nagrania z wydarzeń). | Brak zakazu i brak zgody wprost. |

**Ocena:** bezpieczne i proste. Regulaminy milczą na temat pobierania, a `robots.txt` dopuszcza używane adresy. To ten sam poziom pewności co przy kinach (`docs/rozpoznanie-kin.md`: „regulamin bez zakazu → bezpieczne"). Gdyby KBF chciał wyłączyć pobieranie, wystarczy usunąć moduł albo ustawić `wlaczone: false`.

**Zasady przyjęte dla tego źródła:** bierzemy tylko fakty (tytuł, data, godzina, miejsce, wiek, cena, link do biletu). Opisów i plakatów nie kopiujemy. Opis z podstrony służy wyłącznie do rozpoznania wieku i sygnałów „dla dorosłych" i nie trafia do `data/repertuar.json`.

## Jak działa moduł `scripts/repertuar/zrodla/kbf.mjs`

- **Dane:** zwykły HTML renderowany na serwerze (bez JavaScriptu i bez API). Lista: tabela `.striped-table` z odnośnikami do wydarzeń. Strona wydarzenia: tytuł (`h1`), podtytuł, miejsce i adres (`.post-details .address`), data i godzina („08 listopada 2026, godz. 13:00"), cena, opis.
- **Zapytania:** robots.txt → lista → po jednym zapytaniu na każde wydarzenie, w odstępie ponad 1 s (wspólny limit całego skryptu). Bez przeglądarki, bez logowania. Obsłużona jest też paginacja (`?page=N`, do 10 stron), choć dziś lista mieści się na jednej stronie.
- **Okno czasowe:** 180 dni do przodu (`wyprzedzenieDni`).
- **Miejsce:** część adresu przed ukośnikiem („Teatr KTO / Jana Zamoyskiego 50, …"). Znane hale i teatry mają nazwy takie same jak w innych modułach (Filharmonia Krakowska, Teatr Groteska, TAURON Arena Kraków, ICE Kraków…), dzięki czemu **deduplikacja** (ten sam tytuł, dzień i miejsce z dwóch źródeł = jedno wydarzenie; KBF jest ostatni na liście, więc wygrywa źródło własne miejsca) działa bez zmian. Wydarzenia poza Krakowem są pomijane.
- **`powiazane_miejsce_id`:** z arkusza „Miejsca": znane miejsca po nazwie, reszta tylko przy identycznej nazwie (bez zgadywania). Brak w arkuszu = puste pole i wpis „Miejsca bez place_id" w podsumowaniu uruchomienia.
- **Dla dzieci:** ufamy filtrowi KBF. Odrzucamy wydarzenia z sygnałem dla dorosłych (18+, „dla dorosłych", kabaret, stand-up… z `dla-dzieci.mjs`, funkcja `dlaDoroslych`). Wiek powyżej 12 lat → `do_weryfikacji` (właścicielka dopisuje tytuł do `wymus` albo `ukryj` w `data/wyjatki.json`, można osobno dla źródła: `zrodla.kbf`).
- **Wiek:** „od lat 3", „od 3 lat", „od 3. roku życia", „4+", „w wieku 4–8 lat" → np. `3+`; tylko gdy źródło go podaje.
- **Kategoria** z listy (koncert, spektakl, warsztaty, pokaz, czytanie, wystawa, jarmark, festyn, sport, spacer, planszowki, inne) z tytułu i podtytułu, potem dopracowana wspólnym `kategorie.mjs`.
- **Godziny:** każdy termin to osobny wpis; wydarzenia o tym samym tytule, dniu i miejscu łączy w jeden wiersz z kilkoma godzinami strona (`lib/grupowanie.js`), tak jak przy pozostałych źródłach. Każda godzina ma własny link do biletu (KBF nadaje osobny numer każdemu terminowi).
- **Puste wyniki:** lista „Dla dzieci" bywa pusta („Brak aktywnych wydarzeń"). To nie jest błąd (`moznaPusto: true`). Brak i tabeli, i komunikatu o braku wydarzeń uznajemy za zmianę układu strony i zgłaszamy błąd.
- **Błąd źródła:** poprzednie dane zostają (`ok: false`), a workflow kończy się „failed" (zasada dla całego skryptu).

## Test z serwerów GitHuba (workflow_dispatch, 7 października 2026)

Uruchomienie ręczne na gałęzi `zrodlo-kbf` ([przebieg #8](https://github.com/jarecka01-ctrl/frajdoplan/actions/runs/37592700115)), zakończone sukcesem, bez żadnego błędu źródeł. `robots.txt`, lista i obie strony wydarzeń odpowiedziały z serwerów GitHuba, czyli **bez blokady** (w przeciwieństwie do opera.krakow.pl, która daje HTTP 403). Moduł zostaje włączony. Gdyby serwer zaczął odpowiadać 403 lub podobnie, wystarczy `wlaczone: false` w `kbf.mjs`; zabezpieczeń nie obchodzimy. Krok „Zapisz zmiany" na gałęzi innej niż `main` jest pomijany, więc próba nie zmieniła `data/repertuar.json`.

## Wynik: liczba wydarzeń dla dzieci na 180 dni

| Źródło | Wydarzeń na stronie | Dla dzieci (po filtrze) | Dla grup (ukryte) | Do weryfikacji | Zastąpione linki |
|---|---|---|---|---|---|
| KBF Bilety | 2 terminy (1 wydarzenie: „SP4Kids: Uszy Duszy", Teatr KTO, 8.11.2026, 13:00 i 16:00, od 3 lat, 40/60 zł) | **2** | 0 | 0 | 0 |

- To niewiele: filtr „Dla dzieci" ma w tej chwili tylko jedno wydarzenie z dwoma godzinami (festiwal Sacrum Profanum). Lista bywa pusta; ma się zapełniać przy większych festiwalach i sezonowych wydarzeniach. Moduł nie wymaga żadnej zmiany, gdy pojawi się więcej pozycji.
- **Miejsca bez `place_id`:** Teatr KTO. W arkuszu „Miejsca" z repozytorium (`data/miejsca-poprawione.csv`) jest, ale arkusz używany przez workflow go nie ma (log: „Miejsca bez place_id w arkuszu: …, KBF Bilety, …"). Po dodaniu miejsca do arkusza `uzupelnij-miejsca.mjs` uzupełni pole.
- **Deduplikacja:** w tym przebiegu nic nie dublowało się z innymi źródłami. Klucz (tytuł, dzień, miejsce) działa tak samo jak dla pozostałych źródeł, a nazwy miejsc KBF są sprowadzone do tych samych nazw co w modułach Filharmonii, Groteski, TAURON Areny, ICE itd.
- **Do weryfikacji:** brak. Do tej listy trafiłyby wydarzenia z wiekiem powyżej 12 lat (decyduje właścicielka przez `wymus` / `ukryj`).

## Do decyzji właścicielki
1. Dodać **Teatr KTO** (Jana Zamoyskiego 50) do arkusza „Miejsca", żeby wydarzenia miały powiązane miejsce.
2. Rozważyć kontakt z KBF (poczta@kbf.krakow.pl) w sprawie zgody na pobieranie listy. Regulaminy tego nie zakazują, ale też nie zezwalają wprost; kontakt (adres w nagłówku User-Agent) pozwoli KBF zareagować, gdyby się sprzeciwił.
