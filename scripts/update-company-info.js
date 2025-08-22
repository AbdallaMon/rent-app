// سكريبت تحديث معلومات الشركة
// تحديث اسم الشركة ورقم التواصل في جميع الملفات

const fs = require('fs');
const path = require('path');

// معلومات الشركة الجديدة
const COMPANY_INFO = {
  OLD_PHONE: '0507935566',
  NEW_PHONE: '+971507935566',
  OLD_NAME_AR: 'شركة تار للعقارات',
  NEW_NAME_AR: 'شركة تار العقارية',
  OLD_NAME_AR_2: 'شركة الإمارات للعقارات',
  NEW_NAME_EN: 'Tar Real Estate'
};

// قائمة الملفات المراد تحديثها
const FILES_TO_UPDATE = [
  'src/app/api/notifications/whatsapp/webhook/route.js',
  'src/app/api/notifications/whatsapp/request/status/route.js',
  'src/lib/reliable-notifications.js',
  'src/config/staff-numbers.js'
];

// دالة تحديث ملف
function updateFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ الملف غير موجود: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // تحديث أرقام الهواتف
    if (content.includes(COMPANY_INFO.OLD_PHONE)) {
      content = content.replace(new RegExp(COMPANY_INFO.OLD_PHONE, 'g'), COMPANY_INFO.NEW_PHONE);
      updated = true;
      console.log(`✅ تم تحديث رقم الهاتف في: ${filePath}`);
    }

    // تحديث اسم الشركة العربي القديم
    if (content.includes(COMPANY_INFO.OLD_NAME_AR)) {
      content = content.replace(new RegExp(COMPANY_INFO.OLD_NAME_AR, 'g'), COMPANY_INFO.NEW_NAME_AR);
      updated = true;
      console.log(`✅ تم تحديث اسم الشركة (1) في: ${filePath}`);
    }

    // تحديث اسم الشركة العربي القديم الثاني
    if (content.includes(COMPANY_INFO.OLD_NAME_AR_2)) {
      content = content.replace(new RegExp(COMPANY_INFO.OLD_NAME_AR_2, 'g'), COMPANY_INFO.NEW_NAME_AR);
      updated = true;
      console.log(`✅ تم تحديث اسم الشركة (2) في: ${filePath}`);
    }

    // حفظ الملف إذا تم التحديث
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`💾 تم حفظ الملف: ${filePath}`);
    } else {
      console.log(`ℹ️ لا توجد تحديثات مطلوبة في: ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ خطأ في تحديث الملف ${filePath}:`, error.message);
  }
}

// تشغيل التحديث
console.log('🚀 بدء تحديث معلومات الشركة...\n');

FILES_TO_UPDATE.forEach(file => {
  console.log(`\n📁 معالجة الملف: ${file}`);
  updateFile(file);
});

console.log('\n✅ تم الانتهاء من تحديث معلومات الشركة!');
console.log('\n📋 ملخص التحديثات:');
console.log(`- اسم الشركة: ${COMPANY_INFO.NEW_NAME_AR}`);
console.log(`- اسم الشركة (EN): ${COMPANY_INFO.NEW_NAME_EN}`);
console.log(`- رقم التواصل: ${COMPANY_INFO.NEW_PHONE}`);
