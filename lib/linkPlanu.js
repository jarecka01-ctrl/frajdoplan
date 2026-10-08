// Link do planu: https://…/plan?p=…  (JSON → kompresja deflate → base64url). Serwer niczego nie przechowuje: cały plan jest w adresie.
// Pierwszy znak parametru to format: „z" = skompresowany, „j" = sam JSON (gdy przeglądarka nie umie kompresować).
import { planDoPayloadu, payloadDoPlanu } from './plan';

export const MAKS_DLUGOSC_LINKU = 2000; // dłuższe adresy bywają ucinane przez komunikatory i poczty
const MAKS_ROZPAKOWANE = 64 * 1024; // zabezpieczenie przed „bombą" w sfałszowanym linku

const doBase64Url = (bajty) => {
  let s = '';
  bajty.forEach((b) => { s += String.fromCharCode(b); });
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const zBase64Url = (tekst) => {
  const bin = atob(tekst.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

async function przepusc(bajty, strumien, maks = Infinity) {
  const czytnik = new Blob([bajty]).stream().pipeThrough(strumien).getReader();
  const kawalki = [];
  let suma = 0;
  for (;;) {
    const { done, value } = await czytnik.read();
    if (done) break;
    suma += value.length;
    if (suma > maks) { czytnik.cancel(); throw new Error('za duże'); }
    kawalki.push(value);
  }
  const wynik = new Uint8Array(suma);
  let przesuniecie = 0;
  kawalki.forEach((k) => { wynik.set(k, przesuniecie); przesuniecie += k.length; });
  return wynik;
}

export async function zakodujPlan(payload) {
  const bajty = new TextEncoder().encode(JSON.stringify(payload));
  if (typeof CompressionStream === 'function') {
    try { return `z${doBase64Url(await przepusc(bajty, new CompressionStream('deflate-raw')))}`; } catch (e) { /* spadamy do zapisu bez kompresji */ }
  }
  return `j${doBase64Url(bajty)}`;
}

// Zwraca { nazwa, utworzono, pozycje, odciski } albo rzuca błąd z kodem: 'brak' (pusty), 'stara' (przeglądarka nie umie rozpakować), 'uszkodzony'.
export async function odkodujPlan(parametr) {
  const p = String(parametr || '');
  if (!p) throw Object.assign(new Error('brak'), { kod: 'brak' });
  if (p.length > 8000 || !/^[zj][A-Za-z0-9_-]+$/.test(p)) throw Object.assign(new Error('uszkodzony'), { kod: 'uszkodzony' });
  try {
    let bajty = zBase64Url(p.slice(1));
    if (p[0] === 'z') {
      if (typeof DecompressionStream !== 'function') throw Object.assign(new Error('stara'), { kod: 'stara' });
      bajty = await przepusc(bajty, new DecompressionStream('deflate-raw'), MAKS_ROZPAKOWANE);
    }
    const plan = payloadDoPlanu(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bajty)));
    if (!plan) throw new Error('to nie plan');
    return plan;
  } catch (e) {
    throw e.kod ? e : Object.assign(new Error('uszkodzony'), { kod: 'uszkodzony' });
  }
}

// { url, dlugosc, zaDlugi }: `origin` to adres strony użytkownika (działa też na adresach testowych); `odciski`: klucz pozycji → odcisk.
export async function zbudujLinkPlanu(origin, plan, odciski, dzienUtworzenia) {
  const parametr = await zakodujPlan(planDoPayloadu(plan, odciski, dzienUtworzenia));
  const url = `${origin}/plan?p=${parametr}`;
  return { url, dlugosc: url.length, zaDlugi: url.length > MAKS_DLUGOSC_LINKU };
}
