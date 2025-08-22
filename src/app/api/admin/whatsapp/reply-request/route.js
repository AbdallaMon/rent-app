import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Helper function to verify authentication
async function verifyAuth() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return null;
    }
    
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        privileges: {
          where: { area: 'WHATSAPP' },
          include: { privilege: true }
        }
      }
    });
    
    if (!user || !user.privileges.some(p => p.privilege.canWrite)) {
      return null;
    }
    
    return user;
  } catch (error) {
    return null;
  }
}

// Send WhatsApp reply for maintenance request
export async function POST(request) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول' },
        { status: 401 }
      );
    }

    const { clientId, message: messageText, messageType, requestId, phoneNumber } = await request.json();

    // Validate required fields
    if (!clientId || !messageText || !requestId || !phoneNumber) {
      return NextResponse.json(
        { error: 'البيانات المطلوبة مفقودة' },
        { status: 400 }
      );
    }

    // Get client and request details
    const client = await prisma.client.findUnique({
      where: { id: parseInt(clientId) }
    });

    const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
      where: { id: parseInt(requestId) },
      include: {
        client: true,
        property: true,
        unit: true
      }
    });

    if (!client || !maintenanceRequest) {
      return NextResponse.json(
        { error: 'العميل أو طلب الصيانة غير موجود' },
        { status: 404 }
      );
    }

    // Format message based on type
    let formattedMessage = messageText;
    const language = client.language || 'ARABIC';
    
    if (messageType === 'status_update') {
      const statusMap = {
        ARABIC: {
          prefix: `تحديث حول طلب الصيانة #${requestId}:\n\n`,
          suffix: '\n\nشكراً لتعاونك معنا.'
        },
        ENGLISH: {
          prefix: `Update on maintenance request #${requestId}:\n\n`,
          suffix: '\n\nThank you for your cooperation.'
        }
      };
      
      const msgs = statusMap[language] || statusMap.ARABIC;
      formattedMessage = msgs.prefix + messageText + msgs.suffix;
    }

    // Send WhatsApp message
    const whatsappResponse = await sendWhatsAppMessage(
      phoneNumber,
      formattedMessage,
      false, // Not using template for admin replies
      '',
      { 
        language: { code: language === 'ARABIC' ? 'ar' : 'en' },
        metadata: {
          source: 'admin_dashboard',
          requestId: requestId,
          messageType: messageType,
          adminUserId: user.id
        }
      }
    );

    // Log the message in database
    await prisma.whatsAppMessage.create({
      data: {
        messageId: whatsappResponse.messages[0].id,
        clientId: parseInt(clientId),
        direction: 'OUTBOUND',
        content: formattedMessage,
        messageType: 'TEXT',
        status: 'SENT',
        language: language,
        metadata: {
          source: 'admin_dashboard',
          requestId: parseInt(requestId),
          messageType: messageType,
          adminUserId: user.id
        }
      }
    });

    // Update request with admin reply timestamp
    await prisma.maintenanceRequest.update({
      where: { id: parseInt(requestId) },
      data: {
        updatedAt: new Date(),
        // Add admin reply flag if needed
        adminReplied: true
      }
    });

    return NextResponse.json({
      success: true,
      messageId: whatsappResponse.messages[0].id,
      message: 'تم إرسال الرد بنجاح'
    });

  } catch (error) {
    console.error('Error sending WhatsApp reply:', error);
    return NextResponse.json(
      { error: 'فشل في إرسال الرد عبر WhatsApp' },
      { status: 500 }
    );
  }
}
