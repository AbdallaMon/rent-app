import { NextRequest, NextResponse } from 'next/server';
import { sendInteractiveWhatsAppMessage, sendWhatsAppMessage } from '@/lib/whatsapp';
import { withDatabaseConnection, withReadOnlyConnection, withWriteConnection } from '@/lib/database-connection';

// VERSION 5.0 - ENHANCED ERROR HANDLING AND DEBUGGING - UPDATED_JAN16_2025_v4
// Store user sessions and conversation state
const userSessions = new Map();
const processedWebhookIds = new Set();

// Enhanced message templates with better structured options
const enhancedMessages = {
  welcomeMessage: {
    ar: "مرحباً بك! كيف يمكننا مساعدتك اليوم؟",
    en: "Welcome! How can we help you today?"
  },
  mainMenuOptions: {
    ar: {
      header: "خدمات العملاء",
      body: "يرجى اختيار الخدمة التي تحتاجها:",
      footer: "نحن هنا لخدمتك 24/7",
      button: "اختر الخدمة",
      sections: [
        {
          title: "الخدمات المتاحة",
          rows: [
            {
              id: "maintenance_request",
              title: "🔧 طلب صيانة",
              description: "الإبلاغ عن مشكلة في العقار أو الوحدة"
            },
            {
              id: "submit_complaint", 
              title: "📝 تقديم شكوى",
              description: "تقديم شكوى أو اقتراح للتحسين"
            },
            {
              id: "check_status",
              title: "📊 حالة الطلبات",
              description: "متابعة حالة طلباتك السابقة"
            },
            {
              id: "contact_support",
              title: "☎️ الاتصال بالدعم",
              description: "التحدث مع ممثل خدمة العملاء"
            }
          ]
        }
      ]
    },
    en: {
      header: "Customer Services",
      body: "Please select the service you need:",
      footer: "We're here to serve you 24/7",
      button: "Select Service",
      sections: [
        {
          title: "Available Services",
          rows: [
            {
              id: "maintenance_request",
              title: "🔧 Maintenance Request",
              description: "Report an issue with your property or unit"
            },
            {
              id: "submit_complaint",
              title: "📝 Submit Complaint", 
              description: "Submit a complaint or suggestion"
            },
            {
              id: "check_status",
              title: "📊 Check Status",
              description: "Track your previous requests"
            },
            {
              id: "contact_support",
              title: "☎️ Contact Support",
              description: "Speak with customer service"
            }
          ]
        }
      ]
    }
  },
  
  // Maintenance request flow
  maintenanceTypeOptions: {
    ar: {
      header: "نوع طلب الصيانة",
      body: "ما نوع المشكلة التي تواجهها؟",
      footer: "اختر النوع الأقرب لمشكلتك",
      button: "اختر النوع",
      sections: [
        {
          title: "أنواع الصيانة",
          rows: [
            {
              id: "plumbing",
              title: "🚿 سباكة",
              description: "مشاكل المياه والصرف الصحي"
            },
            {
              id: "electrical",
              title: "⚡ كهرباء",
              description: "مشاكل الكهرباء والإضاءة"
            },
            {
              id: "ac_heating",
              title: "❄️ تكييف وتدفئة",
              description: "مشاكل التكييف والتدفئة"
            },
            {
              id: "appliances",
              title: "🏠 أجهزة منزلية",
              description: "مشاكل الأجهزة المنزلية"
            },
            {
              id: "structural",
              title: "🏗️ إنشائية",
              description: "مشاكل الأبواب والنوافذ والجدران"
            },
            {
              id: "other_maintenance",
              title: "🔧 أخرى",
              description: "مشاكل صيانة أخرى"
            }
          ]
        }
      ]
    },
    en: {
      header: "Maintenance Request Type",
      body: "What type of issue are you experiencing?",
      footer: "Choose the type closest to your issue",
      button: "Select Type",
      sections: [
        {
          title: "Maintenance Types",
          rows: [
            {
              id: "plumbing",
              title: "🚿 Plumbing",
              description: "Water and drainage issues"
            },
            {
              id: "electrical",
              title: "⚡ Electrical",
              description: "Electrical and lighting issues"
            },
            {
              id: "ac_heating",
              title: "❄️ AC & Heating",
              description: "Air conditioning and heating issues"
            },
            {
              id: "appliances",
              title: "🏠 Appliances",
              description: "Home appliance issues"
            },
            {
              id: "structural",
              title: "🏗️ Structural",
              description: "Doors, windows, and wall issues"
            },
            {
              id: "other_maintenance",
              title: "🔧 Other",
              description: "Other maintenance issues"
            }
          ]
        }
      ]
    }
  },

  // Priority selection
  priorityOptions: {
    ar: {
      header: "أولوية الطلب",
      body: "ما مدى إلحاح هذه المشكلة؟",
      footer: "سيساعدنا هذا في تحديد أولوية الاستجابة",
      button: "اختر الأولوية",
      sections: [
        {
          title: "مستويات الأولوية",
          rows: [
            {
              id: "urgent",
              title: "🔴 عاجل",
              description: "مشكلة طارئة تحتاج حل فوري"
            },
            {
              id: "high",
              title: "🟠 عالية",
              description: "مشكلة مهمة تحتاج حل سريع"
            },
            {
              id: "medium",
              title: "🟡 متوسطة",
              description: "مشكلة عادية يمكن حلها خلال أيام"
            },
            {
              id: "low",
              title: "🟢 منخفضة",
              description: "مشكلة بسيطة غير عاجلة"
            }
          ]
        }
      ]
    },
    en: {
      header: "Request Priority",
      body: "How urgent is this issue?",
      footer: "This helps us prioritize our response",
      button: "Select Priority",
      sections: [
        {
          title: "Priority Levels",
          rows: [
            {
              id: "urgent",
              title: "🔴 Urgent",
              description: "Emergency issue requiring immediate solution"
            },
            {
              id: "high",
              title: "🟠 High",
              description: "Important issue requiring quick solution"
            },
            {
              id: "medium",
              title: "🟡 Medium",
              description: "Normal issue that can be solved within days"
            },
            {
              id: "low",
              title: "🟢 Low",
              description: "Simple non-urgent issue"
            }
          ]
        }
      ]
    }
  },

  // Complaint categories
  complaintCategories: {
    ar: {
      header: "نوع الشكوى",
      body: "ما نوع الشكوى التي تريد تقديمها؟",
      footer: "اختر التصنيف المناسب",
      button: "اختر النوع",
      sections: [
        {
          title: "تصنيفات الشكاوى",
          rows: [
            {
              id: "property_issue",
              title: "🏠 مشكلة في العقار",
              description: "مشاكل متعلقة بالعقار نفسه"
            },
            {
              id: "rent_issue",
              title: "💰 مشكلة في الإيجار",
              description: "مشاكل متعلقة بالدفع أو الفواتير"
            },
            {
              id: "neighbor_issue",
              title: "👥 مشكلة مع الجيران",
              description: "مشاكل مع الجيران أو السكان"
            },
            {
              id: "maintenance_issue",
              title: "🔧 مشكلة في الصيانة",
              description: "شكوى حول خدمة الصيانة"
            },
            {
              id: "noise_issue",
              title: "🔊 مشكلة ضوضاء",
              description: "شكاوى متعلقة بالضوضاء"
            },
            {
              id: "security_issue",
              title: "🛡️ مشكلة أمنية",
              description: "مشاكل أمنية في المبنى"
            },
            {
              id: "payment_issue",
              title: "💳 مشكلة في الدفع",
              description: "مشاكل في عمليات الدفع"
            },
            {
              id: "other_complaint",
              title: "📝 أخرى",
              description: "شكوى أخرى غير مصنفة"
            }
          ]
        }
      ]
    },
    en: {
      header: "Complaint Type",
      body: "What type of complaint would you like to submit?",
      footer: "Choose the appropriate category",
      button: "Select Type",
      sections: [
        {
          title: "Complaint Categories",
          rows: [
            {
              id: "property_issue",
              title: "🏠 Property Issue",
              description: "Issues related to the property itself"
            },
            {
              id: "rent_issue",
              title: "💰 Rent Issue",
              description: "Issues related to payment or billing"
            },
            {
              id: "neighbor_issue",
              title: "👥 Neighbor Issue",
              description: "Issues with neighbors or residents"
            },
            {
              id: "maintenance_issue",
              title: "🔧 Maintenance Issue",
              description: "Complaints about maintenance service"
            },
            {
              id: "noise_issue",
              title: "🔊 Noise Issue",
              description: "Noise-related complaints"
            },
            {
              id: "security_issue",
              title: "🛡️ Security Issue",
              description: "Security issues in the building"
            },
            {
              id: "payment_issue",
              title: "💳 Payment Issue",
              description: "Payment processing issues"
            },
            {
              id: "other_complaint",
              title: "📝 Other",
              description: "Other unclassified complaint"
            }
          ]
        }
      ]
    }
  }
};

