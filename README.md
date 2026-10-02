# Frajdoplan

Strona z bazą miejsc dla dzieci w Krakowie, dane pobierane na żywo z Arkusza Google.

## Jak podłączyć dane (zrób to raz)

1. Otwórz swój Arkusz Google z bazą.
2. Kliknij **Plik → Udostępnij → Opublikuj w internecie**.
3. Wybierz zakładkę **Miejsca**, format **CSV**, kliknij **Publikuj**.
4. Skopiuj wygenerowany link.
5. W panelu Vercel: **Settings → Environment Variables**, dodaj zmienną
   `SHEET_CSV_URL` z wklejonym linkiem, zapisz i zrób redeploy.

Od teraz strona co godzinę sama odświeża dane z arkusza (bez przebudowy kodu).

## Rozwój lokalny

```
npm install
npm run dev
```

## Repertuar kin

Seanse dla dzieci z kin studyjnych (Kijów, Mikro, Agrafka, Pod Baranami, Paradox, Sfinks) pobiera
automat w GitHub Actions („Repertuar kin”) we wtorki i czwartki wieczorem oraz w soboty rano.
Wynik trafia do `data/repertuar.json`, a commit uruchamia nowe wdrożenie na Vercelu.

- Ręczne uruchomienie: GitHub → Actions → Repertuar kin → Run workflow.
- Tytuł zawsze pokazywany / zawsze ukryty: dopisz go do `data/wyjatki.json` (`wymus` / `ukryj`).
- Gdy kino zmieni stronę, workflow skończy się błędem (przyjdzie e-mail z GitHuba), a na stronie
  zostaną ostatnie poprawne seanse tego kina.
- Lokalnie: `npm run repertuar`.
