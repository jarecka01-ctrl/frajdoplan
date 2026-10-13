// Składa treść newslettera na weekend z wydarzeń weekendu: temat, krótki podgląd (preheader), HTML do wklejenia w Brevo i wersję tekstową.
// Czysta logika, bez Reacta (używa jej components/NewsletterGenerator.js). HTML jest „mailowy": tabele i style w atrybutach, bez zewnętrznych arkuszy.
// `{{ unsubscribe }}` to znacznik Brevo; narzędzie samo podstawia w nim link do rezygnacji.
const KOLOR = { papier: '#FFFDF7', tusz: '#20242B', tusz2: '#5B6270', mak: '#E4483A', slonce: '#F7B32B', kreda: '#EFE7D6', zielen: '#2F5D3A' };
const MIESIACE = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const dataPl = (iso) => { const d = new Date(`${iso}T12:00:00Z`); return `${d.getUTCDate()} ${MIESIACE[d.getUTCMonth()]}`; };
export const zakresPl = (a, b) => {
  const da = new Date(`${a}T12:00:00Z`), db = new Date(`${b}T12:00:00Z`);
  return da.getUTCMonth() === db.getUTCMonth() ? `${da.getUTCDate()}–${db.getUTCDate()} ${MIESIACE[db.getUTCMonth()]}` : `${dataPl(a)} – ${dataPl(b)}`;
};
const liczbaPl = (n, jedno, kilka, wiele) => (n === 1 ? jedno : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? kilka : wiele);

export const godzinyOpis = (w) => (w.godz && w.godz.length ? w.godz.slice(0, 3).join(', ') + (w.godz.length > 3 ? ` +${w.godz.length - 3}` : '') : 'cały dzień');
const liczbaLok = (n) => `${n} ${n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'lokalizacje' : 'lokalizacji'}`;
const miejsceOpis = (w) => (w.lokalizacje ? `${liczbaLok(w.lokalizacje.length)}${w.wspolneMiejsce ? `: ${w.wspolneMiejsce}` : ''}` : w.miejsce);
const szczegoly = (w) => [miejsceOpis(w), w.lokalizacje ? '' : w.ulica, w.wiek, w.cena].filter(Boolean);

function adresMapy(ulica) { return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ulica}, Kraków`)}`; }

