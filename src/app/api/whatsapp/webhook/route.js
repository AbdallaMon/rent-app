/*
 * ========================================
 * WHATSAPP BOT - REAL ESTATE MANAGEMENT SYSTEM
 * ========================================
 * 
 * Company: Tar Real Estate
 * Version: NEW_CLEAN_2.0
 * Created: January 16, 2025
 * Last Updated: June 25, 2025
 * 
 * DESCRIPTION:
 * This is a comprehensive WhatsApp bot for real estate management that handles:
 * - Maintenance requests with priority levels and categorization
 * - Customer complaints with detailed categorization
 * - Request status checking and tracking
 * - Payment inquiries with account details
 * - Contract renewal requests
 * - Multi-language support (Arabic/English)
 * - Customer support ticket creation
 * 
 * FEATURES:
 * - Interactive WhatsApp menus (buttons and lists)
 * - Session management for conversation flow
 * - Database integration for client and request management
 * - Automatic staff notifications
 * - Fallback text messages for compatibility
 * - Phone number format normalization for UAE
 * - Request tracking with display IDs
 * 
 * ARCHITECTURE:
 * - Uses Next.js API routes for webhook handling
 * - Prisma ORM for database operations
 * - WhatsApp Business API for messaging
 * - In-memory session storage (can be upgraded to persistent storage)
 * 
 * WORKFLOW:
 * 1. User sends message → Webhook receives it
 * 2. Session management determines conversation state
 * 3. Interactive menus guide user through services
 * 4. Database operations store/retrieve client data
 * 5. Staff notifications sent for new requests
 * 6. Confirmation messages sent to user
 */

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

/*
 * ========================================
 * SESSION MANAGEMENT SYSTEM
 * ========================================
 * 
 * PURPOSE: Manages user conversation state and prevents message duplication
 * STORAGE: In-memory Map (can be upgraded to Redis/Database for production)
 * CLEANUP: Automatic cleanup of sessions older than 30 minutes
 * 
 * SESSION STRUCTURE:
 * {
 *   phoneNumber: string,     // User's phone number
 *   language: string,        // 'ARABIC' or 'ENGLISH'
 *   step: string,           // Current conversation step
 *   data: object,           // Temporary data (selections, form data)
 *   timestamp: number       // Last activity timestamp
 * }
 */

// Enhanced in-memory session storage
const sessions = new Map();
const processedMessages = new Set();

// Clean old sessions periodically (every 30 minutes)
// This prevents memory leaks and ensures fresh conversations
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

/*
 * ========================================
 * SESSION MANAGEMENT FUNCTIONS
 * ========================================
 */

// Create a new session for a user
// Default language is Arabic as most clients are Arabic speakers
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

// Retrieve existing session for a user
function getSession(phoneNumber) {
  return sessions.get(phoneNumber);
}

// Update session with new data while preserving existing data
function updateSession(phoneNumber, updates) {
  let session = getSession(phoneNumber) || createSession(phoneNumber);
  Object.assign(session, updates, { timestamp: Date.now() });
  sessions.set(phoneNumber, session);
  console.log(`🔄 Updated session for ${phoneNumber}:`, session);
  return session;
}

/*
 * ========================================
 * CLIENT SEARCH AND VALIDATION
 * ========================================
 */

// Enhanced client search with UAE phone formats
// Handles multiple UAE phone number formats for better client matching
async function findClient(phoneNumber) {
  return await withReadOnlyConnection(async (prisma) => {
    try {
      // Clean and normalize phone number by removing country codes and leading zeros
      const clean = phoneNumber.replace(/^\+/, '').replace(/^971/, '').replace(/^0/, '');
      
      // Generate all possible UAE phone number formats for comprehensive search
      const variants = [
        phoneNumber,           // Original format as received
        `+971${clean}`,        // International format with + prefix
        `971${clean}`,         // International format without + prefix
        `0${clean}`,           // Local UAE format with leading 0
        clean,                 // Raw number without any prefix
        `+9710${clean}`,       // Alternative international format
        `9710${clean}`         // Alternative format without + prefix
      ];
      
      console.log(`🔍 Searching client with variants:`, variants);
        // Search database for client using any of the phone number variants
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
          // Create demo client for testing purposes using specific test number
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

/*
 * ========================================
 * INTERACTIVE MENU CREATORS
 * ========================================
 */

// Creates the initial language selection message with button interface
// This is the first interaction users see when starting a conversation
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

// Creates the main service menu with all available options
// This is the primary navigation interface for all bot services
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
              description: isArabic ? "الإبلاغ عن مشكلة في العقار" : "Report property issue"
            },
            {
              id: "submit_complaint",
              title: isArabic ? "📝 تقديم شكوى" : "📝 Submit Complaint",
              description: isArabic ? "تقديم شكوى أو اقتراح" : "Submit complaint or suggestion"
            },
            {
              id: "check_status",
              title: isArabic ? "📊 حالة الطلبات" : "📊 Check Status",
              description: isArabic ? "متابعة حالة طلباتك" : "Track your requests status"
            },
            {
              id: "contact_support",
              title: isArabic ? "☎️ الاتصال بالدعم" : "☎️ Contact Support",
              description: isArabic ? "التحدث مع خدمة العملاء" : "Speak with customer service"
            },
            {
              id: "payment_inquiry",
              title: isArabic ? "💳 استعلام عن الدفعات" : "💳 Payment Inquiry",
              description: isArabic ? "الاستعلام عن المستحقات" : "Inquire about dues"
            },
            {
              id: "contract_renewal",
              title: isArabic ? "📋 تجديد العقد" : "📋 Contract Renewal",
              description: isArabic ? "طلب تجديد عقد الإيجار" : "Request contract renewal"
            }
          ]
        }
      ]
    }
  };
}

