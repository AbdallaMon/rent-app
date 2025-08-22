const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * فحص حالة إعدادات التذكيرات وتشخيص المشكلة
 */
async function diagnoseReminderSettingsIssue() {
  console.log('🔍 تشخيص مشكلة إعدادات التذكيرات...\n');

  try {
    // 1. فحص الاتصال بقاعدة البيانات
    console.log('1️⃣ فحص الاتصال بقاعدة البيانات...');
    await prisma.$connect();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح\n');

    // 2. فحص وجود جدول ReminderSettings
    console.log('2️⃣ فحص وجود جدول ReminderSettings...');
    try {
      const settingsCount = await prisma.reminderSettings.count();
      console.log(`✅ جدول ReminderSettings موجود، عدد السجلات: ${settingsCount}\n`);
    } catch (error) {
      console.log('❌ خطأ في الوصول لجدول ReminderSettings:', error.message);
      return;
    }

    // 3. فحص الإعدادات الافتراضية
    console.log('3️⃣ فحص الإعدادات الافتراضية...');
    let defaultSettings = await prisma.reminderSettings.findFirst({
      where: { id: 'default_reminder_settings' }
    });

    if (!defaultSettings) {
      console.log('⚠️ الإعدادات الافتراضية غير موجودة، سيتم إنشاؤها...');
      
      try {
        defaultSettings = await prisma.reminderSettings.create({
          data: {
            id: 'default_reminder_settings',
            paymentReminderDays: [7, 3, 1],
            contractReminderDays: [60, 30, 15, 7],
            maintenanceFollowupDays: [3, 7, 14],
            maxRetries: 3,
            messageDelay: 2000,
            enableAutoReminders: true,
            enabledReminderTypes: ["payment_reminder", "contract_expiry_reminder"],
            workingHoursStart: "09:00:00",
            workingHoursEnd: "18:00:00",
            workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            highPriorityThreshold: 3,
            mediumPriorityThreshold: 7,
            defaultLanguage: "ar_AE",
            includeCompanySignature: true,
            isActive: true
          }
        });
        console.log('✅ تم إنشاء الإعدادات الافتراضية بنجاح');
      } catch (createError) {
        console.log('❌ فشل في إنشاء الإعدادات الافتراضية:', createError.message);
        return;
      }
    } else {
      console.log('✅ الإعدادات الافتراضية موجودة');
    }

    console.log('\n📋 الإعدادات الحالية:');
    console.log(JSON.stringify(defaultSettings, null, 2));

    // 4. اختبار API endpoint
    console.log('\n4️⃣ اختبار API endpoint...');
    try {
      const response = await fetch('http://localhost:3000/api/admin/whatsapp/reminders?action=settings');
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API endpoint يعمل بشكل صحيح');
        console.log('📊 استجابة API:', JSON.stringify(data, null, 2));
      } else {
        console.log('❌ API endpoint يعيد خطأ:', response.status, response.statusText);
        const errorText = await response.text();
        console.log('تفاصيل الخطأ:', errorText);
      }
    } catch (apiError) {
      console.log('❌ خطأ في الاتصال بـ API:', apiError.message);
      console.log('💡 تأكد من أن الخادم يعمل على localhost:3000');
    }

    // 5. فحص المصادقة
    console.log('\n5️⃣ فحص إعدادات المصادقة...');
    
    // قراءة ملف API
    const fs = require('fs');
    const path = require('path');
    const apiPath = path.join(__dirname, '../src/app/api/admin/whatsapp/reminders/route.js');
    
    if (fs.existsSync(apiPath)) {
      const apiContent = fs.readFileSync(apiPath, 'utf8');
      
      if (apiContent.includes('verifyAuth')) {
        console.log('⚠️ المصادقة مفعلة في API');
        console.log('💡 قد تحتاج إلى تسجيل دخول صحيح للوصول للإعدادات');
      } else {
        console.log('✅ لا توجد مصادقة في API');
      }
    }

    // 6. التوصيات
    console.log('\n📝 التوصيات:');
    console.log('1. تأكد من تشغيل الخادم على localhost:3000');
    console.log('2. تأكد من تسجيل الدخول إذا كانت المصادقة مفعلة');
    console.log('3. تحقق من console في المتصفح لرؤية أخطاء JavaScript');
    console.log('4. تأكد من أن Network requests تصل بنجاح');

  } catch (error) {
    console.error('❌ خطأ عام في التشخيص:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل التشخيص
if (require.main === module) {
  diagnoseReminderSettingsIssue()
    .then(() => {
      console.log('\n✅ انتهى التشخيص');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل التشخيص:', error);
      process.exit(1);
    });
}

module.exports = { diagnoseReminderSettingsIssue };
