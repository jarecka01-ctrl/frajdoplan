# Rozpoznanie źródeł wydarzeń gościnnych i komercyjnych dla dzieci (etap 1)

Sprawdzono 5 października 2026 (poniedziałek). Zapytania szły po kolei, nie częściej niż raz na sekundę, z nagłówkiem `frajdoplan-rozpoznanie/1.0` (moduły w skrypcie używają `FrajdoplanBot`). **Dla każdego serwisu najpierw czytano `robots.txt`**, dopiero potem cokolwiek innego. Bez logowania, bez omijania zabezpieczeń. Nic nie zostało zapisane w serwisach, to tylko odczyt publicznych stron.

**Nie sprawdzano i nie pobierano** (zgodnie z zadaniem): `kupbilecik.pl`, `biletomat.pl` i serwisów KICKET, Facebooka, Instagrama. W skrypcie jest na to dodatkowe zabezpieczenie: adresy tych serwisów są odrzucane przy pobieraniu i przy sprawdzaniu linków (link do nich może zostać w danych, ale nikt go nie odpytuje).

**Czego nie udało się sprawdzić:** `eventim.pl`. Zapytanie o `robots.txt` kończyło się zerwaniem połączenia (HTTP/2 INTERNAL_ERROR) albo przekroczeniem czasu, także przy HTTP/1.1. Zgodnie z zasadą (brak odczytu `robots.txt` = nic nie pobieramy) serwis jest oceniony jako niemożliwy do użycia z tego środowiska. Nie jest to ocena samego serwisu.

**Regulaminy:** regulaminu serwisu (zakazującego albo dopuszczającego pobieranie list wydarzeń) nie znaleziono na stronach TAURON Areny, ICE Kraków ani Klubu Studio (są tylko polityki prywatności i cookies oraz regulaminy newslettera). Variété ma podstronę „Pliki i regulaminy” (`/teatr/pliki-i-regulaminy`), której nie otwierano; do sprawdzenia przez właścicielkę. Regulamin obiektu TAURON Areny to skan PDF dotyczący zachowania na obiekcie (nie dało się go odczytać jako tekst; nie dotyczy pobierania danych ze strony). Regulamin eBilet przeczytano w całości, patrz niżej.

## Podsumowanie

| Źródło | Dane | `robots.txt` | Oznaczenie „dla dzieci” | Wyprzedzenie | Ocena | Wydarzeń dla dzieci na 180 dni |
|---|---|---|---|---|---|---|
| **TAURON Arena Kraków** | publiczne API wtyczki Events Calendar (JSON) | zakaz tylko `/wp-admin/` | brak oznaczenia; tylko kategorie Muzyczne / Sportowe / Inne i opisy | do 7 miesięcy (36 wydarzeń) | **bezpieczne i proste** | **0** pewnych, **2** do weryfikacji (z 36) |
| **ICE Kraków** | zwykły HTML `/kalendarium` | odpowiada tekstem „Error” (nie ma reguł) | brak | ok. 2 tygodnie (15 wydarzeń) | **bezpieczne i proste** | **0** (z 15) |
| **Klub Studio** | HTML dołączany skryptem z `/index.ajax` (GET, kolejne strony przez POST) | `Disallow:` puste (wszystko wolno) | brak; klub rockowy i kabaretowy | do 8 miesięcy (60 wydarzeń) | **bezpieczne i proste** | **0** (z 60) |
| **Teatr Variété** | dane w znaczniku `__NEXT_DATA__` (JSON) strony „Sprawdź repertuar” | zakazy tylko dla Googlebota | w opisach spektakli („od 10. roku życia”, „od 5 lat”) | do 9 miesięcy (68 terminów) | **bezpieczne i proste** | **10** (+ 26 poranków dla szkół, ukrytych) |
| **Kijów.Centrum** (`kijow.pl/wydarzenia`, nie seanse) | wpisy blogowe WordPressa; data tylko w tytule lub treści; kolejne ładowane skryptem | zakazów brak | brak | kilka dni | **wątpliwe** | nie liczono |
| **eBilet** | schema.org `Event` (`ItemList`, po 8 na stronę), ale trasy ogólnopolskie z listą miast zamiast jednego terminu | zakaz `/api/`, `/cms/`, listy dozwolone | tak: kategorie „Rodzina → Dla dzieci / Teatr dla dzieci / Widowiska dla dzieci” | różne | **wątpliwe** | nie liczono |
| **Eventim** | nie sprawdzony | nie udało się pobrać | — | — | **niemożliwe w tym środowisku** | — |
| **Going** (`going.pl`) | strona to pusta powłoka aplikacji (3 KB), dane tylko przez aplikację | `Disallow: /$` (tylko strona główna) | — | — | **niemożliwe** (brak publicznej listy) | — |

