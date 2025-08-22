import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireWhatsAppAccess } from '@/lib/whatsapp-auth';
import { getRecentConversations } from '@/lib/whatsapp-analytics';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Enhanced authentication check
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
    
    if (!user || !user.privileges.some(p => p.privilege.canRead)) {
      return null;
    }
    
    return user;
  } catch (error) {
    return null;
  }
}

// Enhanced API route to get recent WhatsApp conversations with full details
export async function GET(request) {
  try {
    // التحقق من المصادقة (مُعطل مؤقتاً للاختبار)
    // const user = await verifyAuth();
    // if (!user) {
    //   return NextResponse.json(
    //     { error: 'غير مصرح بالوصول' },
    //     { status: 401 }
    //   );
    // }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') 
      ? parseInt(searchParams.get('limit'))
      : 20;
    const offset = parseInt(searchParams.get('offset')) || 0;
    const status = searchParams.get('status') || 'active';
    
    // Get conversations with enhanced data
    const conversations = await prisma.whatsappConversation.findMany({
      where: {
        status: status,
        lastMessageAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        }
      },
      orderBy: { lastMessageAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Enhance each conversation with recent messages and metadata
    const enhancedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        // Get recent messages
        const [incomingMessages, outgoingMessages] = await Promise.all([
          prisma.whatsappIncomingMessage.findMany({
            where: { sender: conversation.phoneNumber },
            orderBy: { receivedAt: 'desc' },
            take: 5
          }),
          prisma.whatsappMessageLog.findMany({
            where: { recipient: conversation.phoneNumber },
            orderBy: { sentAt: 'desc' },
            take: 5
          })
        ]);

        // Combine and format messages
        const messages = [
          ...incomingMessages.map(msg => ({
            id: msg.id,
            type: 'incoming',
            content: msg.content,
            messageType: msg.messageType,
            timestamp: msg.receivedAt,
            status: 'received',
            metadata: msg.metadata
          })),
          ...outgoingMessages.map(msg => ({
            id: msg.id,
            type: 'outgoing',
            content: msg.metadata?.message || 'رسالة WhatsApp',
            messageType: msg.messageType,
            timestamp: msg.sentAt,
            status: msg.status,
            metadata: msg.metadata
          }))
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
         .slice(0, 10);

        // Calculate conversation stats
        const unreadCount = incomingMessages.filter(msg => !msg.metadata?.read).length;
        const hasActiveRequest = incomingMessages.some(msg => {
          const content = msg.content?.toLowerCase() || '';
          return (content.includes('صيانة') || content.includes('maintenance')) &&
                 (!msg.metadata || msg.metadata.status !== 'completed');
        });
        
        const hasUnresolvedComplaint = incomingMessages.some(msg => {
          const content = msg.content?.toLowerCase() || '';
          return (content.includes('شكوى') || content.includes('complaint')) &&
                 (!msg.metadata || msg.metadata.status !== 'resolved');
        });

        return {
          ...conversation,
          messages,
          unreadCount,
          hasActiveRequest,
          hasUnresolvedComplaint,
          lastActivity: messages[0]?.timestamp || conversation.lastMessageAt
        };
      })
    );
    
    // Get summary stats
    const totalCount = await prisma.whatsappConversation.count({
      where: { status }
    });

    const summary = {
      total: totalCount,
      active: enhancedConversations.length,
      withRequests: enhancedConversations.filter(c => c.hasActiveRequest).length,
      withComplaints: enhancedConversations.filter(c => c.hasUnresolvedComplaint).length,
      unreadMessages: enhancedConversations.reduce((sum, c) => sum + c.unreadCount, 0)
    };
    
    return NextResponse.json({ 
      conversations: enhancedConversations,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      summary
    });
  } catch (error) {
    console.error('Error in WhatsApp conversations API:', error);
    return NextResponse.json(
      { error: "خطأ في تحميل المحادثات", details: error.message },
      { status: 500 }
    );
  }
}

// Send message to a conversation
export async function POST(request) {
  try {
    const user = await verifyAuth();
    if (!user || !user.privileges.some(p => p.privilege.canWrite)) {
      return NextResponse.json(
        { error: 'غير مصرح بإرسال الرسائل' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { conversationId, phoneNumber, message, messageType = 'text' } = body;

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'رقم الهاتف والرسالة مطلوبان' },
        { status: 400 }
      );
    }

    // Send the message via WhatsApp
    const { sendWhatsAppMessage } = await import('@/lib/whatsapp');
    
    try {
      const whatsappResponse = await sendWhatsAppMessage(
        phoneNumber,
        message,
        false,
        '',
        {}
      );

      // Log the message
      const messageLog = await prisma.whatsappMessageLog.create({
        data: {
          messageId: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          recipient: phoneNumber,
          messageType: messageType,
          status: 'sent',
          metadata: {
            message,
            conversationId,
            sentBy: user.id,
            sentFromDashboard: true,
            whatsappResponse
          }
        }
      });

      // Update conversation
      await prisma.whatsappConversation.upsert({
        where: { phoneNumber },
        update: {
          lastMessageAt: new Date(),
          status: 'active'
        },
        create: {
          phoneNumber,
          status: 'active',
          lastMessageAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        messageId: messageLog.id,
        externalMessageId: whatsappResponse.messages?.[0]?.id,
        message: 'تم إرسال الرسالة بنجاح'
      });

    } catch (whatsappError) {
      console.error('WhatsApp send error:', whatsappError);
      return NextResponse.json(
        { error: `فشل في إرسال الرسالة: ${whatsappError.message}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error sending conversation message:', error);
    return NextResponse.json(
      { error: 'خطأ في إرسال الرسالة' },
      { status: 500 }
    );
  }
}
