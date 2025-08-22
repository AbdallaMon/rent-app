import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

// Custom getServerSession that works with your token system
export async function getServerSession(options) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    
    if (!token) {
      return null;
    }
    
    const SECRET_KEY = process.env.SECRET_KEY;
    const decoded = jwt.verify(token, SECRET_KEY);
    
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
    
    if (user) {
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          type: user.type || user.role, // Use role as type fallback
          privileges: user.privileges
        },
        expires: new Date(decoded.exp * 1000).toISOString()
      };
    }
    
    return null;
  } catch (error) {
    console.error('getServerSession error:', error);
    return null;
  }
}
