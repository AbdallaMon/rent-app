import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

let prisma;

function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    const prisma = getPrismaClient();
    
    // Test basic connection
    await prisma.$connect();
    console.log('Database connection successful');
    
    // Test client count
    const clientCount = await prisma.client.count();
    console.log(`Found ${clientCount} clients in database`);
    
    // Test WhatsApp bot client
    const testClient = await prisma.client.findFirst({
      where: {
        phone: {
          contains: '501234567'
        }
      }
    });
    
    const response = {
      status: 'success',
      message: 'Database connection successful',
      data: {
        clientCount,
        testClientExists: !!testClient,
        testClient: testClient ? {
          id: testClient.id,
          name: testClient.name,
          phone: testClient.phone
        } : null,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      }
    };
    
    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    console.error('Database connection test failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }, { status: 500 });
    
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}
