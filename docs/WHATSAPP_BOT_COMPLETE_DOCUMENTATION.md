# WhatsApp Bot - Complete Documentation

## Overview

This document provides comprehensive documentation for the Tar Real Estate WhatsApp Bot system, including architecture, functionality, and code structure.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [File Structure](#file-structure)
3. [Core Components](#core-components)
4. [Workflow Description](#workflow-description)
5. [Message Flow](#message-flow)
6. [Database Integration](#database-integration)
7. [Session Management](#session-management)
8. [Error Handling](#error-handling)
9. [Deployment & Configuration](#deployment--configuration)
10. [Maintenance & Monitoring](#maintenance--monitoring)

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WhatsApp      │────│   Webhook       │────│   Database      │
│   Business API  │    │   Handler       │    │   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               │
                       ┌───────┴────────┐
                       │                │
               ┌───────────────┐ ┌──────────────┐
               │   Session     │ │ Notification │
               │  Management   │ │   System     │
               └───────────────┘ └──────────────┘
```

### Technology Stack

- **Backend**: Next.js 14 (API Routes)
- **Database**: PostgreSQL with Prisma ORM
- **Message Service**: WhatsApp Business API
- **Session Storage**: In-memory Map (upgradeable to Redis)
- **Language Support**: Arabic & English
- **Deployment**: Vercel

## File Structure

```
src/app/api/whatsapp/webhook/
├── route.js                           # Main webhook handler
├── enhanced-request-handler-production.js # Database operations
└── README.md                          # This documentation

Key Files Explained:
├── route.js                   # 🚀 Main bot logic and message handling
├── enhanced-request-handler.js # 🔧 Database operations and business logic
├── lib/whatsapp.js           # 📱 WhatsApp API communication
├── lib/database-connection.js # 🗄️ Database connection management
└── prisma/schema.prisma      # 📊 Database schema definition
```

## Core Components

### 1. Webhook Handler (`route.js`)

**Purpose**: Main entry point for all WhatsApp messages

**Key Functions**:
- `POST()` - Processes incoming messages
- `GET()` - Handles webhook verification
- Message routing and response handling

**Code Structure**:
```javascript
// Import dependencies
import { NextRequest, NextResponse } from 'next/server';
import { sendInteractiveWhatsAppMessage, sendWhatsAppMessage } from '@/lib/whatsapp';

// Session management
const sessions = new Map();
const processedMessages = new Set();

// Main POST handler
export async function POST(request) {
  // Webhook message processing logic
}
```

### 2. Session Management

**Purpose**: Tracks user conversation state across messages

**Session Structure**:
```javascript
{
  phoneNumber: string,    // User's phone number
  language: string,       // 'ARABIC' or 'ENGLISH'
  step: string,          // Current conversation step
  data: object,          // Temporary form data
  timestamp: number      // Last activity time
}
```

**Key Functions**:
- `createSession()` - Creates new user session
- `getSession()` - Retrieves existing session
- `updateSession()` - Updates session data

### 3. Interactive Menu System

**Purpose**: Creates rich interactive WhatsApp menus

**Menu Types**:
- **Button Menus**: Language selection
- **List Menus**: Service selection, categories
- **Text Fallbacks**: For unsupported devices

**Example Menu Structure**:
```javascript
{
  type: "list",
  header: { type: "text", text: "Header Text" },
  body: { text: "Body message" },
  footer: { text: "Footer text" },
  action: {
    button: "Button Label",
    sections: [
      {
        title: "Section Title",
        rows: [
          {
            id: "option_id",
            title: "Option Title",
            description: "Option Description"
          }
        ]
      }
    ]
  }
}
```

### 4. Database Integration

**Purpose**: Stores and retrieves client data, requests, and complaints

**Key Functions**:
- `findClientWithPropertyProduction()` - Finds client by phone
- `createMaintenanceRequestProduction()` - Creates maintenance request
- `createComplaintProduction()` - Creates complaint
- `getClientRequestHistory()` - Retrieves request history

**Database Schema (Key Tables)**:
```sql
-- Clients table
Table: Client {
  id: String (Primary Key)
  name: String
  phone: String (Unique)
  email: String
  nationalId: String
  role: Enum (OWNER, RENTER, AGENT)
}

-- Maintenance Requests
Table: MaintenanceRequest {
  id: String (Primary Key)
  displayId: String (Unique, Human-readable)
  clientId: String (Foreign Key)
  propertyId: String (Foreign Key)
  unitId: String (Foreign Key)
  type: String
  priority: Enum (URGENT, HIGH, MEDIUM, LOW)
  description: String
  status: Enum (PENDING, IN_PROGRESS, COMPLETED, REJECTED)
}

-- Complaints
Table: Complaint {
  id: String (Primary Key)
  displayId: String (Unique, Human-readable)
  clientId: String (Foreign Key)
  propertyId: String (Foreign Key)
  unitId: String (Foreign Key)
  category: String
  description: String
  status: Enum (PENDING, REVIEWING, RESOLVED, REJECTED)
}
```

## Workflow Description

### 1. User Starts Conversation

```mermaid
graph TD
    A[User sends first message] --> B[Create session]
    B --> C[Send language selection]
    C --> D[User selects language]
    D --> E[Send main menu]
```

### 2. Maintenance Request Flow

```mermaid
graph TD
    A[User selects Maintenance Request] --> B[Show maintenance types]
    B --> C[User selects type] --> D[Show priority levels]
    D --> E[User selects priority] --> F[Request description]
    F --> G[User provides description] --> H[Create request in DB]
    H --> I[Send confirmation] --> J[Notify technician]
```

### 3. Complaint Submission Flow

```mermaid
graph TD
    A[User selects Submit Complaint] --> B[Show complaint categories]
    B --> C[User selects category] --> D[Request description]
    D --> E[User provides description] --> F[Create complaint in DB]
    F --> G[Send confirmation] --> H[Notify PR staff]
```

### 4. Status Check Flow

```mermaid
graph TD
    A[User selects Check Status] --> B[Query user's requests]
    B --> C{Has requests?}
    C -->|Yes| D[Format status message]
    C -->|No| E[Send 'no requests' message]
    D --> F[Send status details]
    E --> G[Return to main menu]
    F --> G
```

## Message Flow

### 1. Incoming Message Processing

```javascript
// Main message handler in POST function
export async function POST(request) {
  try {
    // Parse webhook data
    const body = await request.json();
    
    // Extract message details
    const { messages, contacts } = body.entry[0].changes[0].value;
    
    // Process each message
    for (const message of messages) {
      // Prevent duplicate processing
      if (processedMessages.has(message.id)) continue;
      
      // Route message based on type
      if (message.type === 'interactive') {
        await handleInteractiveMessage(message.interactive, phoneNumber);
      } else if (message.type === 'text') {
        await handleTextMessage(message.text.body, phoneNumber);
      }
    }
  } catch (error) {
    console.error('Webhook error:', error);
  }
}
```

### 2. Interactive Message Handling

```javascript
async function handleInteractiveMessage(interactive, phoneNumber) {
  if (interactive.type === 'button_reply') {
    // Handle button clicks (language selection)
    await handleButtonResponse(interactive.button_reply, phoneNumber);
  } else if (interactive.type === 'list_reply') {
    // Handle list selections (menus, options)
    await handleListResponse(interactive.list_reply, phoneNumber);
  }
}
```

### 3. Text Message Handling

```javascript
async function handleTextMessage(messageText, phoneNumber) {
  const session = getSession(phoneNumber);
  
  // No session = new conversation
  if (!session) {
    await sendLanguageSelection(phoneNumber);
    return;
  }
  
  // Route based on conversation step
  switch (session.step) {
    case 'awaiting_language_selection':
      // Handle text-based language selection
      break;
    case 'awaiting_description':
      // Process maintenance description
      await processEnhancedMaintenance(phoneNumber, messageText, session);
      break;
    case 'awaiting_complaint_description':
      // Process complaint description
      await processEnhancedComplaint(phoneNumber, messageText, session);
      break;
  }
}
```

## Database Integration

### 1. Connection Management

**File**: `lib/database-connection.js`

```javascript
// Read-only operations
export async function withReadOnlyConnection(callback) {
  const prisma = new PrismaClient();
  try {
    return await callback(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

// Write operations
export async function withWriteConnection(callback) {
  const prisma = new PrismaClient();
  try {
    return await callback(prisma);
  } finally {
    await prisma.$disconnect();
  }
}
```

### 2. Client Search with Phone Normalization

```javascript
async function findClient(phoneNumber) {
  // Clean and normalize phone number
  const clean = phoneNumber.replace(/^\+/, '').replace(/^971/, '').replace(/^0/, '');
  
  // Generate all possible UAE formats
  const variants = [
    phoneNumber,           // Original
    `+971${clean}`,        // +971xxxxxxxx
    `971${clean}`,         // 971xxxxxxxx
    `0${clean}`,           // 0xxxxxxxx
    clean,                 // xxxxxxxx
    `+9710${clean}`,       // +9710xxxxxxxx
    `9710${clean}`         // 9710xxxxxxxx
  ];
  
  // Search database with all variants
  const client = await prisma.client.findFirst({
    where: { phone: { in: variants } }
  });
  
  return client;
}
```

### 3. Request Creation

```javascript
async function createMaintenanceRequestProduction(phoneNumber, description, session) {
  return await withWriteConnection(async (prisma) => {
    // Find client
    const clientResult = await findClientWithPropertyProduction(phoneNumber);
    if (!clientResult.success) {
      return { success: false, error: 'CLIENT_NOT_FOUND' };
    }
    
    // Create maintenance request
    const request = await prisma.maintenanceRequest.create({
      data: {
        clientId: clientResult.client.id,
        propertyId: clientResult.property?.id,
        unitId: clientResult.unit?.id,
        type: session.data.maintenanceType || 'other',
        priority: session.data.priority || 'medium',
        description: description,
        status: 'PENDING'
      }
    });
    
    return {
      success: true,
      data: {
        request,
        client: clientResult.client,
        property: clientResult.property,
        unit: clientResult.unit
      }
    };
  });
}
```

## Session Management

### 1. In-Memory Storage

**Current Implementation**: JavaScript Map
```javascript
const sessions = new Map();

// Session structure
{
  phoneNumber: "971501234567",
  language: "ARABIC",
  step: "awaiting_description",
  data: {
    maintenanceType: "plumbing",
    priority: "high"
  },
  timestamp: 1703542800000
}
```

### 2. Session Lifecycle

```javascript
// Create new session
function createSession(phoneNumber, language = 'ARABIC') {
  const session = {
    phoneNumber,
    language,
    step: 'greeting',
    data: {},
    timestamp: Date.now()
  };
  sessions.set(phoneNumber, session);
  return session;
}

// Update existing session
function updateSession(phoneNumber, updates) {
  let session = getSession(phoneNumber) || createSession(phoneNumber);
  Object.assign(session, updates, { timestamp: Date.now() });
  sessions.set(phoneNumber, session);
  return session;
}

// Clean old sessions (runs every 30 minutes)
setInterval(() => {
  const now = Date.now();
  const thirtyMinutes = 30 * 60 * 1000;
  
  for (const [phoneNumber, session] of sessions.entries()) {
    if (now - session.timestamp > thirtyMinutes) {
      sessions.delete(phoneNumber);
    }
  }
}, 30 * 60 * 1000);
```

### 3. Production Upgrade Options

**Redis Implementation** (Recommended for production):
```javascript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getSession(phoneNumber) {
  const sessionData = await redis.get(`session:${phoneNumber}`);
  return sessionData ? JSON.parse(sessionData) : null;
}

async function updateSession(phoneNumber, updates) {
  const session = await getSession(phoneNumber) || createSession(phoneNumber);
  Object.assign(session, updates, { timestamp: Date.now() });
  await redis.setex(`session:${phoneNumber}`, 1800, JSON.stringify(session));
  return session;
}
```

## Error Handling

### 1. Message Processing Errors

```javascript
export async function POST(request) {
  try {
    // Main processing logic
  } catch (error) {
    console.error('❌ Webhook error:', error);
    
    // Return success to prevent WhatsApp retries
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
```

### 2. Interactive Message Fallbacks

```javascript
async function sendMainMenu(phoneNumber, language) {
  try {
    // Try interactive message first
    const menu = createMainMenu(language);
    await sendInteractiveWhatsAppMessage(phoneNumber, menu);
  } catch (error) {
    console.error('Error sending interactive menu:', error);
    
    // Fallback to text message
    const fallback = isArabic ?
      "اختر من الخيارات:\n1️⃣ طلب صيانة\n2️⃣ تقديم شكوى..." :
      "Choose from options:\n1️⃣ Maintenance Request\n2️⃣ Submit Complaint...";
    
    await sendWhatsAppMessage(phoneNumber, fallback);
  }
}
```

### 3. Database Error Handling

```javascript
async function createMaintenanceRequest(phoneNumber, description, session) {
  try {
    // Database operations
    const result = await createMaintenanceRequestProduction(phoneNumber, description, session);
    
    if (!result.success) {
      // Handle specific errors
      if (result.error === 'CLIENT_NOT_FOUND') {
        const errorMsg = "❌ لم نتمكن من العثور على حسابك في النظام";
        await sendWhatsAppMessage(phoneNumber, errorMsg);
        return;
      }
    }
    
    // Success handling
  } catch (error) {
    console.error('Database error:', error);
    
    const errorMsg = "❌ عذراً، حدث خطأ تقني. يرجى المحاولة مرة أخرى.";
    await sendWhatsAppMessage(phoneNumber, errorMsg);
  }
}
```

## Deployment & Configuration

### 1. Environment Variables

```bash
# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_verify_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Next.js
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=https://your-domain.com
```

### 2. Vercel Deployment

```json
// vercel.json
{
  "functions": {
    "src/app/api/whatsapp/webhook/route.js": {
      "maxDuration": 30
    }
  },
  "env": {
    "WHATSAPP_ACCESS_TOKEN": "@whatsapp_access_token",
    "WHATSAPP_VERIFY_TOKEN": "@whatsapp_verify_token",
    "DATABASE_URL": "@database_url"
  }
}
```

### 3. WhatsApp Webhook Configuration

```bash
# Set webhook URL
curl -X POST "https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/webhooks" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "webhooks": [{
      "callback_url": "https://your-domain.vercel.app/api/whatsapp/webhook",
      "verify_token": "your_verify_token",
      "fields": ["messages"]
    }]
  }'
```

## Maintenance & Monitoring

### 1. Logging

```javascript
// Structured logging throughout the application
console.log('🚀 WhatsApp Bot initialized');
console.log(`📱 Processing message from ${phoneNumber}`);
console.log(`✅ Request created: #${request.displayId}`);
console.log(`❌ Error: ${error.message}`);
```

### 2. Performance Monitoring

**Key Metrics**:
- Message processing time
- Database query duration
- Session memory usage
- Error rates by function

```javascript
// Performance timing example
const startTime = Date.now();
await processMaintenanceRequest(phoneNumber, description, session);
const duration = Date.now() - startTime;
console.log(`⏱️ Request processed in ${duration}ms`);
```

### 3. Health Checks

```javascript
// Health check endpoint
export async function GET(request) {
  if (request.url.includes('/health')) {
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      sessions: sessions.size
    });
  }
  
  // Regular webhook verification
  // ... existing verification logic
}
```

### 4. Production Considerations

**Scaling**:
- Move sessions to Redis for multi-instance support
- Implement message queuing for high volume
- Add database connection pooling
- Monitor memory usage and optimize

**Security**:
- Validate webhook signatures
- Implement rate limiting
- Sanitize user inputs
- Log security events

**Reliability**:
- Implement circuit breakers for external APIs
- Add retry logic for failed operations
- Monitor webhook delivery success
- Set up alerting for critical failures

## Troubleshooting Guide

### Common Issues

1. **Messages not being received**
   - Check webhook verification
   - Verify WhatsApp API credentials
   - Check Vercel function logs

2. **Interactive menus not working**
   - Check WhatsApp Business API version
   - Verify message format
   - Use text fallbacks

3. **Database connection issues**
   - Verify DATABASE_URL
   - Check connection limits
   - Monitor query performance

4. **Session data lost**
   - Check session cleanup intervals
   - Monitor memory usage
   - Consider Redis upgrade

### Debugging Tools

```javascript
// Debug session state
console.log('Session debug:', JSON.stringify(getSession(phoneNumber), null, 2));

// Debug message structure
console.log('Message debug:', JSON.stringify(message, null, 2));

// Debug database queries
console.log('Query result:', JSON.stringify(result, null, 2));
```

---

This documentation provides a complete overview of the WhatsApp Bot system. For specific implementation details, refer to the inline comments in the source code files.
