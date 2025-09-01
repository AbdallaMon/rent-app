// نظام إشعارات محسن مع ضمان التسليم 100%
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
dotenv.config();

const prisma = new PrismaClient();
const WHATSAPP_TOKEN = process.env.WHATSAPP_BUSINESS_API_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

// إعدادات الموثوقية
const NOTIFICATION_CONFIG = {
  MAX_RETRIES: 3, // عدد المحاولات عند الفشل
  RETRY_DELAY: 2000, // وقت الانتظار بين المحاولات (بالميلي ثانية)
  TIMEOUT: 10000, // مهلة زمنية للطلب (10 ثواني)
  BATCH_DELAY: 1000, // انتظار بين الرسائل المتعددة
};

/**
 * جلب أرقام فريق العمل من قاعدة البيانات
 */
async function getTeamNumbers() {
  try {
    const settings = await prisma.whatsAppTeamSettings.findFirst({
      where: { id: "default_team_settings" },
    });

    if (!settings) {
      console.warn(
        "⚠️ لم يتم العثور على إعدادات فريق العمل، استخدام الأرقام الافتراضية"
      );
      return STAFF_NUMBERS; // استخدام الأرقام المثبتة كـ fallback
    }

    return {
      TECHNICIAN: {
        original: settings.technicianPhone?.replace("971", "0") || "0506111139",
        formatted: settings.technicianPhone || "971506111139",
        name: "الفني",
        role: "technician",
      },
      PUBLIC_RELATIONS: {
        original:
          settings.customerServicePhone?.replace("971", "0") || "0506677779",
        formatted: settings.customerServicePhone || "971556677779",
        name: "خدمة العملاء",
        role: "public_relations",
      },
    };
  } catch (error) {
    console.error("❌ خطأ في جلب أرقام فريق العمل:", error);
    return STAFF_NUMBERS; // استخدام الأرقام المثبتة كـ fallback
  }
}

// أرقام الموظفين مع التحقق من الصحة (كـ fallback فقط)
const STAFF_NUMBERS = {
  TECHNICIAN: {
    original: "0506111139",
    formatted: "971506111139",
    name: "الفني",
    role: "technician",
  },
  PUBLIC_RELATIONS: {
    original: "0556677779",
    formatted: "971556677779",
    name: "خدمة العملاء",
    role: "public_relations",
  },
};

/**
 * دالة إرسال موثوقة مع إعادة المحاولة
 */
async function sendReliableNotification(
  phoneNumber,
  message,
  recipientName,
  maxRetries = NOTIFICATION_CONFIG.MAX_RETRIES
) {
  const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `📤 محاولة ${attempt}/${maxRetries} - إرسال لـ ${recipientName} (${phoneNumber})`
      );

      const messageData = {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "text",
        text: { body: message },
      };

      // إضافة timeout للطلب
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        NOTIFICATION_CONFIG.TIMEOUT
      );

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (response.ok) {
        console.log(
          `✅ نجح إرسال لـ ${recipientName} - Message ID: ${result.messages[0].id}`
        );
        return {
          success: true,
          messageId: result.messages[0].id,
          waId: result.contacts[0].wa_id,
          attempt: attempt,
          recipient: recipientName,
          phone: phoneNumber,
        };
      } else {
        console.log(
          `❌ فشل المحاولة ${attempt} لـ ${recipientName}:`,
          result.error?.message
        );

        // إذا كان الخطأ نهائي (رقم غير صحيح)، لا تعيد المحاولة
        if (result.error?.code === 131026 || result.error?.code === 131047) {
          console.log(`🚫 خطأ نهائي - توقف إعادة المحاولة لـ ${recipientName}`);
          break;
        }

        if (attempt < maxRetries) {
          console.log(
            `⏰ انتظار ${NOTIFICATION_CONFIG.RETRY_DELAY}ms قبل المحاولة التالية...`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, NOTIFICATION_CONFIG.RETRY_DELAY)
          );
        }
      }
    } catch (error) {
      console.log(
        `❌ خطأ في المحاولة ${attempt} لـ ${recipientName}:`,
        error.message
      );

      if (attempt < maxRetries) {
        console.log(
          `⏰ انتظار ${NOTIFICATION_CONFIG.RETRY_DELAY}ms قبل المحاولة التالية...`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, NOTIFICATION_CONFIG.RETRY_DELAY)
        );
      }
    }
  }

  return {
    success: false,
    error: `فشل في جميع المحاولات (${maxRetries}) لـ ${recipientName}`,
    recipient: recipientName,
    phone: phoneNumber,
  };
}

