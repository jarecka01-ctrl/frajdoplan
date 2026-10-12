# Formularze „Dodaj wydarzenie" i „Dodaj miejsce": jak to uruchomić

Strona ma formularze pod adresami `/dodaj`, `/dodaj/wydarzenie` i `/dodaj/miejsce`. Zgłoszenia **nie trafiają na stronę same**:
zapisują się w Twoim arkuszu Google, w dwóch nowych zakładkach, a Ty dostajesz e-mail. Dopiero Ty decydujesz, co przenieść do zakładek „Wydarzenia" i „Miejsca".

Do uruchomienia potrzebne są trzy rzeczy (jednorazowo, około 10 minut).

## 1. Wklej skrypt do arkusza

1. Otwórz **ten sam arkusz Google**, z którego strona czyta dane („Miejsca", „Wydarzenia").
2. Menu **Rozszerzenia → Apps Script**.
3. Usuń to, co tam jest, i wklej całą zawartość pliku `docs/zgloszenia-apps-script.gs`. Zapisz (ikona dyskietki).
4. Po lewej kliknij **Ustawienia projektu** (koło zębate) → na dole **Właściwości skryptu** → **Dodaj właściwość skryptu**:
   - Właściwość: `SEKRET`
   - Wartość: wymyśl długie hasło (np. 30 losowych znaków). **Zapamiętaj je**, będzie potrzebne w kroku 3.
