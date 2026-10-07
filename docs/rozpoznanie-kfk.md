# Rozpoznanie źródła: Krakowskie Forum Kultury (krakowskieforum.pl)

Sprawdzono 7 października 2026. Zapytania szły po kolei, nie częściej niż raz na sekundę, z czytelnym User-Agentem (`FrajdoplanBot/1.0 (+https://frajdoplan.pl; …)`), bez logowania i bez omijania zabezpieczeń.

## Ocena: bezpieczne i proste (HTML)

- **`robots.txt`:** `Disallow` tylko dla `/uploads/`, `/css/`, `/images/`, `/js/`, kilku adresów AJAX (np. `/kalendarz_imprez/kalendarzTopTydzien/`, `/Common/getSearchAllForm/`) i `convert.php`. Kalendarium (`/wydarzenia-…html`, `/kalendarz_imprez/index/harmonogram/…`) i strony wydarzeń są dozwolone. Skrypt czyta `robots.txt` przed każdym pobraniem i nie używa żadnego zakazanego adresu.
- **Regulaminu pobierania** nie szukałem poza stopką: serwis to publiczne kalendarium instytucji miejskiej. Bierzemy same fakty (tytuł, data, godzina, miejsce, wiek, cena, link), bez opisów i zdjęć.
- **JSON-LD:** strony wydarzeń mają `Event`, ale tylko z zakresem dat całej serii (bez godziny dla terminu, `location` pomylone z nazwą wydarzenia), więc nie nadaje się na źródło. **RSS** (`/aktualnosci.xml`) to aktualności, nie kalendarium. **iCal:** brak (jest tylko link „Dodaj do kalendarza Google" dla pojedynczego terminu). Dlatego czytamy HTML.

## Struktura HTML

- **Dzień:** `https://krakowskieforum.pl/wydarzenia-RRRR-MM-DD.html`. Tabela `table.widok_listy` z wierszami: data od/do, godzina („10:00-11:00"), tytuł z podtytułem, kategorie (Muzyka, Teatr, **Dla dzieci**, Taniec, Zajęcia, Wystawy, Literatura, Kino, Spotkanie, Spacery), miejsce (nazwa klubu), link do wydarzenia w atrybucie `onclick`. 12 wierszy na stronę; dalsze strony: `/kalendarz_imprez/index/harmonogram/1/year/RRRR/month/MM/day/DD/page/N.html` (stały adres, bez sesji).
- **Kategoria „Dla dzieci"** ma adres `/wydarzenia-kategoria-119.html`, ale filtr i jego stronicowanie (`/wydarzenia-szukaj-strona-N.html`) działają na **sesji (cookies)**. Dlatego zamiast filtra bierzemy tabele dni i sami wybieramy wiersze z kategorią „Dla dzieci". Filtr po lokalizacji też jest formularzem POST (`/wydarzenia-harmonogram.html`), bez własnych adresów, ale miejsce jest w tabeli dnia, więc nie jest potrzebny.
- **Strona wydarzenia** (`/wydarzenie-<seria>-<nazwa>-szczegoly-<termin>.html`): blok `.aside_kal` z terminem, godziną („15:45 — 16:30"), ceną, kategoriami i organizatorem (klub, ulica, kod). Numer serii (`3611`) jest wspólny dla wszystkich terminów cyklu. Grupa wiekowa **nie ma osobnego pola**: jest w tytule („Capoeira dla dzieci (6-9 lat)", „Smyko-Multisensoryka® (1-3 lata)"). Adres klubu i cena są tylko na stronie wydarzenia.

## Co robi moduł `scripts/repertuar/zrodla/kfk.mjs`
- 181 stron dni (180 dni do przodu) plus strony kolejne dla dni z więcej niż 12 wierszami: ok. 300 zapytań, ok. 6 minut (workflow ma limit 60 minut). Strony szczegółów: jedno zapytanie na serię (cena i adres).
- **Wydarzenia (`data/repertuar.json`):** terminy z kategorią „Dla dzieci" oraz nieregularne wydarzenia z wiekiem (dolna granica < 12 lat) albo słowami „dla dzieci", „rodzinn…", „maluch", „bobas", „Klub Rodziców" w tytule. Odrzucamy: dorosłych, seniorów, jogę, kobiety w ciąży i wiek od 12 lat („12-25 lat"). Kategoria z listy (`warsztaty`, `spektakl`, `inne`…), wiek z tytułu, cena ze strony wydarzenia, link do strony terminu.
- **Zajęcia cotygodniowe** (≥ 3 terminy, ten dzień tygodnia i godzina co najmniej 2 razy, bez kategorii „Dla dzieci") nie są wydarzeniami: gdyby je dodać, kalendarz dostałby setki cotygodniowych wpisów. Trafiają do `data/kfk-zajecia.csv`.
- **Miejsce:** nazwa klubu; `powiazane_miejsce_id` z arkusza „Miejsca": Klub Malwa, Olsza, Kazimierz, Strych po nazwie, Krakowiacy po nazwie, siedziba Forum (Mikołajska 2, w arkuszu jako „Krakowskie Centrum Kultury") po adresie.
- **Błąd źródła:** `lagodny: true`. Kalendarium niedostępne lub zmieniony układ = ostrzeżenie w logu (`::warning::`), poprzednie dane zostają, workflow **nie** kończy się „failed" i nie zapala ostrzeżenia „nie udało się odświeżyć" w kafelku kin (źródło nie dostaje `ok: false`). Pusta lista nie jest błędem.
- **Deduplikacja:** wspólna z pozostałymi źródłami (tytuł + dzień + miejsce); dodatkowo identyczne terminy tej samej serii (ten sam tytuł, dzień, godzina i klub) łączą się w jeden.

## Wynik próby lokalnej (7 października 2026, dane z `data/miejsca-poprawione.csv`)
| | |
|---|---|
| Terminów w kalendarium na 180 dni (wszystkie kategorie) | 797 |
| Terminów dla dzieci wybranych jako wydarzenia | **28** |
| Po połączeniu identycznych terminów (zapis w `repertuar.json`) | **18** |
| Z miejscem dopasowanym do arkusza | 18 z 18 |
| Do weryfikacji | 0 |
| Serie cotygodniowe w `data/kfk-zajecia.csv` (okno 56 dni) | 24 serie, **28 wierszy** |

18 wydarzeń to m.in. Smyko-Multisensoryka® (1-3 lata, 10.10, 35 zł), Kreatywna plastyka (3-5 lat, 10.10), Rodzinne muzykowanie (2-4 lata, 17.10), O!Teatr „Jak wróbelek nie mógł zdążyć na wesele" (24.10, Klub Olsza, 15 zł), Bal halloweenowy (31.10, Klub Malwa) i terminy Klubu Rodziców (logopedyczne, umuzykalniające, Sensoplastyka®, wygiBobasy®…).

## Kluby (`data/kfk-kluby.csv`)
Sześć klubów z adresem, kodem, telefonem i stroną oraz kolumnami do porównania z arkuszem (`w_arkuszu_*`). **Nie dopasowano:** Piwnica pod Baranami (brak w arkuszu „Miejsca"). Zespół Pieśni i Tańca „Krakowiacy" jest w arkuszu jako „Ośrodek Kultury KRAKOWIACY"; strony KFK nie podają jego telefonu, więc w pliku jest numer z arkusza (tak oznaczony). Malwa w arkuszu nazywa się „Klub Malwa przy Krakowskim Forum Kultury", a Strych „Klub Strych. Krakowskie Forum Kultury".

## Odstępstwa od zlecenia i ograniczenia
1. **Filtr „Dla dzieci" nie ma stałego adresu** (sesja), więc kategoria jest wybierana z tabel dni, nie z adresu filtra.
2. **Zajęcia cotygodnie bez kategorii „Dla dzieci" nie są wydarzeniami**, tylko wierszami `kfk-zajecia.csv` (wiek z tytułu). Zajęcia z kategorią „Dla dzieci" (np. Klub Rodziców) są w obu miejscach.
3. **Klub Rodziców bez wieku w tytule** traktuję jako dla dzieci (program dla opiekunów z dziećmi 0–3 lata wg strony klubu); jogę, jogę śmiechu i zajęcia dla kobiet w ciąży wykluczam. Do sprawdzenia, czy to właściwa granica.
4. **Zajęcia stałe pochodzą z kalendarium** (seria + dzień + godzina), nie z prozy podstron ofert (`/strona-3593-zajecia_dla_dzieci.html`, `/strona-3600-…`). Zaletą jest zgodność z kalendarium i jednolite pola; wadą, że zajęcia, których nie ma w kalendarium albo które zaczną się po oknie 56 dni, nie trafią do pliku. Rozbieżność cen: strona oferty podawała 1200 zł za balet, kalendarium 1240 zł (używam kalendarium).
5. **Link „do biletów":** KFK nie ma osobnych linków do sprzedaży per wydarzenie (przycisk „Kup bilet" prowadzi do ogólnej instrukcji `/strona-3727-kup_bilet.html`), więc link to strona terminu.
6. **Piwnica pod Baranami i Krakowiacy** w badanym oknie nie miały wydarzeń oznaczonych jako dla dzieci.
7. **Czas:** ok. 6 minut więcej w tygodniowym przebiegu workflow.
