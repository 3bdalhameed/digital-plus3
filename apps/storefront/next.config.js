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
        // Build-only compiler/bundler tooling
        "node_modules/@swc/core/**",
        "node_modules/esbuild/**",
        "node_modules/webpack/**",
        "node_modules/rollup/**",
        "node_modules/typescript/**",
        "node_modules/prettier/**",
        // Build-only CSS tooling (compiled to static files, not needed at runtime)
        "node_modules/tailwindcss/**",
        "node_modules/@tailwindcss/**",
        "node_modules/postcss/**",
        "node_modules/autoprefixer/**",
        "node_modules/cssnano/**",
        "node_modules/lightningcss/**",
        // Next.js compiled build tools (not runtime)
        "node_modules/next/dist/compiled/webpack/**",
        "node_modules/next/dist/compiled/terser/**",
        "node_modules/next/dist/compiled/sass-loader/**",
        "node_modules/next/dist/compiled/css-loader/**",
        "node_modules/next/dist/compiled/postcss-loader/**",
        "node_modules/next/dist/compiled/babel/**",
        "node_modules/next/dist/compiled/babel-packages/**",
        // Prisma CLI (not the client — @prisma/client is still included)
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
