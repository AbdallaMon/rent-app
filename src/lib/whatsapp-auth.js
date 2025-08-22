import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

/**
 * Get current user session with WhatsApp privileges
 */
export async function getWhatsAppSession() {
  const SECRET_KEY = process.env.SECRET_KEY;
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  
  if (!token) {
    return { auth: false, message: "No token provided" };
  }

  try {
    const currentTime = Math.floor(Date.now() / 1000);
    const decoded = jwt.verify(token, SECRET_KEY);

    if (decoded.exp < currentTime) {
      return {
        message: "انتهت الجلسة من فضلك قم بتسجيل الدخول مرة أخرى",
        auth: false,
      };
    }

    if (decoded) {
      const user = await prisma.user.findUnique({
        where: {
          id: decoded.userId,
        },
        include: {
          privileges: {
            include: {
              privilege: true,
            },
          },
        },
      });

      if (!user) {
        return {
          message: "المستخدم غير موجود",
          auth: false,
        };
      }

      // Find WhatsApp privilege
      const whatsappPrivilege = user.privileges.find(p => p.area === 'WHATSAPP');
      
      return {
        message: "تم تسجيل الدخول بنجاح",
        user,
        whatsappPrivilege: whatsappPrivilege?.privilege || null,
        auth: true,
      };
    }
  } catch (error) {
    console.log(error, "error");
    return {
      message: "خطأ في تسجيل الدخول",
      auth: false,
    };
  }
}

/**
 * Check if user has WhatsApp read access
 */
export async function hasWhatsAppReadAccess() {
  const session = await getWhatsAppSession();
  return session.auth && session.whatsappPrivilege?.canRead;
}

/**
 * Check if user has WhatsApp write access
 */
export async function hasWhatsAppWriteAccess() {
  const session = await getWhatsAppSession();
  return session.auth && session.whatsappPrivilege?.canWrite;
}

/**
 * Check if user has WhatsApp edit access
 */
export async function hasWhatsAppEditAccess() {
  const session = await getWhatsAppSession();
  return session.auth && session.whatsappPrivilege?.canEdit;
}

/**
 * Check if user has WhatsApp delete access
 */
export async function hasWhatsAppDeleteAccess() {
  const session = await getWhatsAppSession();
  return session.auth && session.whatsappPrivilege?.canDelete;
}

/**
 * Middleware for WhatsApp API routes
 */
export async function requireWhatsAppAccess(requiredPermission = 'canRead') {
  const session = await getWhatsAppSession();
  
  if (!session.auth) {
    return {
      error: true,
      message: "غير مخول بالدخول",
      status: 401
    };
  }

  if (!session.whatsappPrivilege) {
    return {
      error: true,
      message: "ليس لديك صلاحية الوصول لإدارة واتساب",
      status: 403
    };
  }

  if (!session.whatsappPrivilege[requiredPermission]) {
    return {
      error: true,
      message: `ليس لديك صلاحية ${requiredPermission} لإدارة واتساب`,
      status: 403
    };
  }

  return {
    error: false,
    session,
    user: session.user,
    whatsappPrivilege: session.whatsappPrivilege
  };
}
