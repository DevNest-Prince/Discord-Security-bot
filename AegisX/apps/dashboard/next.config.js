const path = require('path');
const dotenv = require('dotenv');

// Automatically load environment variables from monorepo root .env and local .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
      },
    ],
  },
  env: {
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
    NEXT_PUBLIC_DASHBOARD_API_KEY: process.env.NEXT_PUBLIC_DASHBOARD_API_KEY || process.env.DASHBOARD_API_KEY,
    NEXT_PUBLIC_BRAND_NAME: process.env.NEXT_PUBLIC_BRAND_NAME || 'AegisX',
    NEXT_PUBLIC_BRAND_NAME_WORD: process.env.NEXT_PUBLIC_BRAND_NAME_WORD || 'AX',
  },
  webpack: (config) => {
    config.cache = false;
    return config;
  },
};

module.exports = nextConfig;