Liczba ocen: **4 bezpieczne i proste**, **2 wątpliwe**, **2 niemożliwe**.

Wniosek: hale i kluby (TAURON Arena, ICE, Klub Studio) publikują prawie wyłącznie wydarzenia dla dorosłych, a pierwsze trzy źródła **nie dają dziś ani jednego pewnego wydarzenia dla dzieci**. Prawdziwy zysk przynosi na razie Variété (spektakle „Adonis ma gościa”, „Mały Książę”). Moduły są jednak gotowe i będą wychwytywać okazjonalne trasy (widowiska lodowe, Disney, programy familijne), gdy hale je ogłoszą, a niepewne pozycje trafiają do `do_weryfikacji`.

## Szczegóły

### TAURON Arena Kraków
- **Kalendarz:** https://www.tauronarenakrakow.pl/events/ . Strona jest zbudowana na wtyczce The Events Calendar, a jej publiczne API (`/wp-json/tribe/events/v1/events`, adres wskazany w kodzie strony) zwraca JSON z tytułem, datą i godziną, opisem, kategorią i adresem wydarzenia. `robots.txt` zabrania tylko `/wp-admin/`.
- **Zawartość na 5 października:** 36 wydarzeń do kwietnia 2027, trzy kategorie: Muzyczne, Sportowe, Inne. W opisach nie ma oznaczeń wieku ani „dla dzieci”. Ponad 30 pozycji to koncerty i imprezy dla dorosłych (Korn, Megadeth, MANOWAR, kabarety, stand-up, targi, półmaraton).
- **Dwie pozycje niepewne (do weryfikacji):** **Harlem Globetrotters** (21.10; opis mówi „pokaz dla całej rodziny”, ale to kategoria sportowa) i **Home Alone Live in Concert** (17.12; opis wspomina dzieci i bezpłatny wstęp dla dzieci do 7 lat, ale nie oznacza koncertu jako dziecięcego).
- **Bez oznaczenia, uznane za dorosłe:** m.in. Freestyle Heroes (14.03.2027, pokaz sportów ekstremalnych) i Magic Christmas Concert. Jeśli właścicielka uzna je za rodzinne, wystarczy dopisać tytuł do `wymus`.
- **Stabilność:** `robots.txt` serwisu odpowiedział raz błędem 503 przy kilku próbach tego dnia, potem działał. Moduł robi jedną ponowną próbę, a przy dalszym błędzie nie pobiera niczego i zachowuje poprzednie dane.
- **Miejsce w arkuszu „Miejsca”:** w pliku `docs/miejsca-poprawione.csv` nie ma TAURON Areny, więc `powiazane_miejsce_id` zostanie puste do czasu dodania miejsca do arkusza.

### ICE Kraków
- **Kalendarz:** https://icekrakow.pl/kalendarium , zwykły HTML (blok `.event` z datą, kategorią, tytułem, opisem, salą i linkiem do biletów zewnętrznych sprzedawców). Na stronie są tylko najbliższe 2 tygodnie (15 wydarzeń, w tym kongresy i spektakle komediowe dla dorosłych).
- **`robots.txt`:** odpowiada kodem 200 i tekstem „Error. Please contact the administrator.” (nie ma żadnych reguł). Uznajemy to za brak zakazów, tak jak dotychczas brak pliku. Warto to potwierdzić z obsługą ICE, gdyby serwis zaczął blokować boty.
- **Dla dzieci:** brak oznaczeń; 0 pozycji. W arkuszu „Miejsca” jest „ICE Kraków Congress Centre”, więc `powiazane_miejsce_id` jest uzupełniane.

