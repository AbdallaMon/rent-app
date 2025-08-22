/*
 * ========================================
 * COMPARE PAYMENT LOGIC BETWEEN FILES
 * ========================================
 * 
 * مقارنة منطق الدفعات بين الملفين
 */

const fs = require('fs');

function extractPaymentFunction(content) {
  // البحث عن دالة handlePaymentInquiry
  const functionStart = content.indexOf('async function handlePaymentInquiry');
  if (functionStart === -1) {
    return null;
  }
  
  // البحث عن نهاية الدالة
  let braceCount = 0;
  let i = functionStart;
  let functionStarted = false;
  
  while (i < content.length) {
    if (content[i] === '{') {
      braceCount++;
      functionStarted = true;
    } else if (content[i] === '}') {
      braceCount--;
      if (functionStarted && braceCount === 0) {
        return content.substring(functionStart, i + 1);
      }
    }
    i++;
  }
  
  return null;
}

function analyzePaymentLogic() {
  console.log('🔍 مقارنة منطق الدفعات بين الملفين...\n');
  
  const files = [
    {
      path: 'src/app/api/whatsapp/webhook/route.js',
      name: 'whatsapp (غير مستخدم)'
    },
    {
      path: 'src/app/api/notifications/whatsapp/webhook/route.js',
      name: 'notifications (مستخدم)'
    }
  ];
  
  const paymentFunctions = {};
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file.path, 'utf8');
      const paymentFunction = extractPaymentFunction(content);
      
      if (paymentFunction) {
        paymentFunctions[file.name] = {
          function: paymentFunction,
          length: paymentFunction.length,
          content
        };
        
        console.log(`✅ ${file.name}:`);
        console.log(`   📏 طول دالة الدفعات: ${paymentFunction.length} حرف`);
        console.log(`   📄 إجمالي طول الملف: ${content.length} حرف`);
        
        // فحص السطور المهمة في دالة الدفعات
        const hasCorrectQuery = paymentFunction.includes('rentAgreement: { renterId: client.id }');
        const hasStatusFilter = paymentFunction.includes("status: { in: ['PENDING', 'OVERDUE'] }");
        const hasPropertyInclude = paymentFunction.includes('property: { select: { name: true } }');
        
        console.log(`   🔍 استعلام صحيح: ${hasCorrectQuery ? '✅' : '❌'}`);
        console.log(`   📊 فلترة الحالة: ${hasStatusFilter ? '✅' : '❌'}`);
        console.log(`   🏠 تضمين العقار: ${hasPropertyInclude ? '✅' : '❌'}`);
        
      } else {
        console.log(`❌ ${file.name}: لا توجد دالة handlePaymentInquiry`);
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`❌ خطأ في قراءة ${file.name}: ${error.message}\n`);
    }
  });
  
  // مقارنة الدوال
  const functionNames = Object.keys(paymentFunctions);
  if (functionNames.length === 2) {
    console.log('═'.repeat(50));
    console.log('🔄 مقارنة الدوال:');
    
    const func1 = paymentFunctions[functionNames[0]];
    const func2 = paymentFunctions[functionNames[1]];
    
    if (func1.function === func2.function) {
      console.log('✅ الدوال متطابقة تماماً');
    } else {
      console.log('⚠️ الدوال مختلفة');
      console.log(`📏 الفرق في الطول: ${Math.abs(func1.length - func2.length)} حرف`);
      
      // فحص الاختلافات الأساسية
      const differences = [];
      
      if (func1.function.includes('payment_inquiry') !== func2.function.includes('payment_inquiry')) {
        differences.push('معالجة payment_inquiry');
      }
      
      if (func1.function.includes('PENDING') !== func2.function.includes('PENDING')) {
        differences.push('فلترة PENDING');
      }
      
      if (differences.length > 0) {
        console.log('🔍 الاختلافات الرئيسية:');
        differences.forEach(diff => console.log(`   - ${diff}`));
      }
    }
  }
  
  console.log('\n🎯 التوصية:');
  console.log('1. الملف المستخدم فعلياً: src/app/api/notifications/whatsapp/webhook/route.js');
  console.log('2. تأكد من أن هذا الملف يحتوي على آخر إصدار من منطق الدفعات');
  console.log('3. في حالة وجود اختلافات، انسخ المنطق الصحيح إلى الملف المستخدم');
}

analyzePaymentLogic();
