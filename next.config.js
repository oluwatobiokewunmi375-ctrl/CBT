const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  productionBrowserSourceMaps: false,
  eslint: { ignoreDuringBuilds: true },
  images: {
    formats: ['image/avif', 'image/webp']
  },
  experimental: {
    serverActions: true
  }
};

module.exports = nextConfig;
