// File: /app/api/notifications/whatsapp/contact_form/reply/route.js
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { NextResponse } from 'next/server';

// Cache mechanism for preventing duplicate messages
const messageCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    const { phone, message, language = "ARABIC" } = body;
    
    if (!phone || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Check cache to prevent duplicate messages
    const cacheKey = `${phone}-${message}`;
    if (messageCache.has(cacheKey)) {
      return NextResponse.json(
        { message: "Message already sent recently" },
        { status: 200 }
      );
    }
    
    // Set the template based on language
    const templateName = "contact_form_reply";
    
    // Language code for WhatsApp template
    const languageCode ="ar_AE";
    
    const templateVariables = {
      message: message,
    };
    
    // Update cache
    messageCache.set(cacheKey, true);
    setTimeout(() => messageCache.delete(cacheKey), CACHE_TTL);
    
    // Send the message
    const response = await sendWhatsAppMessage(
      phone,
      templateVariables,
      true,
      templateName,
      { language: { code: languageCode } }
    );
    
    return NextResponse.json(
      { message: "WhatsApp message sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return NextResponse.json(
      { error: "Failed to send WhatsApp message", details: error.message },
      { status: 500 }
    );
  }
}
