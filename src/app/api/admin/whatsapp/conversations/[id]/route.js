import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireWhatsAppAccess } from '@/lib/whatsapp-auth';
import { getConversationDetails } from '@/lib/whatsapp-analytics';

// API route to get conversation details
export async function GET(request, { params }) {
  try {
    // Verify WhatsApp permissions
    const authResult = await requireWhatsAppAccess('canRead');
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.message },
        { status: authResult.status }
      );
    }
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }
    
    try {
      // Get conversation details
      const conversation = await getConversationDetails(id);
      return NextResponse.json(conversation);
    } catch (dbError) {
      console.error(`Database error getting conversation:`, dbError);
      
      // Check if this is a table does not exist error
      if (dbError.message && (
        dbError.message.includes("doesn't exist") || 
        dbError.message.includes("not found") ||
        dbError.message.includes("no such table") ||
        dbError.message.includes("Unknown table")
      )) {
        // Return a more specific error for missing tables
        return NextResponse.json({
          error: "WhatsApp tables not found in database", 
          message: "Please run the SQL script to create WhatsApp tables first",
          details: dbError.message
        }, { status: 500 });
      }
      
      return NextResponse.json({
        error: "Failed to get conversation details", 
        details: dbError.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error(`Error getting conversation details for ID ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to get conversation details", details: error.message },
      { status: 500 }
    );
  }
}