// Creates maintenance type selection menu for categorizing issues
// Helps technicians understand the type of problem before visiting
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
            },            {
              id: "structural",
              title: isArabic ? "🏗️ إنشائية" : "🏗️ Structural",
              description: isArabic ? "مشاكل الأبواب والنوافذ والجدران" : "Doors, windows, and walls issues"
            },
            {
              id: "internet_cable",
              title: isArabic ? "📡 إنترنت وكابل" : "📡 Internet & Cable",
              description: isArabic ? "مشاكل الإنترنت والكابل والستلايت" : "Internet, cable, and satellite issues"
            },
            {
              id: "security_systems",
              title: isArabic ? "🔒 أنظمة الأمان" : "🔒 Security Systems",
              description: isArabic ? "مشاكل الكاميرات وأنظمة الإنذار" : "Cameras and alarm systems issues"
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

// Creates priority selection menu for maintenance requests
// Allows users to indicate urgency level for proper resource allocation
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

// Creates complaint category selection menu
// Categorizes complaints for proper routing to the right department
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

/*
 * ========================================
 * MESSAGE SENDING FUNCTIONS
 * ========================================
 */

// Sends the initial language selection menu to new users
// Includes fallback to text message if interactive message fails
async function sendLanguageSelection(phoneNumber) {
  try {
    console.log(`🌍 Sending language selection to ${phoneNumber}`);
    const message = createLanguageSelection();
    await sendInteractiveWhatsAppMessage(phoneNumber, message);
    updateSession(phoneNumber, { step: 'awaiting_language_selection' });
    console.log(`✅ Language selection sent`);
  } catch (error) {
    console.error('Error sending language selection:', error);
    // Fallback to text message for devices that don't support interactive messages
    const fallback = "Welcome! Reply with:\n1 - English\n2 - العربية\n\nمرحباً! اكتب:\n1 - English\n2 - العربية";
    await sendWhatsAppMessage(phoneNumber, fallback);
  }
}

// Sends the main service menu after language selection
// Updates user session to track conversation state
async function sendMainMenu(phoneNumber, language) {
  try {
    console.log(`📋 Sending main menu to ${phoneNumber} in ${language}`);
    const menu = createMainMenu(language);
    await sendInteractiveWhatsAppMessage(phoneNumber, menu);
    updateSession(phoneNumber, { step: 'awaiting_main_menu_selection', language });
    console.log(`✅ Main menu sent`);
  } catch (error) {
    console.error('Error sending main menu:', error);
    // Fallback to text message with numbered options
    const isArabic = language === 'ARABIC';    const fallback = isArabic ?
      "اختر من الخيارات:\n1️⃣ طلب صيانة\n2️⃣ تقديم شكوى\n3️⃣ حالة الطلبات\n4️⃣ الاتصال بالدعم\n5️⃣ استعلام عن الدفعات\n6️⃣ تجديد العقد" :
      "Choose from options:\n1️⃣ Maintenance Request\n2️⃣ Submit Complaint\n3️⃣ Check Status\n4️⃣ Contact Support\n5️⃣ Payment Inquiry\n6️⃣ Contract Renewal";
    await sendWhatsAppMessage(phoneNumber, fallback);
  }
}

// Sends maintenance type selection menu
// Allows users to categorize their maintenance issue
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

// Sends priority selection menu for maintenance requests
// Helps prioritize urgent issues over routine maintenance
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

// Sends complaint category selection menu
// Routes complaints to appropriate departments
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

/*
 * ========================================
 * INTERACTIVE MESSAGE HANDLERS
 * ========================================
 */

// Handles button responses (primarily for language selection)
// Processes user clicks on interactive buttons
async function handleButtonResponse(buttonReply, phoneNumber) {
  const buttonId = buttonReply.id;
  console.log(`🔘 Button pressed: ${buttonId} by ${phoneNumber}`);
  
  // Handle language selection buttons
  if (buttonId === 'lang_en' || buttonId === 'lang_ar') {
    const language = buttonId === 'lang_en' ? 'ENGLISH' : 'ARABIC';
    console.log(`✅ Language selected: ${language}`);
    
    await sendMainMenu(phoneNumber, language);
    return;
  }
  
  console.log(`❓ Unknown button: ${buttonId}`);
}

// Handles list responses (main menu and submenu selections)
// Processes user selections from dropdown lists
async function handleListResponse(listReply, phoneNumber) {
  const selectedId = listReply.id;
  const session = getSession(phoneNumber);
  
  console.log(`📝 List option selected: ${selectedId} by ${phoneNumber}`);
  console.log(`📋 Current session:`, session);
  
  // If no session exists, restart conversation with language selection
  if (!session) {
    console.log(`❌ No session found, starting over`);
    await sendLanguageSelection(phoneNumber);
    return;
  }
    const language = session.language || 'ARABIC';
  const isArabic = language === 'ARABIC';
  
  // Handle special navigation requests - return to main menu from any step
  if (selectedId === 'main_menu' || selectedId === 'back_to_menu') {
    console.log(`🔄 User requested main menu from step: ${session.step}`);
    updateSession(phoneNumber, { step: 'awaiting_main_menu_selection', data: {} });
    await sendMainMenu(phoneNumber, language);
    return;
  }
  
  // Route to appropriate handler based on current conversation step
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
      // Handle interactions after completing a request
      console.log(`✅ User completed a request, checking if they want main menu`);
      
      // Only show main menu if explicitly requested
      if (selectedId === 'main_menu' || selectedId === 'back_to_menu') {
        await sendMainMenu(phoneNumber, language);
      } else {
        // Send welcome back message with option to access main menu
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

/*
 * ========================================
 * SERVICE SELECTION HANDLERS
 * ========================================
 */

// Handles main menu service selection
// Routes users to appropriate service flows
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

// Handles maintenance type selection
// Saves selected type and proceeds to priority selection
async function handleMaintenanceTypeSelection(selectedId, phoneNumber, language) {
  console.log(`🔧 Maintenance type selected: ${selectedId}`);
  
  // Save maintenance type to session data for later use
  updateSession(phoneNumber, { 
    data: { ...getSession(phoneNumber).data, maintenanceType: selectedId }
  });
  
  // Proceed to priority selection
  await sendPriorityMenu(phoneNumber, language);
}

// Handles priority selection for maintenance requests
// Saves priority and prompts for detailed description
async function handlePrioritySelection(selectedId, phoneNumber, language) {
  console.log(`📶 Priority selected: ${selectedId}`);
  
  // Save priority level to session data
  updateSession(phoneNumber, { 
    data: { ...getSession(phoneNumber).data, priority: selectedId }
  });
  
  // Request detailed description of the maintenance issue
  const isArabic = language === 'ARABIC';
  const descriptionMsg = isArabic ?
    "ممتاز! الآن يرجى وصف المشكلة بالتفصيل. كلما كان الوصف أكثر تفصيلاً، كان بإمكان فريق الصيانة مساعدتك بشكل أفضل." :
    "Great! Now please describe the issue in detail. The more detailed your description, the better our maintenance team can help you.";
  
  await sendWhatsAppMessage(phoneNumber, descriptionMsg);
  updateSession(phoneNumber, { step: 'awaiting_description' });
}

// Handles complaint category selection
// Saves category and prompts for detailed complaint description
async function handleComplaintCategorySelection(selectedId, phoneNumber, language) {
  console.log(`📝 Complaint category selected: ${selectedId}`);
  console.log(`📝 Phone number: ${phoneNumber}`);
  console.log(`📝 Current session before update:`, JSON.stringify(getSession(phoneNumber), null, 2));
  
  // Save complaint category to session data
  updateSession(phoneNumber, { 
    data: { ...getSession(phoneNumber).data, category: selectedId }
  });
  
  console.log(`📝 Session after category update:`, JSON.stringify(getSession(phoneNumber), null, 2));
  console.log(`📝 Category saved as: ${getSession(phoneNumber).data?.category}`);
  
  // Request detailed complaint description
  const isArabic = language === 'ARABIC';
  const descriptionMsg = isArabic ?
    "يرجى وصف الشكوى بالتفصيل. سيساعدنا ذلك في فهم المشكلة ومعالجتها بشكل أفضل." :
    "Please describe your complaint in detail. This will help us understand and address the issue better.";
  
  await sendWhatsAppMessage(phoneNumber, descriptionMsg);  updateSession(phoneNumber, { step: 'awaiting_complaint_description' });
}

/*
 * ========================================
 * MESSAGE TYPE HANDLERS
 * ========================================
 */

// Main handler for interactive messages (buttons and lists)
// Routes different types of interactive responses
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

// Main handler for text messages
// Processes user text input based on conversation state
async function handleTextMessage(messageText, phoneNumber) {
  console.log(`💬 Text message from ${phoneNumber}: "${messageText}"`);
  
  const session = getSession(phoneNumber);
  const text = messageText.toLowerCase().trim();
  
  // No session exists - start new conversation
  if (!session) {
    console.log(`🆕 New conversation starting`);
    await sendLanguageSelection(phoneNumber);
    return;
  }
  
  const language = session.language || 'ARABIC';
  const isArabic = language === 'ARABIC';
  
  // Route message based on current conversation step
  switch (session.step) {    case 'awaiting_language_selection':
      // Handle text-based language selection as fallback
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
      // Process maintenance request description
      console.log(`🔧 Processing maintenance request: "${messageText}"`);
      await processEnhancedMaintenance(phoneNumber, messageText, session);
      break;
        case 'awaiting_complaint_description':
      // Process complaint description
      console.log(`📝 Processing complaint: "${messageText}"`);
      await processEnhancedComplaint(phoneNumber, messageText, session);
      break;
        case 'completed':
      // Handle messages after completing a request
      console.log(`✅ User completed a request, checking message content`);
      
      // Check if user is requesting main menu
      const lowerText = messageText.toLowerCase().trim();
      if (lowerText.includes('قائمة') || lowerText.includes('menu') || 
          lowerText.includes('خدمة') || lowerText.includes('service') ||
          lowerText.includes('مساعدة') || lowerText.includes('help')) {
        await sendMainMenu(phoneNumber, language);
      } else {
        // Send welcome back message with menu option
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

/*
 * ========================================
 * REQUEST PROCESSING FUNCTIONS
 * ========================================
 */

// Processes complete maintenance request with user description
// Creates database record and sends confirmation
async function processEnhancedMaintenance(phoneNumber, description, session) {
  const language = session.language || 'ARABIC';
  const isArabic = language === 'ARABIC';
  
  try {
    console.log(`🔧 Creating enhanced maintenance request for ${phoneNumber}`);
      // Use enhanced production system to create maintenance request
    const result = await createMaintenanceRequestProduction(phoneNumber, description, session);
      if (!result.success) {
      let errorMsg;
        // Handle specific error cases
        if (result.error === 'CLIENT_NOT_FOUND') {
        errorMsg = isArabic ?
          `❌ *لم نتمكن من العثور على حسابك*\n\n` +
          `📞 يرجى الاتصال بمكتبنا: *+971507935566*\n` +
          `🏢 شركة تار العقارية` :
          `❌ *We couldn't find your account*\n\n` +
          `📞 Please contact our office: *+971507935566*\n` +
          `🏢 Tar Real Estate`;
      } else {
        errorMsg = isArabic ?
          `❌ *حدث خطأ أثناء تقديم الطلب*\n\n` +
          `🔄 يرجى المحاولة مرة أخرى\n` +
          `📞 أو الاتصال بنا: *+971507935566*` :
          `❌ *Error occurred while submitting request*\n\n` +
          `🔄 Please try again\n` +
          `📞 Or contact us: *+971507935566*`;
      }
      
      await sendWhatsAppMessage(phoneNumber, errorMsg);
      setTimeout(() => sendMainMenu(phoneNumber, language), 2000);
      return;
    }
      // Create detailed success message
    const { request, client, property, unit } = result.data;
      // Translation mappings for maintenance types and priorities
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
      // Build location information string
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
    const priority = session.data?.priority || 'medium';    
    
    // تنسيق رقم الطلب من اليسار لليمين
    const requestNumber = request.displayId || request.id;
    const formattedRequestNumber = `\u202D${requestNumber}\u202C`;
    
    // Create comprehensive success message
    const successMsg = isArabic ?
      `✅ *تم تقديم طلب الصيانة بنجاح*\n\n` +
      `📋 *رقم الطلب:* ${formattedRequestNumber}\n` +
      `👤 *العميل:* ${client.name}\n` +
      `🔧 *نوع الصيانة:* ${typeNames[maintenanceType] || 'أخرى'}\n` +
      `⚡ *الأولوية:* ${priorityNames[priority] || 'متوسطة'}${locationInfo}\n` +
      `📝 *الوصف:* ${description}\n\n` +
      `⏰ سيقوم فريق الصيانة بمراجعة طلبك والتواصل معك قريباً\n` +
      `📞 تم إشعار الفني المختص بطلبك\n\n` +
      `للاستفسار: 📱 *+971507935566*\n` +
      `🏢 شركة تار العقارية` :
      `✅ *Maintenance Request Submitted Successfully*\n\n` +
      `📋 *Request #:* ${formattedRequestNumber}\n` +
      `👤 *Client:* ${client.name}\n` +
      `🔧 *Type:* ${typeNames[maintenanceType] || 'Other'}\n` +
      `⚡ *Priority:* ${priorityNames[priority] || 'Medium'}${locationInfo}\n` +
      `📝 *Description:* ${description}\n\n` +
      `⏰ Our maintenance team will review your request and contact you soon\n` +
      `📞 Technician has been notified of your request\n\n` +
      `For inquiries: 📱 *+971507935566*\n` +
      `🏢 Tar Real Estate`;await sendWhatsAppMessage(phoneNumber, successMsg);
    
    // Note: Staff notifications are sent automatically by the integrated notification system
    
    // Complete session - user can send new message to return to menu
    updateSession(phoneNumber, { data: {}, step: 'completed' });
    
  } catch (error) {
    console.error('Error processing enhanced maintenance request:', error);
      const errorMsg = isArabic ?
      "❌ عذراً، حدث خطأ أثناء تقديم طلب الصيانة. يرجى المحاولة مرة أخرى." :
      "❌ Sorry, an error occurred while submitting the maintenance request. Please try again.";
    
    await sendWhatsAppMessage(phoneNumber, errorMsg);
  }
}

// Processes complete complaint with user description
// Creates database record and sends confirmation
async function processEnhancedComplaint(phoneNumber, description, session) {
  const language = session.language || 'ARABIC';
  const isArabic = language === 'ARABIC';
  
  try {
    console.log(`📝 Creating enhanced complaint for ${phoneNumber}`);
      // Use enhanced production system to create complaint
    const result = await createComplaintProduction(phoneNumber, description, session);
    
    if (!result.success) {
      let errorMsg;
        // Handle specific error cases
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
      // Create detailed success message
    const { complaint, client, property, unit } = result.data;
    
    // Translation mappings for complaint categories
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
      // Build location information string
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
    
    const category = session.data?.category || 'other_complaint';
    
    // تنسيق رقم الشكوى من اليسار لليمين
    const complaintNumber = complaint.displayId || complaint.id;
    const formattedComplaintNumber = `\u202D${complaintNumber}\u202C`;
    
    // Create comprehensive success message
    const successMsg = isArabic ?
      `✅ *تم تقديم الشكوى بنجاح*\n\n` +
      `📋 *رقم الشكوى:* ${formattedComplaintNumber}\n` +
      `👤 *العميل:* ${client.name}\n` +
      `📝 *نوع الشكوى:* ${categoryNames[category] || 'أخرى'}${locationInfo}\n` +
      `📄 *الوصف:* ${description}\n\n` +
      `⏰ سيقوم فريق خدمة العملاء بمراجعة شكواك والرد عليك قريباً\n` +
      `📞 تم إشعار موظف العلاقات العامة بشكواك\n\n` +
      `للاستفسار: 📱 *+971507935566*\n` +
      `🏢 شركة تار العقارية` :
      `✅ *Complaint Submitted Successfully*\n\n` +
      `📋 *Complaint #:* ${formattedComplaintNumber}\n` +
      `👤 *Client:* ${client.name}\n` +
      `📝 *Type:* ${categoryNames[category] || 'Other'}${locationInfo}\n` +
      `📄 *Description:* ${description}\n\n` +
      `⏰ Our customer service team will review your complaint and respond soon\n` +
      `📞 Public Relations staff has been notified of your complaint\n\n` +
      `For inquiries: 📱 *+971507935566*\n` +
      `🏢 Tar Real Estate`;await sendWhatsAppMessage(phoneNumber, successMsg);
    
    // Note: Staff notifications are sent automatically by the integrated notification system
    
    // Complete session - user can send new message to return to menu
    updateSession(phoneNumber, { data: {}, step: 'completed' });
    
  } catch (error) {
    console.error('Error processing enhanced complaint:', error);
      const errorMsg = isArabic ?
      "❌ عذراً، حدث خطأ أثناء تقديم الشكوى. يرجى المحاولة مرة أخرى." :
      "❌ Sorry, an error occurred while submitting the complaint. Please try again.";
    
    await sendWhatsAppMessage(phoneNumber, errorMsg);
  }
}

/*
 * ========================================
 * SERVICE HANDLER FUNCTIONS
 * ========================================
 */

// Handles status check requests - shows user's previous requests and complaints
// Retrieves and formats request history from database
async function handleStatusCheck(phoneNumber, language) {
  const isArabic = language === 'ARABIC';
  
  try {
    console.log(`📊 Checking request status for ${phoneNumber}`);
      // Use enhanced system to get client request history
    const result = await getClientRequestHistory(phoneNumber, 5);
    
    // Handle case where client is not found
    if (!result.success) {
      const msg = isArabic ?
        `❌ *لم نتمكن من العثور على حسابك*\n\n` +
        `📞 يرجى الاتصال بمكتبنا: *+971507935566*\n` +
        `🏢 شركة تار العقارية` :
        `❌ *We couldn't find your account*\n\n` +
        `📞 Please contact our office: *+971507935566*\n` +
        `🏢 Tar Real Estate`;
      
      await sendWhatsAppMessage(phoneNumber, msg);
      setTimeout(() => sendMainMenu(phoneNumber, language), 2000);
      return;
    }
    
    const { client, maintenanceRequests, complaints, totalRequests } = result.data;
      // Handle case where client has no requests
      if (totalRequests === 0) {
      const msg = isArabic ?
        `📊 *حالة الطلبات*\n\n` +
        `👋 مرحباً ${client.name}\n\n` +
        `ℹ️ لا توجد طلبات أو شكاوى سابقة في سجلك\n\n` +
        `📞 للاستفسار: *+971507935566*\n` +
        `🏢 شركة تار العقارية` :
        `📊 *Request Status*\n\n` +
        `👋 Hello ${client.name}\n\n` +
        `ℹ️ No previous requests or complaints found in your record\n\n` +
        `📞 For inquiries: *+971507935566*\n` +
        `🏢 Tar Real Estate`;
      
      await sendWhatsAppMessage(phoneNumber, msg);
      setTimeout(() => sendMainMenu(phoneNumber, language), 2000);
      return;
    }
      // Build enhanced status message with client's request history
      const currentDate = new Date().toLocaleDateString(isArabic ? 'ar-SA' : 'en-US');
      let statusMsg = isArabic ? 
        `📊 *حالة طلبات ${client.name}*\n` +
        `📅 التاريخ: ${currentDate}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` : 
        `📊 *${client.name}'s Request Status*\n` +
        `📅 Date: ${currentDate}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n`;
      
      // Display maintenance requests if any exist
      if (maintenanceRequests.length > 0) {
        statusMsg += isArabic ? 
          `🔧 *طلبات الصيانة* (${maintenanceRequests.length}):\n` : 
          `🔧 *Maintenance Requests* (${maintenanceRequests.length}):\n`;
        
        maintenanceRequests.forEach((req, index) => {
          // Enhanced status translations with emojis
          const statusText = isArabic ? 
            { 
              PENDING: '⏳ معلق', 
              IN_PROGRESS: '🔄 قيد المعالجة', 
              COMPLETED: '✅ مكتمل', 
              REJECTED: '❌ مرفوض' 
            } :
            { 
              PENDING: '⏳ Pending', 
              IN_PROGRESS: '🔄 In Progress', 
              COMPLETED: '✅ Completed', 
              REJECTED: '❌ Rejected' 
            };
          
          // Enhanced priority icons with better visual distinction
          const priorityIcon = {
            'URGENT': '��🔴', 'HIGH': '⚠️🟠', 'MEDIUM': '��🟡', 'LOW': '✅🟢'
          };
          
          // Build enhanced location text
          let locationText = '';
          if (req.property) {
            locationText += isArabic ? ` 📍 ${req.property.name}` : ` 📍 ${req.property.name}`;
          }
          if (req.unit) {
            locationText += isArabic ? ` • وحدة ${req.unit.number}` : ` • Unit ${req.unit.number}`;
          }
          
          // Add creation date if available
          let dateText = '';
          if (req.createdAt) {
            const reqDate = new Date(req.createdAt).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US');
            dateText = isArabic ? `\n   📅 ${reqDate}` : `\n   📅 ${reqDate}`;
          }
          
          // Add enhanced request line with better formatting
          const requestNumber = req.displayId || req.id;
          const formattedRequestNumber = `\u202D${requestNumber}\u202C`;
          
          statusMsg += `\n${index + 1}. ${priorityIcon[req.priority] || '🔹'} #${formattedRequestNumber}\n`;
          statusMsg += `   ${statusText[req.status] || req.status}${locationText}${dateText}\n`;
          
          // Add separator line except for last item
          if (index < maintenanceRequests.length - 1) {
            statusMsg += `   ━━━━━━━━━━━━━━━━━━\n`;
          }
        });
        statusMsg += "\n";
      }
    
      // Display complaints if any exist
      if (complaints.length > 0) {
        statusMsg += isArabic ? 
          `📝 *الشكاوى* (${complaints.length}):\n` : 
          `📝 *Complaints* (${complaints.length}):\n`;
        
        complaints.forEach((comp, index) => {
          // Enhanced complaint status translations with emojis
          const statusText = isArabic ? 
            { 
              PENDING: '⏳ معلق', 
              REVIEWING: '👀 قيد المراجعة', 
              RESOLVED: '✅ محلول', 
              REJECTED: '❌ مرفوض' 
            } :
            { 
              PENDING: '⏳ Pending', 
              REVIEWING: '👀 Reviewing', 
              RESOLVED: '✅ Resolved', 
              REJECTED: '❌ Rejected' 
            };
          
          // Build enhanced location text for complaints
          let locationText = '';
          if (comp.property) {
            locationText += isArabic ? `\n   📍 ${comp.property.name}` : `\n   📍 ${comp.property.name}`;
          }
          if (comp.unit) {
            locationText += isArabic ? ` - وحدة ${comp.unit.number}` : ` - Unit ${comp.unit.number}`;
          }
          
          // Add creation date for complaints if available
          let dateText = '';
          if (comp.createdAt) {
            const compDate = new Date(comp.createdAt).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US');
            dateText = isArabic ? `\n   📅 تاريخ الشكوى: ${compDate}` : `\n   📅 Submitted: ${compDate}`;
          }
          
          // Add enhanced complaint line with better formatting
          const complaintNumber = comp.displayId || comp.id;
          const formattedComplaintNumber = `\u202D${complaintNumber}\u202C`;
          
          statusMsg += `\n📋 *شكوى #${formattedComplaintNumber}*\n`;
          statusMsg += `   ${statusText[comp.status] || comp.status}${locationText}${dateText}\n`;
        });
        statusMsg += "\n";
      }
      // Add enhanced footer with contact information and summary
      const totalCount = maintenanceRequests.length + complaints.length;
      statusMsg += isArabic ? 
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `� *الملخص:* ${totalCount} طلب/شكوى إجمالي\n\n` +
        `�💡 *للمتابعة:*\n` +
        `• اتصل بمكتبنا مع رقم الطلب\n` +
        `• أو راسلنا عبر الواتساب\n\n` +
        `📞 *خدمة العملاء:* +971507935566\n` +
        `🕐 *ساعات العمل:* الأحد-الخميس 8ص-6م\n` +
        `🏢 *شركة تار العقارية*\n` +
        `✨ نحن في خدمتكم دائماً` :
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `� *Summary:* ${totalCount} total requests/complaints\n\n` +
        `💡 *For follow-up:*\n` +
        `• Contact our office with request number\n` +
        `• Or message us via WhatsApp\n\n` +
        `📞 *Customer Service:* +971507935566\n` +
        `🕐 *Business Hours:* Sun-Thu 8AM-6PM\n` +
        `🏢 *Tar Real Estate*\n` +
        `✨ Always at your service`;
    
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
          description: `طلب اتصال بالدعم من البوت - ${new Date().toLocaleString('ar-SA')} - العميل طلب التحدث مع ممثل خدمة العملاء`
        }
      });
        const supportMsg = isArabic ?
        `✅ *تم إرسال طلب الدعم الفني*\n\n` +
        `📞 سيتصل بك ممثل خدمة العملاء خلال 30 دقيقة\n` +
        `⏰ خلال ساعات العمل الرسمية\n\n` +
        `🕐 *ساعات العمل:*\n` +
        `الأحد - الخميس: 8 ص - 6 م\n\n` +
        `📱 للطوارئ: *+971507935566*\n` +
        `شكراً لك 🙏` :
        `✅ *Technical Support Request Sent*\n\n` +
        `📞 A customer service representative will contact you within 30 minutes\n` +
        `⏰ During official business hours\n\n` +
        `🕐 *Business Hours:*\n` +
        `Sunday - Thursday: 8 AM - 6 PM\n\n` +
        `📱 For emergencies: *+971507935566*\n` +
        `Thank you 🙏`;
      
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

// Handle payment inquiry
async function handlePaymentInquiry(phoneNumber, language) {
  const isArabic = language === 'ARABIC';
  
  try {
    const clientResult = await findClientWithPropertyProduction(phoneNumber);
    if (!clientResult.success || !clientResult.client) {
      const msg = isArabic ?
        "❌ لم نتمكن من العثور على حسابك. يرجى الاتصال بمكتبنا للاستعلام عن الدفعات." :
        "❌ We couldn't find your account. Please contact our office for payment inquiry.";
      
      await sendWhatsAppMessage(phoneNumber, msg);
      setTimeout(() => sendMainMenu(phoneNumber, language), 2000);
      return;
    }

    const client = clientResult.client;
    
    // Get payment information from database
    await withReadOnlyConnection(async (prisma) => {
      const rentAgreements = await prisma.rentAgreement.findMany({
        where: { renterId: client.id },
        include: {
          property: true,
          unit: true,
          payments: {
            where: { status: 'PENDING' },
            orderBy: { dueDate: 'asc' },
            take: 3
          }
        }
      });

      if (rentAgreements.length === 0) {
        const msg = isArabic ?
          "ℹ️ لا توجد دفعات معلقة في حسابك حالياً.\n\nللمزيد من المعلومات، يرجى الاتصال بالإدارة." :
          "ℹ️ No pending payments found in your account.\n\nFor more information, please contact management.";
        
        await sendWhatsAppMessage(phoneNumber, msg);
      } else {        let paymentMsg = isArabic ?
          `💳 *استعلام الدفعات*\n\n` +
          `👋 مرحباً ${client.name}\n\n` +
          `📋 *الدفعات المستحقة:*\n\n` :
          `💳 *Payment Inquiry*\n\n` +
          `👋 Hello ${client.name}\n\n` +
          `📋 *Pending Payments:*\n\n`;        for (const agreement of rentAgreements) {
          for (const payment of agreement.payments) {
            const dueDate = new Date(payment.dueDate).toLocaleDateString('en-US');
            const amount = payment.amount.toLocaleString('en-US');
            
            // تنسيق رقم الدفعة من اليسار لليمين
            const paymentNumber = payment.displayId || payment.id;
            const formattedPaymentNumber = `\u202D${paymentNumber}\u202C`;
            
            paymentMsg += isArabic ?
              `💳 *رقم الدفعة:* ${formattedPaymentNumber}\n` +
              `🏠 *العقار:* ${agreement.property.name}\n` +
              `🏢 *الوحدة:* ${agreement.unit?.number || 'غير محدد'}\n` +
              `💰 *المبلغ:* ${amount} درهم\n` +
              `📅 *الاستحقاق:* ${dueDate}\n\n` :
              `💳 *Payment ID:* ${formattedPaymentNumber}\n` +
              `🏠 *Property:* ${agreement.property.name}\n` +
              `🏢 *Unit:* ${agreement.unit?.number || 'N/A'}\n` +
              `💰 *Amount:* ${amount} AED\n` +
              `📅 *Due Date:* ${dueDate}\n\n`;
          }
        }

        paymentMsg += isArabic ?
          `📞 للدفع: *+971507935566*\n` +
          `💻 أو عبر الموقع الإلكتروني\n` +
          `🏢 شركة تار العقارية` :
          `📞 For payment: *+971507935566*\n` +
          `💻 Or through the website\n` +
          `🏢 Tar Real Estate`;

        await sendWhatsAppMessage(phoneNumber, paymentMsg);
      }
    });

    setTimeout(() => sendMainMenu(phoneNumber, language), 5000);
    
  } catch (error) {
    console.error('Error in payment inquiry:', error);
    const errorMsg = isArabic ?
      "❌ حدث خطأ أثناء جلب معلومات الدفعات. يرجى إعادة المحاولة لاحقاً." :
      "❌ Error occurred while fetching payment information. Please try again later.";
    
    await sendWhatsAppMessage(phoneNumber, errorMsg);
    setTimeout(() => sendMainMenu(phoneNumber, language), 2000);
  }
}

// Handle contract renewal
async function handleContractRenewal(phoneNumber, language) {
  const isArabic = language === 'ARABIC';
  
  try {
    const clientResult = await findClientWithPropertyProduction(phoneNumber);
    if (!clientResult.success || !clientResult.client) {
      const msg = isArabic ?
        "❌ لم نتمكن من العثور على حسابك. يرجى الاتصال بمكتبنا لتجديد العقد." :
        "❌ We couldn't find your account. Please contact our office for contract renewal.";
      
      await sendWhatsAppMessage(phoneNumber, msg);
      setTimeout(() => sendMainMenu(phoneNumber, language), 2000);
      return;
    }

    const client = clientResult.client;

    // Create contact request for contract renewal
    await withWriteConnection(async (prisma) => {
      await prisma.contact.create({
        data: {
          name: client.name,
          phone: phoneNumber,
          description: `طلب تجديد عقد من البوت - ${new Date().toLocaleString('ar-SA')} - العميل يرغب في تجديد عقد الإيجار`
        }
      });
    });    const renewalMsg = isArabic ?
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
    setTimeout(() => sendMainMenu(phoneNumber, language), 5000);
    
  } catch (error) {
    console.error('Error in contract renewal:', error);
    const errorMsg = isArabic ?
      "❌ حدث خطأ أثناء تسجيل طلب التجديد. يرجى إعادة المحاولة لاحقاً." :
      "❌ Error occurred while submitting renewal request. Please try again later.";
    
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

📋 رقم الطلب: \u202D${data.request?.displayId || data.request?.id || 'غير محدد'}\u202C
📱 رقم العميل: ${phoneNumber}
👤 اسم العميل: ${data.client?.name || 'غير محدد'}
🏠 العقار: ${data.property?.name || 'غير محدد'}
� الوحدة: ${data.unit?.unitNumber || 'غير محدد'}
⚙️ نوع الصيانة: ${getMaintenanceTypeName(data.request?.type)}
📋 الوصف: ${data.request?.description}
🔴 الأولوية: ${getPriorityName(data.request?.priority)}
📅 تاريخ الطلب: ${new Date().toLocaleString('ar-EG')}

الرجاء التواصل مع العميل لتحديد موعد الصيانة.`;

      console.log(`📲 إرسال إشعار للفني: ${TECHNICIAN}`);
      await sendWhatsAppMessage(TECHNICIAN, technicianMessage);
      console.log(`✅ تم إرسال إشعار الصيانة للفني`);
      
      // إرسال إشعار لموظف العلاقات العامة أيضاً
      const prMaintenanceMessage = `📋 إشعار طلب صيانة جديد

🆔 رقم الطلب: \u202D${data.request?.displayId || data.request?.id || 'غير محدد'}\u202C
👤 العميل: ${data.client?.name || 'غير محدد'}
📱 رقم العميل: ${phoneNumber}
🏠 العقار: ${data.property?.name || 'غير محدد'}
🏢 الوحدة: ${data.unit?.unitNumber || 'غير محدد'}
🔧 نوع الصيانة: ${getMaintenanceTypeName(data.request?.type)}

تم إرسال الطلب للفني المختص.`;

      // تأخير قصير لتجنب spam
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log(`📲 إرسال إشعار لموظف العلاقات العامة: ${PUBLIC_RELATIONS}`);
      await sendWhatsAppMessage(PUBLIC_RELATIONS, prMaintenanceMessage);
      console.log(`✅ تم إرسال إشعار الصيانة لموظف العلاقات العامة`);
    }
    
    if (type === 'complaint') {
      // إرسال إشعار لموظف العلاقات العامة
      const prMessage = `📝 شكوى جديدة

🆔 رقم الشكوى: \u202D${data.complaint?.displayId || data.complaint?.id || 'غير محدد'}\u202C
📱 رقم العميل: ${phoneNumber}
👤 اسم العميل: ${data.client?.name || 'غير محدد'}
🏠 العقار: ${data.property?.name || 'غير محدد'}
� الوحدة: ${data.unit?.unitNumber || 'غير محدد'}
📂 نوع الشكوى: ${getComplaintTypeName(data.complaint?.type)}
📋 تفاصيل الشكوى: ${data.complaint?.description}
� تاريخ الشكوى: ${new Date().toLocaleString('ar-EG')}

يرجى المتابعة والتواصل مع العميل لحل المشكلة.`;

      console.log(`📲 إرسال إشعار الشكوى لموظف العلاقات العامة: ${PUBLIC_RELATIONS}`);
      await sendWhatsAppMessage(PUBLIC_RELATIONS, prMessage);
      console.log(`✅ تم إرسال إشعار الشكوى لموظف العلاقات العامة`);
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

/*
 * ========================================
 * WEBHOOK ENDPOINTS
 * ========================================
 */

// GET handler for webhook verification (required by WhatsApp)
// WhatsApp calls this endpoint to verify the webhook URL during setup
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log('🔍 GET webhook verification:', { mode, token, challenge });

    // Verify that the request is from WhatsApp and token matches
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('✅ Webhook verified successfully');
      return new Response(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    } else {
      console.error('❌ Webhook verification failed');
      return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
    }
  } catch (error) {
    console.error('❌ GET webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });  }
}

// PATCH endpoint for manual debugging and testing
// Can be used to trigger diagnostic functions or check system health
export async function PATCH(request) {
  try {
    return NextResponse.json({
      success: true,
      message: "PATCH endpoint is working",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ خطأ في PATCH:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
