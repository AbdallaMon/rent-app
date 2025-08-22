/** @type {import('next').NextConfig} */
const nextConfig = {
  // إعدادات محسنة للنشر على Vercel
  experimental: {
    // تحسين الأداء
    serverComponentsExternalPackages: ['@prisma/client']
  },
  
  // إعدادات Prisma
  webpack: (config) => {
    config.externals = [...config.externals, '@prisma/client'];
    return config;
  },
  
  // إعدادات البيئة
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    SECRET_KEY: process.env.SECRET_KEY,
  },
  
  // إعدادات الإنتاج
  ...(process.env.NODE_ENV === 'production' && {
    output: 'standalone',
    poweredByHeader: false,
    compress: true,
  }),
  
  // إعدادات CORS للـ API
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
};

export default nextConfig;