5. **Zezwól skryptowi na dostęp do arkusza i poczty** (bez tego zgłoszenia kończą się błędem „You do not have permission to call SpreadsheetApp.getActiveSpreadsheet"). Wróć do edytora (znaczek `<>`), u góry z listy funkcji wybierz **`autoryzuj`** i kliknij **Uruchom**. Google zapyta o uprawnienia: **Przejrzyj uprawnienia** → wybierz swoje konto → ostrzeżenie o niezweryfikowanej aplikacji: **Zaawansowane → Przejdź do… (niebezpieczne)** (to Twój własny skrypt) → **Zezwól**. W dzienniku na dole powinno być „Uprawnienia w porządku".
6. Kliknij **Wdróż → Nowe wdrożenie** → ikona koła zębatego → **Aplikacja internetowa**:
   - Wykonaj jako: **Ja**
   - Kto ma dostęp: **Wszyscy**
   - Kliknij **Wdróż**.
7. Skopiuj **Adres URL aplikacji internetowej** (kończy się na `/exec`).
8. **Sprawdź wdrożenie:** wklej ten adres do przeglądarki. Powinieneś zobaczyć krótki tekst z `"ok":true`, `"sekret_ustawiony":true` i `"arkusz_dostepny":true`. Jeśli któreś jest `false`, wróć do kroków 4–5 (hasło, zgoda).

Dostęp „Wszyscy" jest bezpieczny: bez hasła `SEKRET` skrypt niczego nie zapisze, a adres w przeglądarce pokazuje tylko tak/nie (bez haseł).

**Po każdej zmianie kodu skryptu** samo „Zapisz" nie wystarcza. Zrób: **Wdróż → Zarządzaj wdrożeniami → ołówek → Wersja: „Nowa wersja" → Wdróż**. Adres się nie zmienia, więc zmiennych w Vercel nie ruszasz.

## 2. Ustaw dwie zmienne w Vercel

Vercel → projekt `frajdoplan` → **Settings → Environment Variables**:

| Nazwa | Wartość |
|---|---|
| `ZGLOSZENIA_URL` | adres z kroku 1.7 (kończy się na `/exec`) |
| `ZGLOSZENIA_SEKRET` | to samo hasło, które wpisałaś w `SEKRET` |

Po zapisaniu zrób nowe wdrożenie (Deployments → trzy kropki przy ostatnim → Redeploy), żeby zmienne zaczęły działać.
Adresu i hasła **nie wklejaj do czatu ani do kodu**.

## 3. Sprawdź

Wejdź na `/dodaj/wydarzenie`, wypełnij formularz (np. testowo, z datą jutrzejszą) i wyślij. W arkuszu powinna pojawić się zakładka
`Zgłoszenia_wydarzeń` z wierszem o statusie `nowe`, a na Twoją skrzynkę przyjść e-mail. Testowy wiersz możesz potem usunąć.

## Co jeśli nie działa

Formularz pokazuje wtedy „Nie udało się zapisać zgłoszenia". Prawdziwą przyczynę widać w Vercel → projekt → **Logs** (na planie Hobby tylko z ostatniej godziny, więc wyślij zgłoszenie testowe i zajrzyj od razu). Szukaj wiersza `[zglos] nie udało się zapisać zgłoszenia`:

| Komunikat w logu | Przyczyna | Co zrobić |
|---|---|---|
| `błąd skryptu: brak dostępu` | hasło `ZGLOSZENIA_SEKRET` w Vercel różni się od `SEKRET` w skrypcie | ustaw takie samo w obu miejscach, w Vercel zrób Redeploy |
| `błąd skryptu: Exception: You do not have permission…` | skrypt nie ma zgody na arkusz albo pocztę | krok 1.5 (funkcja `autoryzuj`), potem „Nowa wersja" wdrożenia |
| `błąd skryptu: skrypt nie jest przypisany do arkusza` | skrypt założono poza arkuszem | otwórz Apps Script z arkusza (Rozszerzenia → Apps Script) i wklej kod tam |
| `odpowiedź nie jest JSON-em` | `ZGLOSZENIA_URL` to nie adres `/exec`, dostęp nie jest „Wszyscy" albo wdrożenie ma starą wersję kodu | sprawdź adres w przeglądarce (krok 1.8), zrób „Nowa wersja" |
| `zgłoszenie zapisane w arkuszu, ale e-mail… nie poszedł` | to tylko ostrzeżenie: wiersz jest w arkuszu, brakuje powiadomienia | uruchom `autoryzuj` jeszcze raz i zezwól na pocztę |

## Jak przeglądać zgłoszenia

- Zakładka `Zgłoszenia_wydarzeń`: kolumna `czestosc` mówi, czy wydarzenie jest `jednorazowe`, trwa `kilka` dni, czy jest `cykliczne`. Kolumna `data_regula` ma ten sam format co w zakładce „Wydarzenia" (`2026-10-03`, `2026-10-01 do 2026-10-05`, `co sobotę`, `codziennie`). Gdy zgłaszający wybrał „Inaczej" (np. pierwsza sobota miesiąca), `data_regula` jest pusta, a opis jest w `cykl_opis`, więc regułę trzeba wpisać ręcznie. `cykl_od` i `cykl_do` to granice cyklu (arkusz ich nie ma, więc zakończenie cyklu pilnujesz sama, np. zmieniając `status`).
  Skopiuj do „Wydarzenia" nazwę, datę, godzinę, miejsce, wiek, cenę, link i opis; kategoria ma te same wartości co w „Wydarzenia".
- Zakładka `Zgłoszenia_miejsc`: `rodzaj` to `Pod dachem` albo `Plener` (kolumna `kategoria_glowna`), `podkategoria` wpisał zgłaszający
  (zwykle trzeba ją dopasować do istniejących podkategorii), reszta pasuje do kolumn „Miejsc". Dane miejsca (lat, lon, zdjęcie) uzupełniasz jak zwykle.
- Zmieniaj kolumnę `status` (np. `dodane`, `odrzucone`), żeby wiedzieć, co jest załatwione. Kolumna `email` służy tylko do odpisania zgłaszającemu.

## Zabezpieczenia przed spamem (już w kodzie)

Ukryte pole pułapka, minimalny czas wypełniania (3 s), limit 5 zgłoszeń na godzinę z jednego adresu, limity długości pól, sprawdzenie formatu daty, godziny, e-maila i linku,
maksymalnie jeden link w opisie, odrzucanie zgłoszeń spoza naszej strony. Adresów IP nie zapisujemy.

## Dane osobowe

Zgłaszający podaje e-mail i zaznacza zgodę. E-mail jest w arkuszu tylko po to, żeby móc zadać pytanie; warto usuwać go z wierszy po załatwieniu sprawy
(polityka prywatności mówi o przechowywaniu do 12 miesięcy). Nie jestem prawnikiem: przejrzyj proszę zmieniony punkt w polityce prywatności.
