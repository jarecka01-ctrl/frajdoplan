// Składa obraz do udostępniania w mediach społecznościowych (1200x630): public/brand/og-image.png.
// Uruchamiany ręcznie, gdy zmienią się grafiki: node scripts/og-image.mjs
// Wymaga pakietu `playwright` z zainstalowaną przeglądarką (nie jest zależnością serwisu) i @fontsource/baloo-2.
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const katalog = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = (p) => pathToFileURL(path.join(katalog, p)).href;
const font = (plik) => url(`node_modules/@fontsource/baloo-2/files/${plik}.woff2`);

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'Baloo 2';font-weight:700;src:url(${font('baloo-2-latin-700-normal')}) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Baloo 2';font-weight:700;src:url(${font('baloo-2-latin-ext-700-normal')}) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;position:relative;overflow:hidden;background-color:#FFFDF7;
 background-image:radial-gradient(rgba(32,36,43,.10) 1.5px,transparent 1.8px);background-size:30px 30px;font-family:'Baloo 2',sans-serif;color:#20242B}
.ramka{position:absolute;inset:22px;border:3px dashed #d6cdb8;border-radius:28px}
img{position:absolute;display:block}
.logo{left:70px;top:48px;width:560px}
.smok{right:70px;top:34px;height:300px}
h1{position:absolute;left:70px;top:222px;font-weight:700;font-size:104px;line-height:.98;letter-spacing:-.03em}
h1 span{background:linear-gradient(transparent 52%,#F7B32B 52%,#F7B32B 80%,transparent 80%);padding:0 6px}
.baner{right:50px;bottom:40px;width:780px}
</style></head><body><div class="ramka"></div>
<img class="logo" src="${url('public/brand/logo-frajdoplan.png')}">
<img class="smok" src="${url('public/brand/smok.png')}">
<h1>Gdzie <span>dziś</span><br>idziemy?</h1>
<img class="baner" src="${url('public/brand/krakow-baner.png')}">
</body></html>`;

const przegladarka = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const strona = await przegladarka.newPage({ viewport: { width: 1200, height: 630 } });
// plik tymczasowy, bo strona z setContent nie ma dostępu do plików lokalnych
const plik = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'og-')), 'og.html');
fs.writeFileSync(plik, html);
await strona.goto(pathToFileURL(plik).href, { waitUntil: 'load' });
await strona.evaluate(() => document.fonts.ready);
await strona.screenshot({ path: path.join(katalog, 'public/brand/og-image.png') });
await przegladarka.close();
console.log('Zapisano public/brand/og-image.png');
