const fs = require('fs');

function analyzeWebhookRouting() {
  console.log('🔍 تحليل routing الـ webhook...\n');
  
  // 1. فحص vercel.json
  try {
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    console.log('📋 إعدادات Vercel:');
    console.log(JSON.stringify(vercelConfig.functions, null, 2));
    
    if (vercelConfig.rewrites) {
      console.log('\n🔄 إعدادات الـ rewrites:');
      console.log(JSON.stringify(vercelConfig.rewrites, null, 2));
    }
  } catch (error) {
    console.log('❌ خطأ في قراءة vercel.json:', error.message);
  }
  
  console.log('\n' + '═'.repeat(50));
  
  // 2. فحص Next.js structure
  console.log('📁 بنية مجلدات API:');
  const apiPaths = [
    'src/app/api/whatsapp/webhook',
    'src/app/api/notifications/whatsapp/webhook'
  ];
  
  for (const path of apiPaths) {
    if (fs.existsSync(path)) {
      console.log(`✅ ${path}/`);
      const files = fs.readdirSync(path);
      files.forEach(file => {
        console.log(`   📄 ${file}`);
      });
    } else {
      console.log(`❌ ${path}/ (غير موجود)`);
    }
  }
  
  console.log('\n' + '═'.repeat(50));
  
  // 3. تحليل الـ URLs المحتملة
  console.log('🌐 الـ URLs المحتملة:');
  const baseUrl = 'https://tar-ad.vercel.app';
  const webhookPaths = [
    '/api/whatsapp/webhook',
    '/api/notifications/whatsapp/webhook'
  ];
  
  webhookPaths.forEach(path => {
    console.log(`🔗 ${baseUrl}${path}`);
  });
  
  console.log('\n' + '═'.repeat(50));
  
  // 4. فحص محتوى الملفات للتأكد من منطق الدفعات
  console.log('💳 فحص منطق الدفعات في الملفات:');
  
  const webhookFiles = [
    'src/app/api/whatsapp/webhook/route.js',
    'src/app/api/notifications/whatsapp/webhook/route.js'
  ];
  
  webhookFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // فحص النسخة والتاريخ
      const versionMatch = content.match(/VERSION: (.+)/);
      const version = versionMatch ? versionMatch[1] : 'غير محدد';
      
      // فحص وجود دالة الدفعات
      const hasPaymentInquiry = content.includes('handlePaymentInquiry');
      const hasPaymentCase = content.includes('payment_inquiry');
      
      // فحص آخر تعديل
      const stats = fs.statSync(file);
      
      console.log(`📄 ${file}:`);
      console.log(`   📌 النسخة: ${version}`);
      console.log(`   🕒 آخر تعديل: ${stats.mtime.toLocaleString()}`);
      console.log(`   💳 دالة handlePaymentInquiry: ${hasPaymentInquiry ? '✅' : '❌'}`);
      console.log(`   🔍 معالجة payment_inquiry: ${hasPaymentCase ? '✅' : '❌'}`);
      console.log('');
    }
  });
  
  console.log('🎯 التوصيات:');
  console.log('1. تحقق من إعدادات واتساب للتأكد من الـ webhook URL');
  console.log('2. الملف الصحيح حسب Vercel: src/app/api/notifications/whatsapp/webhook/route.js');
  console.log('3. في حالة استخدام ملف آخر، قم بنسخ منطق الدفعات');
}

analyzeWebhookRouting();
