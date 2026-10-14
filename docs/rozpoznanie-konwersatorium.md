# Rozpoznanie: Konwersatorium Muzyczne (konwersatoriummuzyczne.pl)

Data rozpoznania: 14.10.2026. Moduł: `scripts/repertuar/zrodla/konwersatorium.mjs`.

## Zgoda na pobieranie
`robots.txt` zezwala ogólnemu agentowi (`User-agent: *`; zakaz tylko `/files/` i `/pl/opinie-uczestnikow`). Osobno zablokowane są
boty AI (ClaudeBot, GPTBot, Applebot-Extended), ale skrypt używa własnego agenta `FrajdoplanBot` i przed każdym pobraniem czyta `robots.txt`
(`pobierz(..., { robots: true })`), więc nic się nie zmienia. Zapytania idą nie częściej niż jedno na ok. sekundę; na przebieg to ok. 6 zapytań.

## Jak jest zbudowany serwis
- Zwykły HTML renderowany na serwerze. Bez API i bez JSON-LD.
- Strona `/pl/home?city=Kraków` pokazuje tylko wybrane („promowane") wydarzenia, więc nie nadaje się jako lista. Pełne listy dają dwie kategorie:
  `/pl/koncerty-dla-maluszkow?city=Kraków` i `/pl/bajki-baletowe?city=Kraków`. Z nich bierzemy adresy `.../KRAKOW...`.
- Koncerty dla dorosłych („Koncert w Ciemności") są na osobnej domenie (`najlepszekoncertywciemnosci.pl`). Moduł jej nie pobiera
  i odrzuca każdy adres spoza `konwersatoriummuzyczne.pl`.
- Strona wydarzenia ma tabelę `#bilety`: nagłówki `h3` z grupą wiekową („Koncert dla dzieci 4-6 lat", „Koncert OPEN dla dzieci 0-12 lat",
  „Koncert dla dzieci 0-3lat"), a pod nimi wiersze `tr.event` (data `22-11-2026`, godzina, miejsce „Kraków Centrum CKF13", dostępność, cena
  w przycisku „Kup bilety 49 zł" albo „od 49 zł"). Wyprzedane terminy są w sekcji „Koncerty wyprzedane", mają napis „Wyprzedane"
  i „dostępne bilety: 0" oraz nie mają przycisku zakupu.
- Bilety są pod jednym adresem sekcji (`<strona wydarzenia>#bilety`), bez linków do pojedynczych terminów.

## Co robi moduł
- Kategoria i typ: `koncert`. Miejsce: „CKF13 Centrum Konferencyjne Fabryczna".
- Wiek tylko z nagłówka sekcji („4–6 lat", „0–12 lat", „0–3 lat"); cena tylko z przycisku („49 zł", „od 49 zł").
- Pomija terminy wyprzedane i minione. Gdy wyprzedane są wszystkie terminy wydarzenia, nie ma go w wyniku. Pusta lista nie jest błędem (`moznaPusto`).
- `link_biletow` = `<strona wydarzenia>#bilety`, `link_strony` = strona wydarzenia.
- Błąd serwisu to tylko ostrzeżenie (`lagodny: true`), poprzednie dane zostają. Brak tytułu na stronie wydarzenia (zmiana układu) jest błędem źródła.
- `powiazane_miejsce_id`: wzór szuka w „Miejsca" karty z „CKF13" albo „Centrum Konferencyjne Fabryczna". Na 14.10.2026 takiej karty nie ma
  (przy Fabryczna 13 są tylko inne firmy), więc pole zostaje puste i źródło trafia do listy „Miejsca bez place_id" w podsumowaniu.
- Tytuły: pierwsza linia nazwy cyklu + druga linia tytułu, np. „Koncert bajka baletowa: Śpiąca królewna", „Koncert dla maluszków #7: Kraina pasków".
  Wersaliki ze strony zamieniamy na zapis zdaniowy.

## Test (14.10.2026, na żywo)
6 wydarzeń na 180 dni: Śpiąca królewna 22.11 (16:30, 4–6 lat; 18:00, 0–12 lat), Dziadek do orzechów 29.11 (10:30, 4–6 lat; 13:30, 0–12 lat),
Koncert dla maluszków #7 22.11 12:00 (0–3 lat), Świąteczny koncert dla maluszków 29.11 12:00 (0–3 lat). Pominięte jako wyprzedane: Śpiąca królewna 18.10 (10:30, 13:30, 15:00) i 22.11 (10:30, 13:30, 15:00) oraz Kraina pasków 18.10 (9:00, 12:00). Do weryfikacji: 0.

## Scalanie z ręcznym wpisem w arkuszu „Wydarzenia"
Sprawdzone na wierszu „Śpiąca Królewna", 22.11, „16:30, 18:00":

| Miejsce w arkuszu | Wynik |
| --- | --- |
| „CKF13 Centrum Konferencyjne Fabryczna" | scala się, zostaje wiersz z arkusza, dochodzą link biletów, cena i wiek |
| „CKF13" | scala się (po zmianie w `lib/scalanie.js`: skrót z literami i cyfrą wystarcza, wcześniej jedno krótkie słowo było za mało) |
| „Fabryczna 13" | **nie** scala się (to zwykły adres, a wydarzenia nie scala się po samym adresie): powstaje duplikat |
| „Centrum Konferencyjne Fabryczna" | scala się |

Jeśli w arkuszu jest samo „Fabryczna 13", zmień miejsce na „CKF13" albo „CKF13 Centrum Konferencyjne Fabryczna" (adres możesz wpisać w kolumnie `adres`).
Wiek w scalonym wierszu to wiek pierwszej godziny (4–6 lat), choć druga godzina (18:00) jest dla 0–12 lat; wpisz w arkuszu wiek ręcznie, jeśli chcesz, żeby był dokładny
(wiek z arkusza ma pierwszeństwo).
