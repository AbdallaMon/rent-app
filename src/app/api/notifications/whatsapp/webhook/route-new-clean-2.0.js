import { NextRequest, NextResponse } from 'next/server';
import { sendInteractiveWhatsAppMessage, sendWhatsAppMessage } from '@/lib/whatsapp';
import { withDatabaseConnection, withReadOnlyConnection, withWriteConnection } from '@/lib/database-connection';

// VERSION: NEW_CLEAN_2.0 - Complete Features with Enhanced Menus
// Created: January 16, 2025
// Goal: Add all the original bot features to the clean working base

console.log('🚀 WhatsApp Bot NEW_CLEAN_2.0 initialized with complete features');

// Enhanced in-memory session storage
const sessions = new Map();
const processedMessages = new Set();

// Clean old sessions periodically (every 30 minutes)
setInterval(() => {
  const now = Date.now();
  const thirtyMinutes = 30 * 60 * 1000;
  
  for (const [phoneNumber, session] of sessions.entries()) {
    if (now - session.timestamp > thirtyMinutes) {
      sessions.delete(phoneNumber);
      console.log(`🧹 Cleaned old session for ${phoneNumber}`);
    }
  }
}, 30 * 60 * 1000);

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
        
        // Create demo client for testing number
        if (clean === '1234567890' || phoneNumber === '1234567890') {
          console.log(`🧪 Creating demo client for testing`);
          const demoClient = await prisma.client.create({
            data: {
              name: 'عميل تجريبي',
              phone: phoneNumber,
              email: 'demo@test.com',
              nationalId: '123456789',
              isActive: true
            }
          });
          return demoClient;
        }
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

// Enhanced main menu
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
              id: "maintenance_request",
              title: isArabic ? "🔧 طلب صيانة" : "🔧 Maintenance Request",
              description: isArabic ? "الإبلاغ عن مشكلة في العقار أو الوحدة" : "Report property or unit issue"
            },
            {
              id: "submit_complaint",
              title: isArabic ? "📝 تقديم شكوى" : "📝 Submit Complaint",
              description: isArabic ? "تقديم شكوى أو اقتراح للتحسين" : "Submit complaint or suggestion for improvement"
            },
            {
              id: "check_status",
              title: isArabic ? "📊 حالة الطلبات" : "📊 Check Status",
              description: isArabic ? "متابعة حالة طلباتك السابقة" : "Track your previous requests status"
            },
            {
              id: "contact_support",
              title: isArabic ? "☎️ الاتصال بالدعم" : "☎️ Contact Support",
              description: isArabic ? "التحدث مع ممثل خدمة العملاء" : "Speak with customer service representative"
            }
          ]
        }
      ]
    }
  };
}

// Maintenance type selection
function createMaintenanceTypeMenu(language) {
  const isArabic = language === 'ARABIC';
  
  return {
    type: "list",
    header: {
      type: "text",
      text: isArabic ? "نوع طلب الصيانة" : "Maintenance Request Type"
    },
    body: {
      text: isArabic ? 
        "يرجى اختيار نوع المشكلة التي تحتاج إلى صيانة:" :
        "Please select the type of issue that needs maintenance:"
    },
    footer: {
      text: isArabic ? "اختر النوع المناسب" : "Select the appropriate type"
    },
    action: {
      button: isArabic ? "اختر النوع" : "Select Type",
      sections: [
        {
          title: isArabic ? "أنواع الصيانة" : "Maintenance Types",
          rows: [
            {
              id: "plumbing",
              title: isArabic ? "🚿 سباكة" : "🚿 Plumbing",
              description: isArabic ? "مشاكل المياه والصرف الصحي" : "Water and drainage issues"
            },
            {
              id: "electrical",
              title: isArabic ? "⚡ كهرباء" : "⚡ Electrical",
              description: isArabic ? "مشاكل الكهرباء والإضاءة" : "Electrical and lighting issues"
            },
            {
              id: "ac_heating",
              title: isArabic ? "❄️ تكييف وتدفئة" : "❄️ AC & Heating",
              description: isArabic ? "مشاكل التكييف والتدفئة" : "Air conditioning and heating issues"
            },
            {
              id: "appliances",
              title: isArabic ? "🏠 أجهزة منزلية" : "🏠 Appliances",
              description: isArabic ? "مشاكل الأجهزة المنزلية" : "Home appliances issues"
            },
            {
              id: "structural",
              title: isArabic ? "🏗️ إنشائية" : "🏗️ Structural",
              description: isArabic ? "مشاكل الأبواب والنوافذ والجدران" : "Doors, windows, and walls issues"
            },
            {
              id: "other_maintenance",
              title: isArabic ? "🔧 أخرى" : "🔧 Other",
              description: isArabic ? "مشاكل صيانة أخرى" : "Other maintenance issues"
            }
          ]
        }
      ]
    }
  };
}

