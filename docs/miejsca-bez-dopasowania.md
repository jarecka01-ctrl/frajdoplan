# Dopasowanie miejsc wydarzeń do arkusza „Miejsca" (powiazane_miejsce_id)

Sprawdzono 7 października 2026 na podstawie logów workflow „Repertuar kin i wydarzeń", pliku `data/repertuar.json` i `data/miejsca-poprawione.csv`.

## Skąd workflow bierze listę miejsc
Z **arkusza**, nie z pliku w repozytorium: krok „Pobierz repertuar" dostaje `SHEET_CSV_URL` ze zmiennej lub sekretu repozytorium (`vars.SHEET_CSV_URL || secrets.SHEET_CSV_URL`), a `scripts/repertuar/miejsca.mjs` pobiera ten CSV. Plik `data/miejsca-poprawione.csv` nie był używany.

## Dlaczego Teatr KTO „nie istnieje"
- Na produkcji miejsce jest: `/miejsce/teatr-kto-yx3e`, nazwa „Teatr KTO", ten sam `place_id` (`ChIJYx3E6KlbFkcRz-PJ9_komgw`) co w `data/miejsca-poprawione.csv`. Nazwa nie jest więc przyczyną: moduł KBF porównuje nazwy bez względu na wielkość liter, spacje i polskie znaki (po `slugZ`), i w pliku dopasowanie działa.
- W przebiegu #8 nie było ostrzeżenia o nieudanym pobraniu arkusza, więc CSV się pobrał, ale **miejsca KTO w nim nie znaleziono**. Wniosek: arkusz, który widzi workflow (`SHEET_CSV_URL` w GitHubie), nie jest tym samym, który buduje stronę (`SHEET_CSV_URL` w Vercelu): jest starszy, niepełny albo to inny adres publikacji. Wskazuje na to też `Klub Płaszów` (Centrum Kultury Podgórza): w `data/repertuar.json` z workflow nie ma `place_id`, a w pliku `data/miejsca-poprawione.csv` takie miejsce jest.
- Wartości sekretu nie da się odczytać z zewnątrz, więc ostatecznie sprawdź to ręcznie: Settings → Secrets and variables → Actions → `SHEET_CSV_URL` powinien być identyczny jak w Vercelu (Settings → Environment Variables).

## Co zmieniono
- Arkusz z `SHEET_CSV_URL` pozostaje źródłem głównym.
- **Zapas:** miejsca, których w arkuszu nie ma, a są w `data/miejsca-poprawione.csv` (bez wierszy z sekcją `archiwum`), dokładają się do dopasowania wydarzeń. Dotyczy tylko `powiazane_miejsce_id`.
- Log i zakładka Summary mówią teraz wprost: ile wierszy miał arkusz (`PUSTY albo nie pobrano` przy zerze), które miejsca dopasowano dopiero z zapasu (to sygnał, że sekret jest nieaktualny) i jakie miejsca nadal nie mają dopasowania (źródło, miejsce, liczba wydarzeń; wcześniej była tylko nazwa źródła).
- Próba lokalna: arkusz bez Teatru KTO + plik zapasowy → oba terminy „SP4Kids: Uszy Duszy" dostały `place_id` KTO, a log wypisał „Dopasowano z pliku zapasowego: Teatr KTO".

## Miejsca z modułów bez dopasowania (po dodaniu zapasu)
Nie ma ich ani w arkuszu, ani w pliku zapasowym; aby wydarzenia miały powiązane miejsce, trzeba je dopisać do arkusza „Miejsca" (potem `node scripts/repertuar/uzupelnij-miejsca.mjs <plik.csv>`).

| Źródło | Miejsce | Wydarzeń |
|---|---|---|
| TAURON Arena Kraków | TAURON Arena Kraków | 2 |
| Dzieciaki na start (ZIS Kraków) | ZIS Kraków | 6 |
| Centrum Kultury Podgórza | Strefa Sokolska | 5 |
| Centrum Kultury Podgórza | Teatr Praska 52 | 3 |
| Ośrodek Kultury Norwida | Galeria Huta Sztuki \| Ośrodek Kultury Norwida | 1 |
| Sinfonietta Cracovia | Muzeum Sztuki i Techniki Japońskiej Manggha | 2 |
| Biblioteka Kraków | 27 filii i oddziałów (Biblioteka Główna, Filia nr 3, 6, 7, 8, 10, 11, 14, 15, 16, 20, 24, 31, 38, 40, 42, 44, 46–50, 52, 55, 57, 58 i inne) | kilkadziesiąt |

Uwagi:
- Dokładna, aktualna lista z liczbą wydarzeń jest w zakładce Summary każdego uruchomienia (sekcja „Miejsca bez place_id").
- **Biblioteka Kraków** to osobne miejsca w arkuszu pod innymi nazwami; automatyczne dopasowanie po nazwie filii jest ryzykowne, więc zostawiono je puste.
- Gdy po poprawieniu sekretu Summary pokaże sekcję „Miejsca dopasowane z pliku zapasowego" pustą albo nieobecną, arkusz i plik są zgodne.
