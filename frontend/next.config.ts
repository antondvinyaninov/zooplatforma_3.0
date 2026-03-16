import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Генерируем уникальный Build ID для каждого билда
  // Это заставит браузеры загружать новые JS файлы вместо использования кеша
  generateBuildId: async () => {
    // Используем timestamp + random для гарантии уникальности
    return `build-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  },
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zooplatforma.s3.firstvds.ru',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/main',
        destination: '/',
        permanent: true,
      },
    ];
  },
  // Rewrites для main frontend routes
  async rewrites() {
    return [
      // Main frontend routes at root
      { source: '/about', destination: '/main/about' },
      { source: '/announcements', destination: '/main/announcements' },
      { source: '/catalog', destination: '/main/catalog' },
      { source: '/favorites', destination: '/main/favorites' },
      { source: '/friends', destination: '/main/friends' },
      { source: '/friends/:path*', destination: '/main/friends/:path*' },
      { source: '/messenger', destination: '/main/messenger' },
      { source: '/zooassistant', destination: '/main/zooassistant' },
      { source: '/notifications', destination: '/main/notifications' },
      { source: '/org', destination: '/main/org' },
      { source: '/org/:path*', destination: '/main/org/:path*' },
      { source: '/pets', destination: '/main/pets' },
      { source: '/pets/:path*', destination: '/main/pets/:path*' },
      { source: '/profile', destination: '/main/profile' },
      { source: '/profile/:path*', destination: '/main/profile/:path*' },
      { source: '/services', destination: '/main/services' },
      { source: '/statistics', destination: '/main/statistics' },
      { source: '/support', destination: '/main/support' },
      { source: '/team', destination: '/main/team' },
      { source: '/pet-cards-demo', destination: '/main/pet-cards-demo' },
      { source: '/id:ident', destination: '/main/id:ident' },
    ];
  },
};

export default nextConfig;
