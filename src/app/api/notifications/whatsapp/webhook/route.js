import { NextRequest, NextResponse } from 'next/server';
import { sendInteractiveWhatsAppMessage, sendWhatsAppMessage } from '@/lib/whatsapp';
import { withDatabaseConnection, withReadOnlyConnection, withWriteConnection } from '@/lib/database-connection';
import { 
  findClientWithProperty, 
  createMaintenanceRequestWithProperty, 
  createComplaintWithProperty,
  getClientRequestHistory,
  findClientWithPropertyProduction,
  createMaintenanceRequestProduction,
  createComplaintProduction
} from './enhanced-request-handler-production';

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
          phone: {
            in: variants
          }
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
              role: 'RENTER'
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
            title: "🇦🇪 العربية"
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
            },
            {
              id: "payment_inquiry",
              title: isArabic ? "💳 استعلام عن الدفعات" : "💳 Payment Inquiry",
              description: isArabic ? "الاستعلام عن المستحقات والدفعات" : "Inquire about dues and payments"
            },
            {
              id: "contract_renewal",
              title: isArabic ? "📋 تجديد العقد" : "📋 Contract Renewal",
              description: isArabic ? "طلب تجديد عقد الإيجار" : "Request rental contract renewal"
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
      "اختر من الخيارات:\n1️⃣ طلب صيانة\n2️⃣ تقديم شكوى\n3️⃣ حالة الطلبات\n4️⃣ الاتصال بالدعم\n5️⃣ استعلام عن الدفعات\n6️⃣ تجديد العقد" :
      "Choose from options:\n1️⃣ Maintenance Request\n2️⃣ Submit Complaint\n3️⃣ Check Status\n4️⃣ Contact Support\n5️⃣ Payment Inquiry\n6️⃣ Contract Renewal";
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
  
  // معالجة خاصة لطلب القائمة الرئيسية من أي step
  if (selectedId === 'main_menu' || selectedId === 'back_to_menu') {
    console.log(`🔄 User requested main menu from step: ${session.step}`);
    updateSession(phoneNumber, { step: 'awaiting_main_menu_selection', data: {} });
    await sendMainMenu(phoneNumber, language);
    return;
  }
  
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
        case 'completed':
      // المستخدم أكمل طلباً وأرسل رسالة جديدة
      console.log(`✅ User completed a request, checking if they want main menu`);
      
      // إرسال القائمة الرئيسية فقط إذا طلب المستخدم ذلك صراحة
      if (selectedId === 'main_menu' || selectedId === 'back_to_menu') {
        await sendMainMenu(phoneNumber, language);
      } else {
        // إرسال رسالة ترحيبية بسيطة مع خيار العودة للقائمة
        const welcomeMsg = language === 'ARABIC' ? 
          "🙂 مرحباً بك مرة أخرى!\n\nإذا كنت تريد خدمة جديدة، يرجى الضغط على الزر أدناه." :
          "🙂 Welcome back!\n\nIf you need a new service, please click the button below.";
        
        await sendInteractiveWhatsAppMessage(phoneNumber, {
          type: "button",
          body: { text: welcomeMsg },
          action: {
            buttons: [{
              type: "reply",
              reply: {
                id: "main_menu",
                title: language === 'ARABIC' ? "📋 القائمة الرئيسية" : "📋 Main Menu"
              }
            }]
          }
        });
      }
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
      
    case 'payment_inquiry':
      console.log(`💳 Payment inquiry requested`);
      await handlePaymentInquiry(phoneNumber, language);
      break;
      
    case 'contract_renewal':
      console.log(`📋 Contract renewal requested`);
      await handleContractRenewal(phoneNumber, language);
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
  console.log(`📝 Phone number: ${phoneNumber}`);
  console.log(`📝 Current session before update:`, JSON.stringify(getSession(phoneNumber), null, 2));
  
  // Save category to session
  updateSession(phoneNumber, { 
    data: { ...getSession(phoneNumber).data, category: selectedId }
  });
  
  console.log(`📝 Session after category update:`, JSON.stringify(getSession(phoneNumber), null, 2));
  console.log(`📝 Category saved as: ${getSession(phoneNumber).data?.category}`);
  
  // Ask for description
  const isArabic = language === 'ARABIC';
  const descriptionMsg = isArabic ?
    "يرجى وصف الشكوى بالتفصيل. سيساعدنا ذلك في فهم المشكلة ومعالجتها بشكل أفضل." :
    "Please describe your complaint in detail. This will help us understand and address the issue better.";
  
  await sendWhatsAppMessage(phoneNumber, descriptionMsg);  updateSession(phoneNumber, { step: 'awaiting_complaint_description' });
}