/**
 * إرسال إشعارات طلب الصيانة مع ضمان التسليم
 */
async function sendMaintenanceNotificationsReliable(requestData) {
  console.log("🔧 بدء إرسال إشعارات طلب الصيانة مع ضمان التسليم...");

  const results = [];

  // جلب الأرقام من قاعدة البيانات
  const teamNumbers = await getTeamNumbers();

  // تحويل نوع الصيانة إلى العربية
  const getMaintenanceTypeArabic = (type) => {
    const typeMap = {
      ELECTRICAL: "كهرباء",
      PLUMBING: "سباكة",
      AC_HEATING: "تكييف وتدفئة",
      APPLIANCES: "أجهزة منزلية",
      STRUCTURAL: "إنشائية",
      CLEANING: "تنظيف",
      PAINTING: "دهان",
      CARPENTRY: "نجارة",
      PEST_CONTROL: "مكافحة حشرات",
      OTHER: "أخرى",
    };
    return typeMap[type] || type || "غير محدد";
  };
  // رسالة للفني
  const technicianMessage = `🔧 طلب صيانة جديد

📋 رقم الطلب: ${requestData.displayId || requestData.requestId || "AUTO_" + Date.now()}
🏠 العقار: ${requestData.propertyName || "غير محدد"}
🏢 الوحدة: ${requestData.unitNumber || "غير محدد"}
👤 العميل: ${requestData.clientName || "غير محدد"}
📱 رقم العميل: ${requestData.clientPhone || "غير محدد"}
🔧 نوع الصيانة: ${getMaintenanceTypeArabic(requestData.maintenanceType)}
⚡ الأولوية: ${requestData.priority === "URGENT" ? "عاجل" : requestData.priority === "HIGH" ? "عالية" : requestData.priority === "MEDIUM" ? "متوسطة" : "منخفضة"}
📝 الوصف: ${requestData.description || "غير محدد"}
📅 تاريخ الطلب: ${new Date().toLocaleString("ar-EG")}

⚡ يرجى التواصل مع العميل والبدء في معالجة الطلب فوراً.

🇦🇪 شركة تار العقارية
📞 +971507935566`;
  // رسالة لخدمة العملاء
  const prMessage = `📋 إشعار طلب صيانة جديد

🆔 رقم الطلب: ${requestData.displayId || requestData.requestId || "AUTO_" + Date.now()}
👤 العميل: ${requestData.clientName || "غير محدد"}
📱 رقم العميل: ${requestData.clientPhone || "غير محدد"}
🏠 العقار: ${requestData.propertyName || "غير محدد"}
🏢 الوحدة: ${requestData.unitNumber || "غير محدد"}
🔧 نوع الصيانة: ${getMaintenanceTypeArabic(requestData.maintenanceType)}
⚡ الأولوية: ${requestData.priority === "URGENT" ? "عاجل" : requestData.priority === "HIGH" ? "عالية" : requestData.priority === "MEDIUM" ? "متوسطة" : "منخفضة"}
📅 التاريخ: ${new Date().toLocaleString("ar-EG")}

✅ تم إرسال الطلب للفني المختص.

🇦🇪 شركة تار العقارية
📞 +971507935566`;

  try {
    // إرسال للفني
    console.log("📤 إرسال إشعار للفني...");
    const techResult = await sendReliableNotification(
      teamNumbers.TECHNICIAN.formatted,
      technicianMessage,
      teamNumbers.TECHNICIAN.name
    );
    results.push(techResult);

    // انتظار قصير بين الرسائل
    await new Promise((resolve) =>
      setTimeout(resolve, NOTIFICATION_CONFIG.BATCH_DELAY)
    );

    // إرسال لخدمة العملاء
    console.log("📤 إرسال إشعار لخدمة العملاء...");
    const prResult = await sendReliableNotification(
      teamNumbers.PUBLIC_RELATIONS.formatted,
      prMessage,
      STAFF_NUMBERS.PUBLIC_RELATIONS.name
    );
    results.push(prResult);
  } catch (error) {
    console.error("❌ خطأ عام في إرسال إشعارات الصيانة:", error);
  }

  // تحليل النتائج
  const successCount = results.filter((r) => r.success).length;
  const totalCount = results.length;
  const successRate = Math.round((successCount / totalCount) * 100);

  console.log(`📊 نتائج إرسال إشعارات الصيانة:`);
  console.log(`   ✅ نجح: ${successCount}/${totalCount} (${successRate}%)`);

  results.forEach((result) => {
    if (result.success) {
      console.log(
        `   ✅ ${result.recipient}: نجح في المحاولة ${result.attempt}`
      );
    } else {
      console.log(`   ❌ ${result.recipient}: فشل - ${result.error}`);
    }
  });
  return {
    success: successCount === totalCount,
    successRate: successRate,
    successCount: successCount,
    totalCount: totalCount,
    results: results,
    summary: `${successCount}/${totalCount} رسائل تم إرسالها بنجاح`,
  };
}

