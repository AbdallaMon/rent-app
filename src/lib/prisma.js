import { PrismaClient } from "@prisma/client";

let prisma;

// إعدادات محسنة لتجنب مشكلة max_user_connections
const prismaConfig = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  errorFormat: 'pretty',
};

if (process.env.NODE_ENV === "production") {
  // إعدادات Vercel المحسنة - منع تعدد الاتصالات
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      ...prismaConfig,
      // إعدادات خاصة بـ Vercel
      __internal: {
        engine: {
          connectionLimit: 1, // اتصال واحد فقط
        }
      }
    });
  }
  
  prisma = global.prisma;
} else {
  // إعدادات التطوير المحلي - نفس الطريقة لتجنب المشاكل
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      ...prismaConfig,
      __internal: {
        engine: {
          connectionLimit: 1 // اتصال واحد فقط حتى في التطوير
        }
      }
    });
  }
  prisma = global.prisma;
}

// دالة محسنة للاتصال الآمن مع إعادة المحاولة
export async function ensureConnection() {
  let retries = 3;
  while (retries > 0) {
    try {
      // اختبار الاتصال
      await prisma.$queryRaw`SELECT 1`;
      return prisma;
    } catch (error) {
      console.error(`Database connection attempt failed, retries left: ${retries - 1}`, error.message);
      
      if (error.message.includes('max_user_connections') || error.message.includes('Too many connections')) {
        // إغلاق الاتصال الحالي وإعادة المحاولة
        try {
          await prisma.$disconnect();
        } catch (disconnectError) {
          console.error('Error disconnecting:', disconnectError.message);
        }
        
        // انتظار قصير قبل إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries--;
        
        if (retries === 0) {
          throw new Error('Database connection failed after multiple attempts due to connection limits');
        }
      } else {
        throw error;
      }
    }
  }
}

// دالة محسنة لإغلاق الاتصال
export async function closeConnection() {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error closing database connection:', error.message);
  }
}

// دالة للتحقق من حالة الاتصال
export async function checkConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error.message);
    return false;
  }
}

export default prisma;
