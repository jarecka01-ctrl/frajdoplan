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
5. Wróć do edytora (znaczek `<>`), kliknij **Wdróż → Nowe wdrożenie** → ikona koła zębatego → **Aplikacja internetowa**:
   - Wykonaj jako: **Ja**
   - Kto ma dostęp: **Wszyscy**
   - Kliknij **Wdróż** i zaakceptuj uprawnienia (Google ostrzeże, że aplikacja jest niezweryfikowana: **Zaawansowane → Przejdź do…**; to Twój własny skrypt).
6. Skopiuj **Adres URL aplikacji internetowej** (kończy się na `/exec`).

Dostęp „Wszyscy" jest bezpieczny: bez hasła `SEKRET` skrypt niczego nie zapisze.

## 2. Ustaw dwie zmienne w Vercel

Vercel → projekt `frajdoplan` → **Settings → Environment Variables**:

| Nazwa | Wartość |
|---|---|
| `ZGLOSZENIA_URL` | adres z kroku 1.6 (kończy się na `/exec`) |
| `ZGLOSZENIA_SEKRET` | to samo hasło, które wpisałaś w `SEKRET` |

Po zapisaniu zrób nowe wdrożenie (Deployments → trzy kropki przy ostatnim → Redeploy), żeby zmienne zaczęły działać.
Adresu i hasła **nie wklejaj do czatu ani do kodu**.

## 3. Sprawdź

Wejdź na `/dodaj/wydarzenie`, wypełnij formularz (np. testowo, z datą jutrzejszą) i wyślij. W arkuszu powinna pojawić się zakładka
`Zgłoszenia_wydarzeń` z wierszem o statusie `nowe`, a na Twoją skrzynkę przyjść e-mail. Testowy wiersz możesz potem usunąć.

## Jak przeglądać zgłoszenia

- Zakładka `Zgłoszenia_wydarzeń`: kolumna `data_regula` ma ten sam format co w zakładce „Wydarzenia" (`2026-10-03` albo `2026-10-01 do 2026-10-05`).
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
