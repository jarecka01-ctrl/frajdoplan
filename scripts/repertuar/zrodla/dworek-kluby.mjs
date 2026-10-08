// Kluby Kultury Dworku Białoprądnickiego na własnych subdomenach (np. mydlniki.dworek.eu). Każdy klub ma osobny kalendarz
// /wydarzenia/ o tej samej budowie co dworek.eu (WordPress, karty `article.card`, `time[itemprop=startDate]`, wszystkie
// wydarzenia w jednej odpowiedzi; „Pokaż więcej" tylko rozwija ukryty HTML). Parsowanie i ocena wieku są z ./dworek.mjs.
// Wydarzenia z głównego dworek.eu nie są tu pobierane (robi to moduł `dworek`); powtórzenia między klubami usuwa klucz
// strona|godzina. Cykle zajęć (np. „cykl warsztatów") bez wyraźnego wieku dla dzieci dostają ocenę z dla-dzieci.mjs.
import { pobierz, dzisWarszawa } from '../wspolne.mjs';
import { parsuj, parsujSzczegoly, ocena, kategoriaWydarzenia } from './dworek.mjs';

// subdomena → nazwa klubu (jako `miejsce`)
export const KLUBY = {
  przegorzaly: 'Klub Kultury Przegorzały',
  mydlniki: 'Klub Kultury Mydlniki',
  paleta: 'Klub Kultury Paleta',
  lokietek: 'Klub Kultury Łokietek',
  wena: 'Klub Kultury Wena',
  wola: 'Klub Kultury Wola',
  chelm: 'Klub Kultury Chełm',
};

export { parsuj };

export default {
  id: 'dworek-kluby',
  nazwa: 'Kluby Kultury Dworku Białoprądnickiego',
  url: 'https://mydlniki.dworek.eu/wydarzenia/',
  rodzaj: 'wydarzenia',
  miejsca: [
    ['Klub Kultury Przegorzały', /przegorza/i],
    ['Klub Kultury Mydlniki', /mydlniki/i],
    ['Klub Kultury Paleta', /\bpaleta\b/i],
    ['Klub Kultury Łokietek', /łokietek/i],
    ['Klub Kultury Wena', /\bwena\b/i],
    ['Klub Kultury Wola', /klub kultury wola/i],
    ['Klub Kultury Chełm', /klub kultury chełm/i],
  ],
  async pobierz() {
    const dzis = dzisWarszawa();
    const wynik = [];
    for (const [sub, miejsce] of Object.entries(KLUBY)) {
      let lista;
      try {
        lista = parsuj(await pobierz(`https://${sub}.dworek.eu/wydarzenia/`, { robots: true }));
      } catch (e) {
        console.warn(`dworek-kluby: ${sub}: ${e.message}`); // jeden klub nie psuje reszty
        continue;
      }
      for (const w of lista) {
        if (w.data < dzis) continue; // minione nie potrzebują strony szczegółów
        const s = parsujSzczegoly(await pobierz(w.strona, { robots: true }));
        const o = ocena(w, s);
        const { kategoria, typ } = kategoriaWydarzenia(w.badge, w.tytul);
        wynik.push({
          tytul: w.tytul, data: w.data, godzina: w.godzina, miejsce, kategoria, typ,
          wiek: o.wiek, cena: s.cena, strona: w.strona, link: '', dlaDzieci: o.dlaDzieci,
        });
      }
    }
    return [...new Map(wynik.map((w) => [`${w.strona}|${w.godzina}`, w])).values()];
  },
};