### Klub Studio
- **Kalendarz:** https://www.klubstudio.pl/wydarzenia ładuje listę skryptem z `/index.ajax` (strona 1 przez GET, następne przez POST z numerem strony; to samo robi przycisk „więcej”). Odpowiedź to zwykły HTML: data, godzina, tytuł, cena („Bilety od … zł”), link do sprzedawcy biletów. `robots.txt` pozwala na wszystko.
- **Zawartość:** 60 wydarzeń do czerwca 2027: koncerty rockowe i metalowe, popowe, kabarety, dyskoteki. Żadnego dla dzieci.

### Teatr Variété
- **Repertuar:** https://www.teatrvariete.pl/repertuar/sprawdz-repertuar . Strona (2,4 MB) ma w kodzie pełne dane w znaczniku `__NEXT_DATA__`: 7 spektakli i koncertów, każdy z opisem i listą terminów (data, godzina, link do biletów w systemie `bilety.teatrvariete.pl`). `robots.txt` zakazuje tylko Googlebota; dla innych botów brak reguł. Dane pochodzą z zaplecza WordPressa (`wordpress.teatrvariete.pl`, jego `robots.txt` też bez zakazów dla pozostałych), ale moduł pobiera tylko stronę teatru.
- **Dla dzieci (z opisów, nie z oznaczeń na liście):**
  - **„Adonis ma gościa”**: spektakl o papudze, wiek 5+, 44 terminy do czerwca 2027; większość to poranki dla szkół (rezerwacje grupowe), które oznaczamy `dla_grup` i nie pokazujemy. W weekendy i po południu są terminy dla wszystkich.
  - **„Mały Książę”**: „rekomendowany dla widzów od 10. roku życia”, 6 terminów w październiku (część poranków dla grup).
  - Pozostałe (SIX, RENT, „Premiera, która poszła nie tak”, koncerty „Mistrzowie musicalu”, Blues Brothers) są dla dorosłych i młodzieży.
- **Miejsce w arkuszu „Miejsca”:** w pliku `docs/miejsca-poprawione.csv` nie ma Variété, więc `powiazane_miejsce_id` zostanie puste.

### Kijów.Centrum (wydarzenia inne niż seanse)
- `https://kijow.pl/wydarzenia/` to lista wpisów blogowych (kategoria „Wydarzenia”), w tytule lub treści jest zwykle data, ale nie ma stałych pól (godzina, cena, wiek, miejsce sali). Kolejne wpisy dociąga skrypt. Wśród widocznych są spektakle komediowe i koncerty dla dorosłych oraz transmisje MET Opera. Seanse dla dzieci Kijowa już mamy w module kina. **Wątpliwe:** bez AI nie da się wiarygodnie wydobyć dat i godzin, a wydarzeń dla dzieci tam nie widać.