// Priority selection
function createPriorityMenu(language) {
  const isArabic = language === 'ARABIC';
  
  return {
    type: "list",
    header: {
      type: "text",
      text: isArabic ? "أولوية الطلب" : "Request Priority"
    },
    body: {
      text: isArabic ? 
        "يرجى تحديد أولوية طلب الصيانة:" :
        "Please specify the priority of your maintenance request:"
    },
    footer: {
      text: isArabic ? "اختر الأولوية المناسبة" : "Select appropriate priority"
    },
    action: {
      button: isArabic ? "اختر الأولوية" : "Select Priority",
      sections: [
        {
          title: isArabic ? "مستويات الأولوية" : "Priority Levels",
          rows: [
            {
              id: "urgent",
              title: isArabic ? "🔴 عاجل" : "🔴 Urgent",
              description: isArabic ? "مشكلة طارئة تحتاج حل فوري" : "Emergency issue needs immediate solution"
            },
            {
              id: "high",
              title: isArabic ? "🟠 عالية" : "🟠 High",
              description: isArabic ? "مشكلة مهمة تحتاج حل سريع" : "Important issue needs quick solution"
            },
            {
              id: "medium",
              title: isArabic ? "🟡 متوسطة" : "🟡 Medium",
              description: isArabic ? "مشكلة عادية يمكن حلها خلال أيام" : "Normal issue can be solved within days"
            },
            {
              id: "low",
              title: isArabic ? "🟢 منخفضة" : "🟢 Low",
              description: isArabic ? "مشكلة بسيطة غير عاجلة" : "Simple issue not urgent"
            }
          ]
        }
      ]
    }
  };
}

