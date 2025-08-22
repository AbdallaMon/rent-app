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

// Send WhatsApp reply for complaint
export async function POST(request) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول' },
        { status: 401 }
      );
    }

    const { clientId, message: messageText, messageType, complaintId, phoneNumber } = await request.json();

    // Validate required fields
    if (!clientId || !messageText || !complaintId || !phoneNumber) {
      return NextResponse.json(
        { error: 'البيانات المطلوبة مفقودة' },
        { status: 400 }
      );
    }

    // Get client and complaint details
    const client = await prisma.client.findUnique({
      where: { id: parseInt(clientId) }
    });

    const complaint = await prisma.complaint.findUnique({
      where: { id: parseInt(complaintId) },
      include: {
        client: true,
        property: true,
        unit: true
      }
    });

    if (!client || !complaint) {
      return NextResponse.json(
        { error: 'العميل أو الشكوى غير موجود' },
        { status: 404 }
      );
    }

    // Format message based on type
    let formattedMessage = messageText;
    const language = client.language || 'ARABIC';
    
    if (messageType === 'complaint_update') {
      const statusMap = {
        ARABIC: {
          prefix: `تحديث حول الشكوى #${complaintId}:\n\n`,
          suffix: '\n\nنشكرك على صبرك ونعتذر عن أي إزعاج.'
        },
        ENGLISH: {
          prefix: `Update on complaint #${complaintId}:\n\n`,
          suffix: '\n\nThank you for your patience and we apologize for any inconvenience.'
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
          complaintId: complaintId,
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
          complaintId: parseInt(complaintId),
          messageType: messageType,
          adminUserId: user.id
        }
      }
    });

    // Update complaint with admin reply timestamp
    await prisma.complaint.update({
      where: { id: parseInt(complaintId) },
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
    console.error('Error sending WhatsApp reply to complaint:', error);
    return NextResponse.json(
      { error: 'فشل في إرسال الرد عبر WhatsApp' },
      { status: 500 }
    );
  }
}
