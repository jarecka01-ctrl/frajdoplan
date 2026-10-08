import StronaPrawna, { Administrator, Email } from '../components/StronaPrawna';
import { seoStrony } from '../lib/seo';

export async function getStaticProps() {
  const seo = await seoStrony('/polityka-prywatnosci', {
    tytul: 'Polityka prywatności | Frajdoplan',
    opis: 'Jakie dane przetwarza serwis Frajdoplan, po co, jak długo i jakie prawa ma użytkownik. Bez ciasteczek śledzących.',
    h1: 'Polityka prywatności',
    wstep: '',
  }, 0);
  return { props: { seo }, revalidate: 3600 };
}

export default function PolitykaPrywatnosci({ seo }) {
  return (
    <StronaPrawna seo={seo} nazwa="Polityka prywatności" aktualizacja="8 października 2026">
      <h2>1. Kto jest administratorem danych</h2>
      <p>
        Administratorem danych osobowych jest <Administrator />, osoba fizyczna prowadząca serwis Frajdoplan poza działalnością
        gospodarczą. W sprawach danych osobowych pisz na adres <Email />.
      </p>

      <h2>2. Jakie dane przetwarzam i po co</h2>

      <h3>a) Statystyki odwiedzin (Vercel Analytics)</h3>
      <p>
        Żeby wiedzieć, które części serwisu są potrzebne rodzicom, korzystam ze statystyk Vercel Analytics. Zbierają one adres
        odwiedzanej podstrony, adres strony, z której ktoś przyszedł, rodzaj przeglądarki, systemu i urządzenia oraz ogólną
        lokalizację (kraj lub region) ustaloną z adresu IP. Statystyki działają bez ciasteczek, bez profilowania i bez zapisywania
        w przeglądarce, a dane są zanonimizowane: według opisu dostawcy odwiedziny nie są łączone z konkretną osobą ani między
        kolejnymi dniami. Podstawa prawna: uzasadniony interes administratora (art. 6 ust. 1 lit. f RODO), czyli ulepszanie serwisu.
      </p>

      <h3>b) Logi serwera (hosting)</h3>
      <p>
        Strona działa na serwerach firmy Vercel. Przy każdym wejściu dostawca hostingu zapisuje techniczne dane żądania: adres IP,
        datę i godzinę, adres żądanej strony, rodzaj przeglądarki i kod odpowiedzi. Służą one do działania i zabezpieczenia serwisu
        (np. wykrywania nadużyć). Nie używam ich do identyfikowania odwiedzających. Logi są przechowywane przez dostawcę przez krótki
        czas, zgodnie z jego zasadami. Podstawa prawna: uzasadniony interes administratora (art. 6 ust. 1 lit. f RODO), czyli
        bezpieczeństwo i sprawne działanie serwisu.
      </p>

      <h3>c) Wiadomości e-mail</h3>
      <p>
        Jeśli napiszesz na adres <Email />, przetwarzam Twój adres e-mail, treść wiadomości i dane, które sam podasz w korespondencji.
        Używam ich tylko do odpowiedzi i prowadzenia rozmowy. Podstawa prawna: uzasadniony interes administratora w odpowiedzi na
        wiadomość (art. 6 ust. 1 lit. f RODO). Korespondencję przechowuję do 12 miesięcy po jej zakończeniu, potem ją usuwam.
      </p>

      {/* TODO: dopisać po dodaniu formularzy i newslettera */}

      <h3>d) Czcionki i mapa ładowane z zewnętrznych serwerów</h3>
      <p>
        Przy otwarciu strony Twoja przeglądarka pobiera czcionki z serwerów Google (Google Fonts), więc Google otrzymuje wtedy Twój
        adres IP i podstawowe dane przeglądarki. Gdy otworzysz mapę, przeglądarka pobiera jej kafelki z serwerów OpenStreetMap
        (tile.openstreetmap.org), a po włączeniu nakładki z drogami rowerowymi także z CyclOSM (tile-cyclosm.openstreetmap.fr).
        Operatorzy tych serwerów widzą wtedy Twój adres IP i przybliżony obszar mapy, który oglądasz. Te zasoby przeglądarka pobiera
        bezpośrednio od ich dostawców, ja tych danych nie otrzymuję. Podstawa prawna: uzasadniony interes administratora
        (art. 6 ust. 1 lit. f RODO), czyli poprawne wyświetlenie strony i mapy.
      </p>

      <h2>3. Funkcja „Blisko mnie”</h2>
      <p>
        Położenie jest ustalane wyłącznie po kliknięciu przycisku „Blisko mnie” i dopiero po Twojej zgodzie wyrażonej w przeglądarce.
        Możesz odmówić, a strona działa dalej bez tej funkcji. Współrzędne są używane tylko w Twojej przeglądarce: do ustawienia listy
        według odległości i do wycentrowania mapy. Nie wysyłam ich na serwer serwisu ani nigdzie nie zapisuję, także w pamięci
        przeglądarki. Znikają po odświeżeniu lub zamknięciu strony. Zgodę możesz wycofać w ustawieniach przeglądarki. Jeśli przy tym
        wyświetlisz mapę, obowiązuje opis z punktu 2d: serwery mapy zobaczą, jaki obszar wokół Ciebie oglądasz.
      </p>

      <h2>4. Ciasteczka i pamięć przeglądarki</h2>
      <p>
        Serwis nie ustawia ciasteczek (plików cookies). Nie używam ciasteczek śledzących, reklamowych ani analitycznych, dlatego na
        stronie nie ma baneru zgody na ciasteczka.
      </p>
      {/* TODO: gdy plan będzie dało się udostępniać linkiem (etap 2 funkcji „Mój plan"), dopisać, że link zawiera wybrane pozycje, a serwer ich nie zapisuje */}
      <p>
        Jedyne dane, które serwis zapisuje w pamięci przeglądarki (localStorage), to Twój plan z funkcji „Mój plan”: wybrane wydarzenia
        i miejsca, ewentualnie wybrane przez Ciebie dni i godziny oraz nazwa planu. Zapis powstaje dopiero wtedy, gdy dodasz coś do planu,
        zostaje wyłącznie na Twoim urządzeniu i nie jest wysyłany na serwer. Możesz go usunąć w każdej chwili przyciskiem „Wyczyść plan”
        albo w ustawieniach przeglądarki.
      </p>

      <h2>5. Odbiorcy danych i dostawcy</h2>
      <ul>
        <li><strong>Vercel Inc.</strong>: hosting strony i statystyki odwiedzin (Vercel Analytics), jako podmiot przetwarzający na moje zlecenie.</li>
        <li>
          <strong>Google</strong>: poczta w usłudze Google Workspace obsługująca adres <Email /> (Twoje wiadomości) oraz arkusz Google
          z danymi o miejscach i wydarzeniach (bez danych użytkowników serwisu), jako podmiot przetwarzający na moje zlecenie.
          Google jest też dostawcą czcionek (punkt 2d).
        </li>
        <li><strong>OpenStreetMap i CyclOSM</strong>: kafelki mapy (punkt 2d). To odrębni operatorzy, nie przetwarzają danych na moje zlecenie.</li>
      </ul>
      <p>Nie sprzedaję danych i nie przekazuję ich nikomu poza wymienionymi dostawcami.</p>

      <h2>6. Przekazywanie danych poza Europejski Obszar Gospodarczy</h2>
      <p>
        Vercel i Google mogą przetwarzać dane poza Europejskim Obszarem Gospodarczym, w tym w Stanach Zjednoczonych. Dostawcy stosują
        zabezpieczenia wymagane przez RODO, w szczególności standardowe klauzule umowne zatwierdzone przez Komisję Europejską i (lub)
        uczestnictwo w programie EU-US Data Privacy Framework. Więcej informacji możesz uzyskać, pisząc na <Email />.
      </p>

      <h2>7. Twoje prawa</h2>
      <p>Masz prawo do:</p>
      <ul>
        <li>dostępu do swoich danych i otrzymania ich kopii,</li>
        <li>sprostowania danych,</li>
        <li>usunięcia danych,</li>
        <li>ograniczenia przetwarzania,</li>
        <li>sprzeciwu wobec przetwarzania opartego na uzasadnionym interesie administratora,</li>
        <li>przenoszenia danych, w zakresie wynikającym z przepisów.</li>
      </ul>
      <p>
        Żeby skorzystać z tych praw, napisz na <Email />. Odpowiem bez zbędnej zwłoki, najpóźniej w ciągu miesiąca. Możesz też
        złożyć skargę do organu nadzorczego: Prezesa Urzędu Ochrony Danych Osobowych, ul. Stawki 2, 00-193 Warszawa,{' '}
        <a href="https://uodo.gov.pl" target="_blank" rel="noreferrer">uodo.gov.pl</a>.
      </p>
      <p>
        Nie musisz podawać żadnych danych, żeby korzystać ze strony. Piszesz do mnie dobrowolnie, a adres e-mail jest potrzebny tylko
        po to, żeby było gdzie odpowiedzieć.
      </p>

      <h2>8. Zautomatyzowane decyzje i profilowanie</h2>
      <p>Nie podejmuję wobec nikogo zautomatyzowanych decyzji i nie stosuję profilowania.</p>

      <h2>9. Linki do innych stron</h2>
      <p>
        Serwis zawiera linki do stron organizatorów, kin, teatrów i innych miejsc. Po przejściu na taką stronę obowiązują jej własne
        zasady przetwarzania danych, za które nie odpowiadam.
      </p>

      <h2>10. Zmiany polityki</h2>
      <p>Aktualną wersję zawsze znajdziesz na tej stronie, a zmiany odnotowuję poniżej.</p>
      <ul className="prawne-historia">
        <li><strong>8 października 2026</strong>: pierwsza wersja polityki prywatności.</li>
        <li><strong>8 października 2026</strong>: dopisany zapis planu („Mój plan”) w pamięci przeglądarki.</li>
      </ul>
    </StronaPrawna>
  );
}
