/**
 * اختبار مفصل لتشخيص مشكلة اختيار اللغة
 */

const axios = require('axios');

console.log('🔍 تشخيص مشكلة اختيار اللغة...\n');

const testLanguageSelection = async () => {
  // اختبار 1: محاكاة "مرحبا"
  console.log('1️⃣ إرسال "مرحبا" لبدء المحادثة...');
  
  const greetingPayload = {
    object: 'whatsapp_business_account',
    entry: [{
      id: 'test-greeting-detailed',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: {
            display_phone_number: '971506111139',
            phone_number_id: '600619643130496'
          },
          messages: [{
            from: '971506111139',
            id: 'greeting-detailed-' + Date.now(),
            timestamp: Math.floor(Date.now() / 1000).toString(),
            type: 'text',
            text: { body: 'مرحبا' }
          }]
        },
        field: 'messages'
      }]
    }]
  };
  
  try {
    const response1 = await axios.post(
      'https://tarwhats.vercel.app/api/notifications/whatsapp/webhook',
      greetingPayload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );
    
    console.log('✅ استجابة "مرحبا":');
    console.log('📄 Status:', response1.status);
    console.log('📄 Response:', response1.data);
    
    // انتظار 5 ثوان
    console.log('\n⏳ انتظار 5 ثوان قبل اختيار اللغة...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // اختبار 2: محاكاة اختيار "العربية"
    console.log('\n2️⃣ إرسال "العربية" لاختيار اللغة...');
    
    const languagePayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'test-language-detailed',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '971506111139',
              phone_number_id: '600619643130496'
            },
            messages: [{
              from: '971506111139',
              id: 'language-detailed-' + Date.now(),
              timestamp: Math.floor(Date.now() / 1000).toString(),
              type: 'text',
              text: { body: 'العربية' }
            }]
          },
          field: 'messages'
        }]
      }]
    };
    
    const response2 = await axios.post(
      'https://tarwhats.vercel.app/api/notifications/whatsapp/webhook',
      languagePayload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );
    
    console.log('✅ استجابة "العربية":');
    console.log('📄 Status:', response2.status);
    console.log('📄 Response:', response2.data);
    
    console.log('\n🎯 النتيجة المتوقعة:');
    console.log('- بعد "مرحبا" → رسالة اختيار اللغة');
    console.log('- بعد "العربية" → قائمة تفاعلية (وليس رسالة تأكيد طلب صيانة!)');
    
    console.log('\n📱 تحقق من WhatsApp لرؤية النتيجة!');
    console.log('⚠️ إذا ظهرت رسالة تأكيد طلب صيانة، فالمشكلة لا تزال موجودة');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.response?.data || error.message);
  }
};

testLanguageSelection();
