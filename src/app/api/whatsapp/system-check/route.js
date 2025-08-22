import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // فحص جدول الرسائل المرسلة
    const sentMessagesStats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_sent_messages,
        COUNT(CASE WHEN DATE(sentAt) = CURDATE() THEN 1 END) as messages_today,
        COUNT(CASE WHEN messageType = 'template' THEN 1 END) as template_messages,
        COUNT(CASE WHEN templateName LIKE '%reminder%' OR templateName LIKE '%تذكير%' THEN 1 END) as reminder_messages,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_status,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_status,
        COUNT(CASE WHEN status = 'read' THEN 1 END) as read_status,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_status
      FROM WhatsappMessageLog
    `;

    // فحص جدول الرسائل الواردة
    const incomingMessagesStats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_incoming_messages,
        COUNT(CASE WHEN DATE(receivedAt) = CURDATE() THEN 1 END) as incoming_today,
        COUNT(CASE WHEN messageType = 'text' THEN 1 END) as text_messages,
        COUNT(CASE WHEN messageType = 'interactive' THEN 1 END) as interactive_messages
      FROM WhatsappIncomingMessage
    `;

    // فحص جدول المحادثات
    const conversationsStats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_conversations,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_conversations,
        COUNT(CASE WHEN DATE(lastMessageAt) = CURDATE() THEN 1 END) as conversations_today,
        COUNT(CASE WHEN topic = 'maintenance' THEN 1 END) as maintenance_conversations,
        COUNT(CASE WHEN topic = 'complaint' THEN 1 END) as complaint_conversations,
        AVG(messageCount) as avg_messages_per_conversation
      FROM WhatsappConversation
    `;

    // عينة من الرسائل المرسلة
    const recentSentMessages = await prisma.whatsappMessageLog.findMany({
      take: 5,
      orderBy: { sentAt: 'desc' },
      select: {
        messageId: true,
        recipient: true,
        messageType: true,
        templateName: true,
        status: true,
        sentAt: true,
        clientId: true
      }
    });

    // عينة من الرسائل الواردة
    const recentIncomingMessages = await prisma.whatsappIncomingMessage.findMany({
      take: 5,
      orderBy: { receivedAt: 'desc' },
      select: {
        messageId: true,
        sender: true,
        messageType: true,
        content: true,
        receivedAt: true,
        clientId: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        sentMessages: sentMessagesStats[0],
        incomingMessages: incomingMessagesStats[0],
        conversations: conversationsStats[0],
        recentSentMessages,
        recentIncomingMessages,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('خطأ في فحص جداول الواتساب:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
