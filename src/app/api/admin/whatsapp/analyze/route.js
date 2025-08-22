import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {    // فحص جدول رسائل الواتساب المرسلة
    const sentMessagesCount = await prisma.whatsappMessageLog.count();
    const sentMessages = [{
      total_sent_messages: sentMessagesCount,
      messages_today: 0,
      template_messages: 0,
      reminder_messages: 0,
      sent_status: 0,
      delivered_status: 0,
      read_status: 0,
      failed_status: 0
    }];    // فحص جدول الرسائل الواردة
    const incomingMessagesCount = await prisma.whatsappIncomingMessage.count();
    const incomingMessages = [{
      total_incoming_messages: incomingMessagesCount,
      incoming_today: 0,
      text_messages: 0,
      interactive_messages: 0
    }];    // فحص جدول المحادثات
    const conversationsCount = await prisma.whatsappConversation.count();
    const conversations = [{
      total_conversations: conversationsCount,
      active_conversations: 0,
      conversations_today: 0,
      maintenance_conversations: 0,
      complaint_conversations: 0,
      avg_messages_per_conversation: 0
    }];

    // عينة من آخر 5 رسائل مرسلة
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

    // عينة من آخر 5 رسائل واردة
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

    // فحص إعدادات التذكيرات
    const reminderSettings = await prisma.reminderSettings.findFirst();

    // فحص قوالب الواتساب
    const templates = await prisma.whatsappTemplate.findMany({
      where: { isActive: true },
      select: {
        name: true,
        displayName: true,
        category: true,
        languages: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        sentMessages: sentMessages[0],
        incomingMessages: incomingMessages[0],
        conversations: conversations[0],
        recentSentMessages,
        recentIncomingMessages,
        reminderSettings,
        templates,
        analysis: {
          hasRealData: {
            sentMessages: Number(sentMessages[0]?.total_sent_messages || 0) > 0,
            incomingMessages: Number(incomingMessages[0]?.total_incoming_messages || 0) > 0,
            conversations: Number(conversations[0]?.total_conversations || 0) > 0,
            reminderSettings: !!reminderSettings,
            templates: templates.length > 0
          },
          totalActivity: {
            totalSent: Number(sentMessages[0]?.total_sent_messages || 0),
            totalIncoming: Number(incomingMessages[0]?.total_incoming_messages || 0),
            totalConversations: Number(conversations[0]?.total_conversations || 0),
            todayActivity: Number(sentMessages[0]?.messages_today || 0) + Number(incomingMessages[0]?.incoming_today || 0)
          }
        }
      }
    });

  } catch (error) {
    console.error('Database analysis error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze WhatsApp system',
      details: error.message
    }, { status: 500 });
  }
}
