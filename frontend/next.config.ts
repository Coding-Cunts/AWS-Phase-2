import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:3001';
    return {
      beforeFiles: [
        {
          source: '/api/v1/:path*',
          destination: `${backendUrl}/api/v1/:path*`,
        },
        {
          source: '/api/keys/:path*',
          destination: `${backendUrl}/api/keys/:path*`,
        },
        {
          source: '/api/keys',
          destination: `${backendUrl}/api/keys`,
        },
        {
          source: '/api/analyse',
          destination: `${backendUrl}/api/analyse`,
        },
        {
          source: '/api/analyze-waste',
          destination: `${backendUrl}/api/analyze-waste`,
        },
        {
          source: '/api/health',
          destination: `${backendUrl}/api/health`,
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
