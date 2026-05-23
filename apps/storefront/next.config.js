/** @type {import('next').NextConfig} */
const cmsUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3001";
const { hostname: cmsHostname, protocol: cmsProtocol, port: cmsPort } = new URL(cmsUrl);

const nextConfig = {
  output: "standalone",
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    outputFileTracingExcludes: {
      "*": [
        "node_modules/@swc/**",
        "node_modules/esbuild/**",
        "node_modules/webpack/**",
        "node_modules/next/dist/compiled/webpack/**",
        "node_modules/next/dist/compiled/terser/**",
        "node_modules/rollup/**",
        "node_modules/prettier/**",
        "node_modules/typescript/**",
        "node_modules/prisma/**",
      ],
    },
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
      },
      {
        protocol: cmsProtocol.replace(":", ""),
        hostname: cmsHostname,
        ...(cmsPort ? { port: cmsPort } : {}),
      },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

module.exports = nextConfig;
