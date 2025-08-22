import { NextRequest, NextResponse } from 'next/server';
import { sendInteractiveWhatsAppMessage, sendWhatsAppMessage } from '@/lib/whatsapp';
import { withDatabaseConnection, withReadOnlyConnection, withWriteConnection } from '@/lib/database-connection';

// VERSION: NEW_CLEAN_2.0 - Complete Features with Enhanced Menus
// Created: January 16, 2025
// Goal: Add all the original bot features to the clean working base

console.log('🚀 WhatsApp Bot NEW_CLEAN_2.0 initialized with complete features');

// Simple in-memory session storage (will be enhanced later)
const sessions = new Map();
const processedMessages = new Set();

// Session management
function createSession(phoneNumber, language = 'ARABIC') {
  const session = {
    phoneNumber,
    language,
    step: 'greeting',
    data: {},
    timestamp: Date.now()
  };
  sessions.set(phoneNumber, session);
  console.log(`✅ Created session for ${phoneNumber}:`, session);
  return session;
}

function getSession(phoneNumber) {
  return sessions.get(phoneNumber);
}

function updateSession(phoneNumber, updates) {
  let session = getSession(phoneNumber) || createSession(phoneNumber);
  Object.assign(session, updates, { timestamp: Date.now() });
  sessions.set(phoneNumber, session);
  console.log(`🔄 Updated session for ${phoneNumber}:`, session);
  return session;
}

// Enhanced client search with UAE phone formats
async function findClient(phoneNumber) {
  return await withReadOnlyConnection(async (prisma) => {
    try {
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
      
      console.log(`🔍 Searching client with variants:`, variants);
      
      const client = await prisma.client.findFirst({
        where: {
          OR: variants.map(v => ({ phone: v }))
        }
      });
      
      if (client) {
        console.log(`✅ Found client: ${client.name} (${client.phone})`);
      } else {
        console.log(`❌ No client found for ${phoneNumber}`);
      }
      
      return client;
    } catch (error) {
      console.error('Error finding client:', error);
      return null;
    }
  });
}

// Language selection message
function createLanguageSelection() {
  return {
    type: "button",
    header: {
      type: "text",
      text: "🌍 Language Selection / اختيار اللغة"
    },
    body: {
      text: "Welcome! Please choose your preferred language to continue.\n\nمرحبًا! يرجى اختيار لغتك المفضلة للمتابعة."
    },
    footer: {
      text: "Choose your language / اختر لغتك"
    },
    action: {
      buttons: [
        {
          type: "reply",
          reply: {
            id: "lang_en",
            title: "🇺🇸 English"
          }
        },
        {
          type: "reply",
          reply: {
            id: "lang_ar", 
            title: "🇸🇦 العربية"
          }
        }
      ]
    }
  };
}

// Main menu
function createMainMenu(language) {
  const isArabic = language === 'ARABIC';
  
  return {
    type: "list",
    header: {
      type: "text",
      text: isArabic ? "خدمات العملاء" : "Customer Services"
    },
    body: {
      text: isArabic ? 
        "مرحباً بك! يرجى اختيار الخدمة التي تحتاجها:" :
        "Welcome! Please select the service you need:"
    },
    footer: {
      text: isArabic ? "نحن هنا لخدمتك 24/7" : "We're here to serve you 24/7"
    },
    action: {
      button: isArabic ? "اختر الخدمة" : "Select Service",
      sections: [
        {
          title: isArabic ? "الخدمات المتاحة" : "Available Services",
          rows: [
            {
              id: "maintenance",
              title: isArabic ? "🔧 طلب صيانة" : "🔧 Maintenance Request",
              description: isArabic ? "الإبلاغ عن مشكلة في العقار" : "Report property issue"
            },
            {
              id: "complaint",
              title: isArabic ? "📝 تقديم شكوى" : "📝 Submit Complaint",
              description: isArabic ? "تقديم شكوى أو اقتراح" : "Submit complaint or suggestion"
            },
            {
              id: "status",
              title: isArabic ? "📊 حالة الطلبات" : "📊 Check Status",
              description: isArabic ? "متابعة طلباتك السابقة" : "Track your previous requests"
            },
            {
              id: "support",
              title: isArabic ? "☎️ الدعم الفني" : "☎️ Technical Support",
              description: isArabic ? "التحدث مع ممثل الدعم" : "Speak with support representative"
            }
          ]
        }
      ]
    }
  };
}