### eBilet
- **Dane:** strony kategorii (np. `/rodzina/miasto/krakow`) zawierają schema.org `ItemList` z `Event` (8 na stronę). Dla tras ogólnopolskich (Teatr Baniek Mydlanych, Szaleni Naukowcy, „Wigilijna opowieść”) pole `location` to lista miast, a `startDate` dotyczy jednego z nich (np. Warszawy albo Kalisza). Terminy w Krakowie trzeba by wyciągać ze stron poszczególnych wydarzeń (`?city=Kraków`). Ma natomiast czytelne kategorie „Rodzina → Dla dzieci / Teatr dla dzieci / Widowiska dla dzieci”, więc po zbudowaniu byłby to najlepszy filtr „dla dzieci” ze wszystkich platform.
- **`robots.txt`:** zakazuje `/api/` i `/cms/`; listy wydarzeń nie są zakazane.
- **Regulamin** (https://www.ebilet.pl/lp/regulamin, przeczytany w całości): zakazuje używania botów i zautomatyzowanych narzędzi do **zakupu** biletów; o odczycie list wydarzeń nic nie mówi, ale też nie wyraża na niego zgody.
- **Ocena: wątpliwe.** Technicznie wykonalne, prawnie szare, a dane tras wymagają odpytywania wielu stron. Lepszym rozwiązaniem byłby kontakt z eBilet w sprawie feedu partnerskiego (tak jak z KICKET).

### Eventim
- Nie udało się pobrać nawet `robots.txt` z tego środowiska (zerwane połączenie, brak odpowiedzi). **Nie sprawdzony.** Strona Klubu Studio linkuje do Eventim, więc wydarzenia klubu i tak mamy ze strony klubu.

### Going
- `https://going.pl/` zwraca pustą powłokę aplikacji (3,4 KB HTML), a dane dostarcza aplikacja `goingapp.pl`. `robots.txt` zabrania tylko strony głównej (`Disallow: /$`), ale publicznych list wydarzeń nie ma. **Niemożliwe.**

## Co zbudowano (etapy 2 i 3)

Dla czterech źródeł ocenionych „bezpieczne i proste”, w `scripts/repertuar/zrodla/`: `tauron-arena.mjs`, `ice-krakow.mjs`, `klub-studio.mjs`, `variete.mjs`. Wspólna ocena „dla dzieci” jest w `scripts/repertuar/dla-dzieci.mjs`:
- **publikujemy** tylko przy wyraźnym sygnale: „dla dzieci”, „familijny”, „rodzinny”, „bajka”, „Disney”, „na lodzie”, „maluch”, „przedszkol”, „dla całej rodziny” albo wieku „od N lat” / „N+” (N ≤ 12; „N+” liczy się tylko w tytule);
- **odrzucamy** 18+, „dla dorosłych”, kabaret, stand-up, metal, rap, disco polo, mecze, MMA, ADCC, konferencje, targi i biegi;
- **niepewne** (w opisie jest „dzieci” albo „rodzina”, ale bez wyraźnego oznaczenia; sygnał rodzinny przy wydarzeniu sportowym) trafiają do `do_weryfikacji` i do podsumowania workflow;
- tytuły z `wymus` / `ukryj` w `data/wyjatki.json` mają pierwszeństwo.

Pozostałe zmiany: `typ: widowisko` (wyprzedzenie 180 dni; każde źródło może mieć własne `wyprzedzenieDni`), pole `kandydat_banera` (nic nie ustawia `wyrozniony`), usuwanie duplikatów między źródłami (ten sam tytuł, dzień i miejsce), kafelek „Najbliższe koncerty” i strona `/koncerty` pokazują także `widowisko`, lista miejsc bez wpisu w arkuszu i kandydatów na baner w podsumowaniu workflow, jedna ponowna próba pobrania `robots.txt` przy błędzie serwera.

Automat: moduły działają w istniejącym workflow „Repertuar kin i wydarzeń” (wtorek i czwartek wieczorem, sobota rano, `workflow_dispatch` zostaje); commit tylko przy zmianie pliku, błąd źródła nie nadpisuje poprzednich danych, a workflow kończy się „failed” przy awarii.

## Pytania do decyzji

1. **Harlem Globetrotters (21.10) i Home Alone Live in Concert (17.12):** czy pokazywać jako wydarzenia dla dzieci? Jeśli tak, dopisz tytuły do `wymus` w `data/wyjatki.json` (najlepiej w `zrodla.tauron-arena`).
2. **Variété:** czy „Mały Książę” (od 10 lat) ma być w kafelku „Najbliższe spektakle”? Obecnie przechodzi filtr (wiek ≤ 12). Jeśli wolisz tylko spektakle od 5–6 lat, wpisz tytuł do `ukryj`.
3. **Miejsca do arkusza „Miejsca”:** TAURON Arena Kraków, Klub Studio i Krakowski Teatr VARIETE (bez nich wydarzenia nie mają `powiazane_miejsce_id`).
4. **eBilet:** czy napisać do eBilet o feed partnerski (jak w sprawie KICKET)? To najlepsze źródło wydarzeń rodzinnych („Widowiska dla dzieci”), ale bez zgody uznajemy je za wątpliwe.
5. **Eventim:** czy ponowić sprawdzenie z innego środowiska (np. z komputera właścicielki)?
6. **Kijów.Centrum (wydarzenia inne niż seanse):** czy warto wracać do tego źródła z użyciem AI do odczytu dat z wpisów blogowych? Na dziś nic dla dzieci tam nie widać.
7. **ICE Kraków:** `robots.txt` zwraca tekst błędu zamiast pliku. Warto zapytać obsługę ICE, czy pobieranie kalendarza jest dla nich w porządku.
