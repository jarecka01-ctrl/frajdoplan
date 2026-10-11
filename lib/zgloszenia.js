// Formularze „Dodaj wydarzenie" i „Dodaj miejsce": opis pól (wspólny dla formularza w przeglądarce i dla serwera) oraz sprawdzanie danych.
// Zgłoszenia trafiają do arkusza Google (przez skrypt Apps Script, patrz docs/zgloszenia-instrukcja.md) i nigdy nie pojawiają się
// na stronie same: właścicielka przegląda je i przenosi do zakładek „Wydarzenia" / „Miejsca".

const KATEGORIE_WYDARZEN = [
  ['koncert', 'Koncert'], ['spektakl', 'Spektakl'], ['warsztaty', 'Warsztaty'], ['pokaz', 'Pokaz'], ['czytanie', 'Czytanie'],
  ['wystawa', 'Wystawa'], ['jarmark', 'Jarmark'], ['festyn', 'Festyn'], ['sport', 'Sport'], ['spacer', 'Spacer'],
  ['planszowki', 'Planszówki'], ['inne', 'Inne'],
];
const ROLE = [['organizator', 'Jestem organizatorem lub właścicielem'], ['rodzic', 'Jestem rodzicem lub uczestnikiem'], ['inna', 'Inna osoba']];

// typ: text | textarea | date | time | email | url | select ; max = limit znaków
export const POLA = {
  wydarzenie: [
    { id: 'rola', label: 'Kim jesteś?', typ: 'select', opcje: ROLE, wymagane: true },
    { id: 'nazwa', label: 'Nazwa wydarzenia', typ: 'text', max: 150, wymagane: true },
    { id: 'kategoria', label: 'Rodzaj wydarzenia', typ: 'select', opcje: KATEGORIE_WYDARZEN, wymagane: true },
    { id: 'data', label: 'Data', typ: 'date', wymagane: true },
    { id: 'data_do', label: 'Do (jeśli trwa kilka dni)', typ: 'date' },
    { id: 'godzina', label: 'Godzina rozpoczęcia', typ: 'time', pomoc: 'Jeśli jest kilka seansów, wpisz pierwszy, resztę w opisie.' },
    { id: 'miejsce', label: 'Miejsce (nazwa)', typ: 'text', max: 150, wymagane: true, placeholder: 'np. Dworek Białoprądnicki' },
    { id: 'adres', label: 'Adres', typ: 'text', max: 200, placeholder: 'ulica i numer' },
    { id: 'wiek', label: 'Dla jakiego wieku', typ: 'text', max: 60, placeholder: 'np. 3-6 lat' },
    { id: 'cena', label: 'Cena', typ: 'text', max: 80, placeholder: 'np. 25 zł albo wstęp wolny' },
    { id: 'link', label: 'Strona wydarzenia lub bilety', typ: 'url', max: 300, placeholder: 'https://' },
    { id: 'opis', label: 'Krótki opis', typ: 'textarea', max: 800, pomoc: 'Dwa, trzy zdania: co się będzie działo i dla kogo.' },
    { id: 'email', label: 'Twój e-mail', typ: 'email', max: 120, wymagane: true, pomoc: 'Tylko do pytań o zgłoszenie. Nie pokazujemy go na stronie.' },
  ],
  miejsce: [
    { id: 'rola', label: 'Kim jesteś?', typ: 'select', opcje: ROLE, wymagane: true },
    { id: 'nazwa', label: 'Nazwa miejsca', typ: 'text', max: 150, wymagane: true },
    { id: 'rodzaj', label: 'Gdzie to jest?', typ: 'select', opcje: [['Pod dachem', 'Pod dachem'], ['Plener', 'Na polu']], wymagane: true },
    { id: 'podkategoria', label: 'Jakie to miejsce?', typ: 'text', max: 100, wymagane: true, placeholder: 'np. sala zabaw, plac zabaw, park trampolin, muzeum' },
    { id: 'adres', label: 'Adres', typ: 'text', max: 200, wymagane: true, placeholder: 'ulica, numer, miejscowość' },
    { id: 'www', label: 'Strona internetowa', typ: 'url', max: 300, placeholder: 'https://' },
    { id: 'telefon', label: 'Telefon do miejsca', typ: 'text', max: 40 },
    { id: 'wiek', label: 'Dla jakiego wieku', typ: 'text', max: 60, placeholder: 'np. 1-10 lat' },
    { id: 'cena', label: 'Ceny lub cennik', typ: 'text', max: 150, placeholder: 'np. wstęp 30 zł, dorosły gratis' },
    { id: 'urodziny', label: 'Czy organizują urodziny?', typ: 'select', opcje: [['nie wiem', 'Nie wiem'], ['tak', 'Tak'], ['nie', 'Nie']] },
    { id: 'opis', label: 'Krótki opis', typ: 'textarea', max: 800, pomoc: 'Co tam jest i co warto wiedzieć (np. kawiarnia dla rodziców, wejście z wózkiem).' },
    { id: 'email', label: 'Twój e-mail', typ: 'email', max: 120, wymagane: true, pomoc: 'Tylko do pytań o zgłoszenie. Nie pokazujemy go na stronie.' },
  ],
};