// Complaint categories
function createComplaintCategoryMenu(language) {
  const isArabic = language === 'ARABIC';
  
  return {
    type: "list",
    header: {
      type: "text",
      text: isArabic ? "نوع الشكوى" : "Complaint Type"
    },
    body: {
      text: isArabic ? 
        "يرجى اختيار نوع الشكوى التي تريد تقديمها:" :
        "Please select the type of complaint you want to submit:"
    },
    footer: {
      text: isArabic ? "اختر النوع المناسب" : "Select appropriate type"
    },
    action: {
      button: isArabic ? "اختر النوع" : "Select Type",
      sections: [
        {
          title: isArabic ? "أنواع الشكاوى" : "Complaint Types",
          rows: [
            {
              id: "property_issue",
              title: isArabic ? "🏠 مشكلة في العقار" : "🏠 Property Issue",
              description: isArabic ? "مشاكل متعلقة بالعقار أو الوحدة" : "Issues related to property or unit"
            },
            {
              id: "rent_issue",
              title: isArabic ? "💰 مشكلة في الإيجار" : "💰 Rent Issue",
              description: isArabic ? "مشاكل متعلقة بالإيجار أو الدفع" : "Issues related to rent or payment"
            },
            {
              id: "neighbor_issue",
              title: isArabic ? "👥 مشكلة مع الجيران" : "👥 Neighbor Issue",
              description: isArabic ? "مشاكل مع الجيران أو السكان" : "Issues with neighbors or residents"
            },
            {
              id: "maintenance_issue",
              title: isArabic ? "🔧 مشكلة في الصيانة" : "🔧 Maintenance Issue",
              description: isArabic ? "شكوى حول خدمة الصيانة" : "Complaint about maintenance service"
            },
            {
              id: "noise_issue",
              title: isArabic ? "🔊 مشكلة ضوضاء" : "🔊 Noise Issue",
              description: isArabic ? "شكوى من الضوضاء أو الإزعاج" : "Complaint about noise or disturbance"
            },
            {
              id: "security_issue",
              title: isArabic ? "🛡️ مشكلة أمنية" : "🛡️ Security Issue",
              description: isArabic ? "مشاكل أمنية أو سلامة" : "Security or safety issues"
            },
            {
              id: "payment_issue",
              title: isArabic ? "💳 مشكلة في الدفع" : "💳 Payment Issue",
              description: isArabic ? "مشاكل في نظام الدفع" : "Payment system issues"
            },
            {
              id: "other_complaint",
              title: isArabic ? "📝 أخرى" : "📝 Other",
              description: isArabic ? "شكوى أخرى غير مذكورة" : "Other complaint not listed"
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
    updateSession(phoneNumber, { step: 'awaiting_language_selection' });
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
    updateSession(phoneNumber, { step: 'awaiting_main_menu_selection', language });
    console.log(`✅ Main menu sent`);
  } catch (error) {
    console.error('Error sending main menu:', error);
    // Fallback to text message
    const isArabic = language === 'ARABIC';
    const fallback = isArabic ?
      "اختر من الخيارات:\n1️⃣ طلب صيانة\n2️⃣ تقديم شكوى\n3️⃣ حالة الطلبات\n4️⃣ الاتصال بالدعم" :
      "Choose from options:\n1️⃣ Maintenance Request\n2️⃣ Submit Complaint\n3️⃣ Check Status\n4️⃣ Contact Support";
    await sendWhatsAppMessage(phoneNumber, fallback);
  }
}

// Send maintenance type menu
async function sendMaintenanceTypeMenu(phoneNumber, language) {
  try {
    console.log(`🔧 Sending maintenance type menu to ${phoneNumber}`);
    const menu = createMaintenanceTypeMenu(language);
    await sendInteractiveWhatsAppMessage(phoneNumber, menu);
    updateSession(phoneNumber, { step: 'awaiting_maintenance_type' });
    console.log(`✅ Maintenance type menu sent`);
  } catch (error) {
    console.error('Error sending maintenance type menu:', error);
    const isArabic = language === 'ARABIC';
    const fallback = isArabic ?
      "اختر نوع الصيانة:\n1️⃣ سباكة\n2️⃣ كهرباء\n3️⃣ تكييف\n4️⃣ أجهزة\n5️⃣ إنشائية\n6️⃣ أخرى" :
      "Choose maintenance type:\n1️⃣ Plumbing\n2️⃣ Electrical\n3️⃣ AC\n4️⃣ Appliances\n5️⃣ Structural\n6️⃣ Other";
    await sendWhatsAppMessage(phoneNumber, fallback);
  }
}

// Send priority menu
async function sendPriorityMenu(phoneNumber, language) {
  try {
    console.log(`📶 Sending priority menu to ${phoneNumber}`);
    const menu = createPriorityMenu(language);
    await sendInteractiveWhatsAppMessage(phoneNumber, menu);
    updateSession(phoneNumber, { step: 'awaiting_priority_selection' });
    console.log(`✅ Priority menu sent`);
  } catch (error) {
    console.error('Error sending priority menu:', error);
    const isArabic = language === 'ARABIC';
    const fallback = isArabic ?
      "اختر الأولوية:\n1️⃣ عاجل\n2️⃣ عالية\n3️⃣ متوسطة\n4️⃣ منخفضة" :
      "Choose priority:\n1️⃣ Urgent\n2️⃣ High\n3️⃣ Medium\n4️⃣ Low";
    await sendWhatsAppMessage(phoneNumber, fallback);
  }
}

// Send complaint category menu
async function sendComplaintCategoryMenu(phoneNumber, language) {
  try {
    console.log(`📝 Sending complaint category menu to ${phoneNumber}`);
    const menu = createComplaintCategoryMenu(language);
    await sendInteractiveWhatsAppMessage(phoneNumber, menu);
    updateSession(phoneNumber, { step: 'awaiting_complaint_category' });
    console.log(`✅ Complaint category menu sent`);
  } catch (error) {
    console.error('Error sending complaint category menu:', error);
    const isArabic = language === 'ARABIC';
    const fallback = isArabic ?
      "اختر نوع الشكوى:\n1️⃣ العقار\n2️⃣ الإيجار\n3️⃣ الجيران\n4️⃣ الصيانة\n5️⃣ الضوضاء\n6️⃣ الأمان\n7️⃣ الدفع\n8️⃣ أخرى" :
      "Choose complaint type:\n1️⃣ Property\n2️⃣ Rent\n3️⃣ Neighbors\n4️⃣ Maintenance\n5️⃣ Noise\n6️⃣ Security\n7️⃣ Payment\n8️⃣ Other";
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
  
  // Handle based on current step
  switch (session.step) {
    case 'awaiting_main_menu_selection':
      await handleMainMenuSelection(selectedId, phoneNumber, language);
      break;
      
    case 'awaiting_maintenance_type':
      await handleMaintenanceTypeSelection(selectedId, phoneNumber, language);
      break;
      
    case 'awaiting_priority_selection':
      await handlePrioritySelection(selectedId, phoneNumber, language);
      break;
      
    case 'awaiting_complaint_category':
      await handleComplaintCategorySelection(selectedId, phoneNumber, language);
      break;
      
    default:
      console.log(`❓ Unknown step: ${session.step}`);
      await sendMainMenu(phoneNumber, language);
  }
}

// Handle main menu selection
async function handleMainMenuSelection(selectedId, phoneNumber, language) {
  const isArabic = language === 'ARABIC';
  
  switch (selectedId) {
    case 'maintenance_request':
      console.log(`🔧 Starting maintenance request`);
      await sendMaintenanceTypeMenu(phoneNumber, language);
      break;
      
    case 'submit_complaint':
      console.log(`📝 Starting complaint submission`);
      await sendComplaintCategoryMenu(phoneNumber, language);
      break;
      
    case 'check_status':
      console.log(`📊 Checking request status`);
      await handleStatusCheck(phoneNumber, language);
      break;
      
    case 'contact_support':
      console.log(`☎️ Requesting support`);
      await handleSupportRequest(phoneNumber, language);
      break;
      
    default:
      console.log(`❓ Unknown main menu option: ${selectedId}`);
      await sendMainMenu(phoneNumber, language);
  }
}

// Handle maintenance type selection
async function handleMaintenanceTypeSelection(selectedId, phoneNumber, language) {
  console.log(`🔧 Maintenance type selected: ${selectedId}`);
  
  // Save maintenance type to session
  updateSession(phoneNumber, { 
    data: { ...getSession(phoneNumber).data, maintenanceType: selectedId }
  });
  
  // Send priority menu
  await sendPriorityMenu(phoneNumber, language);
}

// Handle priority selection
async function handlePrioritySelection(selectedId, phoneNumber, language) {
  console.log(`📶 Priority selected: ${selectedId}`);
  
  // Save priority to session
  updateSession(phoneNumber, { 
    data: { ...getSession(phoneNumber).data, priority: selectedId }
  });
  
  // Ask for description
  const isArabic = language === 'ARABIC';
  const descriptionMsg = isArabic ?
    "ممتاز! الآن يرجى وصف المشكلة بالتفصيل. كلما كان الوصف أكثر تفصيلاً، كان بإمكان فريق الصيانة مساعدتك بشكل أفضل." :
    "Great! Now please describe the issue in detail. The more detailed your description, the better our maintenance team can help you.";
  
  await sendWhatsAppMessage(phoneNumber, descriptionMsg);
  updateSession(phoneNumber, { step: 'awaiting_description' });
}

// Handle complaint category selection
async function handleComplaintCategorySelection(selectedId, phoneNumber, language) {
  console.log(`📝 Complaint category selected: ${selectedId}`);
  
  // Save category to session
  updateSession(phoneNumber, { 
    data: { ...getSession(phoneNumber).data, category: selectedId }
  });
  
  // Ask for description
  const isArabic = language === 'ARABIC';
  const descriptionMsg = isArabic ?
    "يرجى وصف الشكوى بالتفصيل. سيساعدنا ذلك في فهم المشكلة ومعالجتها بشكل أفضل." :
    "Please describe your complaint in detail. This will help us understand and address the issue better.";
  
  await sendWhatsAppMessage(phoneNumber, descriptionMsg);
  updateSession(phoneNumber, { step: 'awaiting_complaint_description' });
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
    case 'awaiting_language_selection':
      // Handle text-based language selection
      if (text === '1' || text.includes('english')) {
        await sendMainMenu(phoneNumber, 'ENGLISH');
      } else if (text === '2' || text.includes('عرب')) {
        await sendMainMenu(phoneNumber, 'ARABIC');
      } else {
        await sendLanguageSelection(phoneNumber);
      }
      break;
      
    case 'awaiting_description':
      console.log(`🔧 Processing maintenance request: "${messageText}"`);
      await processEnhancedMaintenance(phoneNumber, messageText, session);
      break;
      
    case 'awaiting_complaint_description':
      console.log(`📝 Processing complaint: "${messageText}"`);
      await processEnhancedComplaint(phoneNumber, messageText, session);
      break;
      
    default:
      console.log(`📋 Redirecting to main menu`);
      await sendMainMenu(phoneNumber, language);
  }
}

// Process enhanced maintenance request
async function processEnhancedMaintenance(phoneNumber, description, session) {
  const language = session.language || 'ARABIC';
  const isArabic = language === 'ARABIC';
  
  try {
    console.log(`🔧 Creating enhanced maintenance request for ${phoneNumber}`);
    
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
    
    // Get maintenance type and priority from session
    const maintenanceType = session.data?.maintenanceType || 'other_maintenance';
    const priority = session.data?.priority || 'medium';
    
    // Map values to database enums
    const priorityMap = {
      'urgent': 'URGENT',
      'high': 'HIGH', 
      'medium': 'MEDIUM',
      'low': 'LOW'
    };
    
    // Create maintenance request
    await withWriteConnection(async (prisma) => {
      const request = await prisma.maintenanceRequest.create({
        data: {
          clientId: client.id,
          propertyId: null,
          unitId: null,
          description: `نوع الصيانة: ${maintenanceType}\nالأولوية: ${priority}\n\nالوصف: ${description}`,
          status: 'PENDING',
          priority: priorityMap[priority] || 'MEDIUM',
          isExpired: false,
          lastRequestTime: new Date()
        }
      });
      
      console.log(`✅ Enhanced maintenance request created with ID: ${request.id}`);
      
      // Create detailed success message
      const typeNames = {
        'plumbing': isArabic ? 'سباكة' : 'Plumbing',
        'electrical': isArabic ? 'كهرباء' : 'Electrical',
        'ac_heating': isArabic ? 'تكييف وتدفئة' : 'AC & Heating',
        'appliances': isArabic ? 'أجهزة منزلية' : 'Appliances',
        'structural': isArabic ? 'إنشائية' : 'Structural',
        'other_maintenance': isArabic ? 'أخرى' : 'Other'
      };
      
      const priorityNames = {
        'urgent': isArabic ? 'عاجل' : 'Urgent',
        'high': isArabic ? 'عالية' : 'High',
        'medium': isArabic ? 'متوسطة' : 'Medium',
        'low': isArabic ? 'منخفضة' : 'Low'
      };
      
      const successMsg = isArabic ?
        `✅ تم تقديم طلب الصيانة بنجاح!\n\n📋 رقم الطلب: #${request.id}\n🔧 نوع الصيانة: ${typeNames[maintenanceType]}\n📶 الأولوية: ${priorityNames[priority]}\n📝 الوصف: ${description}\n\n⏰ سيقوم فريق الصيانة بمراجعة طلبك والتواصل معك وفقاً لأولوية الطلب.\n\nهل تحتاج إلى خدمة أخرى؟` :
        `✅ Maintenance request submitted successfully!\n\n📋 Request #: ${request.id}\n🔧 Type: ${typeNames[maintenanceType]}\n📶 Priority: ${priorityNames[priority]}\n📝 Description: ${description}\n\n⏰ Our maintenance team will review your request and contact you according to the priority level.\n\nDo you need another service?`;
      
      await sendWhatsAppMessage(phoneNumber, successMsg);
      
      // Clear session data and return to main menu
      updateSession(phoneNumber, { data: {}, step: 'awaiting_main_menu_selection' });
      setTimeout(() => sendMainMenu(phoneNumber, language), 4000);
    });
    
  } catch (error) {
    console.error('Error processing enhanced maintenance request:', error);
    
    const errorMsg = isArabic ?
      "❌ عذراً، حدث خطأ أثناء تقديم طلب الصيانة. يرجى المحاولة مرة أخرى." :
      "❌ Sorry, an error occurred while submitting the maintenance request. Please try again.";
    
    await sendWhatsAppMessage(phoneNumber, errorMsg);
    setTimeout(() => sendMainMenu(phoneNumber, language), 2000);
  }
}

// Process enhanced complaint
async function processEnhancedComplaint(phoneNumber, description, session) {
  const language = session.language || 'ARABIC';
  const isArabic = language === 'ARABIC';
  
  try {
    console.log(`📝 Creating enhanced complaint for ${phoneNumber}`);
    
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
    
    // Get category from session
    const category = session.data?.category || 'other_complaint';
    
    // Map values to database enums
    const categoryMap = {
      'property_issue': 'PROPERTY_ISSUE',
      'rent_issue': 'RENT_ISSUE',
      'neighbor_issue': 'NEIGHBOR_ISSUE',
      'maintenance_issue': 'MAINTENANCE_ISSUE',
      'noise_issue': 'NOISE_ISSUE',
      'security_issue': 'SECURITY_ISSUE',
      'payment_issue': 'PAYMENT_ISSUE',
      'other_complaint': 'OTHER'
    };
    
    // Create complaint
    await withWriteConnection(async (prisma) => {
      const complaint = await prisma.complaint.create({
        data: {
          clientId: client.id,
          propertyId: null,
          unitId: null,
          title: description.length > 50 ? description.substring(0, 47) + "..." : description,
          description: `نوع الشكوى: ${category}\n\nالوصف: ${description}`,
          category: categoryMap[category] || 'OTHER',
          status: 'PENDING'
        }
      });
      
      console.log(`✅ Enhanced complaint created with ID: ${complaint.id}`);
      
      // Create detailed success message
      const categoryNames = {
        'property_issue': isArabic ? 'مشكلة في العقار' : 'Property Issue',
        'rent_issue': isArabic ? 'مشكلة في الإيجار' : 'Rent Issue',
        'neighbor_issue': isArabic ? 'مشكلة مع الجيران' : 'Neighbor Issue',
        'maintenance_issue': isArabic ? 'مشكلة في الصيانة' : 'Maintenance Issue',
        'noise_issue': isArabic ? 'مشكلة ضوضاء' : 'Noise Issue',
        'security_issue': isArabic ? 'مشكلة أمنية' : 'Security Issue',
        'payment_issue': isArabic ? 'مشكلة في الدفع' : 'Payment Issue',
        'other_complaint': isArabic ? 'أخرى' : 'Other'
      };
      
      const successMsg = isArabic ?
        `✅ تم تقديم الشكوى بنجاح!\n\n📋 رقم الشكوى: #${complaint.id}\n📝 نوع الشكوى: ${categoryNames[category]}\n📄 الوصف: ${description}\n\n⏰ سيقوم فريق خدمة العملاء بمراجعة شكواك والرد عليك قريباً.\n\nهل تحتاج إلى خدمة أخرى؟` :
        `✅ Complaint submitted successfully!\n\n📋 Complaint #: ${complaint.id}\n📝 Type: ${categoryNames[category]}\n📄 Description: ${description}\n\n⏰ Our customer service team will review your complaint and respond soon.\n\nDo you need another service?`;
      
      await sendWhatsAppMessage(phoneNumber, successMsg);
      
      // Clear session data and return to main menu
      updateSession(phoneNumber, { data: {}, step: 'awaiting_main_menu_selection' });
      setTimeout(() => sendMainMenu(phoneNumber, language), 4000);
    });
    
  } catch (error) {
    console.error('Error processing enhanced complaint:', error);
    
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
          
          const priorityText = isArabic ?
            { URGENT: '🔴', HIGH: '🟠', MEDIUM: '🟡', LOW: '🟢' } :
            { URGENT: '🔴', HIGH: '🟠', MEDIUM: '🟡', LOW: '🟢' };
          
          statusMsg += `${priorityText[req.priority]} #${req.id}: ${statusText[req.status] || req.status}\n`;
        });
        statusMsg += "\n";
      }
      
      if (complaints.length > 0) {
        statusMsg += isArabic ? "📝 الشكاوى:\n" : "📝 Complaints:\n";
        complaints.forEach(comp => {
          const statusText = isArabic ? 
            { PENDING: 'معلق', REVIEWING: 'قيد المراجعة', RESOLVED: 'محلول', REJECTED: 'مرفوض' } :
            { PENDING: 'Pending', REVIEWING: 'Reviewing', RESOLVED: 'Resolved', REJECTED: 'Rejected' };
          statusMsg += `📋 #${comp.id}: ${statusText[comp.status] || comp.status}\n`;
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
          message: 'Customer requested support via WhatsApp bot - NEW_CLEAN_2.0',
          language: language
        }
      });
      
      const supportMsg = isArabic ?
        "✅ تم إرسال طلب الدعم الفني!\n\n📞 سيتصل بك ممثل خدمة العملاء خلال 30 دقيقة خلال ساعات العمل.\n\n🕐 ساعات العمل: الأحد - الخميس من 8 صباحاً حتى 6 مساءً\n\nشكراً لك!" :
        "✅ Technical support request sent!\n\n📞 A customer service representative will contact you within 30 minutes during business hours.\n\n🕐 Business hours: Sunday - Thursday 8 AM to 6 PM\n\nThank you!";
      
      await sendWhatsAppMessage(phoneNumber, supportMsg);
      setTimeout(() => sendMainMenu(phoneNumber, language), 4000);
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
    console.log(`🔧 Version: NEW_CLEAN_2.0 - Complete Features`);
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
      data: currentSession.data,
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
      data: finalSession.data,
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

console.log('✅ WhatsApp Bot NEW_CLEAN_2.0 ready with complete features');
