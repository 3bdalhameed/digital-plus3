/** @type {import('next').NextConfig} */
const cmsUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3001";
const { hostname: cmsHostname, protocol: cmsProtocol, port: cmsPort } = new URL(cmsUrl);

const nextConfig = {
  output: "standalone",
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
