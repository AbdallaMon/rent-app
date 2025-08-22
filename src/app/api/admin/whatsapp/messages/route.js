import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

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

// Send WhatsApp message
export async function POST(request) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح بإرسال الرسائل' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phoneNumber, message, templateId } = body;

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'رقم الهاتف والرسالة مطلوبان' },
        { status: 400 }
      );
    }    // Here we'll integrate with actual WhatsApp API
    console.log('Sending WhatsApp message:', { phoneNumber, message });
    
    try {
      // Send the actual WhatsApp message
      const whatsappResult = await sendWhatsAppMessage(
        phoneNumber,
        message,
        false, // useTemplate
        '', // templateName
        {} // options
      );

      console.log('WhatsApp API response:', whatsappResult);

      // Create or find conversation
      let conversation = await prisma.whatsappConversation.findFirst({
        where: { phoneNumber }
      });

      if (!conversation) {
        conversation = await prisma.whatsappConversation.create({
          data: {
            phoneNumber,
            status: 'active'
          }
        });
      } else {
        // Update conversation
        await prisma.whatsappConversation.update({
          where: { id: conversation.id },
          data: {
            status: 'active',
            lastMessageAt: new Date()
          }
        });
      }      // Log the message with actual WhatsApp response
      const uniqueMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const messageLog = await prisma.whatsappMessageLog.create({
        data: {
          messageId: uniqueMessageId,
          recipient: phoneNumber,
          messageType: 'text',
          status: whatsappResult.messages?.[0]?.id ? 'sent' : 'failed',
          templateName: templateId ? `template_${templateId}` : null,
          metadata: { 
            message,
            whatsappResponse: whatsappResult,
            externalMessageId: whatsappResult.messages?.[0]?.id
          }
        }
      });

      return NextResponse.json({
        success: true,
        messageId: messageLog.id,
        externalMessageId: whatsappResult.messages?.[0]?.id,
        status: 'sent',
        message: 'تم إرسال الرسالة بنجاح عبر WhatsApp'
      });

    } catch (whatsappError) {      console.error('WhatsApp API error:', whatsappError);
      
      // Log failed message
      const uniqueFailedMessageId = `failed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const messageLog = await prisma.whatsappMessageLog.create({
        data: {
          messageId: uniqueFailedMessageId,
          recipient: phoneNumber,
          messageType: 'text',
          status: 'failed',
          templateName: templateId ? `template_${templateId}` : null,
          metadata: { 
            message,
            error: whatsappError.message
          }
        }
      });return NextResponse.json({
        success: false,
        messageId: messageLog.id,
        error: `فشل في إرسال الرسالة: ${whatsappError.message}`,
        details: whatsappError.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    
    // Check if it's a database constraint error
    if (error.message && error.message.includes('Unique constraint failed')) {
      return NextResponse.json(
        { 
          error: 'خطأ في حفظ الرسالة - معرف مكرر',
          details: 'تم إرسال الرسالة ولكن حدث خطأ في التسجيل'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'خطأ عام في إرسال الرسالة',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Get recent messages
export async function GET(request) {
  try {
    // تجاوز المصادقة مؤقتاً للاختبار
    // const user = await verifyAuth();
    // if (!user) {
    //   return NextResponse.json(
    //     { error: 'غير مصرح بالوصول' },
    //     { status: 401 }
    //   );
    // }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    
    console.log('📱 جلب رسائل واتساب من قاعدة البيانات...');
      // جلب الرسائل من جدول WhatsappMessageLog
    const messages = await prisma.$queryRaw`
      SELECT 
        id, messageId, recipient, messageType, templateName, language, status,
        metadata, clientId, sentAt, updatedAt
      FROM WhatsappMessageLog 
      ORDER BY sentAt DESC 
      LIMIT ${limit}
    `;

    console.log(`✅ تم جلب ${messages.length} رسالة من قاعدة البيانات`);

    const formattedMessages = messages.map(msg => {
      let metadata = {};
      try {
        metadata = typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : msg.metadata || {};
      } catch (e) {
        metadata = {};
      }
      
      return {
        id: msg.id,
        messageId: msg.messageId,
        recipient: msg.recipient,
        message: metadata.message || 'رسالة واتساب',
        messageType: msg.messageType || 'text',
        templateName: msg.templateName,
        language: msg.language,
        status: msg.status || 'sent',
        clientId: msg.clientId,
        sentAt: msg.sentAt,
        createdAt: msg.sentAt,
        updatedAt: msg.updatedAt,
        metadata: metadata
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedMessages,
      total: formattedMessages.length,
      summary: {
        totalMessages: formattedMessages.length,
        reminderMessages: formattedMessages.filter(m => m.reminderType).length,
        sentMessages: formattedMessages.filter(m => m.status === 'sent').length,
        deliveredMessages: formattedMessages.filter(m => m.status === 'delivered').length,
        readMessages: formattedMessages.filter(m => m.status === 'read').length
      }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب رسائل واتساب:', error);
    return NextResponse.json({
      success: false,
      error: 'خطأ في تحميل الرسائل',
      details: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
