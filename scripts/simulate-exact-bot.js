/*
 * ========================================
 * SIMULATE EXACT BOT BEHAVIOR
 * ========================================
 * 
 * محاكاة سلوك البوت بالضبط لاختبار الدفعات
 */

const { PrismaClient } = require('@prisma/client');

// تهيئة قاعدة البيانات
const prisma = new PrismaClient();

// دالة withReadOnlyConnection مبسطة
async function withReadOnlyConnection(callback) {
  return await callback(prisma);
}

// نسخة مطابقة لدالة findClient من البوت
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
      }
      
      return client;
    } catch (error) {
      console.error('❌ Error finding client:', error);
      return null;
    }
  });
}

// دالة مرسال وهمية
async function sendWhatsAppMessage(phoneNumber, message) {
  console.log(`📤 [BOT] Would send to ${phoneNumber}:`);
  console.log('─'.repeat(40));
  console.log(message);
  console.log('─'.repeat(40));
}

// دالة تحديث الجلسة الوهمية
function updateSession(phoneNumber, updates) {
  console.log(`🔄 [BOT] Session updated for ${phoneNumber}:`, updates);
}

// **نسخة مطابقة تماماً** لدالة handlePaymentInquiry من البوت
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
                property: {
                  select: { name: true }
                },
                unit: {
                  select: { unitId: true, number: true }
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
        const propertyName = payment.rentAgreement?.property?.name || 'غير محدد';
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

async function simulateBot() {
  console.log('🤖 محاكاة سلوك البوت بالضبط...\n');
  
  // اختبار رقم جبل الشروق
  await handlePaymentInquiry('0506111139', 'ARABIC');
}

simulateBot()
  .catch(console.error)
  .finally(() => {
    prisma.$disconnect();
    console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
  });
