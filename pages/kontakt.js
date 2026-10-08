import Link from 'next/link';
import StronaPrawna, { Email } from '../components/StronaPrawna';
import { seoStrony } from '../lib/seo';

export async function getStaticProps() {
  const seo = await seoStrony('/kontakt', {
    tytul: 'Kontakt | Frajdoplan',
    opis: 'Napisz do Frajdoplanu: zgłoś błąd lub nieaktualną informację, podpowiedz miejsce albo wydarzenie dla dzieci w Krakowie.',
    h1: 'Kontakt',
    wstep: '',
  }, 0);
  return { props: { seo }, revalidate: 3600 };
}

export default function Kontakt({ seo }) {
  return (
    <StronaPrawna seo={seo} nazwa="Kontakt">
      <p className="lead">
        Napisz do mnie: <Email />
      </p>
      <p>Odpowiadam zwykle w ciągu kilku dni roboczych.</p>

      <h2>O czym możesz napisać</h2>
      <ul>
        <li>o błędzie na stronie,</li>
        <li>o nieaktualnej informacji (zmieniła się godzina, cena, adres albo wydarzenie się nie odbędzie),</li>
        <li>o miejscu lub wydarzeniu dla dzieci, które warto dodać,</li>
        <li>o współpracy.</li>
      </ul>
      <p>
        Żeby szybciej pomóc, podaj w wiadomości adres strony, której dotyczy sprawa, i krótki opis. Twoją wiadomość przetwarzam tylko
        po to, żeby odpowiedzieć. Szczegóły są w <Link href="/polityka-prywatnosci">polityce prywatności</Link>.
      </p>
    </StronaPrawna>
  );
}
