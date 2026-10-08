import Link from 'next/link';
import StronaPrawna, { Administrator, Email } from '../components/StronaPrawna';
import { seoStrony } from '../lib/seo';

export async function getStaticProps() {
  const seo = await seoStrony('/regulamin', {
    tytul: 'Regulamin serwisu | Frajdoplan',
    opis: 'Zasady korzystania z serwisu Frajdoplan: informacyjny katalog miejsc i wydarzeń dla dzieci w Krakowie.',
    h1: 'Regulamin serwisu',
    wstep: '',
  }, 0);
  return { props: { seo }, revalidate: 3600 };
}

export default function Regulamin({ seo }) {
  return (
    <StronaPrawna seo={seo} nazwa="Regulamin" aktualizacja="8 października 2026">
      <h2>1. Czym jest serwis</h2>
      <p>
        Frajdoplan (frajdoplan.pl) to bezpłatny, informacyjny katalog miejsc i wydarzeń dla rodziców: co robić z dzieckiem w Krakowie
        i okolicy. Serwis prowadzi <Administrator />, osoba fizyczna. Z serwisu można korzystać bez zakładania konta.
      </p>

      <h2>2. Skąd są dane i dlaczego warto je sprawdzić</h2>
      <p>
        Informacje o miejscach i wydarzeniach pochodzą od organizatorów i z publicznych źródeł, takich jak strony teatrów, kin, domów
        kultury i Mapy Google. Godziny, ceny, adresy i terminy mogą się zmienić, a wydarzenia mogą zostać odwołane. Przed wyjściem
        z domu warto potwierdzić najważniejsze szczegóły u organizatora.
      </p>

      <h2>3. Zakres odpowiedzialności</h2>
      <p>
        Serwis nie sprzedaje biletów ani nie zawiera umów z organizatorami. Linki prowadzą do stron organizatorów i sprzedawców, a ich
        oferta i zasady są od nich zależne. Dokładam starań, żeby informacje były aktualne, ale nie odpowiadam za ich kompletność,
        za treść i jakość usług organizatorów ani za skutki decyzji podjętych na podstawie informacji z serwisu.
      </p>

      {/*
        Szablon, odkomentować TYLKO wtedy, gdy na stronie pojawi się link partnerski (dziś ich nie ma):
        <h2>Linki partnerskie</h2>
        <p>
          Część linków w serwisie to linki partnerskie. Gdy z nich skorzystasz i dokonasz zakupu, serwis może otrzymać prowizję.
          Cena dla Ciebie się nie zmienia, a oznaczenie takich linków jest widoczne przy nich.
        </p>
      */}

      <h2>4. Prawa autorskie</h2>
      <p>
        Układ, teksty, grafiki, nazwa i znak Frajdoplan są chronione prawem autorskim. Nie wolno ich kopiować ani rozpowszechniać
        bez zgody administratora, poza dozwolonym użytkiem. Nazwy, opisy i znaki miejsc, organizatorów i wydarzeń należą do ich
        właścicieli i są używane wyłącznie informacyjnie.
      </p>

      <h2>5. Dane osobowe</h2>
      <p>
        Zasady przetwarzania danych osobowych opisuje <Link href="/polityka-prywatnosci">polityka prywatności</Link>.
      </p>

      <h2>6. Kontakt</h2>
      <p>
        Uwagi, zgłoszenia błędów i pytania wysyłaj na adres <Email />. Więcej na stronie <Link href="/kontakt">Kontakt</Link>.
      </p>

      <h2>7. Zmiany regulaminu</h2>
      <p>Aktualna wersja jest zawsze na tej stronie, a data ostatniej zmiany na jej górze.</p>
    </StronaPrawna>
  );
}
