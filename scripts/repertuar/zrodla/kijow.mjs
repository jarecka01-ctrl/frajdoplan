// Kino Kijów.Centrum — system sprzedaży MSI (kupbilet.kijow.pl).
// Strona miesiąca ma w kodzie gotową listę `var RepertoireEvents = [{ 'Id', 'Name', 'Date', 'Hour', … }]`.
import { pobierz, dzisWarszawa, godzina, rozbierzTytul, pad } from '../wspolne.mjs';

const BAZA = 'https://kupbilet.kijow.pl';
const tekstPola = (blok, pole) => {
  const m = blok.match(new RegExp(`'${pole}':\\s*'((?:\\\\'|[^'])*)'`));
  return m ? m[1].replace(/\\'/g, "'") : '';
};

export default {
  id: 'kijow',
  nazwa: 'Kino Kijów',
  url: 'https://kijow.pl/repertuar/',
  async pobierz() {
    const [r, m] = dzisWarszawa().split('-').map(Number);
    const miesiace = [`${r}-${pad(m)}`, m === 12 ? `${r + 1}-01` : `${r}-${pad(m + 1)}`];
    const seanse = [];
    for (const miesiac of miesiace) {
      const html = await pobierz(`${BAZA}/MSI/mvc/pl?sort=Date&date=${miesiac}`);
      const lista = html.match(/var RepertoireEvents\s*=\s*\[([\s\S]*?)\];/);
      if (!lista) continue;
      for (const blok of lista[1].split(/\},\s*\{/)) {
        const id = (blok.match(/'Id':\s*(\d+)/) || [])[1];
        const [dd, mm, rrrr] = tekstPola(blok, 'Date').split('.');
        if (!id || !rrrr) continue;
        const { tytul, wersja } = rozbierzTytul(tekstPola(blok, 'Name'));
        const opis = tekstPola(blok, 'Description');
        seanse.push({
          tytul,
          data: `${rrrr}-${mm}-${dd}`,
          godzina: godzina(tekstPola(blok, 'Hour')),
          miejsce: 'Kino Kijów',
          wersja,
          link: `${BAZA}/MSI/Default.aspx?event_id=${id}&typetran=0`,
          // Kijów nie podaje wieku ani gatunku. Seanse z dubbingiem to w praktyce filmy dla dzieci.
          dlaDzieci: wersja === 'dubbing' || /animowan|animacj|familijn|przedszkol|dla najmłodszych/i.test(opis),
          inne: /^(spektakl|opera)\b/i.test(tytul),
        });
      }
    }
    return seanse.filter((s) => !s.inne);
  },
};
