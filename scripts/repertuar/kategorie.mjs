// Kategorie wydarzeń (kolumna `kategoria`): koncert, spektakl, warsztaty, pokaz, czytanie, wystawa, jarmark, festyn,
// sport, spacer, planszowki, inne. Moduł źródła nadaje wstępną kategorię z tagów strony, a tu ją dopracowujemy
// na podstawie tytułu i tagów:
//  1. „planszowki" ma wyższy priorytet niż „sport" (gry, puzzle, szachy, quizy…),
//  2. „sport" zostaje tylko przy wyraźnie sportowych słowach; inaczej wydarzenie ląduje w „inne"
//     (wcześniej słowo „gry" trafiało do sportu, np. „Wymiana gier i puzzli" w bibliotece).

const PLANSZOWKI = /planszówk|planszowk|gry planszowe|gier planszowych|gry karciane|gier karcianych|wymiana gier|puzzl|szachy|szachów|szachow|turniej gier|klub gier|quiz|gry logiczne|gier logicznych|dzień gier|dniu gier/i;

const SPORT = /sport|piłk|pilk|(?<![\p{L}])bieg(?:i|u|ów|iem)?(?![\p{L}])|trening|gimnastyk|pływ|rower|narty|nart(?:ach|ami)|łyżw|rolki|zawody|mecz|maraton|karate|judo|wspinacz|koszykówk|siatkówk|tenis|lekkoatlet|hokej|szermierk|(?<![\p{L}])joga|fitness|aerobik|parkour|jazda konna|kajak|żegluj|deskorol|bmx|pumptrack|akrobatyk|zumba|rugby|golf/iu;

export const jestPlanszowka = (tekst) => PLANSZOWKI.test(String(tekst || ''));
export const jestSportowe = (tekst) => SPORT.test(String(tekst || ''));

// `wstepna` — kategoria nadana przez moduł źródła; `tekst` — tytuł (i ewentualnie tagi) wydarzenia.
export function dopracujKategorie(wstepna, tekst) {
  if (jestPlanszowka(tekst)) return 'planszowki';
  if (wstepna === 'sport' && !jestSportowe(tekst)) return 'inne';
  return wstepna || 'inne';
}
