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
  const pdf = `${adres}/weekend?pdf=1&utm_source=newsletter&utm_medium=email&utm_campaign=${kampania}`;
  const zakres = zakresPl(sob, nd);
  const temat = `Weekend z dzieckiem w Krakowie: ${zakres}`;
  const pre = ileWszystkich
    ? `${ileWszystkich} ${liczbaPl(ileWszystkich, 'wydarzenie', 'wydarzenia', 'wydarzeń')} w sobotę i niedzielę${ileBezplatnych ? `, w tym ${ileBezplatnych} bezpłatnych` : ''}.${typy[0] ? ` Nasz typ: ${typy[0].nazwa}.` : ''}`
    : 'Plan weekendu dla dzieci w Krakowie.';
  const lead = 'Co robić z dzieckiem w ten weekend? Oto nasz wybór na sobotę i niedzielę, z godzinami, miejscem i ceną.';

  // ---------- HTML (wygląd „Plakat": ciemny nagłówek, kolorowe naklejki w „Naszych typach", lekka lista) ----------
  const FD = "font-family:'Baloo 2','Arial Rounded MT Bold','Trebuchet MS',Arial,sans-serif;";
  const FB = 'font-family:Arial,Helvetica,sans-serif;';
  const img = (sciezka) => `${adres}/brand/${sciezka}`;
  const plakietka = (w) => (w.bezplatne ? ` <span style="${FB}background:#EAF5EC;color:${KOLOR.zielen};font-size:12px;font-weight:bold;padding:2px 7px;border-radius:9px;white-space:nowrap;">bezpłatne</span>` : '');
  const tytul = (w, rozmiar, kolor) => {
    const t = `<span style="${FD}font-size:${rozmiar}px;font-weight:bold;line-height:1.25;color:${kolor};">${w.link ? `<a href="${esc(w.link)}" style="color:${kolor};text-decoration:none;border-bottom:2px solid ${KOLOR.slonce};">${esc(w.nazwa)}</a>` : esc(w.nazwa)}</span>`;
    return t;
  };
  // miejsce, ulica (link do mapy), wiek, cena; przy wielu lokalizacjach: liczba i lista linków do poszczególnych miejsc
  const detale = (w, kolor = KOLOR.tusz2, kolorLinku = KOLOR.tusz) => {
    const czesci = [esc(miejsceOpis(w)), w.lokalizacje ? '' : (w.ulica ? `<a href="${adresMapy(w.ulica)}" style="color:${kolor};text-decoration:underline;">${esc(w.ulica)}</a>` : ''), esc(w.wiek), w.bezplatne ? '' : esc(w.cena)].filter(Boolean);
    let h = czesci.length ? `<div style="${FB}font-size:13px;line-height:1.5;color:${kolor};margin-top:2px;">${czesci.join(' &middot; ')}</div>` : '';
    if (w.lokalizacje) {
      h += `<div style="${FB}font-size:13px;line-height:1.7;color:${kolor};margin-top:3px;">${w.lokalizacje.map((l) => {
        const rozne = w.lokalizacje.some((x) => (x.godz || []).join() !== (l.godz || []).join());
        const nazwa = l.link ? `<a href="${esc(l.link)}" style="color:${kolorLinku};text-decoration:underline;">${esc(l.nazwaMiejsca)}</a>` : esc(l.nazwaMiejsca);
        return nazwa + (rozne && (l.godz || []).length ? ` <span style="color:${KOLOR.mak};font-weight:bold;">${esc(l.godz.join(', '))}</span>` : '');
      }).join(' &middot; ')}</div>`;
    }
    return h;
  };
  // „Nasze typy": kolorowe naklejki (słońce, mak, kreda) z twardym cieniem; cień znika w Outlooku, układ zostaje
  const KOLORY_TYPOW = [[KOLOR.slonce, KOLOR.tusz], [KOLOR.mak, KOLOR.papier], [KOLOR.kreda, KOLOR.tusz]];
  const typ = (w, i) => {
    const [tlo, tekst] = KOLORY_TYPOW[i % 3];
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px 0;background:${tlo};border:2px solid ${KOLOR.tusz};border-radius:16px;box-shadow:4px 4px 0 ${KOLOR.tusz};"><tr><td style="padding:14px 18px;">`
      + `<div style="${FB}font-size:12px;font-weight:bold;color:${tekst};">${esc(w.dzienNazwa ? `${w.dzienNazwa}, ` : '')}${esc(godzinyOpis(w))}</div>`
      + `<div style="${FD}font-size:22px;font-weight:bold;line-height:1.15;color:${tekst};margin-top:2px;">${w.link ? `<a href="${esc(w.link)}" style="color:${tekst};text-decoration:none;">${esc(w.nazwa)}</a>` : esc(w.nazwa)}</div>`
      + detale(w, tekst, tekst).replace(/<span style="color:#E4483A;font-weight:bold;">/g, `<span style="color:${tekst};font-weight:bold;">`)
      + '</td></tr></table>';
  };
  const rzad = (w, kol) => `<tr><td valign="top" width="14" style="width:14px;padding:2px 0 12px 0;"><div style="width:5px;height:40px;background:${kol};border-radius:3px;font-size:0;line-height:0;">&nbsp;</div></td>`
    + `<td valign="top" width="68" style="width:68px;padding:2px 8px 12px 0;${FD}font-size:16px;font-weight:bold;line-height:1.25;color:${KOLOR.tusz};">${esc(w.godz && w.godz.length ? w.godz.slice(0, 2).join(', ') : 'cały dzień')}${w.godz && w.godz.length > 2 ? `<div style="${FB}font-size:11px;font-weight:normal;color:${KOLOR.tusz2};">+${w.godz.length - 2} więcej</div>` : ''}</td>`
    + `<td valign="top" style="padding:0 0 12px 0;">${tytul(w, 16, KOLOR.tusz)}${plakietka(w)}${detale(w)}</td></tr>`;
  const dzienBlok = (d, i) => `<tr><td style="padding:22px 24px 0 24px;"><div style="${FD}font-size:26px;font-weight:bold;line-height:1.1;color:${KOLOR.tusz};margin-bottom:10px;">${esc(d.nazwa)} <span style="font-size:18px;color:${KOLOR.tusz2};">${esc(dataPl(d.iso))}</span></div>`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${d.wiersze.map((w) => rzad(w, i ? KOLOR.mak : KOLOR.slonce)).join('')}</table></td></tr>`;

  const bloki = [];
  if (typy.length) bloki.push(`<tr><td style="padding:20px 24px 8px 24px;background:${KOLOR.kreda};"><div style="${FD}font-size:22px;font-weight:bold;color:${KOLOR.tusz};margin-bottom:12px;">Nasze typy</div>${typy.map(typ).join('')}</td></tr>`);
  dni.forEach((d, i) => { if (d.wiersze.length) bloki.push(dzienBlok(d, i)); });
  if (!bloki.length) bloki.push(`<tr><td style="${FB}padding:22px 28px 0 28px;font-size:16px;color:${KOLOR.tusz};">Na ten weekend nie mamy jeszcze wydarzeń w kalendarzu. Zajrzyj na stronę, bo lista uzupełnia się na bieżąco.</td></tr>`);

  const html = `<!DOCTYPE html>
