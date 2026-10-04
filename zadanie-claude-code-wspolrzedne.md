# Zadanie dla Claude Code: współrzędne brakujących miejsc

Przeczytaj `CLAUDE.md`. Wgrany będzie aktualny plik CSV bazy („Miejsca", kolumny jak w CLAUDE.md).

1. Znajdź wiersze z flagą „brak współrzędnych" (biblioteki dla dzieci, kluby jeździeckie, parki linowe, orliki ZIS, ok. 65 miejsc).
2. Dla każdego wyszukaj współrzędne po adresie (Nominatim / OpenStreetMap, maks. 1 zapytanie na sekundę, nagłówek User-Agent z nazwą projektu). Gdy adres jest niepełny (np. tylko miejscowość), użyj nazwy + miejscowości.
3. Wpisz `lat` i `lon`, policz `odleglosc_km` od Rynku Głównego (50.0617, 19.9373), ustaw `strefa` („Pod Krakowem" powyżej 21 km), usuń flagę „brak współrzędnych". Jeśli nie da się znaleźć, zostaw flagę i wypisz takie miejsca.
4. Dla placów zabaw z flagą „brak adresu" (mają współrzędne) dopisz ulicę z odwrotnego geokodowania i zmień nazwę na „Plac zabaw – [ulica]". Usuń z `street` wartość „Unnamed Road".
5. Pobierz z OpenStreetMap (Overpass) skateparki, tory BMX i pumptracki w Krakowie i do 20 km od Rynku. Dodaj jako nowe wiersze (podkategoria „Boiska i sport na polu", kategoria_glowna „Plener", sekcja „z-marszu"). Pomiń te, które już są (porównaj po odległości poniżej 50 m).
6. Oddaj poprawiony CSV. Nie zmieniaj innych kolumn ani nazw. Podaj listę: ile miejsc uzupełniono, ile nie znaleziono.
