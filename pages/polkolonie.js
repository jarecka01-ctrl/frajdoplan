import Uklad from '../components/Uklad';
import Katalog from '../components/Katalog';
import Okruszki from '../components/Okruszki';
import RankingKategorii from '../components/RankingKategorii';
import { listaMiejscJsonLd } from '../lib/jsonld';
import { pobierzDane, rankingMiejsc } from '../lib/dane';

// Poradnik pod listą: tylko ogólne wskazówki, bez cen i terminów (te ustala organizator).
const PORADNIK = {
  tytul: 'Jak wybrać półkolonie dla dziecka',
  punkty: [
    'Rodzaj: wybierz kafelkami nad listą, czy dziecko ma się ruszać (sport, tenis, rower), tworzyć czy poznawać nowe rzeczy. Dobre półkolonie to te, na które dziecko pójdzie chętnie.',
    'Wiek i grupa: zapytaj organizatora, dla jakich dzieci jest turnus i ile osób liczy grupa, bo od tego zależy, ile uwagi dostanie Twoje dziecko.',
    'Godziny i dojazd: sprawdź, od której do której trwa opieka i jak dojedziesz. Przycisk „Blisko mnie” ustawia organizatorów od najbliższego.',
    'Posiłki i wyposażenie: zapytaj, czy w cenie jest obiad i co dziecko ma zabrać ze sobą.',
    'Zapisy: popularne turnusy zapełniają się z wyprzedzeniem, więc zapytaj o wolne miejsca wcześniej, szczególnie na lato.',
    'Ceny i terminy ustala organizator, dlatego podajemy adres, ocenę z Google i link do jego strony, a szczegóły sprawdzisz tam.',
  ],
};

export async function getStaticProps() {
  const wynik = await pobierzDane({
    sekcja: 'polkolonie',
    adres: '/polkolonie',
    teksty: {
      tytul: 'Półkolonie w Krakowie: organizatorzy i oceny',
      opis: 'Półkolonie letnie i zimowe w Krakowie: {liczba} organizatorów z ocenami z Google, adresami i mapą. Wybierz rodzaj półkolonii i znajdź ten blisko domu.',
      h1: 'Półkolonie dla dzieci w Krakowie',
      wstep: 'Szukasz półkolonii dla dziecka w Krakowie? Zebraliśmy {liczba} organizatorów półkolonii letnich i zimowych, z adresami, ocenami z Google i mapą. Wybierz rodzaj kafelkami albo znajdź organizatora blisko domu.',
    },
  });
  if (wynik.props && Array.isArray(wynik.props.places)) {
    wynik.props.ranking = rankingMiejsc(wynik.props.places, 'Najlepiej oceniani organizatorzy półkolonii w Krakowie');
    wynik.props.poradnik = PORADNIK;
  }
  return wynik;
}

export default function Polkolonie({ places, seo, ranking = null, poradnik = null, missingConfig, fetchError }) {
  return (
    <Uklad seo={seo} jsonLd={[listaMiejscJsonLd(places, seo.h1)]} missingConfig={missingConfig} fetchError={fetchError}>
      <Okruszki sciezka={[{ nazwa: 'Półkolonie', href: '/polkolonie' }]} siteUrl={seo.siteUrl} />
      <section className="hero">
        <h1>{seo.h1}</h1>
        <p className="lead">{seo.wstep}</p>
      </section>
      <RankingKategorii ranking={ranking} />
      <Katalog places={places} tytul="Organizatorzy półkolonii" pokazDachPole={false} pokazStrefy={false} placeholder="Szukaj organizatora lub dzielnicy…" />
      {poradnik && (
        <section className="kk-poradnik" aria-labelledby="poradnik-h">
          <h2 id="poradnik-h">{poradnik.tytul}</h2>
          <ul>{poradnik.punkty.map((t) => <li key={t}>{t}</li>)}</ul>
        </section>
      )}
    </Uklad>
  );
}