const dzisWarszawa = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const dataPoprawna = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T12:00:00Z`)) && new Date(`${s}T12:00:00Z`).toISOString().slice(0, 10) === s;
const emailPoprawny = (s) => /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(s);
const urlPoprawny = (s) => { try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:'; } catch (e) { return false; } };
// komórki arkusza zaczynające się od = + - @ mogłyby zostać wykonane jako formuła
const bezFormul = (s) => (/^[=+\-@]/.test(s) ? `'${s}` : s);

// Wejście: typ ('wydarzenie' | 'miejsce') i obiekt z formularza. Wynik: { czyste } albo { bledy: { pole: komunikat } }.
export function sprawdzZgloszenie(typ, dane) {
  const pola = POLA[typ];
  if (!pola) return { bledy: { _: 'Nieznany formularz.' } };
  const czyste = {};
  const bledy = {};
  pola.forEach((p) => {
    let w = dane && dane[p.id] != null ? String(dane[p.id]).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim() : '';
    if (p.typ !== 'textarea') w = w.replace(/\s+/g, ' ');
    if (!w) { if (p.wymagane) bledy[p.id] = 'To pole jest wymagane.'; return; }
    if (p.max && w.length > p.max) { bledy[p.id] = `Maksymalnie ${p.max} znaków.`; return; }
    if (p.typ === 'select' && !p.opcje.some(([v]) => v === w)) { bledy[p.id] = 'Wybierz jedną z opcji.'; return; }
    if (p.typ === 'email' && !emailPoprawny(w)) { bledy[p.id] = 'Wpisz poprawny adres e-mail.'; return; }
    if (p.typ === 'url' && !urlPoprawny(w)) { bledy[p.id] = 'Wpisz adres zaczynający się od https://'; return; }
    if (p.typ === 'date' && !dataPoprawna(w)) { bledy[p.id] = 'Wpisz poprawną datę.'; return; }
    if (p.typ === 'time' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(w)) { bledy[p.id] = 'Wpisz godzinę w formacie 15:30.'; return; }
    czyste[p.id] = w;
  });
  if (typ === 'wydarzenie') {
    if (czyste.data && czyste.data < dzisWarszawa()) bledy.data = 'Data nie może być z przeszłości.';
    if (czyste.data_do && czyste.data && czyste.data_do <= czyste.data) bledy.data_do = 'Data końcowa musi być po dacie początkowej.';
    if (czyste.data_do && !czyste.data) bledy.data = 'Najpierw wpisz datę początkową.';
  }
  // linki w opisie to zwykle spam; jeden jest w porządku
  if (czyste.opis && (czyste.opis.match(/https?:\/\//gi) || []).length > 1) bledy.opis = 'W opisie możesz podać najwyżej jeden link; resztę wpisz w polu ze stroną.';
  if (Object.keys(bledy).length) return { bledy };
  Object.keys(czyste).forEach((k) => { czyste[k] = bezFormul(czyste[k]); });
  return { czyste };
}

// Dla arkusza: kolumny „Wydarzenia" mają `data_regula` (jedna data albo „od do do"), więc łączymy daty.
export function wierszDoArkusza(typ, czyste) {
  const w = { ...czyste };
  if (typ === 'wydarzenie') {
    w.data_regula = w.data_do ? `${w.data} do ${w.data_do}` : w.data;
    delete w.data; delete w.data_do;
  }
  return w;
}
