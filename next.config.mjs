/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["puppeteer", "bwip-js", "pg"],
  },
};

export default nextConfig;
