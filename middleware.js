import { NextResponse } from 'next/server';

// Indeksowanie tylko na produkcyjnej domenie z SITE_URL (domyślnie frajdoplan.pl) i w środowisku „production" Vercela.
// Każdy inny host (podgląd, frajdoplan.vercel.app, localhost) dostaje X-Robots-Tag: noindex, nofollow.
const hostSerwisu = () => {
  try { return new URL(process.env.SITE_URL || 'https://frajdoplan.pl').host.toLowerCase(); } catch (e) { return 'frajdoplan.pl'; }
};

export function middleware(request) {
  const host = String(request.headers.get('x-forwarded-host') || request.headers.get('host') || '').split(',')[0].trim().toLowerCase();
  const odpowiedz = NextResponse.next();
  if (process.env.VERCEL_ENV !== 'production' || host !== hostSerwisu()) {
    odpowiedz.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return odpowiedz;
}

export const config = { matcher: ['/((?!_next/static|_next/image|brand/|favicon|apple-touch|icon-|site.webmanifest).*)'] };
