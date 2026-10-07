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

