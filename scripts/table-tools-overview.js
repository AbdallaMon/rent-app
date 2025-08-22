#!/usr/bin/env node

console.log(`
🔍 أدوات فحص الجداول المتاحة في المشروع
${'='.repeat(60)}

لديك الآن 7 أدوات مختلفة لفحص الجداول:

📸 1. اللقطة السريعة (quick-table-snapshot.js)
   → ملخص سريع لجميع الجداول
   
🔍 2. المستكشف التفاعلي (interactive-table-explorer.js)  
   → فحص مفصل للجداول الأساسية
   
🔧 3. الفحص المتقدم (advanced-table-checker.js)
   → تحليل شامل مع الفهارس والعلاقات
   
✅ 4. فحص صحة البيانات (validate-dashboard-data.js)
   → اختبار البيانات باستخدام Prisma
   
📊 5. التحليل الشامل (comprehensive-table-analysis.js)
   → تحليل كامل لكل شيء
   
📋 6. فحص التركيب الأساسي (check-table-structure.js)
   → عرض تركيب الجداول الرئيسية فقط
   
💰 7. فحص جداول الإيجار (check-rent-payment-tables.js)
   → فحص جداول العقود والدفعات

${'='.repeat(60)}

🚀 للاستخدام السريع:
   node quick-table-snapshot.js        (لقطة سريعة)
   node interactive-table-explorer.js  (فحص تفاعلي)
   node validate-dashboard-data.js     (فحص بـ Prisma)

📖 للمزيد من التفاصيل:
   اقرأ ملف TABLE_INSPECTION_GUIDE.md

${'='.repeat(60)}

✨ نصائح مفيدة:
• تأكد من تشغيل قاعدة البيانات قبل أي فحص
• جميع الأدوات آمنة (قراءة فقط)
• إذا واجهت أخطاء، تحقق من ملف .env
• البيانات موجودة والجداول سليمة! 🎉

`);

// معلومات سريعة عن حالة الجداول
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function quickStatus() {
  try {
    console.log('📊 حالة سريعة للجداول الأساسية:\n');
    
    const tables = [
      { name: 'ReminderSettings', emoji: '🔔' },
      { name: 'WhatsappMessageLog', emoji: '📱' },
      { name: 'Complaint', emoji: '📢' },
      { name: 'MaintenanceRequest', emoji: '🔧' },
      { name: 'Client', emoji: '👥' },
      { name: 'RentAgreement', emoji: '📝' },
      { name: 'Payment', emoji: '💰' }
    ];    for (const table of tables) {
      try {
        const countQuery = `SELECT COUNT(*) as count FROM \`${table.name}\``;
        const result = await prisma.$queryRawUnsafe(countQuery);
        const count = result[0].count;
        console.log(`   ${table.emoji} ${table.name}: ${count} سجل`);
      } catch (error) {
        console.log(`   ❌ ${table.name}: خطأ (${error.message.substring(0, 30)}...)`);
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ في الفحص السريع:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickStatus();
