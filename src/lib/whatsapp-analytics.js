/**
 * WhatsApp Analytics Module
 * Provides analytics and tracking for WhatsApp messaging integration
 */

import { PrismaClient } from '@prisma/client';

let prisma;

// Get or initialize the Prisma client
function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

/**
 * Schema Additions Required:
 * 
 * model WhatsappMessageLog {
 *   id                String      @id @default(cuid())
 *   messageId         String      @unique // WhatsApp message ID from Meta API
 *   recipient         String      // Phone number (E.164 format)
 *   messageType       String      // "text", "template", "interactive", "media"
 *   templateName      String?     // Name of template if used
 *   language          String?     // Language code (ar_AE, en, etc.)
 *   status            String      // "sent", "delivered", "read", "failed"
 *   metadata          Json?       // Additional data about the message
 *   sentAt            DateTime    @default(now())
 *   updatedAt         DateTime    @default(now())
 *   clientId          Int?        // Associated client ID if known
 *   client            Client?     @relation(fields: [clientId], references: [id])
 * }
 * 
 * model WhatsappIncomingMessage {
 *   id                String      @id @default(cuid())
 *   messageId         String      @unique // WhatsApp message ID from webhook
 *   sender            String      // Phone number (E.164 format)
 *   messageType       String      // "text", "interactive", "button", "media"
 *   content           String?     // Message content or button/list selection ID
 *   language          String?     // Detected language
 *   metadata          Json?       // Additional message data
 *   receivedAt        DateTime    @default(now())
 *   clientId          Int?        // Associated client ID if known
 *   client            Client?     @relation(fields: [clientId], references: [id])
 * }
 * 
 * model WhatsappConversation {
 *   id                String      @id @default(cuid())
 *   phoneNumber       String      // Phone number (E.164 format)
 *   clientId          Int?        // Associated client ID if known
 *   startedAt         DateTime    @default(now())
 *   lastMessageAt     DateTime    @default(now())
 *   status            String      // "active", "idle", "closed"
 *   topic             String?     // "maintenance", "complaint", "support"
 *   messageCount      Int         @default(0)
 *   metadata          Json?       // Additional conversation data
 *   client            Client?     @relation(fields: [clientId], references: [id])
 * }
 */

/**
 * Tracks a sent WhatsApp message in the database
 * @param {object} messageData - The message data to track
 * @param {string} messageData.messageId - WhatsApp message ID from the API
 * @param {string} messageData.to - Recipient phone number
 * @param {string} messageData.type - Message type (text, template, interactive)
 * @param {string} [messageData.templateName] - Template name (if applicable)
 * @param {string} [messageData.language] - Message language code
 * @param {string} [messageData.status] - Initial message status (default: "sent")
 * @param {object} [messageData.metadata] - Additional metadata about the message
 * @returns {Promise<object>} The created message record
 */
