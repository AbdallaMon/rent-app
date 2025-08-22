import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

// SIMPLIFIED VERSION - BASIC TEST
console.log('🚀 Webhook route loaded - SIMPLIFIED VERSION');

// Simple webhook handler for testing
export async function POST(request) {
  try {
    console.log('\n=== SIMPLE WEBHOOK TEST ===');
    const body = await request.json();
    console.log('Body received:', JSON.stringify(body, null, 2));
    
    if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
      const message = body.entry[0].changes[0].value.messages[0];
      const phoneNumber = message.from;
      console.log('Message from:', phoneNumber);
      
      if (message.text) {
        const messageText = message.text.body;
        console.log('Text:', messageText);
        
        // Simple response
        const response = "مرحباً! نسخة مبسطة تعمل الآن. 🎉\n\nHello! Simplified version is working now. 🎉";
        await sendWhatsAppMessage(phoneNumber, response);
        console.log('✅ Response sent successfully');
      }
    }
    
    return NextResponse.json({ status: 'success', message: 'Simplified webhook working' });
    
  } catch (error) {
    console.error('❌ Simple webhook error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}

// Webhook verification
export async function GET(request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  
  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  
  return new Response('Forbidden', { status: 403 });
}
