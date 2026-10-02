# Zadanie dla Claude Code: repertuar kin (rozpoznanie + pierwsza wersja skryptu)

Przeczytaj `CLAUDE.md`. Pracuj na nowej gałęzi `repertuar-kin`, małe commity po polsku, po każdym etapie `npm run build`. Na końcu otwórz pull request z krótkim opisem po polsku.

Skrypt jeszcze nie istnieje. To jest pierwsze podejście: najpierw rozpoznanie źródeł, potem budowa dla tych, które da się pobierać bezpiecznie.

## Etap 1: rozpoznanie (plik `docs/rozpoznanie-kin.md`)
Kina w bazie (podkategoria „Kino" w CSV „Miejsca"): Cinema City (Bonarka, Kazimierz, IMAX Zakopianka), Multikino, Kijów.Centrum, Pod Baranami, Agrafka, Paradox, Sfinks, Mikro i inne z listy. Dla każdego kina albo sieci sprawdź i zapisz w jednym wierszu tabeli:
- adres strony z repertuarem i w jaki sposób są tam dane (publiczne API/JSON w kodzie strony, dane `schema.org Event`, zwykły HTML, ładowane skryptem),
- co mówi `robots.txt` o ścieżce z repertuarem i co mówi regulamin lub warunki korzystania z serwisu o automatycznym pobieraniu,
- jakie pola da się wyciągnąć: tytuł, data, godzina, sala, wersja (dubbing/napisy), kategoria wiekowa, gatunek, link do zakupu biletu,
- w jakie dni tygodnia i jak daleko do przodu publikowany jest repertuar (to ustala harmonogram),
- ocena: „bezpieczne" (dane wprost, regulamin nie zabrania), „wątpliwe" (regulamin niejasny lub zabrania), „niemożliwe".
Nie pobieraj więcej niż jedno zapytanie na sekundę. Nie omijaj zabezpieczeń ani logowania. Jeśli sesja nie ma dostępu do tych stron (blokada sieci), napisz to wprost i przerwij.

## Etap 2: budowa dla źródeł „bezpiecznych"
- `scripts/repertuar/zrodla/<kino>.mjs`: osobny moduł na źródło, zwraca listę seansów w wspólnym formacie (niżej). Node 20, wbudowany `fetch`, HTML tylko przez lekką bibliotekę (np. `cheerio`), bez Claude API. Jeśli jakieś źródło wymaga AI do odczytu, zapytaj najpierw.
- `scripts/repertuar/uruchom.mjs`: uruchamia moduły, filtruje „dla dzieci", usuwa duplikaty, zapisuje `data/repertuar.json`.
- Filtr „dla dzieci": kategoria wiekowa 0–7 albo gatunek animacja/familijny, albo tytuł z listy `wymus` w `data/wyjatki.json`. Tytuły z listy `ukryj` odrzucaj zawsze.
- Walidacje: jeśli źródło, które wcześniej dało seanse, teraz zwraca 0, zachowaj jego poprzednie dane i oznacz w `zrodla.<id>.ok = false`. Nie zapisuj pustego wyniku.
- Seanse z minionych dni nie trafiają do pliku.

Format `data/repertuar.json`:
```json
{
  "zaktualizowano": "2026-10-06T21:05:00+02:00",
  "zrodla": { "cinema-city": { "ok": true, "pobrano": "2026-10-06T21:05:00+02:00", "url": "..." } },
  "wydarzenia": [
    { "id": "cinema-city-bonarka-<film>-2026-10-09T16:00", "typ": "seans", "kino": true,
      "nazwa": "...", "data_regula": "2026-10-09", "godzina": "16:00",
      "miejsce": "Cinema City Bonarka", "powiazane_miejsce_id": "<place_id z CSV>",
      "grupa_wiekowa": "3+", "cena": "", "link_biletow": "...",
      "zrodlo": "cinema-city", "status": "zatwierdzone" }
  ]
}
```
Tylko fakty, własne krótkie opisy lub bez opisów. Nie zapisuj plakatów ani zdjęć.

## Etap 3: strona czyta dane
- W `lib/dane.js` (funkcja pobierająca wydarzenia) wczytaj także `data/repertuar.json` i połącz z wydarzeniami z arkusza (pole `kino: true` już obsługuje sekcję „Dziś w kinach"). Nie zmieniaj działania wydarzeń z arkusza.
- Seanse z minionych dni nie są pokazywane. W sekcji „Dziś w kinach" dodaj napis „Repertuar zaktualizowany: [dzień]" (z `zaktualizowano`) i link do strony kina. Gdy źródło ma `ok: false`, pokaż datę ostatniej aktualizacji i link do strony kina.
- Seanse mają trafiać też do kalendarza miesiąca (z wyjątkiem listy „Dziś" i „Jutro", gdzie kina już są wyłączone).

## Etap 4: automat (GitHub Actions)
- `.github/workflows/repertuar-kin.yml`: harmonogram (cron w UTC; kroki wykonaj dla czasu letniego i zaznacz w komentarzu, że zimą godzina przesuwa się o 1 h): **wtorek wieczorem** i **czwartek wieczorem**, opcjonalnie sobota rano. Dostosuj do rzeczywistych dni publikacji repertuaru z etapu 1, osobno dla kin, jeśli to konieczne. Dodaj `workflow_dispatch` do ręcznego uruchomienia.
- Workflow commituje `data/repertuar.json` tylko wtedy, gdy plik się zmienił (wiadomość: „Repertuar kin: aktualizacja"). Brak pętli: commit z workflow nie uruchamia workflow.
- Przy błędzie źródła workflow kończy się statusem „failed" (GitHub wysyła e-mail do właścicielki).
- Zmienna `CONTACT_EMAIL` (sekret lub zmienna repozytorium) trafia do nagłówka User-Agent. Jeśli jej brak, użyj nazwy „FrajdoplanBot" bez adresu i napisz o tym w PR.

## Czego NIE robić
Nie zmieniaj wyglądu ani logiki dat. Nie omijaj `robots.txt` ani regulaminów. Nie włączaj indeksowania (`noindex` zostaje). Nie używaj Claude API bez pytania. Nie usuwaj istniejących wydarzeń z arkusza.

## Raport końcowy w PR
Tabela: kino / źródło / status (działa, wątpliwe, niemożliwe) / ile seansów dla dzieci na najbliższy tydzień / dni publikacji. Lista rzeczy do decyzji właścicielki (np. kina z wątpliwym regulaminem).

## Po stronie właścicielki (nie rób tego za nią)
1. GitHub: Settings → Actions → General → Workflow permissions: „Read and write permissions" (żeby workflow mógł zapisywać plik).
2. Opcjonalnie sekret/zmienna `CONTACT_EMAIL`.
3. Zatwierdzenie pull requesta po obejrzeniu podglądu.