/*
  wejście: { sob, nd, adres (adres serwisu bez końcowego „/"), dni: [{ nazwa, iso, wiersze }], typy: [wiersz], ileWszystkich, ileBezplatnych }
  wiersz: { nazwa, godz: ['10:00'], miejsce, ulica, wiek, cena, link, bezplatne, dzienNazwa? } (dzienNazwa = „Sobota"/„Niedziela", dla „Naszych typów", które mieszają oba dni)
*/
export function zbudujNewsletter({ sob, nd, adres, dni, typy = [], ileWszystkich = 0, ileBezplatnych = 0 }) {
  const kampania = `weekend-${sob}`;
  const wszystkie = `${adres}/weekend?utm_source=newsletter&utm_medium=email&utm_campaign=${kampania}`;
  const zakres = zakresPl(sob, nd);
  const temat = `Weekend z dzieckiem w Krakowie: ${zakres}`;
  const pre = ileWszystkich
    ? `${ileWszystkich} ${liczbaPl(ileWszystkich, 'wydarzenie', 'wydarzenia', 'wydarzeń')} w sobotę i niedzielę${ileBezplatnych ? `, w tym ${ileBezplatnych} bezpłatnych` : ''}.${typy[0] ? ` Nasz typ: ${typy[0].nazwa}.` : ''}`
    : 'Plan weekendu dla dzieci w Krakowie.';
  const lead = 'Co robić z dzieckiem w ten weekend? Oto nasz wybór na sobotę i niedzielę, z godzinami, miejscem i ceną.';

  // ---------- HTML ----------
  const f = 'font-family:Arial,Helvetica,sans-serif;';
  const wiersz = (w) => {
    // w HTML przy bezpłatnych zamiast ceny jest zielona plakietka; ulica prowadzi do mapy
    const lokHtml = w.lokalizacje
      ? `<div style="font-size:13px;line-height:1.6;color:${KOLOR.tusz2};margin-top:3px;">${w.lokalizacje.map((l) => {
        const rozne = w.lokalizacje.some((x) => (x.godz || []).join() !== (l.godz || []).join());
        const nazwa = l.link ? `<a href="${esc(l.link)}" style="color:${KOLOR.tusz};text-decoration:underline;">${esc(l.nazwaMiejsca)}</a>` : esc(l.nazwaMiejsca);
        return nazwa + (rozne && (l.godz || []).length ? ` <span style="color:${KOLOR.mak};font-weight:bold;">${esc(l.godz.join(', '))}</span>` : '');
      }).join(' · ')}</div>` : '';
    const detale = [esc(miejsceOpis(w)), w.lokalizacje ? '' : w.ulica ? `<a href="${adresMapy(w.ulica)}" style="color:${KOLOR.tusz2};text-decoration:underline;">${esc(w.ulica)}</a>` : '', esc(w.wiek), w.bezplatne ? '' : esc(w.cena)].filter(Boolean);
    const tytul = w.link ? `<a href="${esc(w.link)}" style="color:${KOLOR.tusz};text-decoration:underline;">${esc(w.nazwa)}</a>` : esc(w.nazwa);
    const plakietka = w.bezplatne ? ` <span style="background:#EAF5EC;color:${KOLOR.zielen};font-size:12px;font-weight:bold;padding:1px 6px;border-radius:8px;">bezpłatne</span>` : '';
    return `<tr><td valign="top" width="86" style="${f}padding:10px 8px 10px 0;font-size:15px;font-weight:bold;color:${KOLOR.mak};border-top:1px solid ${KOLOR.kreda};">${w.dzienNazwa ? `<div style="font-size:12px;font-weight:normal;color:${KOLOR.tusz2};">${esc(w.dzienNazwa)}</div>` : ''}${esc(godzinyOpis(w))}</td>`
      + `<td valign="top" style="${f}padding:10px 0;border-top:1px solid ${KOLOR.kreda};"><div style="font-size:16px;font-weight:bold;line-height:1.3;color:${KOLOR.tusz};">${tytul}${plakietka}</div>`
      + (detale.length ? `<div style="font-size:13px;line-height:1.5;color:${KOLOR.tusz2};margin-top:2px;">${detale.join(' · ')}</div>` : '')
      + lokHtml
      + '</td></tr>';
  };
  const sekcja = (tytul, wiersze) => `<tr><td style="padding:22px 28px 0 28px;"><h2 style="${f}margin:0 0 6px 0;font-size:22px;line-height:1.2;color:${KOLOR.tusz};">${esc(tytul)}</h2>`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${wiersze.map(wiersz).join('')}</table></td></tr>`;

  const bloki = [];
  if (typy.length) bloki.push(sekcja('Nasze typy', typy));
  dni.forEach((d) => { if (d.wiersze.length) bloki.push(sekcja(`${d.nazwa}, ${dataPl(d.iso)}`, d.wiersze)); });
  if (!bloki.length) bloki.push(`<tr><td style="${f}padding:22px 28px 0 28px;font-size:16px;color:${KOLOR.tusz};">Na ten weekend nie mamy jeszcze wydarzeń w kalendarzu. Zajrzyj na stronę, bo lista uzupełnia się na bieżąco.</td></tr>`);

  const html = `<!DOCTYPE html>
<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(temat)}</title></head>
<body style="margin:0;padding:0;background:${KOLOR.kreda};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(pre)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${KOLOR.kreda};"><tr><td align="center" style="padding:16px 8px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${KOLOR.papier};border:2px solid ${KOLOR.tusz};">
<tr><td style="padding:24px 28px 0 28px;"><div style="${f}font-size:13px;font-weight:bold;letter-spacing:.06em;text-transform:uppercase;color:${KOLOR.mak};">Frajdoplan · ${esc(zakres)}</div>
<h1 style="${f}margin:6px 0 10px 0;font-size:28px;line-height:1.15;color:${KOLOR.tusz};">Weekend z dzieckiem w Krakowie</h1>
<p style="${f}margin:0;font-size:16px;line-height:1.5;color:${KOLOR.tusz};">${esc(lead)}</p></td></tr>
${bloki.join('\n')}
<tr><td align="left" style="padding:26px 28px 6px 28px;"><a href="${wszystkie}" style="${f}display:inline-block;background:${KOLOR.slonce};color:${KOLOR.tusz};border:2px solid ${KOLOR.tusz};padding:12px 20px;font-size:16px;font-weight:bold;text-decoration:none;border-radius:10px;">Zobacz cały weekend${ileWszystkich ? ` (${ileWszystkich})` : ''}</a>
<p style="${f}margin:12px 0 0 0;font-size:13px;line-height:1.5;color:${KOLOR.tusz2};">Na stronie możesz zapisać wydarzenia do swojego planu i wysłać go partnerowi.</p></td></tr>
<tr><td style="${f}padding:22px 28px 24px 28px;font-size:12px;line-height:1.6;color:${KOLOR.tusz2};border-top:1px solid ${KOLOR.kreda};">
Brakuje wydarzenia? <a href="${adres}/dodaj/wydarzenie?utm_source=newsletter&utm_medium=email&utm_campaign=${kampania}" style="color:${KOLOR.tusz2};">Dodaj je</a>.<br>
Dostajesz tę wiadomość, bo ten adres e-mail zapisano na newsletter Frajdoplanu. <a href="{{ unsubscribe }}" style="color:${KOLOR.tusz2};">Wypisz się</a> w dowolnym momencie.</td></tr>
</table></td></tr></table></body></html>`;

  // ---------- tekst ----------
  const liniaTekst = (w) => `${w.dzienNazwa ? `${w.dzienNazwa} ` : ''}${godzinyOpis(w)}  ${w.nazwa}${szczegoly(w).length ? `\n   ${szczegoly(w).join(' · ')}` : ''}${w.lokalizacje ? w.lokalizacje.map((l) => `\n   - ${l.nazwaMiejsca}${l.link ? `: ${l.link}` : ''}`).join('') : (w.link ? `\n   ${w.link}` : '')}`;
  const czesci = [`Weekend z dzieckiem w Krakowie (${zakres})`, '', lead, ''];
  if (typy.length) czesci.push('NASZE TYPY', ...typy.map(liniaTekst), '');
  dni.forEach((d) => { if (d.wiersze.length) czesci.push(`${d.nazwa.toUpperCase()}, ${dataPl(d.iso)}`, ...d.wiersze.map(liniaTekst), ''); });
  czesci.push(`Cały weekend: ${wszystkie}`, '', 'Dostajesz tę wiadomość, bo ten adres e-mail zapisano na newsletter Frajdoplanu.', 'Wypisz się: {{ unsubscribe }}');
  return { temat, preheader: pre, html, tekst: czesci.join('\n') };
}
