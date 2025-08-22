import { NextResponse } from 'next/server';
import { requireWhatsAppAccess } from '@/lib/whatsapp-auth';
import { PrismaClient } from '@prisma/client';

// API route to verify the WhatsApp webhook is properly configured
export async function POST(request) {
  try {
    // Verify WhatsApp read permissions
    const authResult = await requireWhatsAppAccess('canRead');
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.message },
        { status: authResult.status }
      );
    }

    // Check if we have the required environment variables
    const hasVerifyToken = !!process.env.WHATSAPP_VERIFY_TOKEN;
    
    if (!hasVerifyToken) {
      return NextResponse.json({
        status: 'not_configured',
        message: 'WhatsApp webhook verification token not configured'
      });
    }

    // Make a test request to the status-webhook endpoint
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000'}/api/admin/whatsapp/status-webhook`;
    
    try {
      const testParams = new URLSearchParams({
        'hub.mode': 'subscribe',
        'hub.verify_token': process.env.WHATSAPP_VERIFY_TOKEN,
        'hub.challenge': 'test_challenge'
      });
      
      const response = await fetch(`${webhookUrl}?${testParams}`, {
        method: 'GET'
      });
      
      if (response.ok) {
        const responseText = await response.text();
        
        // If we get back the same challenge, webhook is working
        if (responseText === 'test_challenge') {
          // Update status in database if we have the SystemSettings table
          updateWebhookStatus('active');
          
          return NextResponse.json({
            status: 'active',
            message: 'WhatsApp webhook is properly configured'
          });
        }
      }
      
      // If we get here, webhook is not working properly
      updateWebhookStatus('inactive');
      
      return NextResponse.json({
        status: 'inactive',
        message: 'WhatsApp webhook is not responding correctly'
      });
    } catch (error) {
      console.error('Error testing webhook:', error);
      updateWebhookStatus('error');
      
      return NextResponse.json({
        status: 'error',
        message: `Error testing webhook: ${error.message}`
      });
    }
  } catch (error) {
    console.error('Error in verify webhook API:', error);
    return NextResponse.json(
      { error: "Failed to verify webhook", details: error.message },
      { status: 500 }
    );
  }
}

// Helper to update webhook status in the database
async function updateWebhookStatus(status) {
  try {
    const prisma = new PrismaClient();
    
    // Try to update the SystemSettings table
    try {
      await prisma.systemSettings.upsert({
        where: { category: 'WHATSAPP' },
        update: {
          webhookStatus: status,
          lastVerified: new Date()
        },
        create: {
          category: 'WHATSAPP',
          webhookStatus: status,
          lastVerified: new Date()
        }
      });
    } catch (error) {
      console.warn('Could not update webhook status in database:', error);
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error updating webhook status in database:', error);
  }
}
