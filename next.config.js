/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // 將 /uploads/* 請求導向 API route，解決 runtime 上傳檔案無法被 Next.js 靜態服務的問題
  async rewrites() {
    return {
      fallback: [
        {
          source: '/uploads/:path*',
          destination: '/api/uploads/:path*',
        },
      ],
    };
  },
};

module.exports = nextConfig;