// Helper function to get localized messages
const getLocalizedMessages = (language, messageKey) => {
  const lang = language === 'ARABIC' ? 'ar' : 'en';
  return enhancedMessages[messageKey]?.[lang] || enhancedMessages[messageKey]?.en;
};

// Find client by phone number with UAE formats support - using safe connection
const findClientByPhone = async (phoneNumber) => {
  return await withReadOnlyConnection(async (prisma) => {
    try {
      // Support multiple UAE phone formats:
      // +971501234567, 971501234567, 0501234567, 501234567
      const cleanPhone = phoneNumber.replace(/^\+/, '').replace(/^971/, '').replace(/^0/, '');
      
      const searchVariants = [
        phoneNumber,                           // Original format
        phoneNumber.replace(/^\+/, ''),        // Without +
        `+971${cleanPhone}`,                   // +971501234567
        `971${cleanPhone}`,                    // 971501234567
        `0${cleanPhone}`,                      // 0501234567
        cleanPhone,                            // 501234567
        `+9710${cleanPhone}`,                  // +9710501234567 (if stored with extra 0)
        `9710${cleanPhone}`                    // 9710501234567 (if stored with extra 0)
      ];
      
      console.log(`Searching for client with phone variants:`, searchVariants);
      
      const client = await prisma.client.findFirst({
        where: {
          OR: searchVariants.map(variant => ({ phone: variant }))
        }
      });
      
      if (client) {
        console.log(`Found client: ${client.name} (ID: ${client.id}) with phone: ${client.phone}`);      }
    
      return client;
    } catch (error) {
      console.error('Error finding client by phone:', error);
      return null;
    }
  });
};

