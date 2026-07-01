/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["puppeteer", "bwip-js", "pg", "pdf-parse"],
  },
};

export default nextConfig;
