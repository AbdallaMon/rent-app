// File: app/api/language/route.js
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Parse URL and get client ID from the search params
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    
    // Check if clientId is provided
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Convert clientId to integer
    const clientIdInt = parseInt(clientId, 10);
    
    // Check if clientId is a valid integer
    if (isNaN(clientIdInt)) {
      return NextResponse.json(
        { error: 'Invalid client ID format' },
        { status: 400 }
      );
    }

    // Get client language preference from the database
    const client = await prisma.client.findUnique({
      where: {
        id: clientIdInt
      },
      select: {
        id: true,
        name: true,
        language: true
      }
    });

    // If client not found
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Get appropriate language settings for this client
    const languageSettings = getLanguageSettings(client.language);
    
    return NextResponse.json({
      clientId: client.id,
      clientName: client.name,
      language: client.language,
      languageCode: languageSettings.languageCode,
      languageSettings
    });
  } catch (error) {
    console.error('Language API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch language preferences',
        details: error.message 
      },
      { status: 500 }
    );
  } finally {
    // Disconnect Prisma to avoid memory leaks
    await prisma.$disconnect();
  }
}

// Helper function to get language-specific settings
function getLanguageSettings(language) {
  // Default to Arabic if not specified
  const clientLanguage = language || "ARABIC";
  
  // Language settings mapping
  const languageMap = {
    "ARABIC": {
      languageCode: "ar_AE",
      direction: "rtl",
      dateFormat: "DD/MM/YYYY",
      templates: {
        rent_agreement_creation: "rent_agreement_creation",
        maintenance_notification: "maintenance_notification_ar",
        payment_confirmation: "payment_confirmation_ar"
      }
    },
    "ENGLISH": {
      languageCode: "en",
      direction: "ltr",
      dateFormat: "MM/DD/YYYY",
      templates: {
        rent_agreement_creation: "rent_agreement_creation_en",
        maintenance_notification: "maintenance_notification_en", 
        payment_confirmation: "payment_confirmation_en"
      }
    }
  };
  
  // Return the appropriate language settings or default to Arabic
  return languageMap[clientLanguage] || languageMap["ARABIC"];
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }
    
    // Validate language value
    if (data.language && !["ARABIC", "ENGLISH"].includes(data.language)) {
      return NextResponse.json(
        { error: 'Invalid language. Must be ARABIC or ENGLISH' },
        { status: 400 }
      );
    }
    
    // Update client language preference
    const updatedClient = await prisma.client.update({
      where: {
        id: parseInt(data.clientId, 10)
      },
      data: {
        language: data.language
      },
      select: {
        id: true,
        name: true,
        language: true
      }
    });
    
    // Get updated language settings
    const languageSettings = getLanguageSettings(updatedClient.language);
    
    return NextResponse.json({
      success: true,
      message: "Language preference updated successfully",
      clientId: updatedClient.id,
      language: updatedClient.language,
      languageSettings
    });
  } catch (error) {
    console.error('Language update API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update language preference',
        details: error.message 
      },
      { status: 500 }
    );
  } finally {
    // Disconnect Prisma to avoid memory leaks
    await prisma.$disconnect();
  }
}
