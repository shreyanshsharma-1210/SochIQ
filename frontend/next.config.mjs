/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    // Avoid build interruptions for minor styling warnings on production deploy
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Avoid build interruptions for minor type discrepancies on production deploy
    ignoreBuildErrors: false,
  },
};

export default nextConfig;