// Handle interactive messages (buttons and lists)
async function handleInteractiveMessage(interactive, phoneNumber) {
  console.log(`🔘 Interactive message from ${phoneNumber}:`, JSON.stringify(interactive, null, 2));
  
  if (interactive.type === 'button_reply') {
    await handleButtonResponse(interactive.button_reply, phoneNumber);
  } else if (interactive.type === 'list_reply') {
    await handleListResponse(interactive.list_reply, phoneNumber);
  } else {
    console.log(`❓ Unknown interactive type: ${interactive.type}`);
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
  switch (session.step) {    case 'awaiting_language_selection':
      // Handle text-based language selection
      if (text === '1' || text.includes('english')) {
        updateSession(phoneNumber, { language: 'ENGLISH' });
        await sendMainMenu(phoneNumber, 'ENGLISH');
      } else if (text === '2' || text.includes('عرب')) {
        updateSession(phoneNumber, { language: 'ARABIC' });
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
        case 'completed':
      // المستخدم أكمل طلباً وأرسل رسالة نصية جديدة
      console.log(`✅ User completed a request, checking message content`);
      
      // إرسال القائمة الرئيسية فقط إذا طلب المستخدم ذلك صراحة
      const lowerText = messageText.toLowerCase().trim();
      if (lowerText.includes('قائمة') || lowerText.includes('menu') || 
          lowerText.includes('خدمة') || lowerText.includes('service') ||
          lowerText.includes('مساعدة') || lowerText.includes('help')) {
        await sendMainMenu(phoneNumber, language);
      } else {
        // إرسال رسالة ترحيبية بسيطة مع خيار العودة للقائمة
        const welcomeMsg = language === 'ARABIC' ? 
          "🙂 مرحباً بك مرة أخرى!\n\nإذا كنت تريد خدمة جديدة، يرجى الضغط على الزر أدناه." :
          "🙂 Welcome back!\n\nIf you need a new service, please click the button below.";
        
        await sendInteractiveWhatsAppMessage(phoneNumber, {
          type: "button",
          body: { text: welcomeMsg },
          action: {
            buttons: [{
              type: "reply",
              reply: {
                id: "main_menu",
                title: language === 'ARABIC' ? "📋 القائمة الرئيسية" : "📋 Main Menu"
              }
            }]
          }
        });
      }
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
      // استخدام النظام المحسن لإنشاء طلب الصيانة
    const result = await createMaintenanceRequestProduction(phoneNumber, description, session);
      if (!result.success) {
      let errorMsg;
      
      if (result.error === 'CLIENT_NOT_FOUND') {
        errorMsg = isArabic ?
          "❌ لم نتمكن من العثور على حسابك في النظام. يرجى الاتصال بمكتبنا: +971507935566" :
          "❌ We couldn't find your account in the system. Please contact our office: +971507935566";
      } else {
        errorMsg = isArabic ?
          "❌ عذراً، حدث خطأ أثناء تقديم طلب الصيانة. يرجى المحاولة مرة أخرى." :
          "❌ Sorry, an error occurred while submitting the maintenance request. Please try again.";
      }
      
      await sendWhatsAppMessage(phoneNumber, errorMsg);
      setTimeout(() => sendMainMenu(phoneNumber, language), 2000);
      return;
    }
      // إنشاء رسالة النجاح المفصلة
    const { request, client, property, unit } = result.data;
      const typeNames = {
      'plumbing': isArabic ? 'سباكة' : 'Plumbing',
      'electrical': isArabic ? 'كهرباء' : 'Electrical',
      'ac_heating': isArabic ? 'تكييف وتدفئة' : 'AC & Heating',
      'appliances': isArabic ? 'أجهزة منزلية' : 'Appliances',
      'structural': isArabic ? 'إنشائية' : 'Structural',
      'other': isArabic ? 'أخرى' : 'Other',
      'other_maintenance': isArabic ? 'أخرى' : 'Other'
    };
    
    const priorityNames = {
      'urgent': isArabic ? 'عاجل' : 'Urgent',
      'high': isArabic ? 'عالية' : 'High',
      'medium': isArabic ? 'متوسطة' : 'Medium',
      'low': isArabic ? 'منخفضة' : 'Low'
    };
      // إنشاء الرسالة مع معلومات العقار والوحدة
    let locationInfo = '';
    if (property) {
      locationInfo += isArabic ? `\n🏠 العقار: ${property.name}` : `\n🏠 Property: ${property.name}`;
      if (property.propertyId) {
        locationInfo += isArabic ? ` (رقم العقار: ${property.propertyId})` : ` (Property ID: ${property.propertyId})`;
      }
    }
    if (unit) {
      locationInfo += isArabic ? `\n🏢 الوحدة: ${unit.number}` : `\n🏢 Unit: ${unit.number}`;
      if (unit.unitId) {
        locationInfo += isArabic ? ` (رقم الوحدة: ${unit.unitId})` : ` (Unit ID: ${unit.unitId})`;
      }
    }
    
    const maintenanceType = session.data?.maintenanceType || 'other';
    const priority = session.data?.priority || 'medium';    const successMsg = isArabic ?
      `🎉 *تم تقديم طلب الصيانة بنجاح!*\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 *رقم الطلب:* \u202D${request.displayId || request.id}\u202C\n` +
      `👤 *العميل:* ${client.name}\n` +
      `🔧 *نوع الصيانة:* ${typeNames[maintenanceType] || 'أخرى'}\n` +
      `📶 *الأولوية:* ${priorityNames[priority] || 'متوسطة'}${locationInfo}\n` +
      `📝 *الوصف:* ${description}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `⏰ *سيقوم فريق الصيانة بمراجعة طلبك والتواصل معك وفقاً لأولوية الطلب.*\n\n` +      `📞 تم إشعار الفني وموظف العلاقات العامة بطلبك.\n\n` +
      `في حال احتجتم إلى أي خدمة، لا تترددوا في التواصل معنا.\n\n` +
      `🏢 *شركة تار العقارية*\n` +
      `📱 +971507935566` :
      `🎉 *Maintenance Request Submitted Successfully!*\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 *Request #:* \u202D${request.displayId || `REQ-${request.id}`}\u202C\n` +
      `👤 *Client:* ${client.name}\n` +
      `🔧 *Type:* ${typeNames[maintenanceType] || 'Other'}\n` +
      `📶 *Priority:* ${priorityNames[priority] || 'Medium'}${locationInfo}\n` +
      `📝 *Description:* ${description}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `⏰ *Our maintenance team will review your request and contact you according to the priority level.*\n\n` +      `📞 Technician and Public Relations have been notified of your request.\n\n` +
      `If you need any service, please don't hesitate to contact us.\n\n` +
      `🏢 *Tar Real Estate*\n` +
      `📱 +971507935566`;    await sendWhatsAppMessage(phoneNumber, successMsg);
    
    // ملاحظة: تم إرسال الإشعارات تلقائياً من نظام الإشعارات الموثوق المدمج
    
    // إنهاء الجلسة بعد تأكيد الطلب - المستخدم يمكنه إرسال رسالة جديدة للعودة للقائمة
    updateSession(phoneNumber, { data: {}, step: 'completed' });
    
  } catch (error) {
    console.error('Error processing enhanced maintenance request:', error);
      const errorMsg = isArabic ?
      "❌ عذراً، حدث خطأ أثناء تقديم طلب الصيانة. يرجى المحاولة مرة أخرى." :
      "❌ Sorry, an error occurred while submitting the maintenance request. Please try again.";
    
    await sendWhatsAppMessage(phoneNumber, errorMsg);
    // إزالة الإرسال التلقائي للقائمة الرئيسية بعد الخطأ
  }
}

// Process enhanced complaint
async function processEnhancedComplaint(phoneNumber, description, session) {
  const language = session.language || 'ARABIC';
  const isArabic = language === 'ARABIC';
  
  try {
    console.log(`📝 Creating enhanced complaint for ${phoneNumber}`);
      // استخدام النظام المحسن لإنشاء الشكوى
    const result = await createComplaintProduction(phoneNumber, description, session);
    
    if (!result.success) {
      let errorMsg;
        if (result.error === 'CLIENT_NOT_FOUND') {
        errorMsg = isArabic ?
          "❌ لم نتمكن من العثور على حسابك في النظام. يرجى الاتصال بمكتبنا: +971507935566" :
          "❌ We couldn't find your account in the system. Please contact our office: +971507935566";
      } else {
        errorMsg = isArabic ?
          "❌ عذراً، حدث خطأ أثناء تقديم الشكوى. يرجى المحاولة مرة أخرى." :
          "❌ Sorry, an error occurred while submitting the complaint. Please try again.";
      }
      
      await sendWhatsAppMessage(phoneNumber, errorMsg);
      setTimeout(() => sendMainMenu(phoneNumber, language), 2000);
      return;
    }
      // إنشاء رسالة النجاح المفصلة
    const { complaint, client, property, unit } = result.data;
    
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
      // إنشاء الرسالة مع معلومات العقار والوحدة
    let locationInfo = '';
    if (property) {
      locationInfo += isArabic ? `\n🏠 العقار: ${property.name}` : `\n🏠 Property: ${property.name}`;
      if (property.propertyId) {
        locationInfo += isArabic ? ` (رقم العقار: ${property.propertyId})` : ` (Property ID: ${property.propertyId})`;
      }
    }
    if (unit) {
      locationInfo += isArabic ? `\n🏢 الوحدة: ${unit.number}` : `\n🏢 Unit: ${unit.number}`;
      if (unit.unitId) {
        locationInfo += isArabic ? ` (رقم الوحدة: ${unit.unitId})` : ` (Unit ID: ${unit.unitId})`;
      }
    }
    
    const category = session.data?.category || 'other_complaint';    const successMsg = isArabic ?
      `🎉 *تم تقديم الشكوى بنجاح!*\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 *رقم الشكوى:* #\u202D${complaint.displayId || `COMP-${complaint.id}`}\u202C\n` +
      `👤 *العميل:* ${client.name}\n` +
      `📝 *نوع الشكوى:* ${categoryNames[category] || 'أخرى'}${locationInfo}\n` +
      `📄 *الوصف:* ${description}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `⏰ *سيقوم فريق خدمة العملاء بمراجعة شكواك والرد عليك قريباً.*\n\n` +      `📞 تم إشعار موظف العلاقات العامة بشكواك.\n\n` +
      `في حال احتجتم إلى أي خدمة، لا تترددوا في التواصل معنا.\n\n` +
      `🏢 *شركة تار العقارية*\n` +
      `📱 +971507935566` :
      `🎉 *Complaint Submitted Successfully!*\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 *Complaint #:* \u202D${complaint.displayId || `COMP-${complaint.id}`}\u202C\n` +
      `👤 *Client:* ${client.name}\n` +
      `📝 *Type:* ${categoryNames[category] || 'Other'}${locationInfo}\n` +
      `📄 *Description:* ${description}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `⏰ *Our customer service team will review your complaint and respond soon.*\n\n` +      `📞 Public Relations staff has been notified of your complaint.\n\n` +
      `If you need any service, please don't hesitate to contact us.\n\n` +
      `🏢 *Tar Real Estate*\n` +
      `📱 +971507935566`;    await sendWhatsAppMessage(phoneNumber, successMsg);
    
    // ملاحظة: تم إرسال الإشعارات تلقائياً من نظام الإشعارات الموثوق المدمج
    
    // إنهاء الجلسة بعد تأكيد الطلب - المستخدم يمكنه إرسال رسالة جديدة للعودة للقائمة
    updateSession(phoneNumber, { data: {}, step: 'completed' });
    
  } catch (error) {
    console.error('Error processing enhanced complaint:', error);
      const errorMsg = isArabic ?
      "❌ عذراً، حدث خطأ أثناء تقديم الشكوى. يرجى المحاولة مرة أخرى." :
      "❌ Sorry, an error occurred while submitting the complaint. Please try again.";
    
    await sendWhatsAppMessage(phoneNumber, errorMsg);
    // إزالة الإرسال التلقائي للقائمة الرئيسية بعد الخطأ
  }
}

// Handle status check
async function handleStatusCheck(phoneNumber, language) {
  const isArabic = language === 'ARABIC';
  
  try {
    console.log(`📊 Checking request status for ${phoneNumber} - Enhanced formatting with displayId only`);
    
    // استخدام النظام المحسن للحصول على تاريخ الطلبات
    const result = await getClientRequestHistory(phoneNumber, 5);
    
    if (!result.success) {      const msg = isArabic ?
        "❌ لم نتمكن من العثور على حسابك في النظام. يرجى الاتصال بمكتبنا: +971507935566" :
        "❌ We couldn't find your account in the system. Please contact our office: +971507935566";
      
      await sendWhatsAppMessage(phoneNumber, msg);
      setTimeout(() => sendMainMenu(phoneNumber, language), 2000);
      return;
    }
      const { client, maintenanceRequests, complaints, totalRequests } = result.data;
    
    if (totalRequests === 0) {
      const msg = isArabic ?
        `📊 مرحباً ${client.name}!\n\n✅ لا توجد طلبات أو شكاوى سابقة في سجلك.\n\n🔥 يمكنك إنشاء طلب صيانة أو تقديم شكوى جديدة من القائمة الرئيسية.` :
        `📊 Hello ${client.name}!\n\n✅ No previous requests or complaints found in your record.\n\n🔥 You can create a maintenance request or submit a new complaint from the main menu.`;
      
      await sendWhatsAppMessage(phoneNumber, msg);
      setTimeout(() => sendMainMenu(phoneNumber, language), 2000);
      return;
    }
    
    let statusMsg = isArabic ? 
      `📊 حالة طلبات ${client.name}:\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📈 إجمالي الطلبات: ${totalRequests} | الصيانة: ${maintenanceRequests.length} | الشكاوى: ${complaints.length}\n\n` : 
      `📊 ${client.name}'s Requests Status:\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📈 Total Requests: ${totalRequests} | Maintenance: ${maintenanceRequests.length} | Complaints: ${complaints.length}\n\n`;
    
    // عرض طلبات الصيانة
    if (maintenanceRequests.length > 0) {
      statusMsg += isArabic ? "🔧 طلبات الصيانة:\n" : "🔧 Maintenance Requests:\n";
      
      maintenanceRequests.forEach((req, index) => {
        const statusText = isArabic ? 
          { PENDING: 'معلق (Pending)', IN_PROGRESS: 'قيد المعالجة (In Progress)', COMPLETED: 'مكتمل (Completed)', REJECTED: 'مرفوض (Rejected)' } :
          { PENDING: 'Pending', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed', REJECTED: 'Rejected' };
        
        const priorityIcon = {
          'URGENT': '🔴', 'HIGH': '🟠', 'MEDIUM': '🟡', 'LOW': '🟢'
        };
        
        let locationText = '';
        if (req.property) {
          locationText += isArabic ? ` - ${req.property.name}` : ` - ${req.property.name}`;
        }
        if (req.unit) {
          // عرض اسم الوحدة أو معرفها إذا كان متوفراً، وإلا عرض الرقم
          const unitDisplay = req.unit.number || req.unit.unitId || 'غير محدد';
          locationText += isArabic ? ` وحدة ${unitDisplay}` : ` Unit ${unitDisplay}`;
        }
        
        // تنسيق رقم الطلب من اليسار لليمين - displayId فقط، لا id أبداً
        const requestNumber = req.displayId || `REQ-${req.id}`;
        const formattedRequestNumber = `\u202D${requestNumber}\u202C`;
        
        // تنسيق تاريخ الطلب - دائماً بالأرقام الإنجليزية
        const createdDate = new Date(req.createdAt);
        const dateStr = createdDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        
        statusMsg += `${index + 1}. ${priorityIcon[req.priority] || '🔹'} #${formattedRequestNumber}\n   📅 ${dateStr} | ${statusText[req.status] || req.status}${locationText}\n\n`;
      });
    }
    
    // عرض الشكاوى
    if (complaints.length > 0) {
      statusMsg += isArabic ? "📝 الشكاوى:\n" : "📝 Complaints:\n";
      
      complaints.forEach((comp, index) => {
        const statusText = isArabic ? 
          { PENDING: 'معلق (Pending)', REVIEWING: 'قيد المراجعة (Reviewing)', RESOLVED: 'محلول (Resolved)', REJECTED: 'مرفوض (Rejected)' } :
          { PENDING: 'Pending', REVIEWING: 'Reviewing', RESOLVED: 'Resolved', REJECTED: 'Rejected' };
        
        let locationText = '';
        if (comp.property) {
          locationText += isArabic ? ` - ${comp.property.name}` : ` - ${comp.property.name}`;
        }
        if (comp.unit) {
          // عرض اسم الوحدة أو معرفها إذا كان متوفراً، وإلا عرض الرقم
          const unitDisplay = comp.unit.number || comp.unit.unitId || 'غير محدد';
          locationText += isArabic ? ` وحدة ${unitDisplay}` : ` Unit ${unitDisplay}`;
        }
        
        // تنسيق رقم الشكوى من اليسار لليمين - displayId فقط، لا id أبداً
        const complaintNumber = comp.displayId || `COMP-${comp.id}`;
        const formattedComplaintNumber = `\u202D${complaintNumber}\u202C`;
        
        // تنسيق تاريخ الشكوى - دائماً بالأرقام الإنجليزية
        const createdDate = new Date(comp.createdAt);
        const dateStr = createdDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        
        statusMsg += `${index + 1}. 📋 #${formattedComplaintNumber}\n   📅 ${dateStr} | ${statusText[comp.status] || comp.status}${locationText}\n\n`;
      });
    }
    
    statusMsg += isArabic ? 
      "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💡 لمتابعة طلب معين، يرجى الاتصال بمكتبنا مع رقم الطلب.\n📞 مكتب شركة تار العقارية: +971507935566" :
      "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💡 To follow up on a specific request, please contact our office with the request number.\n📞 Tar Real Estate Office: +971507935566";
    
    await sendWhatsAppMessage(phoneNumber, statusMsg);
    setTimeout(() => sendMainMenu(phoneNumber, language), 3000);
    
  } catch (error) {
    console.error('Error checking status:', error);
    
    const errorMsg = isArabic ?
      "❌ عذراً، حدث خطأ أثناء فحص حالة الطلبات." :
      "❌ Sorry, an error occurred while checking request status.";
    
    await sendWhatsAppMessage(phoneNumber, errorMsg);
    setTimeout(() => sendMainMenu(phoneNumber, language), 2000);
  }
}

// Handle support request
async function handleSupportRequest(phoneNumber, language) {
  const isArabic = language === 'ARABIC';
  
  try {
    const clientResult = await findClientWithPropertyProduction(phoneNumber);
    if (!clientResult.success || !clientResult.client) {      const msg = isArabic ?
        "❌ لم نتمكن من العثور على حسابك. يرجى الاتصال بمكتبنا: +971507935566" :
        "❌ We couldn't find your account. Please contact our office: +971507935566";
      
      await sendWhatsAppMessage(phoneNumber, msg);
      setTimeout(() => sendMainMenu(phoneNumber, language), 2000);
      return;
    }
    
    const client = clientResult.client;
    
    // Log support request
    await withWriteConnection(async (prisma) => {
      await prisma.contact.create({
        data: {
          name: client.name,
          phone: phoneNumber,
          description: `طلب اتصال بالدعم من البوت - ${new Date().toLocaleString('en-US')} - العميل طلب التحدث مع ممثل خدمة العملاء`
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

// Send notifications to staff members
async function sendStaffNotifications(type, data, phoneNumber) {
  try {
    console.log(`📢 إرسال إشعارات للموظفين - النوع: ${type}`);
    
    // تحويل الأرقام للفورمات الدولي
    function formatPhoneNumber(phone) {
      let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
      if (cleaned.startsWith('05')) {
        cleaned = '971' + cleaned.substring(1);
      } else if (!cleaned.startsWith('971')) {
        cleaned = '971' + cleaned;
      }
      return cleaned;
    }
    
    // أرقام الموظفين بالفورمات الدولي
    const TECHNICIAN = formatPhoneNumber('0506677779');
    const PUBLIC_RELATIONS = formatPhoneNumber('0556677779');
    
    console.log(`📱 أرقام الموظفين: فني=${TECHNICIAN}, علاقات=${PUBLIC_RELATIONS}`);
    
    if (type === 'maintenance') {
      // إرسال إشعار للفني
      const technicianMessage = `🔧 طلب صيانة جديد

📋 رقم الطلب: ${data.request?.displayId || data.request?.id || 'غير محدد'}
📱 رقم العميل: ${phoneNumber}
👤 اسم العميل: ${data.client?.name || 'غير محدد'}
🏠 العقار: ${data.property?.name || 'غير محدد'}
🏢 الوحدة: ${data.unit?.number || data.unit?.unitId || 'غير محدد'}
⚙️ نوع الصيانة: ${getMaintenanceTypeName(data.request?.type)}
📋 الوصف: ${data.request?.description}
🔴 الأولوية: ${getPriorityName(data.request?.priority)}
📅 تاريخ الطلب: ${new Date().toLocaleString('en-US')}

الرجاء التواصل مع العميل لتحديد موعد الصيانة.`;

      console.log(`📲 إرسال إشعار للفني: ${TECHNICIAN}`);
      await sendWhatsAppMessage(TECHNICIAN, technicianMessage);
      console.log(`✅ تم إرسال إشعار الصيانة للفني`);
      
      // إرسال إشعار لموظف العلاقات العامة أيضاً
      const prMaintenanceMessage = `📋 إشعار طلب صيانة جديد

🆔 رقم الطلب: ${data.request?.displayId || data.request?.id || 'غير محدد'}
👤 العميل: ${data.client?.name || 'غير محدد'}
📱 رقم العميل: ${phoneNumber}
🏠 العقار: ${data.property?.name || 'غير محدد'}
🏢 الوحدة: ${data.unit?.number || data.unit?.unitId || 'غير محدد'}
🔧 نوع الصيانة: ${getMaintenanceTypeName(data.request?.type)}

تم إرسال الطلب للفني المختص.`;

      // تأخير قصير لتجنب spam
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log(`📲 إرسال إشعار لموظف علاقات العامة: ${PUBLIC_RELATIONS}`);
      await sendWhatsAppMessage(PUBLIC_RELATIONS, prMaintenanceMessage);
      console.log(`✅ تم إرسال إشعار الصيانة لموظف علاقات العامة`);
    }
    
    if (type === 'complaint') {
      // إرسال إشعار لموظف العلاقات العامة
      const prMessage = `📝 شكوى جديدة

🆔 رقم الشكوى: ${data.complaint?.id || 'غير محدد'}
📱 رقم العميل: ${phoneNumber}
👤 اسم العميل: ${data.client?.name || 'غير محدد'}
🏠 العقار: ${data.property?.name || 'غير محدد'}
🏢 الوحدة: ${data.unit?.number || data.unit?.unitId || 'غير محدد'}
📂 نوع الشكوى: ${getComplaintTypeName(data.complaint?.type)}
📋 تفاصيل الشكوى: ${data.complaint?.description}
📅 تاريخ الشكوى: ${new Date().toLocaleString('en-US')}

يرجى المتابعة والتواصل مع العميل لحل المشكلة.`;

      console.log(`📲 إرسال إشعار الشكوى لموظف علاقات العامة: ${PUBLIC_RELATIONS}`);
      await sendWhatsAppMessage(PUBLIC_RELATIONS, prMessage);
      console.log(`✅ تم إرسال إشعار الشكوى لموظف علاقات العامة`);
    }
    
  } catch (error) {
    console.error('❌ خطأ في إرسال الإشعارات للموظفين:', error);
  }
}

// Helper functions for notification messages
function getMaintenanceTypeName(type) {
  const typeNames = {
    'plumbing': 'سباكة',
    'electrical': 'كهرباء', 
    'air_conditioning': 'تكييف',
    'cleaning': 'تنظيف',
    'painting': 'دهان',
    'carpentry': 'نجارة',
    'general': 'عام',
    'other': 'أخرى'
  };
  return typeNames[type] || type || 'غير محدد';
}

function getComplaintTypeName(type) {
  const typeNames = {
    'PROPERTY_ISSUE': 'مشكلة في العقار',
    'RENT_ISSUE': 'مشكلة في الإيجار',
    'NEIGHBOR_ISSUE': 'مشكلة مع الجيران',
    'MAINTENANCE_ISSUE': 'مشكلة في الصيانة',
    'NOISE_ISSUE': 'مشكلة ضوضاء',
    'SECURITY_ISSUE': 'مشكلة أمنية',
    'PAYMENT_ISSUE': 'مشكلة في الدفع',
    'SERVICE_QUALITY': 'جودة الخدمة',
    'OTHER': 'أخرى'
  };
  return typeNames[type] || type || 'غير محدد';
}

function getPriorityName(priority) {
  const priorityNames = {
    'URGENT': 'عاجل',
    'HIGH': 'مرتفع',
    'MEDIUM': 'متوسط',
    'LOW': 'منخفض'
  };
  return priorityNames[priority] || priority || 'متوسط';
}

// GET handler for webhook verification
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log('🔍 GET webhook verification:', { mode, token, challenge });

    // التحقق من صحة الطلب
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('✅ Webhook verified successfully');
      return new NextResponse(challenge);
    } else {
      console.log('❌ Webhook verification failed');
      return new NextResponse('Forbidden', { status: 403 });
    }
  } catch (error) {
    console.error('❌ GET webhook error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST handler for receiving messages
export async function POST(request) {
  try {
    const body = await request.json();
    console.log('📡 Webhook received:', JSON.stringify(body, null, 2));

    // Handle message events
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;
        
        // معالجة إشعارات حالة الرسائل (الأولوية للتسليم)
        if (value.statuses) {
          console.log(`📊 Processing ${value.statuses.length} message status updates`);
          
          for (const status of value.statuses) {
            await handleMessageStatus(status);
          }
        }
        
        // معالجة الرسائل الواردة
        if (value.messages) {
          for (const message of value.messages) {
            const phoneNumber = message.from;
            const messageId = message.id;

            console.log(`� Message from: ${phoneNumber}, ID: ${messageId}`);

            // منع معالجة الرسائل المكررة
            if (processedMessages.has(messageId)) {
              console.log('⚠️ Duplicate message ignored');
              continue;
            }
            processedMessages.add(messageId);

            // معالجة أنواع الرسائل المختلفة
            if (message.type === 'text') {
              await handleTextMessage(message.text.body, phoneNumber);
            } else if (message.type === 'interactive') {
              await handleInteractiveMessage(message.interactive, phoneNumber);
            }

            // تنظيف الرسائل المعالجة (الاحتفاظ بآخر 1000 رسالة)
            if (processedMessages.size > 1000) {
              const messages = Array.from(processedMessages);
              messages.slice(0, 500).forEach(id => processedMessages.delete(id));
            }
          }
        }
      }
    }

    return new NextResponse('OK');
  } catch (error) {
    console.error('❌ POST webhook error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// إضافة دالة معالجة إشعارات حالة الرسائل
async function handleMessageStatus(status) {
  try {
    console.log(`📊 Handling message status:`, status);
    
    // تحديث حالة الرسالة في قاعدة البيانات
    await withWriteConnection(async (prisma) => {
      const messageId = status.id;
      const statusValue = status.status; // 'delivered', 'read', 'failed'
      const timestamp = new Date(status.timestamp * 1000);
      
      console.log(`📨 Updating message ${messageId} to status: ${statusValue}`);
      
      // البحث عن الرسالة وتحديث حالتها
      const updatedMessage = await prisma.whatsappMessageLog.updateMany({
        where: {
          messageId: messageId
        },
        data: {
          status: statusValue,
          updatedAt: timestamp
        }
      });
      
      if (updatedMessage.count > 0) {
        console.log(`✅ Message status updated: ${messageId} -> ${statusValue}`);
      } else {
        console.log(`⚠️ Message not found in database: ${messageId}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error handling message status:', error);
  }
}

// إضافة دالة تصحيح الرسائل القديمة
async function fixOldMessagesStatus() {
  try {
    console.log('🔧 بدء تصحيح حالة الرسائل القديمة...');
    
    await withWriteConnection(async (prisma) => {
      // الرسائل التي مر عليها أكثر من 24 ساعة وما زالت "sent" - تعتبر "failed"
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const updatedCount = await prisma.whatsappMessageLog.updateMany({
        where: {
          status: 'sent',
          sentAt: {
            lte: oneDayAgo
          }
        },
        data: {
          status: 'failed',
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ تم تحديث ${updatedCount.count} رسالة قديمة إلى حالة "failed"`);
      return updatedCount.count;
    });
    
  } catch (error) {
    console.error('❌ خطأ في تصحيح الرسائل القديمة:', error);
    return 0;
  }
}

// إضافة endpoint لتشغيل التصحيح يدوياً
export async function PATCH(request) {
  try {
    const updatedCount = await fixOldMessagesStatus();
    
    return NextResponse.json({
      success: true,
      message: `تم تصحيح ${updatedCount} رسالة قديمة`,
      updatedCount
    });
    
  } catch (error) {
    console.error('❌ خطأ في PATCH:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Handle payment inquiry - نسخة مبسطة وموثوقة
async function handlePaymentInquiry(phoneNumber, language) {
  const isArabic = language === 'ARABIC';
  
  try {
    console.log(`💳 [PAYMENT] Starting inquiry for ${phoneNumber}`);
    
    // البحث عن العميل باستخدام الدالة البسيطة
    const client = await findClient(phoneNumber);
    if (!client) {
      console.log(`❌ [PAYMENT] Client not found: ${phoneNumber}`);
      const msg = isArabic ?
        `❌ *لم نتمكن من العثور على حسابك*\n\n📞 للاستعلام عن الدفعات اتصل بنا:\n*+971507935566*\n\n🏢 شركة تار العقارية` :
        `❌ *Account not found*\n\n📞 For payment inquiry contact us:\n*+971507935566*\n\n🏢 Tar Real Estate`;
      
      await sendWhatsAppMessage(phoneNumber, msg);
      updateSession(phoneNumber, { step: 'completed' });
      return;
    }

    console.log(`✅ [PAYMENT] Client found: ${client.name} (ID: ${client.id})`);
    
    // البحث عن الدفعات بطريقة مبسطة
    const payments = await withReadOnlyConnection(async (prisma) => {
      try {
        console.log(`🔍 [PAYMENT] Searching payments for client ${client.id}`);
        
        // البحث المباشر في جدول الدفعات
        const allPayments = await prisma.payment.findMany({
          where: {
            rentAgreement: {
              renterId: client.id
            },
            status: {
              in: ['PENDING', 'OVERDUE']
            }
          },
          include: {
            rentAgreement: {
              include: {
                unit: {
                  include: {
                    property: {
                      select: { name: true }
                    }
                  }
                }
              }
            }
          },
          orderBy: {
            dueDate: 'asc'
          },
          take: 10
        });

        console.log(`📋 [PAYMENT] Found ${allPayments.length} pending payments`);
        return allPayments;
        
      } catch (dbError) {
        console.error('❌ [PAYMENT] Database error:', dbError);
        // إذا فشل البحث، ارجع مصفوفة فارغة بدلاً من خطأ
        return [];
      }
    });

    // إذا لم توجد دفعات
    if (!payments || payments.length === 0) {
      console.log(`ℹ️ [PAYMENT] No pending payments for ${client.name}`);
      const msg = isArabic ?
        `✅ *مرحباً ${client.name}*\n\n💚 *تهانينا! لا توجد دفعات معلقة*\n\nجميع مستحقاتك مسددة بالكامل.\n\n📞 للاستفسار: *+971507935566*\n🏢 شركة تار العقارية` :
        `✅ *Hello ${client.name}*\n\n💚 *Congratulations! No pending payments*\n\nAll your dues are fully paid.\n\n📞 For inquiry: *+971507935566*\n🏢 Tar Real Estate`;
      
      await sendWhatsAppMessage(phoneNumber, msg);
      updateSession(phoneNumber, { step: 'completed' });
      return;
    }

    // بناء رسالة الدفعات
    let paymentMsg = isArabic ?
      `💳 *استعلام الدفعات*\n\n👋 مرحباً ${client.name}\n\n📋 *لديك ${payments.length} دفعة معلقة:*\n\n` :
      `💳 *Payment Inquiry*\n\n👋 Hello ${client.name}\n\n📋 *You have ${payments.length} pending payment(s):*\n\n`;

    console.log(`💰 [PAYMENT] Building message for ${payments.length} payments`);

    payments.forEach((payment, index) => {
      try {
        const dueDate = new Date(payment.dueDate).toLocaleDateString('en-US');
        const amount = payment.amount || 0;
        const formattedAmount = amount.toLocaleString('en-US');
        
        // معلومات العقار والوحدة
        const propertyName = payment.rentAgreement?.unit?.property?.name || 'غير محدد';
        const unitDisplay = payment.rentAgreement?.unit?.number || payment.rentAgreement?.unit?.unitId || 'غير محدد';
        
        // رقم الدفعة مع تنسيق LTR
        const paymentNumber = payment.displayId || payment.id;
        const formattedPaymentNumber = `\u202D${paymentNumber}\u202C`;

        paymentMsg += isArabic ?
          `${index + 1}. 💰 *الدفعة رقم:* ${formattedPaymentNumber}\n` +
          `   🏠 *العقار:* ${propertyName}\n` +
          `   🏢 *الوحدة:* ${unitDisplay}\n` +
          `   📅 *الاستحقاق:* ${dueDate}\n` +
          `   💵 *المبلغ:* ${formattedAmount} درهم\n\n` :
          `${index + 1}. 💰 *Payment #:* ${formattedPaymentNumber}\n` +
          `   🏠 *Property:* ${propertyName}\n` +
          `   🏢 *Unit:* ${unitDisplay}\n` +
          `   📅 *Due Date:* ${dueDate}\n` +
          `   💵 *Amount:* AED ${formattedAmount}\n\n`;
          
      } catch (paymentError) {
        console.error('❌ [PAYMENT] Error formatting payment:', paymentError);
        paymentMsg += isArabic ?
          `${index + 1}. 💰 دفعة ${payment.id} - خطأ في العرض\n\n` :
          `${index + 1}. 💰 Payment ${payment.id} - Display error\n\n`;
      }
    });

    paymentMsg += isArabic ?
      `━━━━━━━━━━━━━━━━━━━━\n\n📞 *للدفع أو الاستفسار:*\n*+971507935566*\n\n🏢 *شركة تار العقارية*\n\n💡 يمكنك الدفع عبر:\n• التحويل البنكي\n• زيارة المكتب\n• الدفع الإلكتروني` :
      `━━━━━━━━━━━━━━━━━━━━\n\n📞 *For payment or inquiry:*\n*+971507935566*\n\n🏢 *Tar Real Estate*\n\n💡 You can pay via:\n• Bank transfer\n• Office visit\n• Electronic payment`;

    console.log(`📤 [PAYMENT] Sending message to ${phoneNumber}`);
    await sendWhatsAppMessage(phoneNumber, paymentMsg);
    updateSession(phoneNumber, { step: 'completed' });
    
  } catch (error) {
    console.error('❌ [PAYMENT] Critical error:', error);
    const errorMsg = isArabic ?
      `❌ *خطأ في استعلام الدفعات*\n\nعذراً، حدث خطأ في النظام.\n\n📞 للاستعلام اتصل بنا:\n*+971507935566*\n\n🏢 شركة تار العقارية` :
      `❌ *Payment inquiry error*\n\nSorry, a system error occurred.\n\n📞 For inquiry contact us:\n*+971507935566*\n\n🏢 Tar Real Estate`;
    
    await sendWhatsAppMessage(phoneNumber, errorMsg);
    updateSession(phoneNumber, { step: 'completed' });
  }
}

// Handle contract renewal
async function handleContractRenewal(phoneNumber, language) {
  const isArabic = language === 'ARABIC';
  
  try {
    console.log(`📋 [CONTRACT] Starting renewal request for ${phoneNumber}`);
    
    const client = await findClient(phoneNumber);
    if (!client) {
      console.log(`❌ [CONTRACT] Client not found: ${phoneNumber}`);
      const msg = isArabic ?
        `❌ *لم نتمكن من العثور على حسابك*\n\n📞 لتجديد العقد اتصل بنا:\n*+971507935566*\n\n🏢 شركة تار العقارية` :
        `❌ *Account not found*\n\n📞 For contract renewal contact us:\n*+971507935566*\n\n🏢 Tar Real Estate`;
      
      await sendWhatsAppMessage(phoneNumber, msg);
      updateSession(phoneNumber, { step: 'completed' });
      return;
    }

    console.log(`✅ [CONTRACT] Client found: ${client.name} (ID: ${client.id})`);

    // إنشاء طلب تواصل لتجديد العقد
    await withWriteConnection(async (prisma) => {
      await prisma.contact.create({
        data: {
          name: client.name,
          phone: phoneNumber,
          description: `طلب تجديد عقد من البوت - ${new Date().toLocaleString('en-US')} - العميل ${client.name} طلب تجديد عقد الإيجار`
        }
      });
    });

    const renewalMsg = isArabic ?
      `✅ *تم تسجيل طلب تجديد العقد*\n\n` +
      `👋 مرحباً ${client.name}\n\n` +
      `📋 تم استلام طلبك بنجاح\n` +
      `👥 سيتواصل معك فريق المبيعات خلال 24 ساعة\n` +
      `💼 لمناقشة تفاصيل التجديد والشروط الجديدة\n\n` +
      `📞 للاستعجال: *+971507935566*\n` +
      `🏢 شركة تار العقارية\n\n` +
      `شكراً لثقتكم بنا 🙏` :
      `✅ *Contract Renewal Request Submitted*\n\n` +
      `👋 Hello ${client.name}\n\n` +
      `📋 Your request has been received successfully\n` +
      `👥 Our sales team will contact you within 24 hours\n` +
      `💼 To discuss renewal details and new terms\n\n` +
      `📞 For urgent matters: *+971507935566*\n` +
      `🏢 Tar Real Estate\n\n` +
      `Thank you for your trust 🙏`;

    await sendWhatsAppMessage(phoneNumber, renewalMsg);
    updateSession(phoneNumber, { step: 'completed' });
    
  } catch (error) {
    console.error('❌ [CONTRACT] Error in renewal request:', error);
    const errorMsg = isArabic ?
      `❌ *حدث خطأ أثناء تسجيل طلب التجديد*\n\n📞 يرجى الاتصال مباشرة:\n*+971507935566*\n\n🏢 شركة تار العقارية` :
      `❌ *Error submitting renewal request*\n\n📞 Please call directly:\n*+971507935566*\n\n🏢 Tar Real Estate`;
    
    await sendWhatsAppMessage(phoneNumber, errorMsg);
    updateSession(phoneNumber, { step: 'completed' });
  }
}
