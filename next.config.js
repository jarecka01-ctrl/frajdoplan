/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // stare adresy działu Sport (301)
      { source: '/treningi', destination: '/sport', statusCode: 301 },
      { source: '/treningi/:dyscyplina', destination: '/sport/:dyscyplina', statusCode: 301 },
    ];
  },
};

module.exports = nextConfig;
