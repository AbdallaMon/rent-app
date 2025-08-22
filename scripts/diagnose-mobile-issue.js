const fs = require('fs');
const path = require('path');

console.log('🔍 بدء تشخيص مشكلة عدم انعكاس التحديثات على الهاتف...');
console.log('⏰ الوقت:', new Date().toLocaleString('ar-EG'));
console.log('═══════════════════════════════════════════════════════════');

// 1. فحص ملفات المشروع الأساسية
console.log('1️⃣ فحص ملفات WhatsApp Bot...');
const criticalFiles = [
    'src/app/api/whatsapp/webhook/route.js',
    'src/app/whatsapp/dashboard/page.jsx',
    'package.json',
    'next.config.mjs'
];

let filesOk = 0;
criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
        filesOk++;
    } else {
        console.log(`❌ ${file} - مفقود`);
    }
});

console.log(`📊 نتيجة فحص الملفات: ${filesOk}/${criticalFiles.length}`);

// 2. فحص آخر تحديث Git
console.log('\n2️⃣ فحص آخر commits...');
const { execSync } = require('child_process');

try {
    const lastCommit = execSync('git log --oneline -1', { encoding: 'utf8' });
    console.log(`✅ آخر commit: ${lastCommit.trim()}`);
    
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    if (gitStatus.trim()) {
        console.log('⚠️  يوجد تغييرات غير محفوظة:');
        console.log(gitStatus);
    } else {
        console.log('✅ جميع التغييرات محفوظة');
    }
} catch (error) {
    console.log('❌ خطأ في فحص Git:', error.message);
}

// 3. فحص ملف الواجهة الرئيسية
console.log('\n3️⃣ فحص تحديثات WhatsApp Bot...');
const webhookFile = 'src/app/api/whatsapp/webhook/route.js';

if (fs.existsSync(webhookFile)) {
    const content = fs.readFileSync(webhookFile, 'utf8');
    
    // فحص الطلبات الجديدة
    const hasPaymentInquiry = content.includes('payment_inquiry');
    const hasContractRenewal = content.includes('contract_renewal');
    const hasHandlePaymentInquiry = content.includes('handlePaymentInquiry');
    const hasHandleContractRenewal = content.includes('handleContractRenewal');
    
    console.log(`${hasPaymentInquiry ? '✅' : '❌'} خيار استعلام الدفعات`);
    console.log(`${hasContractRenewal ? '✅' : '❌'} خيار تجديد العقد`);
    console.log(`${hasHandlePaymentInquiry ? '✅' : '❌'} معالج استعلام الدفعات`);
    console.log(`${hasHandleContractRenewal ? '✅' : '❌'} معالج تجديد العقد`);
    
    // فحص تحسينات التنسيق
    const hasFormattingFix = content.includes('displayId') && !content.includes('━━━━━━━━━━');
    console.log(`${hasFormattingFix ? '✅' : '❌'} تحسينات تنسيق الرسائل`);
    
    if (hasPaymentInquiry && hasContractRenewal && hasHandlePaymentInquiry && hasHandleContractRenewal && hasFormattingFix) {
        console.log('🎉 جميع التحديثات موجودة في الكود!');
    } else {
        console.log('⚠️  بعض التحديثات مفقودة في الكود');
    }
} else {
    console.log('❌ ملف webhook غير موجود');
}

// 4. اختبار محاكاة
console.log('\n4️⃣ محاكاة تفاعل WhatsApp...');
console.log('📱 محاكاة القائمة الرئيسية:');

// محاكاة دالة القائمة
const mockMainMenu = () => {
    return `📋 القائمة الرئيسية:
1. 🔧 طلب صيانة
2. 📝 تقديم شكوى  
3. 📊 حالة الطلبات
4. ☎️ الاتصال بالدعم
5. 💳 استعلام عن الدفعات
6. 📋 تجديد العقد

اختر رقم الخدمة المطلوبة 👆`;
};

console.log(mockMainMenu());

// 5. التوصيات
console.log('\n═══════════════════════════════════════════════════════════');
console.log('💡 التوصيات لحل المشكلة:');
console.log('');

if (filesOk === criticalFiles.length) {
    console.log('✅ الملفات الأساسية سليمة');
    console.log('🔄 جرب الحلول التالية بالترتيب:');
    console.log('');
    console.log('1️⃣ إعادة تشغيل الخادم:');
    console.log('   npm run dev');
    console.log('');
    console.log('2️⃣ مسح الكاش وإعادة البناء:');
    console.log('   rm -rf .next && npm run build && npm run dev');
    console.log('');
    console.log('3️⃣ فرض إعادة النشر على Vercel:');
    console.log('   git commit --allow-empty -m "force redeploy"');
    console.log('   git push origin main');
    console.log('');
    console.log('4️⃣ اختبار مباشر بإرسال رسالة للبوت:');
    console.log('   أرسل "اختبار" أو "test" للبوت');
} else {
    console.log('❌ يوجد ملفات مفقودة - راجع التثبيت أولاً');
}

console.log('');
console.log('📞 للاختبار: أرسل رسالة للبوت وتحقق من ظهور 6 خيارات');
console.log('🎯 إذا ظهرت 6 خيارات = التحديث يعمل ✅');
console.log('🎯 إذا ظهرت 4 خيارات = التحديث لم ينعكس ❌');
console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('✅ انتهى التشخيص');
