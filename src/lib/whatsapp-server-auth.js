import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

/**
 * Server-side function to check WhatsApp access for server components
 */
export async function requireWhatsAppServerAccess(requiredPermission = 'canRead') {
  const SECRET_KEY = process.env.SECRET_KEY;
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  
  if (!token) {
    redirect('/login');
  }

  try {
    const currentTime = Math.floor(Date.now() / 1000);
    const decoded = jwt.verify(token, SECRET_KEY);

    if (decoded.exp < currentTime) {
      redirect('/login');
    }

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
      redirect('/login');
    }

    // Find WhatsApp privilege
    const whatsappPrivilege = user.privileges.find(p => p.area === 'WHATSAPP');
    
    if (!whatsappPrivilege || !whatsappPrivilege.privilege[requiredPermission]) {
      redirect('/not-allowed');
    }

    return {
      user,
      whatsappPrivilege: whatsappPrivilege.privilege
    };
  } catch (error) {
    console.log(error, "error");
    redirect('/login');
  }
}
