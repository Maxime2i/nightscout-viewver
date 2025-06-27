import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimisations SEO et performance
  compress: true,
  
  // Headers pour SEO et sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirection pour trailing slash
  async redirects() {
    return [
      {
        source: '/:path*/',
        destination: '/:path*',
        permanent: true,
      },
    ];
  },

  // Optimisation des images
  images: {
    formats: ['image/webp', 'image/avif'],
  },

  // Experimental features pour les performances
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
};

export default nextConfig;
