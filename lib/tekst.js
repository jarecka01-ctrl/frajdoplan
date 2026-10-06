// Skracanie tytułów i opisów do długości, którą pokazuje Google (tytuł ok. 60 znaków, opis ok. 155).
export function przytnij(tekst, max) {
  const t = String(tekst || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const ciete = t.slice(0, max - 1);
  return `${ciete.slice(0, Math.max(ciete.lastIndexOf(' '), max - 25)).replace(/[\s,.:;–-]+$/, '')}…`;
}

// „Nazwa | Frajdoplan" — marka dopisana tylko wtedy, gdy mieści się w 60 znakach.
export const przytnijTytul = (podstawa, marka = 'Frajdoplan', max = 60) => {
  const z = `${podstawa} | ${marka}`;
  return z.length <= max ? z : przytnij(podstawa, max);
};
