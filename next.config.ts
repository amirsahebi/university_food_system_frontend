import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'javanfoods.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'javanfoods.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'www.javanfoods.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.javanfoods.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'javan-foods.ir',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'javan-foods.ir',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'www.javan-foods.ir',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.javan-foods.ir',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '91.212.174.163',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '91.212.174.163',
        pathname: '/**',
      }
    ],
    unoptimized: false,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*/',
        destination: 'http://localhost:8000/api/:path*/',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
      {
        source: '/media/:path*',
        destination: 'http://localhost:8000/media/:path*',
      },
    ];
  },
};

export default nextConfig;
