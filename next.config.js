/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Strona planu z linku: bez indeksowania i bez przekazywania adresu (z zakodowanym planem) jako referera dalej
  async headers() {
    return [
      { source: '/plan', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }, { key: 'Referrer-Policy', value: 'no-referrer' }] },
      // widok roboczy newslettera i strona po potwierdzeniu zapisu: poza wyszukiwarką
      { source: '/newsletter/generator', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/newsletter/dziekujemy', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ];
  },
  async redirects() {
    return [
      // stare adresy działu Sport (301)
      { source: '/treningi', destination: '/sport', statusCode: 301 },
      { source: '/treningi/:dyscyplina', destination: '/sport/:dyscyplina', statusCode: 301 },
      // lista teatrów to to samo, co filtr „Teatry” na /atrakcje; repertuar jest na /spektakle
      { source: '/atrakcje/teatry', destination: '/spektakle', statusCode: 301 },
      // laser tag i game room połączone w „Interaktywne”
      { source: '/atrakcje/laser-tag', destination: '/atrakcje/interaktywne', statusCode: 301 },
      { source: '/atrakcje/game-room', destination: '/atrakcje/interaktywne', statusCode: 301 },
    ];
  },
};

module.exports = nextConfig;
