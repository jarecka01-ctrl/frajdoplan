# Zadanie dla Claude Code: wydarzenia gościnne i komercyjne dla dzieci (koncerty, widowiska, trasy)

Przeczytaj `CLAUDE.md`, `docs/rozpoznanie-kin.md`, `docs/rozpoznanie-teatrow-i-koncertow.md` i `docs/rozpoznanie-wydarzen.md` (wzór raportu i oceny). Nowa gałąź `wydarzenia-goscinne`, małe commity po polsku, po każdym etapie `npm run build`, na końcu pull request z krótkim opisem po polsku.

Cel: kafelek „Najbliższe koncerty" (180 dni do przodu) i kalendarz mają pokazywać także okazjonalne wydarzenia komercyjne dla dzieci: trasy zespołów dziecięcych, widowiska lodowe, musicale rodzinne, wydarzenia w halach. Dziś są tam prawie wyłącznie koncerty Filharmonii.

## Etap 1: rozpoznanie (plik `docs/rozpoznanie-wydarzen-goscinnych.md`)
Zasada nadrzędna: najpierw `robots.txt` i regulamin, dopiero potem cokolwiek innego z danej domeny. Jedno zapytanie na sekundę, bez omijania zabezpieczeń, bez logowania.

**Grupa A, hale i miejsca (priorytet):**
- TAURON Arena Kraków (tauronarenakrakow.pl, kalendarz wydarzeń)
- ICE Kraków (icekrakow.pl), Klub Studio (klubstudio.pl), Teatr Variété (teatrvariete.pl), Kijów.Centrum (kijow.pl, wydarzenia inne niż seanse)

**Grupa B, platformy biletowe (tylko ocena możliwości):**
- eBilet (ebilet.pl, listy „Koncerty Kraków" i kategorie rodzinne), Eventim (eventim.pl), Going (going.pl)

**NIE sprawdzaj i NIE pobieraj:** kupbilecik.pl (zakaz automatycznego pobierania), biletomat.pl i serwisów KICKET (czekamy na odpowiedź w sprawie współpracy), Facebooka, Instagrama.

Dla każdego źródła (wiersz tabeli): adres kalendarza, forma danych (JSON, schema.org Event, iCal, prosty HTML, ładowany skryptem), co mówi `robots.txt`, co mówi regulamin o pobieraniu, czy jest oznaczenie „dla dzieci" / wiek / kategoria rodzinna, wyprzedzenie publikacji, szacowana liczba wydarzeń dla dzieci na pół roku, ocena: „bezpieczne i proste" / „bezpieczne, ale wymaga AI" / „wątpliwe" / „niemożliwe". Na końcu raportu tabela podsumowująca i lista pytań do decyzji.

## Etap 2: budowa dla źródeł „bezpiecznych i prostych" (bez zatrzymywania się na raport)
- Moduły w `scripts/repertuar/zrodla/`, ten sam wspólny format wydarzenia co dla kin, teatrów i koncertów, `typ`: `koncert`, `spektakl` lub `widowisko`, `kategoria` z listy: koncert, spektakl, warsztaty, pokaz, czytanie, wystawa, jarmark, festyn, sport, spacer, planszowki, inne. Wyprzedzenie 180 dni.
- **Filtr „dla dzieci" (ważne, hale mają głównie wydarzenia dla dorosłych):** publikuj tylko wydarzenia z wyraźnym sygnałem: „dla dzieci", „familijny", „rodzinny", „bajka", „Disney", „na lodzie", „od N lat" (N ≤ 12), „maluch", „przedszkol", „dla całej rodziny", oraz tytuły z listy `wymus` w `data/wyjatki.json`. Odrzucaj: 18+, „dla dorosłych", kabaret, stand-up, metal, rap, disco polo, festiwale muzyczne bez oznaczenia rodzinnego, wydarzenia sportowe zawodowe (np. mecze, MMA, ADCC), konferencje. Przy niepewności NIE publikuj: zapisz w sekcji `do_weryfikacji` pliku i w podsumowaniu workflow (GitHub Actions summary), a właścicielka dopisuje tytuł do `wymus`.
- Duże widowiska rodzinne (np. Disney on Ice) oznacz polem `kandydat_banera: true`, ale NIE ustawiaj `wyrozniony` automatycznie. Właścicielka decyduje.
- `powiazane_miejsce_id`: z `place_id` miejsc w CSV „Miejsca" (TAURON Arena i inne hale; jeśli miejsca nie ma w CSV, zostaw puste i wypisz je w podsumowaniu). Pole `miejsce` z nazwą sali.
- Deduplikacja z istniejącymi źródłami (np. Filharmonia, Kijów): to samo wydarzenie (tytuł + dzień + miejsce) nie może pojawić się dwa razy.
- Linki do biletów waliduj jak przy kinach. Niedziałające zastępuj stroną wydarzenia lub kalendarza. Pola `grupa_wiekowa`, `cena` wypełniaj tylko gdy źródło je podaje.
- Strona i kafelki czytają już `data/repertuar.json`. Sprawdź, że nowe wydarzenia pokazują się w „Najbliższe koncerty" i w kalendarzu, i że niektóre tytuły są w jednym wierszu z wieloma godzinami, jeśli to ten sam dzień.

## Etap 3: automat
- Workflow raz w tygodniu (poniedziałek wieczorem) lub dołącz do istniejącego workflow „Repertuar kin i wydarzeń" z osobnym krokiem. `workflow_dispatch` zostaje. Zasady jak dotychczas: commit tylko przy zmianie pliku, błąd źródła nie nadpisuje poprzednich danych, status „failed" przy awarii.

## Czego NIE robić
Nie omijaj `robots.txt` ani regulaminów. Nie używaj Claude API bez pytania. Nie pobieraj kupbilecik.pl, biletomat.pl, Facebooka, Instagrama. Nie kopiuj opisów ani plakatów, tylko fakty (tytuł, data, godzina, miejsce, wiek, link). Nie zmieniaj wyglądu strony, nie usuwaj `noindex`.

## Raport końcowy w PR
Tabela: źródło / ocena / ile wydarzeń dla dzieci na 180 dni / co wymaga decyzji. Lista wydarzeń z sekcji `do_weryfikacji`.