// Send language selection
async function sendLanguageSelection(phoneNumber) {
  try {
    console.log(`🌍 Sending language selection to ${phoneNumber}`);
    const message = createLanguageSelection();
    await sendInteractiveWhatsAppMessage(phoneNumber, message);
    updateSession(phoneNumber, { step: 'language_selection' });
    console.log(`✅ Language selection sent`);
  } catch (error) {
    console.error('Error sending language selection:', error);
    // Fallback to text message
    const fallback = "Welcome! Reply with:\n1 - English\n2 - العربية\n\nمرحباً! اكتب:\n1 - English\n2 - العربية";
    await sendWhatsAppMessage(phoneNumber, fallback);
  }
}

// Send main menu
async function sendMainMenu(phoneNumber, language) {
  try {
    console.log(`📋 Sending main menu to ${phoneNumber} in ${language}`);
    const menu = createMainMenu(language);
    await sendInteractiveWhatsAppMessage(phoneNumber, menu);
    updateSession(phoneNumber, { step: 'main_menu', language });
    console.log(`✅ Main menu sent`);
  } catch (error) {
    console.error('Error sending main menu:', error);
    // Fallback to text message
    const isArabic = language === 'ARABIC';
    const fallback = isArabic ?
      "اختر من الخيارات:\n1️⃣ صيانة\n2️⃣ شكوى\n3️⃣ حالة الطلبات\n4️⃣ الدعم" :
      "Choose from options:\n1️⃣ Maintenance\n2️⃣ Complaint\n3️⃣ Check Status\n4️⃣ Support";
    await sendWhatsAppMessage(phoneNumber, fallback);
  }
}

// Handle button responses (language selection)
async function handleButtonResponse(buttonReply, phoneNumber) {
  const buttonId = buttonReply.id;
  console.log(`🔘 Button pressed: ${buttonId} by ${phoneNumber}`);
  
  // Language selection
  if (buttonId === 'lang_en' || buttonId === 'lang_ar') {
    const language = buttonId === 'lang_en' ? 'ENGLISH' : 'ARABIC';
    console.log(`✅ Language selected: ${language}`);
    
    await sendMainMenu(phoneNumber, language);
    return;
  }
  
  console.log(`❓ Unknown button: ${buttonId}`);
}

// Handle list responses (main menu and other lists)
async function handleListResponse(listReply, phoneNumber) {
  const selectedId = listReply.id;
  const session = getSession(phoneNumber);
  
  console.log(`📝 List option selected: ${selectedId} by ${phoneNumber}`);
  console.log(`📋 Current session:`, session);
  
  if (!session) {
    console.log(`❌ No session found, starting over`);
    await sendLanguageSelection(phoneNumber);
    return;
  }
  
  const language = session.language || 'ARABIC';
  const isArabic = language === 'ARABIC';
  
  // Main menu selections
  if (session.step === 'main_menu') {
    switch (selectedId) {
      case 'maintenance':
        console.log(`🔧 Starting maintenance request`);
        const maintenanceMsg = isArabic ?
          "شكراً لاختيارك خدمة الصيانة. يرجى وصف المشكلة بالتفصيل وسيقوم فريقنا بالتواصل معك قريباً." :
          "Thank you for choosing maintenance service. Please describe the issue in detail and our team will contact you soon.";
        
        await sendWhatsAppMessage(phoneNumber, maintenanceMsg);
        updateSession(phoneNumber, { step: 'maintenance_description' });
        break;
        
      case 'complaint':
        console.log(`📝 Starting complaint submission`);
        const complaintMsg = isArabic ?
          "شكراً لاختيارك تقديم شكوى. يرجى وصف الشكوى بالتفصيل وسنقوم بمراجعتها والرد عليك." :
          "Thank you for choosing to submit a complaint. Please describe your complaint in detail and we will review it and respond.";
        
        await sendWhatsAppMessage(phoneNumber, complaintMsg);
        updateSession(phoneNumber, { step: 'complaint_description' });
        break;
        
      case 'status':
        console.log(`📊 Checking request status`);
        await handleStatusCheck(phoneNumber, language);
        break;
        
      case 'support':
        console.log(`☎️ Requesting technical support`);
        await handleSupportRequest(phoneNumber, language);
        break;
        
      default:
        console.log(`❓ Unknown menu option: ${selectedId}`);
        await sendMainMenu(phoneNumber, language);
    }
  }
}

