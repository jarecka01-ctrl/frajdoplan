// Kino Mikro (ul. Lea 5 i Galeria Bronowice) — publiczny JSON, z którego korzysta strona kina.
import { pobierz, godzina, rozbierzTytul } from '../wspolne.mjs';

const BAZA = 'https://bilety.kinomikro.pl';

export default {
  id: 'mikro',
  nazwa: 'Kino Mikro',
  url: 'https://kinomikro.pl/repertuar/',
  async pobierz() {
    const dane = await pobierz(`${BAZA}/service.php/repertoire/list.json?limit=300&advanced=1`, { json: true });
    return Object.values(dane.repertoires || {}).map((r) => {
      const { tytul, wersja } = rozbierzTytul(r.title);
      const opis = String(r.event?.description || '').replace(/<[^>]+>/g, ' ');
      const bronowice = /bronowice/i.test(`${r.location?.name} ${r.location?.institution_name}`);
      return {
        tytul,
        data: String(r.date).slice(0, 10),
        godzina: godzina(String(r.date).slice(11, 16)),
        miejsce: bronowice ? 'Kino Mikro Bronowice' : 'Kino Mikro',
        sala: r.location?.name || '',
        wersja,
        gatunek: r.event?.category || '',
        link: r.url ? `${BAZA}${r.url}` : '',
        // Mikro nie podaje wieku. Dla dzieci: dubbing albo opis o animacji / przedszkolakach.
        dlaDzieci: wersja === 'dubbing' || /animacj|animowan|familijn|przedszkol|dla najmłodszych/i.test(opis),
      };
    });
  },
};
