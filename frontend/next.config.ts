import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Генерируем уникальный Build ID для каждого билда
  // Это заставит браузеры загружать новые JS файлы вместо использования кеша
  generateBuildId: async () => {
    // Используем timestamp + random для гарантии уникальности
    return `build-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  },
  output: 'standalone',
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
        protocol: 'https',
        hostname: '*.vkuserphoto.ru',
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
  async rewrites() {
    return [
      // WebSocket backend proxy
      { source: '/ws', destination: 'http://127.0.0.1:8000/ws' },
      
      // Global API proxy for backend REST routes
      { source: '/api/:path*', destination: 'http://127.0.0.1:8000/api/:path*' },

      // Main frontend routes at root
      { source: '/announcements', destination: '/main/announcements' },
      { source: '/catalog', destination: '/main/catalog' },
      { source: '/favorites', destination: '/main/favorites' },
      { source: '/friends', destination: '/main/friends' },
      { source: '/friends/:path*', destination: '/main/friends/:path*' },
      { source: '/messenger', destination: '/main/messenger' },
      { source: '/zooassistant', destination: '/main/zooassistant' },
      { source: '/notifications', destination: '/main/notifications' },
      { source: '/orgs', destination: '/main/orgs' },
      { source: '/orgs/:path*', destination: '/main/orgs/:path*' },
      // Gov cabinet (кабинет государственных органов)
      { source: '/gov', destination: '/gov' },
      { source: '/gov/:path*', destination: '/gov/:path*' },
      // /org = кабинет организации — rewrite не нужен, обслуживается из app/org/ напрямую
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