// Session management
const createSession = (phoneNumber, language) => {
  const session = {
    phoneNumber,
    language,
    step: 'main_menu',
    data: {},
    timestamp: Date.now()
  };
  userSessions.set(phoneNumber, session);
  return session;
};

const getSession = (phoneNumber) => {
  return userSessions.get(phoneNumber);
};

const updateSession = (phoneNumber, updates) => {
  console.log(`🔄 Updating session for ${phoneNumber}:`, updates);
  
  let session = getSession(phoneNumber);
  if (!session) {
    console.log(`🆕 Creating new session for ${phoneNumber}`);
    session = {
      phoneNumber,
      language: 'ARABIC',
      step: 'new',
      data: {},
      timestamp: Date.now()
    };
  }
  
  // Apply updates
  Object.assign(session, updates, { timestamp: Date.now() });
  userSessions.set(phoneNumber, session);
  
  console.log(`✅ Session updated for ${phoneNumber}:`, JSON.stringify(session));
  return session;
};

// Enhanced main menu sender
const sendMainMenu = async (phoneNumber, language) => {
  try {
    console.log(`📋 Sending main menu to ${phoneNumber} in ${language}`);
    
    const menuOptions = getLocalizedMessages(language, 'mainMenuOptions');
    
    if (!menuOptions) {
      console.error(`❌ No menu options found for language: ${language}`);
      const fallbackMessage = language === 'ARABIC' ? 
        "عذراً، حدث خطأ في النظام. يرجى المحاولة لاحقاً." :
        "Sorry, there was a system error. Please try again later.";
      await sendWhatsAppMessage(phoneNumber, fallbackMessage);
      return;
    }
    
    console.log(`📋 Menu options found:`, JSON.stringify(menuOptions, null, 2));
    
    const interactiveContent = {
      type: "list",
      header: {
        type: "text",
        text: menuOptions.header
      },
      body: {
        text: menuOptions.body
      },
      footer: {
        text: menuOptions.footer
      },
      action: {
        button: menuOptions.button,
        sections: menuOptions.sections
      }
    };
    
    console.log(`📤 Sending interactive menu:`, JSON.stringify(interactiveContent, null, 2));
    await sendInteractiveWhatsAppMessage(phoneNumber, interactiveContent);
    console.log(`✅ Main menu sent successfully`);
    
    updateSession(phoneNumber, { step: 'awaiting_main_menu_selection', language });
  } catch (error) {
    console.error(`❌ Error sending main menu:`, error);
    
    // Send fallback text message
    const fallbackMessage = language === 'ARABIC' ? 
      "مرحبًا! يرجى الرد بأحد الخيارات التالية:\n\n1️⃣ صيانة\n2️⃣ شكوى\n3️⃣ حالة الطلبات\n4️⃣ الدعم" :
      "Hello! Please reply with one of the following options:\n\n1️⃣ Maintenance\n2️⃣ Complaint\n3️⃣ Check Status\n4️⃣ Support";
    
    await sendWhatsAppMessage(phoneNumber, fallbackMessage);
  }
};

// Enhanced maintenance type selector
const sendMaintenanceTypeOptions = async (phoneNumber, language) => {
  try {
    const typeOptions = getLocalizedMessages(language, 'maintenanceTypeOptions');
    
    const interactiveContent = {
      type: "list",
      header: {
        type: "text",
        text: typeOptions.header
      },
      body: {
        text: typeOptions.body
      },
      footer: {
        text: typeOptions.footer
      },
      action: {
        button: typeOptions.button,
        sections: typeOptions.sections
      }
    };
    
    await sendInteractiveWhatsAppMessage(phoneNumber, interactiveContent);
    updateSession(phoneNumber, { step: 'awaiting_maintenance_type' });
  } catch (error) {
    console.error('Error sending maintenance type options:', error);
    await sendWhatsAppMessage(phoneNumber, "عذراً، حدث خطأ. / Sorry, an error occurred.");
  }
};

// Priority selector
const sendPriorityOptions = async (phoneNumber, language) => {
  try {
    const priorityOptions = getLocalizedMessages(language, 'priorityOptions');
    
    const interactiveContent = {
      type: "list",
      header: {
        type: "text",
        text: priorityOptions.header
      },
      body: {
        text: priorityOptions.body
      },
      footer: {
        text: priorityOptions.footer
      },
      action: {
        button: priorityOptions.button,
        sections: priorityOptions.sections
      }
    };
    
    await sendInteractiveWhatsAppMessage(phoneNumber, interactiveContent);
    updateSession(phoneNumber, { step: 'awaiting_priority_selection' });
  } catch (error) {
    console.error('Error sending priority options:', error);
    await sendWhatsAppMessage(phoneNumber, "عذراً، حدث خطأ. / Sorry, an error occurred.");
  }
};

