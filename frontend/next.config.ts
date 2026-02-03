/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'openf1.org',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'media.formula1.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'www.formula1.com',
        pathname: '**',
      },
    ],
  },
};

module.exports = nextConfig;