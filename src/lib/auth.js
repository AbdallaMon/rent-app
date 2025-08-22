import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

// Define auth options for NextAuth - simplified for compatibility
export const authOptions = {
  providers: [],
  callbacks: {
    async session({ session, token }) {
      // Use existing token-based authentication
      try {
        const cookieStore = cookies();
        const tokenValue = cookieStore.get("token")?.value;
        
        if (tokenValue) {
          const SECRET_KEY = process.env.SECRET_KEY;
          const decoded = jwt.verify(tokenValue, SECRET_KEY);
          
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
            // Create a proper session with user data
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
        }
        
        // Return null if no valid session
        return null;
      } catch (error) {
        console.error('Session verification error:', error);
        return null;
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.SECRET_KEY,
};