// Handle text messages
async function handleTextMessage(messageText, phoneNumber) {
  console.log(`💬 Text message from ${phoneNumber}: "${messageText}"`);
  
  const session = getSession(phoneNumber);
  const text = messageText.toLowerCase().trim();
  
  // No session - start conversation
  if (!session) {
    console.log(`🆕 New conversation starting`);
    await sendLanguageSelection(phoneNumber);
    return;
  }
  
  const language = session.language || 'ARABIC';
  const isArabic = language === 'ARABIC';
  
  // Handle different steps
  switch (session.step) {
    case 'language_selection':
      // Handle text-based language selection
      if (text === '1' || text.includes('english')) {
        await sendMainMenu(phoneNumber, 'ENGLISH');
      } else if (text === '2' || text.includes('عرب')) {
        await sendMainMenu(phoneNumber, 'ARABIC');
      } else {
        await sendLanguageSelection(phoneNumber);
      }
      break;
      
    case 'maintenance_description':
      console.log(`🔧 Processing maintenance request: "${messageText}"`);
      await processMaintenance(phoneNumber, messageText, session);
      break;
      
    case 'complaint_description':
      console.log(`📝 Processing complaint: "${messageText}"`);
      await processComplaint(phoneNumber, messageText, session);
      break;
      
    default:
      console.log(`📋 Redirecting to main menu`);
      await sendMainMenu(phoneNumber, language);
  }
}

// Process maintenance request
async function processMaintenance(phoneNumber, description, session) {
  const language = session.language || 'ARABIC';
  const isArabic = language === 'ARABIC';
  
  try {
    console.log(`🔧 Creating maintenance request for ${phoneNumber}`);
    
    // Find client
    const client = await findClient(phoneNumber);
    if (!client) {
      const msg = isArabic ?
        "❌ لم نتمكن من العثور على حسابك. يرجى الاتصال بمكتبنا: 971234567890" :
        "❌ We couldn't find your account. Please contact our office: 971234567890";
      
      await sendWhatsAppMessage(phoneNumber, msg);
      setTimeout(() => sendMainMenu(phoneNumber, language), 2000);
      return;
    }
    
    // Create maintenance request
    await withWriteConnection(async (prisma) => {
      const request = await prisma.maintenanceRequest.create({
        data: {
          clientId: client.id,
          propertyId: null, // Will be set later when we have property selection
          unitId: null,     // Will be set later when we have unit selection
          description: description,
          status: 'PENDING',
          priority: 'MEDIUM', // Default priority for now
          isExpired: false,
          lastRequestTime: new Date()
        }
      });
      
      console.log(`✅ Maintenance request created with ID: ${request.id}`);
      
      const successMsg = isArabic ?
        `✅ تم تقديم طلب الصيانة بنجاح!\n\n📋 رقم الطلب: #${request.id}\n📝 الوصف: ${description}\n\n⏰ سيقوم فريقنا بمراجعته والتواصل معك قريباً.\n\nهل تحتاج إلى خدمة أخرى؟` :
        `✅ Maintenance request submitted successfully!\n\n📋 Request #: ${request.id}\n📝 Description: ${description}\n\n⏰ Our team will review it and contact you soon.\n\nDo you need another service?`;
      
      await sendWhatsAppMessage(phoneNumber, successMsg);
      
      // Return to main menu after delay
      setTimeout(() => sendMainMenu(phoneNumber, language), 3000);
    });
    
  } catch (error) {
    console.error('Error processing maintenance request:', error);
    
    const errorMsg = isArabic ?
      "❌ عذراً، حدث خطأ أثناء تقديم الطلب. يرجى المحاولة مرة أخرى." :
      "❌ Sorry, an error occurred while submitting the request. Please try again.";
    
    await sendWhatsAppMessage(phoneNumber, errorMsg);
    setTimeout(() => sendMainMenu(phoneNumber, language), 2000);
  }
}