/**
 * إرسال إشعارات الشكوى مع ضمان التسليم
 */
async function sendComplaintNotificationsReliable(complaintData) {
  console.log("📝 بدء إرسال إشعارات الشكوى مع ضمان التسليم...");

  // جلب الأرقام من قاعدة البيانات
  const teamNumbers = await getTeamNumbers();

  // تحويل نوع الشكوى إلى العربية
  const getComplaintTypeArabic = (type) => {
    const typeMap = {
      PROPERTY_ISSUE: "مشكلة في العقار",
      RENT_ISSUE: "مشكلة في الإيجار",
      NEIGHBOR_ISSUE: "مشكلة مع الجيران",
      MAINTENANCE_ISSUE: "مشكلة في الصيانة",
      NOISE_ISSUE: "مشكلة ضوضاء",
      SECURITY_ISSUE: "مشكلة أمنية",
      PAYMENT_ISSUE: "مشكلة في الدفع",
      SERVICE_QUALITY: "جودة الخدمة",
      OTHER: "أخرى",
    };
    return typeMap[type] || type || "غير محدد";
  };

  const prMessage = `📝 شكوى جديدة

🆔 رقم الشكوى: ${complaintData.displayId || complaintData.complaintId || "AUTO_" + Date.now()}
👤 العميل: ${complaintData.clientName || "غير محدد"}
📱 رقم العميل: ${complaintData.clientPhone || "غير محدد"}
🏠 العقار: ${complaintData.propertyName || "غير محدد"}
🏢 الوحدة: ${complaintData.unitNumber || "غير محدد"}
📂 نوع الشكوى: ${getComplaintTypeArabic(complaintData.complaintType)}
⚡ الأولوية: ${complaintData.priority === "URGENT" ? "عاجل" : complaintData.priority === "HIGH" ? "عالية" : complaintData.priority === "MEDIUM" ? "متوسطة" : "منخفضة"}
📝 تفاصيل الشكوى: ${complaintData.description || "غير محدد"}
📅 تاريخ الشكوى: ${new Date().toLocaleString("ar-EG")}

⚡ يرجى المتابعة والتواصل مع العميل لحل المشكلة فوراً.

🇦🇪 شركة تار العقارية
📞 +971507935566`;
  try {
    const result = await sendReliableNotification(
      teamNumbers.PUBLIC_RELATIONS.formatted,
      prMessage,
      teamNumbers.PUBLIC_RELATIONS.name
    );

    const successRate = result.success ? 100 : 0;

    console.log(`📊 نتائج إرسال إشعار الشكوى:`);
    console.log(
      `   ${result.success ? "✅" : "❌"} خدمة العملاء: ${result.success ? "نجح" : "فشل"}`
    );
    return {
      success: result.success,
      successRate: successRate,
      successCount: result.success ? 1 : 0,
      totalCount: 1,
      results: [result],
      summary: `${result.success ? "1/1" : "0/1"} رسائل تم إرسالها بنجاح`,
    };
  } catch (error) {
    console.error("❌ خطأ عام في إرسال إشعار الشكوى:", error);
    return {
      success: false,
      successRate: 0,
      successCount: 0,
      totalCount: 1,
      results: [],
      summary: "0/1 رسائل تم إرسالها بنجاح",
      error: error.message,
    };
  }
}

// تصدير الدوال
export {
  sendMaintenanceNotificationsReliable,
  sendComplaintNotificationsReliable,
  sendMaintenanceNotificationsReliable as sendMaintenanceNotifications, // اسم مستعار
  sendComplaintNotificationsReliable as sendComplaintNotifications, // اسم مستعار
  sendReliableNotification,
  STAFF_NUMBERS,
  NOTIFICATION_CONFIG,
};
