// إصلاح مشكلة Prisma في Vercel
import { PrismaClient } from "@prisma/client";

let prisma;

// إعدادات خاصة لـ Vercel
const prismaConfig = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
};

// في Vercel (الإنتاج)
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    ...prismaConfig,
    // إعدادات محددة للإنتاج
    __internal: {
      engine: {
        connectionLimit: 1, // حد أقل للاتصالات في Vercel
      }
    }
  });
} else {
  // في التطوير المحلي
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      ...prismaConfig,
      __internal: {
        engine: {
          connectionLimit: 5
        }
      }
    });
  }
  prisma = global.prisma;
}

// إضافة middleware لإغلاق الاتصالات تلقائياً
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  // في Vercel، سجل الاستعلامات البطيئة فقط
  if (process.env.NODE_ENV === 'production' && after - before > 1000) {
    console.log(`Query ${params.model}.${params.action} took ${after - before}ms`);
  }
  
  return result;
});

// إغلاق الاتصال عند انتهاء العملية (مهم في Vercel)
if (process.env.NODE_ENV === "production") {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

export default prisma;
