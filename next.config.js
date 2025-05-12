/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['localhost', 'res.cloudinary.com', 'unpkg.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.openstreetmap.org',
      },
      {
        protocol: 'https',
        hostname: 'unpkg.com',
      },
    ],
  },
  async headers() {
    return [
      {
        // 匹配所有 API 路由
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      },
      {
        // 匹配靜態資源
        source: "/_next/static/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" }
        ]
      },
      {
        // 匹配 Leaflet 圖標和圖磚
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" }
        ]
      },
    ]
  },
  basePath: '',
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: '/:path*',
      },
    ];
  },
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
};

module.exports = nextConfig; 