<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(temat)}</title>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:${KOLOR.kreda};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(pre)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${KOLOR.kreda};"><tr><td align="center" style="padding:18px 10px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${KOLOR.papier};border:2px solid ${KOLOR.tusz};border-radius:18px;overflow:hidden;">
<tr><td style="background:${KOLOR.tusz};padding:24px 26px 6px 26px;"><img src="${img('nowe/logo-header-jasne.png')}" width="190" alt="Frajdoplan – co robić z dzieckiem w Krakowie" style="display:block;border:0;"></td></tr>
<tr><td style="background:${KOLOR.tusz};padding:8px 26px 26px 26px;"><h1 style="${FD}margin:0;font-size:36px;line-height:1.05;color:${KOLOR.papier};">Weekend z dzieckiem<br>w&nbsp;Krakowie</h1>
<div style="display:inline-block;margin-top:12px;background:${KOLOR.slonce};color:${KOLOR.tusz};${FD}font-size:18px;font-weight:bold;padding:3px 14px;border-radius:14px;">${esc(zakres)}</div>
<p style="${FB}margin:12px 0 0 0;font-size:14px;line-height:1.5;color:#D9D4C7;">${esc(lead)}</p></td></tr>
<tr><td style="background:${KOLOR.kreda};padding:0;border-top:3px solid ${KOLOR.slonce};"><img src="${img('krakow-baner.png')}" width="600" alt="" style="display:block;width:100%;height:auto;border:0;"></td></tr>
${bloki.join('\n')}
<tr><td align="center" style="padding:26px 28px 6px 28px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:${KOLOR.slonce};border:2px solid ${KOLOR.tusz};border-radius:12px;box-shadow:4px 4px 0 ${KOLOR.tusz};"><a href="${wszystkie}" style="${FD}display:inline-block;padding:13px 26px;font-size:18px;font-weight:bold;color:${KOLOR.tusz};text-decoration:none;">Zobacz weekend na stronie</a></td></tr></table>
<p style="${FB}margin:16px 0 0 0;font-size:13px;line-height:1.5;color:${KOLOR.tusz2};">Na stronie zapiszesz wydarzenia do swojego planu i udostępnisz go rodzinie lub znajomym.<br>Wolisz papier albo plik? <a href="${pdf}" style="color:${KOLOR.tusz};text-decoration:underline;">Zapisz ten weekend jako PDF</a>.</p></td></tr>
<tr><td style="height:24px;font-size:0;line-height:24px;">&nbsp;</td></tr>
<tr><td align="center" style="${FB}background:${KOLOR.kreda};padding:22px 28px 26px 28px;font-size:12px;line-height:1.7;color:${KOLOR.tusz2};border-top:2px solid ${KOLOR.tusz};">
<img src="${img('nowe/logo-slowo.png')}" width="130" alt="Frajdoplan" style="display:block;margin:0 auto 12px auto;border:0;">
Brakuje wydarzenia? <a href="${adres}/dodaj/wydarzenie?utm_source=newsletter&utm_medium=email&utm_campaign=${kampania}" style="color:${KOLOR.tusz};">Dodaj je</a>.<br>
Dostajesz tę wiadomość, bo ten adres e-mail zapisano na newsletter Frajdoplanu.<br><a href="{{ unsubscribe }}" style="color:${KOLOR.tusz2};">Wypisz się</a> w dowolnym momencie.</td></tr>
</table></td></tr></table></body></html>`;

  // ---------- tekst ----------
  const liniaTekst = (w) => `${w.dzienNazwa ? `${w.dzienNazwa} ` : ''}${godzinyOpis(w)}  ${w.nazwa}${szczegoly(w).length ? `\n   ${szczegoly(w).join(' · ')}` : ''}${w.lokalizacje ? w.lokalizacje.map((l) => `\n   - ${l.nazwaMiejsca}${l.link ? `: ${l.link}` : ''}`).join('') : (w.link ? `\n   ${w.link}` : '')}`;
  const czesci = [`Weekend z dzieckiem w Krakowie (${zakres})`, '', lead, ''];
  if (typy.length) czesci.push('NASZE TYPY', ...typy.map(liniaTekst), '');
  dni.forEach((d) => { if (d.wiersze.length) czesci.push(`${d.nazwa.toUpperCase()}, ${dataPl(d.iso)}`, ...d.wiersze.map(liniaTekst), ''); });
  czesci.push(`Weekend na stronie: ${wszystkie}`, `Zapisz jako PDF: ${pdf}`, '', 'Dostajesz tę wiadomość, bo ten adres e-mail zapisano na newsletter Frajdoplanu.', 'Wypisz się: {{ unsubscribe }}');
  return { temat, preheader: pre, html, tekst: czesci.join('\n') };
}
