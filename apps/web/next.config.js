const path = require("path");

const catalogFile = path.resolve(
  __dirname,
  "..",
  "..",
  "data",
  "Samples for AI prototype.xlsx"
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_SUPABASE_ANON_KEY,
  },
  experimental: {
    outputFileTracingIncludes: {
      "/api/chat": [catalogFile],
    },
  },
};

module.exports = nextConfig;
