const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deepMessageDiagnostic() {
  console.log('🔍 بدء التحقيق الشامل لمشكلة عدم وصول رسائل خدمة العملاء...\n');
  
  try {
    // 1. فحص أرقام الفريق الحالية
    console.log('1️⃣ فحص أرقام الفريق:');
    const settings = await prisma.whatsAppTeamSettings.findFirst({
      where: { id: 'default_team_settings' }
    });
    console.log('   🔧 رقم الفني:', settings?.technicianPhone || 'غير محدد');
    console.log('   📞 رقم خدمة العملاء:', settings?.customerServicePhone || 'غير محدد');
    console.log('   🔄 إشعارات الصيانة مفعلة:', settings?.notifyTechnicianForMaintenance);
    console.log('   📝 إشعارات الشكاوى مفعلة:', settings?.notifyCustomerServiceForComplaints);
    console.log('');
      // 2. فحص آخر الرسائل المرسلة
    console.log('2️⃣ فحص آخر 20 رسالة:');
    const messages = await prisma.whatsappMessageLog.findMany({
      orderBy: { sentAt: 'desc' },
      take: 20,
      select: {
        id: true,
        recipient: true,
        messageType: true,
        status: true,
        sentAt: true,
        messageId: true,
        metadata: true
      }
    });
      // تجميع الرسائل حسب الرقم
    const messagesByPhone = {};
    messages.forEach(msg => {
      if (!messagesByPhone[msg.recipient]) {
        messagesByPhone[msg.recipient] = [];
      }
      messagesByPhone[msg.recipient].push(msg);
    });
    
    // عرض الإحصائيات
    Object.keys(messagesByPhone).forEach(phone => {
      const msgs = messagesByPhone[phone];
      const sentCount = msgs.filter(m => m.status === 'sent').length;
      const failedCount = msgs.filter(m => m.status === 'failed').length;
      
      console.log(`   📱 ${phone}:`);
      console.log(`      الإجمالي: ${msgs.length}, نجح: ${sentCount}, فشل: ${failedCount}`);
      
      // عرض أحدث رسالة
      const latest = msgs[0];
      console.log(`      آخر رسالة: ${latest.messageType} - ${latest.status} (${latest.sentAt.toLocaleString('ar-AE')})`);
      
      if (latest.messageId) {
        console.log(`      معرف الرسالة: ${latest.messageId}`);
      }
      
      if (latest.metadata && typeof latest.metadata === 'object' && latest.metadata.error) {
        console.log(`      ❌ خطأ: ${latest.metadata.error}`);
      }
      console.log('');
    });
    
    // 3. فحص متغيرات البيئة
    console.log('3️⃣ فحص متغيرات البيئة:');
    const hasToken = !!process.env.WHATSAPP_BUSINESS_API_TOKEN;
    const hasPhoneId = !!process.env.WHATSAPP_PHONE_NUMBER_ID;
    console.log('   🔑 WHATSAPP_BUSINESS_API_TOKEN:', hasToken ? 'موجود' : '❌ مفقود');
    console.log('   📱 WHATSAPP_PHONE_NUMBER_ID:', hasPhoneId ? 'موجود' : '❌ مفقود');
    
    if (hasPhoneId) {
      console.log('   📱 رقم الهاتف المُرسل:', process.env.WHATSAPP_PHONE_NUMBER_ID);
    }
    console.log('');
      // 4. فحص الرسائل الفاشلة
    console.log('4️⃣ فحص الرسائل الفاشلة:');
    const failedMessages = await prisma.whatsappMessageLog.findMany({
      where: { status: 'failed' },
      orderBy: { sentAt: 'desc' },
      take: 10,
      select: {
        recipient: true,
        messageType: true,
        metadata: true,
        sentAt: true
      }
    });
    
    if (failedMessages.length === 0) {
      console.log('   ✅ لا توجد رسائل فاشلة مؤخراً');
    } else {
      failedMessages.forEach((msg, i) => {
        console.log(`   ${i+1}. ${msg.recipient} - ${msg.messageType} (${msg.sentAt.toLocaleString('ar-AE')})`);
        if (msg.metadata && typeof msg.metadata === 'object' && msg.metadata.error) {
          console.log(`      ❌ ${msg.metadata.error}`);
        }
      });
    }
    console.log('');
    
    // 5. اختبار بسيط لخدمة العملاء
    console.log('5️⃣ اختبار مباشر لخدمة العملاء:');
    
    if (!hasToken || !hasPhoneId) {
      console.log('   ❌ لا يمكن إجراء الاختبار - متغيرات البيئة مفقودة');
    } else {
      const customerPhone = settings?.customerServicePhone;
      if (!customerPhone) {
        console.log('   ❌ رقم خدمة العملاء غير محدد');
      } else {
        console.log(`   📞 اختبار إرسال لـ: ${customerPhone}`);
        
        const testMessage = `🧪 اختبار تشخيصي شامل
        
📅 الوقت: ${new Date().toLocaleString('ar-AE')}
🔍 الغرض: تشخيص مشكلة عدم وصول الرسائل
⚠️ هذه رسالة اختبار - يرجى الرد بـ "وصلت" إذا استلمتها`;

        try {
          const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
          
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.WHATSAPP_BUSINESS_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: customerPhone,
              type: "text",
              text: { body: testMessage }
            })
          });

          const result = await response.json();
          
          if (response.ok) {
            console.log('   ✅ تم إرسال رسالة الاختبار بنجاح');
            console.log(`   📋 معرف الرسالة: ${result.messages[0].id}`);
            console.log(`   📊 استجابة الخادم: ${response.status}`);
          } else {
            console.log('   ❌ فشل إرسال رسالة الاختبار');
            console.log(`   📄 الخطأ: ${JSON.stringify(result, null, 2)}`);
          }
          
        } catch (error) {
          console.log('   ❌ خطأ في الاختبار:', error.message);
        }
      }
    }
    
    console.log('\n🏁 انتهى التحقيق الشامل');
    
  } catch (error) {
    console.error('❌ خطأ في التحقيق:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deepMessageDiagnostic();
