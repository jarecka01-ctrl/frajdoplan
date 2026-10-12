/*
  Frajdoplan: odbiór zgłoszeń z formularzy „Dodaj wydarzenie" i „Dodaj miejsce".
  Skrypt wkleja się do arkusza Google (Rozszerzenia → Apps Script), patrz docs/zgloszenia-instrukcja.md.
  Strona wysyła tu zgłoszenie (przez serwer Vercel), skrypt dopisuje wiersz w zakładce i wysyła Ci e-mail z powiadomieniem.
  Hasło (SEKRET) ustawiasz we Właściwościach skryptu, nie w kodzie.

  Trzy rzeczy, o których łatwo zapomnieć (szczegóły w instrukcji):
  1. Raz uruchom funkcję `autoryzuj` z edytora i zezwól na dostęp do arkusza i poczty. Bez tego zgłoszenia kończą się błędem
     „You do not have permission to call SpreadsheetApp.getActiveSpreadsheet".
  2. Po KAŻDEJ zmianie kodu: Wdróż → Zarządzaj wdrożeniami → ołówek → Wersja: „Nowa wersja" → Wdróż. Adres wdrożenia się nie zmienia.
     Samo zapisanie kodu nie zmienia tego, co działa pod adresem /exec.
  3. Sprawdź wdrożenie, otwierając adres /exec w przeglądarce: zobaczysz krótką odpowiedź z informacją, czy hasło i arkusz są dostępne.
*/
var WERSJA = '2026-10-12';

var ZAKLADKI = {
  wydarzenie: {
    nazwa: 'Zgłoszenia_wydarzeń',
    kolumny: ['rola', 'nazwa', 'kategoria', 'czestosc', 'data_regula', 'cykl_od', 'cykl_do', 'cykl_opis', 'godzina', 'miejsce', 'adres', 'wiek', 'cena', 'link', 'opis', 'email'],
    tytul: 'Nowe wydarzenie'
  },
  miejsce: {
    nazwa: 'Zgłoszenia_miejsc',
    kolumny: ['rola', 'nazwa', 'rodzaj', 'podkategoria', 'adres', 'www', 'telefon', 'wiek', 'cena', 'urodziny', 'opis', 'email'],
    tytul: 'Nowe miejsce'
  }
};

// Uruchom raz z edytora (lista funkcji u góry → autoryzuj → Uruchom), żeby Google zapytał o zgodę na dostęp do arkusza i poczty.
function autoryzuj() {
  var arkusz = SpreadsheetApp.getActiveSpreadsheet();
  if (!arkusz) throw new Error('Skrypt nie jest przypisany do arkusza. Otwórz Apps Script z menu Rozszerzenia w arkuszu.');
  var limit = MailApp.getRemainingDailyQuota();
  Logger.log('Uprawnienia w porządku. Arkusz: ' + arkusz.getName() + '. Pozostały dzienny limit e-maili: ' + limit + '.');
}

// Sprawdzenie wdrożenia: otwórz adres /exec w przeglądarce. Nie pokazuje żadnych sekretów, tylko tak/nie.
function doGet() {
  var wynik = { ok: true, usluga: 'frajdoplan-zgloszenia', wersja: WERSJA };
  wynik.sekret_ustawiony = !!PropertiesService.getScriptProperties().getProperty('SEKRET');
  try {
    wynik.arkusz_dostepny = !!SpreadsheetApp.getActiveSpreadsheet();
  } catch (err) {
    wynik.arkusz_dostepny = false;
    wynik.blad_arkusza = String(err).slice(0, 200);
  }
  return odp(wynik);
}

function doPost(e) {
  try {
    var dane = JSON.parse(e.postData.contents);
    var sekret = PropertiesService.getScriptProperties().getProperty('SEKRET');
    if (!sekret || dane.sekret !== sekret) return odp({ ok: false, blad: 'brak dostępu' });
    var ust = ZAKLADKI[dane.typ];
    if (!ust) return odp({ ok: false, blad: 'nieznany typ' });

    var arkusz = SpreadsheetApp.getActiveSpreadsheet();
    if (!arkusz) return odp({ ok: false, blad: 'skrypt nie jest przypisany do arkusza (otwórz Apps Script z menu Rozszerzenia w arkuszu)' });
    var karta = arkusz.getSheetByName(ust.nazwa) || arkusz.insertSheet(ust.nazwa);
    var naglowek = ['zgłoszono', 'status'].concat(ust.kolumny);
    if (karta.getLastRow() === 0) {
      karta.appendRow(naglowek);
      karta.setFrozenRows(1);
      karta.getRange(1, 1, 1, naglowek.length).setFontWeight('bold');
    }
    var teraz = Utilities.formatDate(new Date(), 'Europe/Warsaw', 'yyyy-MM-dd HH:mm');
    var wiersz = [teraz, 'nowe'].concat(ust.kolumny.map(function (k) { return dane.wiersz[k] || ''; }));
    // wartości są tekstem: wymuszamy format tekstowy, żeby arkusz nie zamienił np. daty na liczbę
    var numer = karta.getLastRow() + 1;
    karta.getRange(numer, 1, 1, wiersz.length).setNumberFormat('@').setValues([wiersz]);

    // e-mail to tylko powiadomienie: gdy się nie uda (brak zgody na pocztę, limit dzienny), zgłoszenie jest już zapisane,
    // więc nie zgłaszamy błędu (inaczej zgłaszający wysyłałby to samo drugi raz)
    var mail = true;
    try {
      var tytul = ust.tytul + ': ' + (dane.wiersz.nazwa || '');
      MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Frajdoplan: ' + tytul,
        'Nowe zgłoszenie czeka w zakładce „' + ust.nazwa + '" (wiersz ' + numer + ').\n\n' + tytul + '\n' + arkusz.getUrl());
    } catch (errMail) {
      mail = false;
    }
    return odp({ ok: true, mail: mail });
  } catch (err) {
    return odp({ ok: false, blad: String(err) });
  }
}

function odp(obiekt) {
  return ContentService.createTextOutput(JSON.stringify(obiekt)).setMimeType(ContentService.MimeType.JSON);
}
