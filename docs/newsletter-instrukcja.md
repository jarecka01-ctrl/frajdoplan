# Newsletter: konfiguracja Brevo i codzienna obsługa

Zapis na newsletter działa tak: osoba wpisuje e-mail na stronie (`/newsletter` albo dół `/weekend`) → serwis przekazuje adres do Brevo →
Brevo wysyła wiadomość z prośbą o potwierdzenie → po kliknięciu osoba trafia na `/newsletter/dziekujemy` i dopiero wtedy jest na liście.
Klucz do Brevo jest tylko w zmiennych Vercela, nigdy w kodzie ani na czacie.

## 1. Jednorazowa konfiguracja w Brevo

Nazwy menu w Brevo czasem się zmieniają. Jeśli czegoś nie widzisz, szukaj podobnej nazwy albo daj znać.

1. Załóż konto na brevo.com (plan darmowy wystarcza na start; ma dzienny limit wysyłek, więc przy większej liście sprawdź aktualny).
2. **Lista:** Contacts → Lists → utwórz listę „Newsletter weekend". Zapisz jej **numer (ID)**; widać go na liście list.
3. **Szablon potwierdzenia (double opt-in):** Marketing → Templates → Create Template → Email template. Temat np. „Potwierdź zapis na newsletter Frajdoplanu".
   Treść krótka: zdanie, że ktoś (mam nadzieję, że Ty) zapisał ten adres na newsletter, i **przycisk**, którego link ma typ **„Double opt-in link"**
   (w razie czego link może też być znacznikiem `{{ params.DOIurl }}`). Bez reklam w tej wiadomości. Zapisz **numer (ID) szablonu**.
4. **Klucz API:** menu konta → SMTP & API → API Keys → Generate a new API key. Skopiuj od razu, bo później go nie zobaczysz. Nigdzie go nie wklejaj poza Vercelem.
5. **Nadawca:** w Brevo dodaj i potwierdź nadawcę (np. `newsletter@frajdoplan.pl` albo `kontakt@frajdoplan.pl`). Żeby maile nie lądowały w spamie,
   Brevo poprosi o dopisanie rekordów DNS domeny (SPF, DKIM, DMARC) u firmy, w której jest domena. Bez tego wysyłka działa, ale wiadomości częściej wpadają do spamu.
6. **Stopka z adresem:** Brevo wymaga w mailach danych nadawcy (imię i nazwisko lub nazwa i adres) oraz linku do rezygnacji. Link dodaje się sam (`{{ unsubscribe }}`).

## 2. Zmienne w Vercelu (Settings → Environment Variables)

| Zmienna | Co wpisać |
|---|---|
| `BREVO_API_KEY` | klucz API z kroku 4 |
| `BREVO_LIST_ID` | numer listy z kroku 2 (sama liczba) |
| `BREVO_DOI_TEMPLATE_ID` | numer szablonu z kroku 3 (sama liczba) |

Po dodaniu zmiennych potrzebne jest **nowe wdrożenie** (wystarczy wdrożyć najnowszy commit). Bez nich formularz odpowiada: „Zapis na newsletter jest chwilowo niedostępny".

## 3. Test

1. Wejdź na `/newsletter`, zapisz własny adres, zaznacz zgodę.
2. Sprawdź skrzynkę (też spam), kliknij przycisk w mailu. Powinnaś wylądować na stronie „Gotowe, jesteś zapisana!".
3. W Brevo (Contacts) adres powinien być na liście „Newsletter weekend".
4. Jeśli formularz mówi „Nie udało się zapisać", zajrzyj w Vercelu do logów funkcji `/api/newsletter`: jest tam kod błędu z Brevo (np. 401 = zły klucz, 400 = zły numer listy lub szablonu).

## 4. Newsletter na weekend (co tydzień, czwartek rano)

1. Otwórz `https://frajdoplan.pl/newsletter/generator` (adres jest ukryty, nie ma do niego linków na stronie).
2. Odznacz wydarzenia, których nie chcesz (np. dla dorosłych). „Nasze typy" to wydarzenia z `wyrozniony = tak` w arkuszu (do trzech). Na start zaznaczone jest do 10 wydarzeń na dzień.
3. Kliknij **Kopiuj temat**, **Kopiuj podgląd** i **Kopiuj kod HTML**.
4. W Brevo: Campaigns → Create an email campaign → wybierz listę „Newsletter weekend" → w edytorze wybierz wklejenie własnego kodu HTML (Code your own / „Paste your code") i wklej. Wyślij sobie test, potem zaplanuj wysyłkę na czwartek rano (zakładka planowania w kampanii).
5. Dane do generatora odświeżają się co godzinę z arkusza, a skrypt repertuaru działa we wtorek i czwartek wieczorem. Przed wysyłką (w środę wieczorem albo w czwartek rano) sprawdź w arkuszu „Wydarzenia”, czy wpisałaś ręcznie to, co ważne; jeśli chcesz najświeższych danych ze skryptu, uruchom go ręcznie (GitHub → Actions → repertuar → Run workflow).
6. Znacznik `{{ unsubscribe }}` w stopce Brevo zamieni na link do rezygnacji.

Linki w mailu mają znaczniki `utm_source=newsletter`, więc w statystykach Vercela zobaczysz wejścia z newslettera.

## 5. Ważne

- W polityce prywatności (punkt 2d) napisano, że Brevo może zapisywać otwarcia i kliknięcia. Jeśli wyłączysz śledzenie w Brevo, zaktualizuj ten akapit.
- Wysyłaj tylko do osób, które potwierdziły zapis. Nie wgrywaj do Brevo adresów z grup na Facebooku ani z wiadomości prywatnych.
- Wypisanie się: link na dole maila albo prośba na `kontakt@frajdoplan.pl`. Wtedy w Brevo usuń adres z listy.
