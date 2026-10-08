/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Strona planu z linku: bez indeksowania i bez przekazywania adresu (z zakodowanym planem) jako referera dalej
  async headers() {
    return [{ source: '/plan', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }, { key: 'Referrer-Policy', value: 'no-referrer' }] }];
  },
  async redirects() {
    return [
      // stare adresy działu Sport (301)
      { source: '/treningi', destination: '/sport', statusCode: 301 },
      { source: '/treningi/:dyscyplina', destination: '/sport/:dyscyplina', statusCode: 301 },
    ];
  },
};

module.exports = nextConfig;