// Process complaint
async function processComplaint(phoneNumber, description, session) {
  const language = session.language || 'ARABIC';
  const isArabic = language === 'ARABIC';
  
  try {
    console.log(`📝 Creating complaint for ${phoneNumber}`);
    
    // Find client
    const client = await findClient(phoneNumber);
    if (!client) {
      const msg = isArabic ?
        "❌ لم نتمكن من العثور على حسابك. يرجى الاتصال بمكتبنا: 971234567890" :
        "❌ We couldn't find your account. Please contact our office: 971234567890";
      
      await sendWhatsAppMessage(phoneNumber, msg);
      setTimeout(() => sendMainMenu(phoneNumber, language), 2000);
      return;
    }
    
    // Create complaint
    await withWriteConnection(async (prisma) => {
      const complaint = await prisma.complaint.create({
        data: {
          clientId: client.id,
          propertyId: null, // Will be set later
          unitId: null,     // Will be set later
          title: description.length > 50 ? description.substring(0, 47) + "..." : description,
          description: description,
          category: 'OTHER', // Default category for now
          status: 'PENDING'
        }
      });
      
      console.log(`✅ Complaint created with ID: ${complaint.id}`);
      
      const successMsg = isArabic ?
        `✅ تم تقديم الشكوى بنجاح!\n\n📋 رقم الشكوى: #${complaint.id}\n📝 الوصف: ${description}\n\n⏰ سيقوم فريقنا بمراجعتها والرد عليك قريباً.\n\nهل تحتاج إلى خدمة أخرى؟` :
        `✅ Complaint submitted successfully!\n\n📋 Complaint #: ${complaint.id}\n📝 Description: ${description}\n\n⏰ Our team will review it and respond soon.\n\nDo you need another service?`;
      
      await sendWhatsAppMessage(phoneNumber, successMsg);
      
      // Return to main menu after delay
      setTimeout(() => sendMainMenu(phoneNumber, language), 3000);
    });
    
  } catch (error) {
    console.error('Error processing complaint:', error);
    
    const errorMsg = isArabic ?
      "❌ عذراً، حدث خطأ أثناء تقديم الشكوى. يرجى المحاولة مرة أخرى." :
      "❌ Sorry, an error occurred while submitting the complaint. Please try again.";
    
    await sendWhatsAppMessage(phoneNumber, errorMsg);
    setTimeout(() => sendMainMenu(phoneNumber, language), 2000);
  }
}

