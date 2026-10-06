import { NextResponse } from 'next/server';

// Indeksowanie tylko na produkcyjnej domenie głównej. Na każdym innym hoście (podgląd Vercela, frajdoplan.vercel.app, inne domeny)
// i w środowisku innym niż produkcja wysyłamy X-Robots-Tag: noindex, nofollow. Kod jest powtórzony z lib/seo.js, bo middleware działa osobno (Edge).
const SITE_HOST = new URL((process.env.SITE_URL || 'https://frajdoplan.pl').replace(/\/+$/, '')).host.toLowerCase();

export function middleware(req) {
  const res = NextResponse.next();
  const host = (req.headers.get('host') || '').toLowerCase();
  if (process.env.VERCEL_ENV !== 'production' || host !== SITE_HOST) res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}

export const config = { matcher: ['/((?!_next/static|_next/image).*)'] };
