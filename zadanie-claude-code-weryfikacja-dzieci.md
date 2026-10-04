# Zadanie dla Claude Code: sprawdzenie, czy miejsca prowadzą zajęcia dla dzieci

Przeczytaj `CLAUDE.md`. Nowa gałąź `weryfikacja-dzieci`. Nie zmieniaj CSV „Miejsca" ani strony. Wynik to tylko raport do decyzji właścicielki.

## Zakres
Wiersze CSV „Miejsca" z flagą „do weryfikacji (dzieci?)" i stroną www (ok. 300 miejsc; zacznij od dyscypliny „Taniec" jako pilota, potem pozostałe: Zajęcia sportowe, edukacyjne, kluby). Kilka szkół tańca jest już ukrytych (`sekcja = archiwum`), pomiń je.

## Co robić dla każdego miejsca
1. Przeczytaj `robots.txt`. Przy zakazie lub błędzie nic nie pobieraj, wynik „nie sprawdzono (robots)".
2. Pobierz stronę główną i maks. 3 podstrony z tej samej domeny, których adres lub link zawiera: oferta, zajęcia, grupy, dzieci, kursy, cennik, grafik. Jedno zapytanie na sekundę, bez logowania, bez Facebooka i Instagrama.
3. Szukaj sygnałów „dla dzieci": dla dzieci, grupy dziecięce, junior, maluchy, przedszkolaki, młodzież, od N lat, dla dzieci od, kids. Szukaj sygnałów „tylko dla dorosłych": dla dorosłych, kursy dla par, pierwszy taniec, ślub, wesele, kurs taneczny dla początkujących dorosłych, 18+.
4. Wynik: `tak` (wyraźna oferta dla dzieci), `prawdopodobnie`, `nie wiadomo`, `tylko dorośli`, `nie sprawdzono (robots / błąd strony)`.

## Raport (`docs/weryfikacja-dzieci.csv` i krótkie podsumowanie)
Kolumny: place_id, nazwa, domena, wynik, wiek (jeśli znaleziono, np. „od 4 lat"), krótki dowód (do 120 znaków, własnymi słowami), adres podstrony z dowodem. Na końcu liczby: ile w każdym wyniku.

## Czego NIE robić
Nie używaj Claude API. Nie kopiuj opisów ani cenników. Nie omijaj zabezpieczeń. Nie zmieniaj istniejących plików poza `docs/`.