// Handle status check
async function handleStatusCheck(phoneNumber, language) {
  const isArabic = language === 'ARABIC';
  
  try {
    const client = await findClient(phoneNumber);
    if (!client) {
      const msg = isArabic ?
        "❌ لم نتمكن من العثور على حسابك. يرجى الاتصال بمكتبنا: 971234567890" :
        "❌ We couldn't find your account. Please contact our office: 971234567890";
      
      await sendWhatsAppMessage(phoneNumber, msg);
      setTimeout(() => sendMainMenu(phoneNumber, language), 2000);
      return;
    }
    
    await withReadOnlyConnection(async (prisma) => {
      // Get recent requests
      const requests = await prisma.maintenanceRequest.findMany({
        where: { clientId: client.id },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      
      const complaints = await prisma.complaint.findMany({
        where: { clientId: client.id },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      
      let statusMsg = isArabic ? "📊 حالة طلباتك:\n\n" : "📊 Your requests status:\n\n";
      
      if (requests.length > 0) {
        statusMsg += isArabic ? "🔧 طلبات الصيانة:\n" : "🔧 Maintenance Requests:\n";
        requests.forEach(req => {
          const statusText = isArabic ? 
            { PENDING: 'معلق', IN_PROGRESS: 'قيد المعالجة', COMPLETED: 'مكتمل', REJECTED: 'مرفوض' } :
            { PENDING: 'Pending', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed', REJECTED: 'Rejected' };
          statusMsg += `#${req.id}: ${statusText[req.status] || req.status}\n`;
        });
        statusMsg += "\n";
      }
      
      if (complaints.length > 0) {
        statusMsg += isArabic ? "📝 الشكاوى:\n" : "📝 Complaints:\n";
        complaints.forEach(comp => {
          const statusText = isArabic ? 
            { PENDING: 'معلق', REVIEWING: 'قيد المراجعة', RESOLVED: 'محلول', REJECTED: 'مرفوض' } :
            { PENDING: 'Pending', REVIEWING: 'Reviewing', RESOLVED: 'Resolved', REJECTED: 'Rejected' };
          statusMsg += `#${comp.id}: ${statusText[comp.status] || comp.status}\n`;
        });
      }
      
      if (requests.length === 0 && complaints.length === 0) {
        statusMsg = isArabic ? 
          "📊 لا توجد طلبات سابقة." : 
          "📊 No previous requests found.";
      }
      
      await sendWhatsAppMessage(phoneNumber, statusMsg);
      setTimeout(() => sendMainMenu(phoneNumber, language), 3000);
    });
    
  } catch (error) {
    console.error('Error checking status:', error);
    const errorMsg = isArabic ?
      "❌ عذراً، حدث خطأ أثناء فحص الحالة." :
      "❌ Sorry, an error occurred while checking status.";
    
    await sendWhatsAppMessage(phoneNumber, errorMsg);
    setTimeout(() => sendMainMenu(phoneNumber, language), 2000);
  }
}

// Handle support request
async function handleSupportRequest(phoneNumber, language) {
  const isArabic = language === 'ARABIC';
  
  try {
    const client = await findClient(phoneNumber);
    if (!client) {
      const msg = isArabic ?
        "❌ لم نتمكن من العثور على حسابك. يرجى الاتصال بمكتبنا: 971234567890" :
        "❌ We couldn't find your account. Please contact our office: 971234567890";
      
      await sendWhatsAppMessage(phoneNumber, msg);
      setTimeout(() => sendMainMenu(phoneNumber, language), 2000);
      return;
    }
    
    // Log support request
    await withWriteConnection(async (prisma) => {
      await prisma.contactForm.create({
        data: {
          name: client.name,
          email: client.email || 'noemail@provided.com',
          phone: phoneNumber,
          message: 'Customer requested support via WhatsApp bot',
          language: language
        }
      });
      
      const supportMsg = isArabic ?
        "✅ تم إرسال طلب الدعم الفني!\n\n📞 سيتصل بك ممثل خدمة العملاء خلال 30 دقيقة.\n\nشكراً لك!" :
        "✅ Technical support request sent!\n\n📞 A customer service representative will contact you within 30 minutes.\n\nThank you!";
      
      await sendWhatsAppMessage(phoneNumber, supportMsg);
      setTimeout(() => sendMainMenu(phoneNumber, language), 3000);
    });
    
  } catch (error) {
    console.error('Error handling support request:', error);
    const errorMsg = isArabic ?
      "❌ عذراً، حدث خطأ أثناء إرسال طلب الدعم." :
      "❌ Sorry, an error occurred while sending support request.";
    
    await sendWhatsAppMessage(phoneNumber, errorMsg);
    setTimeout(() => sendMainMenu(phoneNumber, language), 2000);
  }
}

// Main webhook handler
export async function POST(request) {
  try {
    const body = await request.json();
    
    console.log('\n🌐 ===== NEW WEBHOOK RECEIVED =====');
    console.log(`📅 Time: ${new Date().toISOString()}`);
    console.log(`🔧 Version: NEW_CLEAN_1.0`);
    console.log(`📦 Body:`, JSON.stringify(body, null, 2));
    
    // Extract message
    if (!body.entry?.[0]?.changes?.[0]?.value?.messages) {
      console.log('❌ No messages found in webhook');
      return NextResponse.json({ status: 'no_messages' });
    }
    
    const message = body.entry[0].changes[0].value.messages[0];
    const phoneNumber = message.from;
    const messageId = message.id;
    
    console.log(`📱 Message from: ${phoneNumber}`);
    console.log(`📝 Type: ${message.type}`);
    console.log(`🆔 ID: ${messageId}`);
    
    // Prevent duplicate processing
    const duplicateId = `${messageId}_${phoneNumber}`;
    if (processedMessages.has(duplicateId)) {
      console.log(`⚠️ Duplicate message detected: ${duplicateId}`);
      return NextResponse.json({ status: 'duplicate' });
    }
    processedMessages.add(duplicateId);
    
    // Log current session state
    const currentSession = getSession(phoneNumber);
    console.log(`📋 Current session:`, currentSession ? {
      step: currentSession.step,
      language: currentSession.language,
      timestamp: new Date(currentSession.timestamp).toLocaleString()
    } : 'NO SESSION');
    
    // Handle different message types
    if (message.type === 'text') {
      const messageText = message.text.body;
      console.log(`💬 Text: "${messageText}"`);
      await handleTextMessage(messageText, phoneNumber);
      
    } else if (message.type === 'interactive') {
      console.log(`🎯 Interactive:`, JSON.stringify(message.interactive));
      
      if (message.interactive.button_reply) {
        await handleButtonResponse(message.interactive.button_reply, phoneNumber);
      } else if (message.interactive.list_reply) {
        await handleListResponse(message.interactive.list_reply, phoneNumber);
      }
      
    } else {
      console.log(`❓ Unsupported message type: ${message.type}`);
    }
    
    // Log final session state
    const finalSession = getSession(phoneNumber);
    console.log(`📋 Final session:`, finalSession ? {
      step: finalSession.step,
      language: finalSession.language,
      timestamp: new Date(finalSession.timestamp).toLocaleString()
    } : 'NO SESSION');
    
    console.log('✅ Webhook processing completed');
    console.log('================================\n');
    
    return NextResponse.json({ status: 'success' });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
}

// Webhook verification
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    
    console.log(`🔍 Webhook verification - Mode: ${mode}, Token: ${token ? 'provided' : 'missing'}`);
    
    if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
      console.log('✅ Webhook verification successful');
      return new Response(challenge, { status: 200 });
    }
    
    console.log('❌ Webhook verification failed');
    return new Response('Forbidden', { status: 403 });
    
  } catch (error) {
    console.error('❌ Webhook verification error:', error);
    return new Response('Error', { status: 500 });
  }
}

console.log('✅ WhatsApp Bot NEW_CLEAN_1.0 ready');
