/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/?auth=login',
        permanent: false,
      },
      {
        source: '/signup',
        destination: '/?auth=signup',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
