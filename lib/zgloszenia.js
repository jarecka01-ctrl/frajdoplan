// Formularze „Dodaj wydarzenie" i „Dodaj miejsce": opis pól (wspólny dla formularza w przeglądarce i dla serwera) oraz sprawdzanie danych.
// Zgłoszenia trafiają do arkusza Google (przez skrypt Apps Script, patrz docs/zgloszenia-instrukcja.md) i nigdy nie pojawiają się
// na stronie same: właścicielka przegląda je i przenosi do zakładek „Wydarzenia" / „Miejsca".

const KATEGORIE_WYDARZEN = [
  ['koncert', 'Koncert'], ['spektakl', 'Spektakl'], ['warsztaty', 'Warsztaty'], ['pokaz', 'Pokaz'], ['czytanie', 'Czytanie'],
  ['wystawa', 'Wystawa'], ['jarmark', 'Jarmark'], ['festyn', 'Festyn'], ['sport', 'Sport'], ['spacer', 'Spacer'],
  ['planszowki', 'Planszówki'], ['inne', 'Inne'],
];
const CZESTOSC = [['jednorazowe', 'Jednorazowe (jeden dzień)'], ['kilka', 'Kilka dni z rzędu'], ['cykliczne', 'Cykliczne (powtarza się)']];
const POWTARZANIE = [['tydzien', 'Co tydzień'], ['codziennie', 'Codziennie'], ['inne', 'Inaczej']];
const DNI = [['co poniedziałek', 'w poniedziałek'], ['co wtorek', 'we wtorek'], ['co środę', 'w środę'], ['co czwartek', 'w czwartek'], ['co piątek', 'w piątek'], ['co sobotę', 'w sobotę'], ['co niedzielę', 'w niedzielę']];
const ROLE = [['organizator', 'Jestem organizatorem lub właścicielem'], ['rodzic', 'Jestem rodzicem lub uczestnikiem'], ['inna', 'Inna osoba']];

// typ: text | textarea | date | time | email | url | select ; max = limit znaków ; pokaz = { pole, jest: [wartości] }: pole widoczne (i wymagane) tylko, gdy `pole` ma jedną z wartości
// Czy pole jest widoczne przy danych wartościach (wspólne dla formularza i serwera).
export const czyWidoczne = (p, wartosci) => !p.pokaz || p.pokaz.jest.includes(String((wartosci && wartosci[p.pokaz.pole]) || '').trim());

export const POLA = {
  wydarzenie: [
    { id: 'rola', label: 'Kim jesteś?', typ: 'select', opcje: ROLE, wymagane: true },
    { id: 'nazwa', label: 'Nazwa wydarzenia', typ: 'text', max: 150, wymagane: true },
    { id: 'kategoria', label: 'Rodzaj wydarzenia', typ: 'select', opcje: KATEGORIE_WYDARZEN, wymagane: true },
    { id: 'czestosc', label: 'Jak często się odbywa?', typ: 'select', opcje: CZESTOSC, wymagane: true },
    { id: 'data', label: 'Data', typ: 'date', wymagane: true, pokaz: { pole: 'czestosc', jest: ['jednorazowe', 'kilka'] } },
    { id: 'data_do', label: 'Ostatni dzień', typ: 'date', wymagane: true, pokaz: { pole: 'czestosc', jest: ['kilka'] } },
    { id: 'powtarzanie', label: 'Kiedy się powtarza?', typ: 'select', opcje: POWTARZANIE, wymagane: true, pokaz: { pole: 'czestosc', jest: ['cykliczne'] } },
    { id: 'dzien_tyg', label: 'W który dzień tygodnia?', typ: 'select', opcje: DNI, wymagane: true, pokaz: { pole: 'powtarzanie', jest: ['tydzien'] } },
    { id: 'cykl_opis', label: 'Opisz, kiedy się powtarza', typ: 'text', max: 150, wymagane: true, placeholder: 'np. pierwsza sobota miesiąca albo wtorki i czwartki', pokaz: { pole: 'powtarzanie', jest: ['inne'] } },
    { id: 'cykl_od', label: 'Od kiedy', typ: 'date', pokaz: { pole: 'czestosc', jest: ['cykliczne'] } },
    { id: 'cykl_do', label: 'Do kiedy', typ: 'date', pomoc: 'Zostaw puste, jeśli nie wiadomo albo trwa bezterminowo.', pokaz: { pole: 'czestosc', jest: ['cykliczne'] } },
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
    if (!czyWidoczne(p, dane)) return; // ukryte pola (np. „co tydzień” przy wydarzeniu jednorazowym) pomijamy
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
    const dzis = dzisWarszawa();
    if (czyste.data && czyste.data < dzis) bledy.data = 'Data nie może być z przeszłości.';
    if (czyste.data_do && czyste.data && czyste.data_do <= czyste.data) bledy.data_do = 'Ostatni dzień musi być po pierwszym.';
    if (czyste.cykl_do && czyste.cykl_do < dzis) bledy.cykl_do = 'Ta data jest już za nami.';
    if (czyste.cykl_od && czyste.cykl_do && czyste.cykl_do < czyste.cykl_od) bledy.cykl_do = 'Data końcowa musi być po początkowej.';
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
    // `data_regula` ma ten sam format co zakładka „Wydarzenia”: jedna data, „od do do”, „co sobotę” albo „codziennie”;
    // „Inaczej” wymaga ręcznego wpisania reguły, opis zgłaszającego jest w kolumnie cykl_opis
    if (w.czestosc === 'jednorazowe') w.data_regula = w.data;
    else if (w.czestosc === 'kilka') w.data_regula = `${w.data} do ${w.data_do}`;
    else if (w.powtarzanie === 'tydzien') w.data_regula = w.dzien_tyg;
    else if (w.powtarzanie === 'codziennie') w.data_regula = 'codziennie';
    else w.data_regula = '';
    delete w.data; delete w.data_do; delete w.powtarzanie; delete w.dzien_tyg;
  }
  return w;
}
