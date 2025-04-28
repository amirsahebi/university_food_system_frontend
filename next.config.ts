import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost', 'javanfoods.com', 'www.javanfoods.com'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'javanfoods.com',
        port: '',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: 'www.javanfoods.com',
        port: '',
        pathname: '/media/**',
      }
    ],
    unoptimized: false,
  },
};

export default nextConfig;
