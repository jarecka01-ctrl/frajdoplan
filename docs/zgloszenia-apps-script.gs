/*
  Frajdoplan: odbiór zgłoszeń z formularzy „Dodaj wydarzenie" i „Dodaj miejsce".
  Skrypt wkleja się do arkusza Google (Rozszerzenia → Apps Script), patrz docs/zgloszenia-instrukcja.md.
  Strona wysyła tu zgłoszenie (przez serwer Vercel), skrypt dopisuje wiersz w zakładce i wysyła Ci e-mail z powiadomieniem.
  Hasło (SEKRET) ustawiasz we Właściwościach skryptu, nie w kodzie.
*/
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

function doPost(e) {
  try {
    var dane = JSON.parse(e.postData.contents);
    var sekret = PropertiesService.getScriptProperties().getProperty('SEKRET');
    if (!sekret || dane.sekret !== sekret) return odp({ ok: false, blad: 'brak dostępu' });
    var ust = ZAKLADKI[dane.typ];
    if (!ust) return odp({ ok: false, blad: 'nieznany typ' });

    var arkusz = SpreadsheetApp.getActiveSpreadsheet();
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

    var tytul = ust.tytul + ': ' + (dane.wiersz.nazwa || '');
    MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Frajdoplan: ' + tytul,
      'Nowe zgłoszenie czeka w zakładce „' + ust.nazwa + '" (wiersz ' + numer + ').\n\n' + tytul + '\n' + arkusz.getUrl());
    return odp({ ok: true });
  } catch (err) {
    return odp({ ok: false, blad: String(err) });
  }
}

function odp(obiekt) {
  return ContentService.createTextOutput(JSON.stringify(obiekt)).setMimeType(ContentService.MimeType.JSON);
}