export async function trackMessageSent(messageData) {
  try {
    const db = getPrismaClient();
    
    // Find associated client
    let clientId = null;
    if (messageData.to) {
      const client = await db.client.findFirst({
        where: {
          OR: [
            { phone: messageData.to },
            { phone: messageData.to.replace('+', '') }
          ]
        },
        select: { id: true }
      });
      clientId = client?.id || null;
    }

    const record = await db.whatsappMessageLog.create({
      data: {
        messageId: messageData.messageId,
        recipient: messageData.to,
        messageType: messageData.type,
        templateName: messageData.templateName || null,
        language: messageData.language || 'ar_AE',
        status: messageData.status || 'sent',
        metadata: messageData.metadata || {},
        clientId,
        sentAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Update conversation or create new one
    await updateConversation(messageData.to, clientId, 'outbound', messageData.type);

    return record;
  } catch (error) {
    console.error('Error tracking WhatsApp message:', error);
    // Non-blocking - return null but don't throw to avoid disrupting message flow
    return null;
  }
};

/**
 * Updates the delivery status of a tracked message
 * @param {string} messageId - The WhatsApp message ID
 * @param {string} status - The new status (delivered, read, failed)
 * @returns {Promise<object>} The updated message record
 */
export async function updateMessageStatus(messageId, status) {
  try {
    const db = getPrismaClient();

    const record = await db.whatsappMessageLog.update({
      where: { messageId },
      data: {
        status,
        updatedAt: new Date()
      }
    });

    return record;
  } catch (error) {
    console.error(`Error updating WhatsApp message status for ID ${messageId}:`, error);
    return null;
  }
}

/**
 * Tracks an incoming WhatsApp message
 * @param {object} messageData - The incoming message data
 * @param {string} messageData.messageId - WhatsApp message ID from the webhook
 * @param {string} messageData.from - Sender phone number
 * @param {string} messageData.type - Message type (text, interactive, etc.)
 * @param {string} [messageData.body] - Message body/content
 * @param {string} [messageData.language] - Detected message language
 * @param {object} [messageData.metadata] - Additional metadata about the message
 * @returns {Promise<object>} The created message record
 */
export async function trackIncomingMessage(messageData) {
  try {
    const db = getPrismaClient();
    
    // Find associated client
    let clientId = null;
    if (messageData.from) {
      const client = await db.client.findFirst({
        where: {
          OR: [
            { phone: messageData.from },
            { phone: messageData.from.replace('+', '') }
          ]
        },
        select: { id: true }
      });
      clientId = client?.id || null;
    }

    const record = await db.whatsappIncomingMessage.create({
      data: {
        messageId: messageData.messageId,
        sender: messageData.from,
        messageType: messageData.type,
        content: messageData.body || '',
        language: messageData.language || null,
        metadata: messageData.metadata || {},
        clientId,
        receivedAt: new Date()
      }
    });
    
    // Update conversation or create new one
    await updateConversation(messageData.from, clientId, 'inbound', messageData.type);

    return record;
  } catch (error) {
    console.error('Error tracking incoming WhatsApp message:', error);
    return null;
  }
}

/**
 * Updates or creates a conversation record based on message activity
 * @param {string} phoneNumber - Phone number involved in the conversation
 * @param {number|null} clientId - Associated client ID if available
 * @param {string} direction - Direction of the message (inbound/outbound)
 * @param {string} messageType - Type of message that triggered this update
 * @returns {Promise<object>} Updated or created conversation record
 */
async function updateConversation(phoneNumber, clientId, direction, messageType) {
  try {
    const db = getPrismaClient();
    
    // Look for existing active conversation
    const existingConversation = await db.whatsappConversation.findFirst({
      where: {
        phoneNumber,
        status: { in: ['active', 'idle'] }
      }
    });
    
    // Determine topic based on message type
    let topic = null;
    if (messageType === 'template' && direction === 'outbound') {
      topic = 'system_notification';
    } else if (existingConversation?.topic) {
      topic = existingConversation.topic;
    }
    
    if (existingConversation) {
      // Update existing conversation
      return await db.whatsappConversation.update({
        where: { id: existingConversation.id },
        data: {
          lastMessageAt: new Date(),
          status: 'active',
          topic: topic || existingConversation.topic,
          messageCount: { increment: 1 }
        }
      });
    } else {
      // Create new conversation
      return await db.whatsappConversation.create({
        data: {
          phoneNumber,
          clientId,
          startedAt: new Date(),
          lastMessageAt: new Date(),
          status: 'active',
          topic: topic || 'general',
          messageCount: 1
        }
      });
    }
  } catch (error) {
    console.error('Error updating WhatsApp conversation:', error);
    return null;
  }
}

/**
 * Gets analytics for WhatsApp messages within a date range
 * @param {object} filters - Filters for the analytics
 * @param {Date} [filters.startDate] - Start date for the analytics period
 * @param {Date} [filters.endDate] - End date for the analytics period
 * @param {number} [filters.clientId] - Filter by specific client ID
 * @param {string} [filters.topic] - Filter by conversation topic
 * @returns {Promise<object>} Object containing analytics data
 */
export async function getMessageAnalytics(filters = {}) {
  try {
    const db = getPrismaClient();
    
    const {
      startDate,
      endDate = new Date(),
      clientId,
      topic
    } = filters;
    
    const outgoingWhere = {};
    const incomingWhere = {};
    const conversationWhere = {};
    
    // Apply filters
    if (startDate) {
      outgoingWhere.sentAt = { gte: new Date(startDate) };
      incomingWhere.receivedAt = { gte: new Date(startDate) };
      conversationWhere.startedAt = { gte: new Date(startDate) };
    }
    
    if (endDate) {
      outgoingWhere.sentAt = { ...outgoingWhere.sentAt, lte: new Date(endDate) };
      incomingWhere.receivedAt = { ...incomingWhere.receivedAt, lte: new Date(endDate) };
    }
    
    if (clientId) {
      outgoingWhere.clientId = clientId;
      incomingWhere.clientId = clientId;
      conversationWhere.clientId = clientId;
    }
      if (topic) {
      conversationWhere.topic = topic;
    }
    
    // Get totals and stats
    const outgoingMessages = await db.whatsappMessageLog.count({ where: outgoingWhere });
    const incomingMessages = await db.whatsappIncomingMessage.count({ where: incomingWhere });
    const conversations = await db.whatsappConversation.count({ where: conversationWhere });
    
    // Get template usage stats
    const templateUsage = await db.whatsappMessageLog.groupBy({
      by: ['templateName'],
      where: { 
        ...outgoingWhere,
        templateName: { not: null }
      },
      _count: true
    });
    
    // Get delivery status distribution
    const statusDistribution = await db.whatsappMessageLog.groupBy({
      by: ['status'],
      where: outgoingWhere,
      _count: true
    });
    
    // Get language distribution
    const outgoingLanguages = await db.whatsappMessageLog.groupBy({
      by: ['language'],
      where: outgoingWhere,
      _count: true
    });
    
    const incomingLanguages = await db.whatsappIncomingMessage.groupBy({
      by: ['language'],
      where: {
        ...incomingWhere,
        language: { not: null }
      },
      _count: true
    });
    
    // Get messages by day
    const messagesPerDay = await db.whatsappMessageLog.groupBy({
      by: ['sentAt'],
      where: outgoingWhere,
      _count: true
    }).then(results => {
      // Convert to simplified date format
      return results.map(r => ({
        date: r.sentAt.toISOString().split('T')[0],
        count: r._count
      }));
    });
    
    // Get conversation topics
    const conversationTopics = await db.whatsappConversation.groupBy({
      by: ['topic'],
      where: conversationWhere,
      _count: true
    });
    
    return {
      total: {
        outgoing: outgoingMessages,
        incoming: incomingMessages,
        conversations: conversations
      },
      templateUsage,
      statusDistribution,
      languages: {
        outgoing: outgoingLanguages,
        incoming: incomingLanguages
      },
      messagesPerDay,
      conversationTopics
    };
  } catch (error) {
    console.error('Error getting WhatsApp message analytics:', error);
    throw error;
  }
}

/**
 * Gets recent conversation histories
 * @param {number} limit - Maximum number of conversations to return
 * @returns {Promise<Array>} Array of recent conversations
 */
export async function getRecentConversations(limit = 20) {
  try {
    const db = getPrismaClient();
    
    // Get recent active conversations
    const recentConversations = await db.whatsappConversation.findMany({
      where: {
        status: { in: ['active', 'idle'] }
      },
      orderBy: {
        lastMessageAt: 'desc'
      },
      take: limit,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            language: true
          }
        }
      }
    });
    
    // For each conversation, retrieve recent messages
    const conversations = [];
    
    for (const conversation of recentConversations) {
      // Get incoming messages for this conversation
      const incoming = await db.whatsappIncomingMessage.findMany({
        where: { 
          sender: conversation.phoneNumber 
        },
        orderBy: { receivedAt: 'desc' },
        take: 10
      });
      
      // Get outgoing messages for this conversation
      const outgoing = await db.whatsappMessageLog.findMany({
        where: { 
          recipient: conversation.phoneNumber 
        },
        orderBy: { sentAt: 'desc' },
        take: 10
      });
      
      // Combine and sort messages chronologically
      const messages = [
        ...incoming.map(msg => ({
          ...msg,
          direction: 'incoming',
          timestamp: msg.receivedAt
        })),
        ...outgoing.map(msg => ({
          ...msg,
          direction: 'outgoing',
          timestamp: msg.sentAt
        }))
      ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      conversations.push({
        id: conversation.id,
        phoneNumber: conversation.phoneNumber,
        client: conversation.client || { name: 'Unknown', language: null },
        status: conversation.status,
        topic: conversation.topic,
        lastActivity: conversation.lastMessageAt,
        messageCount: conversation.messageCount,
        messages: messages.slice(0, 15) // Get the 15 most recent messages
      });
    }
    
    return conversations;
  } catch (error) {
    console.error('Error getting recent WhatsApp conversations:', error);
    throw error;
  }
}

/**
 * Gets conversation insights for a specific client
 * @param {number} clientId - The client ID to get insights for
 * @returns {Promise<object>} Conversation insights for the client
 */
export async function getClientConversationInsights(clientId) {
  try {
    const db = getPrismaClient();
    
    // Check if client exists
    const client = await db.client.findUnique({
      where: { id: clientId },
      select: { id: true, name: true, language: true }
    });
    
    if (!client) {
      throw new Error(`Client with ID ${clientId} not found`);
    }
    
    // Get WhatsApp conversations for this client
    const conversations = await db.whatsappConversation.findMany({
      where: { clientId },
      orderBy: { lastMessageAt: 'desc' }
    });
    
    if (!conversations.length) {
      return {
        clientId,
        clientName: client.name,
        language: client.language,
        hasActivity: false,
        message: "No WhatsApp activity for this client"
      };
    }
    
    // Get incoming and outgoing messages for this client
    const incoming = await db.whatsappIncomingMessage.findMany({
      where: { clientId },
      orderBy: { receivedAt: 'asc' }
    });
    
    const outgoing = await db.whatsappMessageLog.findMany({
      where: { clientId },
      orderBy: { sentAt: 'asc' }
    });
    
    // Calculate response times (time between incoming message and next outgoing)
    const responseTimes = [];
    for (const inMsg of incoming) {
      const nextResponse = outgoing.find(out => 
        out.sentAt > inMsg.receivedAt && 
        // Match if the outgoing message was sent after this incoming message
        !incoming.some(other => 
          other.receivedAt > inMsg.receivedAt && 
          other.receivedAt < out.sentAt
        )
      );
      
      if (nextResponse) {
        const responseTimeMinutes = (new Date(nextResponse.sentAt) - new Date(inMsg.receivedAt)) / (1000 * 60);
        responseTimes.push(responseTimeMinutes);
      }
    }
    
    // Calculate insights
    const insights = {
      clientId,
      clientName: client.name,
      language: client.language,
      hasActivity: true,
      phoneNumber: conversations[0]?.phoneNumber,
      totalMessages: incoming.length + outgoing.length,
      incomingCount: incoming.length,
      outgoingCount: outgoing.length,
      conversationCount: conversations.length,
      firstContactDate: incoming.length ? incoming[0].receivedAt : outgoing[0]?.sentAt,
      lastContactDate: conversations[0]?.lastMessageAt,
      preferredTopic: getPreferredTopic(conversations),
      averageResponseTime: responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : null,
      responsesWithin30Minutes: responseTimes.filter(time => time <= 30).length,
      totalResponsesTracked: responseTimes.length
    };
    
    return insights;
  } catch (error) {
    console.error('Error getting client conversation insights:', error);
    throw error;
  }
}

/**
 * Determine the preferred topic based on conversation history
 * @param {Array} conversations - The client's conversations
 * @returns {string|null} The most frequent topic or null if none
 */
function getPreferredTopic(conversations) {
  if (!conversations || !conversations.length) return null;
  
  const topicCount = {};
  conversations.forEach(conv => {
    if (conv.topic) {
      topicCount[conv.topic] = (topicCount[conv.topic] || 0) + 1;
    }
  });
  
  if (Object.keys(topicCount).length === 0) return null;
  
  return Object.entries(topicCount)
    .sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Gets conversation details for a specific conversation
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<object>} Full conversation details with messages
 */
export async function getConversationDetails(conversationId) {
  try {
    const db = getPrismaClient();
    
    // Try to check if the table exists first (wrapped in a try-catch)
    try {
      // Get the conversation
      const conversation = await db.whatsappConversation.findUnique({
        where: { id: conversationId },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              language: true,
              email: true
            }
          }
        }
      });
      
      if (!conversation) {
        throw new Error(`Conversation with ID ${conversationId} not found`);
      }
      
      // Get all incoming messages for this phone number
      const incomingMessages = await db.whatsappIncomingMessage.findMany({
        where: { sender: conversation.phoneNumber },
        orderBy: { receivedAt: 'asc' }
      });
      
      // Get all outgoing messages for this phone number
      const outgoingMessages = await db.whatsappMessageLog.findMany({
        where: { recipient: conversation.phoneNumber },
        orderBy: { sentAt: 'asc' }
      });
      
      // Combine and sort all messages
      const allMessages = [
        ...incomingMessages.map(msg => ({
          id: msg.id,
          messageId: msg.messageId,
          direction: 'incoming',
          type: msg.messageType,
          content: msg.content,
          timestamp: msg.receivedAt,
          metadata: msg.metadata
        })),
        ...outgoingMessages.map(msg => ({
          id: msg.id,
          messageId: msg.messageId,
          direction: 'outgoing',
          type: msg.messageType,
          templateName: msg.templateName,
          status: msg.status,
          timestamp: msg.sentAt,
          metadata: msg.metadata
        }))
      ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      return {
        conversation,
        messages: allMessages
      };
    } catch (dbError) {
      // Check if this is a "table does not exist" error
      if (dbError.code === 'P2021' || // Prisma table not found error
          (dbError.message && (
            dbError.message.includes("doesn't exist") ||
            dbError.message.includes("not found") ||
            dbError.message.includes("no such table") ||
            dbError.message.includes("Unknown table")
          ))
      ) {
        throw new Error(`WhatsApp tables not yet created in the database. Please run the SQL migration script first. Original error: ${dbError.message}`);
      }
      throw dbError; // Re-throw other database errors
    }
  } catch (error) {
    console.error('Error getting conversation details:', error);
    throw error;
  }
}