// Complaint category selector
const sendComplaintCategories = async (phoneNumber, language) => {
  try {
    const categoryOptions = getLocalizedMessages(language, 'complaintCategories');
    
    const interactiveContent = {
      type: "list",
      header: {
        type: "text",
        text: categoryOptions.header
      },
      body: {
        text: categoryOptions.body
      },
      footer: {
        text: categoryOptions.footer
      },
      action: {
        button: categoryOptions.button,
        sections: categoryOptions.sections
      }
    };
    
    await sendInteractiveWhatsAppMessage(phoneNumber, interactiveContent);
    updateSession(phoneNumber, { step: 'awaiting_complaint_category' });
  } catch (error) {
    console.error('Error sending complaint categories:', error);
    await sendWhatsAppMessage(phoneNumber, "عذراً، حدث خطأ. / Sorry, an error occurred.");
  }
};

// Handle interactive responses with enhanced flow
const handleInteractiveResponse = async (interactive, phoneNumber) => {
  try {
    console.log(`\n=== 🎯 INTERACTIVE RESPONSE ===`);
    console.log(`From: ${phoneNumber}`);
    console.log(`Interactive data:`, JSON.stringify(interactive));
    
    const session = getSession(phoneNumber);
    
    // Handle language selection buttons
    if (interactive.button_reply) {
      const buttonId = interactive.button_reply.id;
      console.log(`🔘 Button pressed: ${buttonId}`);
      
      if (buttonId === 'lang_en' || buttonId === 'lang_ar') {
        console.log(`🌍 Processing language selection: ${buttonId}`);
        
        const selectedLanguage = buttonId === 'lang_en' ? 'ENGLISH' : 'ARABIC';
        console.log(`✅ Language selected: ${selectedLanguage}`);
        
        // Update session with language and send main menu
        updateSession(phoneNumber, { 
          step: 'awaiting_main_menu_selection',
          language: selectedLanguage
        });
        
        await sendMainMenu(phoneNumber, selectedLanguage);
        console.log(`📋 Main menu sent in ${selectedLanguage}`);
        return;
      }
    }
    
    if (!session) {
      console.log(`❌ No session found for interactive response from ${phoneNumber}`);
      console.log(`🔄 Starting fresh conversation`);
      
      // Send interactive language selection instead of text message
      const languageSelectionMessage = {
        type: "button",
        header: {
          type: "text",
          text: "🌍 Language / اللغة"
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
      
      await sendInteractiveWhatsAppMessage(phoneNumber, languageSelectionMessage);
      updateSession(phoneNumber, { step: 'awaiting_language_selection' });
      return;
    }
    
    const language = session.language || 'ARABIC';
    console.log(`📋 Session found - Step: ${session.step}, Language: ${language}`);
    
    if (interactive.list_reply) {
      const selectedOption = interactive.list_reply.id;
      console.log(`📝 Selected option: ${selectedOption}`);
      
      switch (session.step) {        case 'awaiting_main_menu_selection':
          console.log(`📋 Processing main menu selection: ${selectedOption}`);
          await handleMainMenuSelection(selectedOption, phoneNumber, language);
          break;
          
        case 'awaiting_maintenance_type':
          updateSession(phoneNumber, { 
            step: 'awaiting_priority_selection',
            data: { ...session.data, maintenanceType: selectedOption }
          });
          await sendPriorityOptions(phoneNumber, language);
          break;
          
        case 'awaiting_priority_selection':
          updateSession(phoneNumber, { 
            step: 'awaiting_description',
            data: { ...session.data, priority: selectedOption }
          });
          const promptMsg = language === 'ARABIC' ? 
            "يرجى وصف المشكلة بالتفصيل:" : 
            "Please describe the issue in detail:";
          await sendWhatsAppMessage(phoneNumber, promptMsg);
          break;
          
        case 'awaiting_complaint_category':
          updateSession(phoneNumber, { 
            step: 'awaiting_complaint_description',
            data: { ...session.data, category: selectedOption }
          });
          const complaintPrompt = language === 'ARABIC' ? 
            "يرجى وصف الشكوى بالتفصيل:" : 
            "Please describe your complaint in detail:";
          await sendWhatsAppMessage(phoneNumber, complaintPrompt);
          break;
      }
    }
  } catch (error) {
    console.error('Error handling interactive response:', error);
  }
};

// Handle main menu selection
const handleMainMenuSelection = async (selectedOption, phoneNumber, language) => {
  const client = await findClientByPhone(phoneNumber);
  
  if (!client) {
    const notFoundMsg = language === 'ARABIC' ? 
      "لم نتمكن من العثور على حسابك في نظامنا. يرجى الاتصال بمكتبنا مباشرة." :
      "We couldn't find your account in our system. Please contact our office directly.";
    await sendWhatsAppMessage(phoneNumber, notFoundMsg);
    return;
  }
  
  switch (selectedOption) {
    case 'maintenance_request':
      await sendMaintenanceTypeOptions(phoneNumber, language);
      break;
      
    case 'submit_complaint':
      await sendComplaintCategories(phoneNumber, language);
      break;
        case 'check_status':
      await handleStatusCheck(phoneNumber, language, client);
      break;
      
    case 'contact_support':
      await handleContactSupport(phoneNumber, language, client);
      break;
      
    default:
      await sendMainMenu(phoneNumber, language);
  }
};

// Enhanced maintenance request creation
const createEnhancedMaintenanceRequest = async (phoneNumber, description, session) => {
  return await withWriteConnection(async (prisma) => {
    try {
      console.log(`🔧 Creating maintenance request for ${phoneNumber}`);
      console.log(`📝 Description: ${description}`);
      console.log(`📋 Session data:`, session.data);
        const client = await findClientByPhone(phoneNumber);
      if (!client) {
        console.log(`❌ Client not found for phone: ${phoneNumber}`);
        
        // For testing, create a demo client
        if (phoneNumber === "1234567890") {
          console.log(`🧪 Creating demo client for testing...`);
          try {
            const demoClient = await prisma.client.create({
              data: {
                name: "عميل تجريبي",
                phone: phoneNumber,
                email: "demo@test.com",
                nationalId: "123456789",
                isActive: true
              }
            });
            console.log(`✅ Demo client created: ${demoClient.name} (ID: ${demoClient.id})`);
            // Continue with the demo client
            const client = demoClient;
            
            const { maintenanceType, priority } = session.data || {};
            
            if (!maintenanceType || !priority) {
              console.log(`❌ Missing session data - Type: ${maintenanceType}, Priority: ${priority}`);
              const errorMsg = session.language === 'ARABIC' ? 
                "❌ معلومات الطلب غير مكتملة. يرجى البدء من جديد." :
                "❌ Request information is incomplete. Please start over.";
              await sendWhatsAppMessage(phoneNumber, errorMsg);
              
              // Reset session and send main menu
              await sendMainMenu(phoneNumber, session.language);
              updateSession(phoneNumber, { 
                step: 'awaiting_main_menu_selection',
                language: session.language
              });
              return;
            }
            
            // Continue with maintenance request creation...
            // (rest of the function will continue here)
            
          } catch (createError) {
            console.error(`Error creating demo client:`, createError);
            const notFoundMsg = session.language === 'ARABIC' ? 
              "❌ لم نتمكن من العثور على حسابك في نظامنا. يرجى الاتصال بمكتبنا مباشرة على: 971234567890" :
              "❌ We couldn't find your account in our system. Please contact our office directly at: 971234567890";
            await sendWhatsAppMessage(phoneNumber, notFoundMsg);
            return;
          }
        } else {
          const notFoundMsg = session.language === 'ARABIC' ? 
            "❌ لم نتمكن من العثور على حسابك في نظامنا. يرجى الاتصال بمكتبنا مباشرة على: 971234567890" :
            "❌ We couldn't find your account in our system. Please contact our office directly at: 971234567890";
          await sendWhatsAppMessage(phoneNumber, notFoundMsg);
          return;
        }
      } else {
        console.log(`✅ Client found: ${client.name} (ID: ${client.id})`);
      }
        // Map priority values to database enum
      const priorityMap = {
        'urgent': 'URGENT',
        'high': 'HIGH', 
        'medium': 'MEDIUM',
        'low': 'LOW'
      };
      
      console.log(`🔍 Fetching client properties and units...`);
      const clientProperties = await prisma.property.findMany({
        where: { clientId: client.id }
      });
      
      const clientUnits = await prisma.unit.findMany({
        where: { clientId: client.id }
      });
      
      console.log(`🏠 Found ${clientProperties.length} properties, ${clientUnits.length} units`);
      
      const requestData = {
        clientId: client.id,
        propertyId: clientProperties.length > 0 ? clientProperties[0].id : null,
        unitId: clientUnits.length > 0 ? clientUnits[0].id : null,
        description: `[${maintenanceType.toUpperCase()}] ${description}`,
        status: 'PENDING',
        priority: priorityMap[priority] || 'MEDIUM',
        isExpired: false,
        lastRequestTime: new Date()
      };
      
      console.log(`💾 Creating maintenance request with data:`, requestData);
      
      const maintenanceRequest = await prisma.maintenanceRequest.create({
        data: requestData
      });
      
      console.log(`✅ Maintenance request created successfully with ID: ${maintenanceRequest.id}`);const successMsg = session.language === 'ARABIC' ? 
        `✅ تم تقديم طلب الصيانة بنجاح!\n\n📋 رقم الطلب: #${maintenanceRequest.id}\n🔧 النوع: ${maintenanceType}\n⚡ الأولوية: ${priority}\n📝 الوصف: ${description}\n\n⏰ سيقوم فريقنا بمراجعته والتواصل معك قريباً.\n\nهل تحتاج إلى خدمة أخرى؟` :
        `✅ Maintenance request submitted successfully!\n\n📋 Request #: ${maintenanceRequest.id}\n🔧 Type: ${maintenanceType}\n⚡ Priority: ${priority}\n📝 Description: ${description}\n\n⏰ Our team will review it and contact you soon.\n\nDo you need another service?`;
      
      await sendWhatsAppMessage(phoneNumber, successMsg);
      
      // Send main menu after a short delay
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      await delay(1500);
      
      await sendMainMenu(phoneNumber, session.language);
      updateSession(phoneNumber, { 
        step: 'awaiting_main_menu_selection',
        language: session.language
      });
        } catch (error) {
      console.error('Error creating enhanced maintenance request:', error);
      const errorMsg = session.language === 'ARABIC' ? 
        "❌ عذراً، حدث خطأ أثناء تقديم الطلب. يرجى المحاولة مرة أخرى." :
        "❌ Sorry, an error occurred while submitting the request. Please try again.";
      await sendWhatsAppMessage(phoneNumber, errorMsg);
      
      // Send main menu on error too
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      await delay(1000);
      
      await sendMainMenu(phoneNumber, session.language);
      updateSession(phoneNumber, { 
        step: 'awaiting_main_menu_selection',
        language: session.language
      });
    }
  });
};

// Enhanced complaint creation
const createEnhancedComplaint = async (phoneNumber, description, session) => {
  return await withWriteConnection(async (prisma) => {
    try {
      console.log(`📝 Creating complaint for ${phoneNumber}`);
      console.log(`📝 Description: ${description}`);
      console.log(`📋 Session data:`, session.data);
      
      const client = await findClientByPhone(phoneNumber);
      if (!client) {
        console.log(`❌ Client not found for phone: ${phoneNumber}`);
        const notFoundMsg = session.language === 'ARABIC' ? 
          "❌ لم نتمكن من العثور على حسابك في نظامنا. يرجى الاتصال بمكتبنا مباشرة على: 971234567890" :
          "❌ We couldn't find your account in our system. Please contact our office directly at: 971234567890";
        await sendWhatsAppMessage(phoneNumber, notFoundMsg);
        return;
      }
      
      console.log(`✅ Client found: ${client.name} (ID: ${client.id})`);
      
      const { category } = session.data || {};
      
      if (!category) {
        console.log(`❌ Missing category in session data`);
        const errorMsg = session.language === 'ARABIC' ? 
          "❌ معلومات الشكوى غير مكتملة. يرجى البدء من جديد." :
          "❌ Complaint information is incomplete. Please start over.";
        await sendWhatsAppMessage(phoneNumber, errorMsg);
        
        // Reset session and send main menu
        await sendMainMenu(phoneNumber, session.language);
        updateSession(phoneNumber, { 
          step: 'awaiting_main_menu_selection',
          language: session.language
        });
        return;
      }
      // Map category values to database enum
    const categoryMap = {
      'property_issue': 'PROPERTY_ISSUE',
      'rent_issue': 'RENT_ISSUE',
      'neighbor_issue': 'NEIGHBOR_ISSUE',
      'maintenance_issue': 'MAINTENANCE_ISSUE',
      'noise_issue': 'NOISE_ISSUE',
      'security_issue': 'SECURITY_ISSUE',
      'payment_issue': 'PAYMENT_ISSUE',
      'service_quality': 'SERVICE_QUALITY',
      'other_complaint': 'OTHER'
    };
    
    const clientProperties = await prisma.property.findMany({
      where: { clientId: client.id }
    });
    
    const clientUnits = await prisma.unit.findMany({
      where: { clientId: client.id }
    });
    
    const complaint = await prisma.complaint.create({
      data: {
        clientId: client.id,
        propertyId: clientProperties.length > 0 ? clientProperties[0].id : null,
        unitId: clientUnits.length > 0 ? clientUnits[0].id : null,
        title: description.length > 50 ? description.substring(0, 50) + "..." : description,
        description: description,
        category: categoryMap[category] || 'OTHER',
        status: 'PENDING'
      }
    });
      const successMsg = session.language === 'ARABIC' ? 
      `✅ تم تقديم الشكوى بنجاح!\n\n📋 رقم الشكوى: #${complaint.id}\n📂 التصنيف: ${category}\n📝 الوصف: ${description}\n\n⏰ سيقوم فريقنا بمراجعتها والرد عليك قريباً.\n\nهل تحتاج إلى خدمة أخرى؟` :
      `✅ Complaint submitted successfully!\n\n📋 Complaint #: ${complaint.id}\n📂 Category: ${category}\n📝 Description: ${description}\n\n⏰ Our team will review it and respond soon.\n\nDo you need another service?`;
      
    await sendWhatsAppMessage(phoneNumber, successMsg);
      
    // Wait a moment then send main menu again
    setTimeout(async () => {
      await sendMainMenu(phoneNumber, session.language);
      updateSession(phoneNumber, { 
        step: 'awaiting_main_menu_selection',
        language: session.language
      });
    }, 2000);
      
    } catch (error) {
      console.error('Error creating enhanced complaint:', error);
      const errorMsg = session.language === 'ARABIC' ? 
        "❌ عذراً، حدث خطأ أثناء تقديم الشكوى. يرجى المحاولة مرة أخرى." :
        "❌ Sorry, an error occurred while submitting the complaint. Please try again.";
      await sendWhatsAppMessage(phoneNumber, errorMsg);
      
      // Send main menu on error too
      setTimeout(async () => {
        await sendMainMenu(phoneNumber, session.language);
        updateSession(phoneNumber, { 
          step: 'awaiting_main_menu_selection',
          language: session.language
        });
      }, 1000);
    }
  });
};

// Handle text messages based on session state - COMPLETELY REWRITTEN
const handleTextMessage = async (messageText, phoneNumber) => {
  console.log(`\n=== � NEW MESSAGE ===`);
  console.log(`From: ${phoneNumber}`);
  console.log(`Text: "${messageText}"`);
  
  const session = getSession(phoneNumber);
  const text = messageText.toLowerCase().trim();
  
  console.log(`Session exists: ${!!session}`);
  if (session) {
    console.log(`Session step: ${session.step}`);
    console.log(`Session language: ${session.language}`);
  }
    // === CASE 1: NEW CONVERSATION (GREETING) ===
  if (!session && (text.includes('مرحبا') || text.includes('hello') || text.includes('hi'))) {
    console.log(`🆕 CASE 1: Starting new conversation`);
    
    // Send interactive language selection menu
    const languageSelectionMessage = {
      type: "button",
      header: {
        type: "text",
        text: "🌍 Language / اللغة"
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
      await sendInteractiveWhatsAppMessage(phoneNumber, languageSelectionMessage);
    
    updateSession(phoneNumber, { step: 'awaiting_language_selection' });
    console.log(`✅ Interactive language selection menu sent`);
    return;
  }
  
  // === CASE 2: NO SESSION (START LANGUAGE SELECTION) ===
  if (!session) {
    console.log(`🔄 CASE 2: No session, starting language selection`);
    
    // Send interactive language selection menu
    const languageSelectionMessage = {
      type: "button",
      header: {
        type: "text",
        text: "🌍 Language / اللغة"
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
    
    await sendInteractiveWhatsAppMessage(phoneNumber, languageSelectionMessage);
    updateSession(phoneNumber, { step: 'awaiting_language_selection' });
    return;
  }
  
  // === CASE 3: EXISTING SESSIONS ===
  console.log(`📋 CASE 3: Handling existing session step: ${session.step}`);
  
  switch (session.step) {
    case 'awaiting_description':
      console.log(`📝 Processing maintenance description`);
      await createEnhancedMaintenanceRequest(phoneNumber, messageText, session);
      break;
      
    case 'awaiting_complaint_description':
      console.log(`📝 Processing complaint description`);
      await createEnhancedComplaint(phoneNumber, messageText, session);
      break;
      
    case 'awaiting_main_menu_selection':
      console.log(`� User sent text instead of interactive selection, resending menu`);
      await sendMainMenu(phoneNumber, session.language || 'ARABIC');
      break;
      
    default:
      console.log(`❓ Unknown session step: ${session.step}`);
      console.log(`📋 Resetting to main menu`);
      await sendMainMenu(phoneNumber, session.language || 'ARABIC');
      updateSession(phoneNumber, { step: 'awaiting_main_menu_selection' });
  }
  
  console.log(`=== MESSAGE PROCESSING COMPLETE ===\n`);
};

// Status check functionality
const handleStatusCheck = async (phoneNumber, language, client) => {
  return await withReadOnlyConnection(async (prisma) => {
  try {
    // Get recent requests and complaints
    const recentRequests = await prisma.maintenanceRequest.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    const recentComplaints = await prisma.complaint.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    let statusMessage = language === 'ARABIC' ? 
      "حالة طلباتك الأخيرة:\n\n" : 
      "Your recent requests status:\n\n";
    
    if (recentRequests.length > 0) {
      statusMessage += language === 'ARABIC' ? "طلبات الصيانة:\n" : "Maintenance Requests:\n";
      recentRequests.forEach(req => {
        const statusText = language === 'ARABIC' ? 
          { PENDING: 'معلق', IN_PROGRESS: 'قيد المعالجة', COMPLETED: 'مكتمل', REJECTED: 'مرفوض' } :
          { PENDING: 'Pending', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed', REJECTED: 'Rejected' };
        statusMessage += `#${req.id}: ${statusText[req.status]}\n`;
      });
      statusMessage += "\n";
    }
    
    if (recentComplaints.length > 0) {
      statusMessage += language === 'ARABIC' ? "الشكاوى:\n" : "Complaints:\n";
      recentComplaints.forEach(comp => {
        const statusText = language === 'ARABIC' ? 
          { PENDING: 'معلق', REVIEWING: 'قيد المراجعة', RESOLVED: 'محلول', REJECTED: 'مرفوض' } :
          { PENDING: 'Pending', REVIEWING: 'Reviewing', RESOLVED: 'Resolved', REJECTED: 'Rejected' };
        statusMessage += `#${comp.id}: ${statusText[comp.status]}\n`;
      });
    }
    
    if (recentRequests.length === 0 && recentComplaints.length === 0) {
      statusMessage = language === 'ARABIC' ? 
        "لا توجد طلبات سابقة." : 
        "No previous requests found.";
    }
      await sendWhatsAppMessage(phoneNumber, statusMessage);
    
    // Return to main menu
    setTimeout(async () => {
      await sendMainMenu(phoneNumber, language);
      updateSession(phoneNumber, { 
        step: 'awaiting_main_menu_selection',
        language: language
      });
    }, 2000);
    
  } catch (error) {
    console.error('Error checking status:', error);
    await sendWhatsAppMessage(phoneNumber, "عذراً، حدث خطأ. / Sorry, an error occurred.");
  }
  });
};

// Contact support
const handleContactSupport = async (phoneNumber, language, client) => {
  return await withWriteConnection(async (prisma) => {
    try {
      const supportMsg = language === 'ARABIC' ? 
        "✅ تم إرسال طلبك للدعم الفني.\n\n📞 سيتصل بك ممثل خدمة العملاء خلال 30 دقيقة.\n\nشكراً لك!" :
        "✅ Your request has been sent to technical support.\n\n📞 A customer service representative will contact you within 30 minutes.\n\nThank you!";
      
      await sendWhatsAppMessage(phoneNumber, supportMsg);
      
      // Log support request
      await prisma.contactForm.create({
        data: {
          name: client.name,
          email: client.email || 'noemail@provided.com',
          phone: phoneNumber,
          message: 'Customer requested support via WhatsApp bot',
          language: language
        }
      });
      
      // Return to main menu after 3 seconds
      setTimeout(async () => {
        await sendMainMenu(phoneNumber, language);
        updateSession(phoneNumber, { 
          step: 'awaiting_main_menu_selection',
          language: language
        });
      }, 3000);
      
    } catch (error) {
      console.error('Error handling contact support:', error);
      const errorMsg = language === 'ARABIC' ? 
        "❌ عذراً، حدث خطأ أثناء إرسال طلب الدعم. يرجى المحاولة مرة أخرى." :
        "❌ Sorry, an error occurred while sending support request. Please try again.";
      await sendWhatsAppMessage(phoneNumber, errorMsg);
      
      // Send main menu on error
      setTimeout(async () => {
        await sendMainMenu(phoneNumber, language);
        updateSession(phoneNumber, { 
          step: 'awaiting_main_menu_selection',
          language: language
        });
      }, 1000);
    }
  });
};

// Main webhook handler - UPDATED VERSION 3.0 - Jan 16, 2025 - Interactive Language Selection
export async function POST(request) {
  try {
    const body = await request.json();    console.log(`\n🌐 ===== WEBHOOK RECEIVED - VERSION 5.0 =====`);
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`🔧 Code Version: ENHANCED_ERROR_HANDLING_JAN16_2025_v4`);
    console.log(`📦 Body:`, JSON.stringify(body, null, 2));
    
    if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
      const message = body.entry[0].changes[0].value.messages[0];
      const phoneNumber = message.from;
      
      console.log(`📱 Message details:`);
      console.log(`   - Phone: ${phoneNumber}`);
      console.log(`   - Type: ${message.type}`);
      console.log(`   - ID: ${message.id}`);
      console.log(`   - Content:`, message.type === 'text' ? message.text.body : JSON.stringify(message.interactive));
      
      // Check current session before processing
      const currentSession = getSession(phoneNumber);
      console.log(`📋 Current session:`, currentSession ? {
        step: currentSession.step,
        language: currentSession.language,
        timestamp: new Date(currentSession.timestamp).toLocaleString()
      } : 'NO SESSION');
      
      // Check for duplicate processing
      const webhookId = `${message.id}_${Date.now()}`;
      if (processedWebhookIds.has(webhookId)) {
        console.log(`⚠️ Duplicate webhook detected: ${webhookId}`);
        return NextResponse.json({ status: 'already_processed' });
      }
      processedWebhookIds.add(webhookId);
      
      // Handle different message types
      if (message.type === 'text') {
        console.log(`📝 Processing TEXT message`);
        await handleTextMessage(message.text.body, phoneNumber);
      } else if (message.type === 'interactive') {
        console.log(`🎯 Processing INTERACTIVE message`);
        await handleInteractiveResponse(message.interactive, phoneNumber);
      }
      
      // Check session after processing
      const finalSession = getSession(phoneNumber);
      console.log(`📋 Final session:`, finalSession ? {
        step: finalSession.step,
        language: finalSession.language,
        timestamp: new Date(finalSession.timestamp).toLocaleString()
      } : 'NO SESSION');
    }
    
    console.log(`✅ Webhook processing complete`);
    console.log(`================================\n`);
    return NextResponse.json({ status: 'success' });
    
  } catch (error) {
    console.error('Enhanced webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Webhook verification
export async function GET(request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  
  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  
  return new Response('Forbidden', { status: 403 });
}
