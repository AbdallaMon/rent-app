const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

console.log('🚨 إرسال التذكيرات العاجلة');
console.log('='.repeat(50));

async function sendUrgentReminders() {
  try {
    const today = new Date();
    
    // 1. إرسال تذكيرات العقود العاجلة
    console.log('\n📋 1. إرسال تذكيرات العقود العاجلة:');
    console.log('-'.repeat(30));
    
    const urgentContracts = await prisma.rentAgreement.findMany({
      where: {
        endDate: {
          gte: today,
          lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) // خلال 7 أيام
        },
        status: 'ACTIVE'
      },
      include: {
        renter: true,
        unit: {
          include: {
            property: true
          }
        }
      }
    });
    
    for (const contract of urgentContracts) {
      const daysLeft = Math.ceil((new Date(contract.endDate) - today) / (1000 * 60 * 60 * 24));
      
      if (contract.renter.phone) {
        const message = `🏠 تذكير هام من شركة تار العقارية

مرحباً ${contract.renter.name}،

نحيطكم علماً بأن عقد إيجار الوحدة ${contract.unit.number} في ${contract.unit.property.name} سينتهي خلال ${daysLeft} يوم بتاريخ ${contract.endDate.toLocaleDateString('ar')}.

يرجى التواصل معنا لتجديد العقد أو ترتيب إجراءات التسليم.

شركة تار العقارية
📱 +971507935566`;

        console.log(`📞 إرسال تذكير للعقد #${contract.id}:`);
        console.log(`   المستأجر: ${contract.renter.name}`);
        console.log(`   الهاتف: ${contract.renter.phone}`);
        console.log(`   الأيام المتبقية: ${daysLeft}`);
        
        // هنا يتم الإرسال الفعلي
        // await sendWhatsAppMessage(contract.renter.phone, message);
        console.log(`   ✅ تم إعداد الرسالة للإرسال`);
      } else {
        console.log(`❌ العقد #${contract.id} - لا يوجد رقم هاتف`);
      }
    }
    
    // 2. إرسال تذكيرات الدفعات العاجلة
    console.log('\n💰 2. إرسال تذكيرات الدفعات العاجلة:');
    console.log('-'.repeat(30));
    
    const urgentPayments = await prisma.payment.findMany({
      where: {
        dueDate: {
          gte: today,
          lte: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000) // خلال 3 أيام
        },
        status: 'PENDING'
      },
      include: {
        client: true,
        property: true
      }
    });
    
    for (const payment of urgentPayments) {
      const daysLeft = Math.ceil((new Date(payment.dueDate) - today) / (1000 * 60 * 60 * 24));
      
      if (payment.client?.phone) {
        const message = `💰 تذكير بموعد دفعة من شركة تار العقارية

مرحباً ${payment.client.name}،

نذكركم بأن لديكم دفعة مستحقة خلال ${daysLeft} يوم:

💵 المبلغ: ${payment.amount.toLocaleString()} درهم
📅 تاريخ الاستحقاق: ${payment.dueDate.toLocaleDateString('ar')}
🏢 العقار: ${payment.property?.name || 'غير محدد'}

يرجى ترتيب عملية الدفع في الموعد المحدد.

شركة تار العقارية
📱 +971507935566`;

        console.log(`📞 إرسال تذكير للدفعة #${payment.id}:`);
        console.log(`   العميل: ${payment.client.name}`);
        console.log(`   الهاتف: ${payment.client.phone}`);
        console.log(`   المبلغ: ${payment.amount.toLocaleString()} درهم`);
        console.log(`   الأيام المتبقية: ${daysLeft}`);
        
        // هنا يتم الإرسال الفعلي
        // await sendWhatsAppMessage(payment.client.phone, message);
        console.log(`   ✅ تم إعداد الرسالة للإرسال`);
      } else {
        console.log(`❌ الدفعة #${payment.id} - لا يوجد عميل أو رقم هاتف`);
      }
    }
    
    // 3. فحص الرسائل الفاشلة
    console.log('\n📱 3. فحص الرسائل الفاشلة:');
    console.log('-'.repeat(30));
    
    const last7Days = new Date();
    last7Days.setDate(today.getDate() - 7);
    
    const failedMessages = await prisma.whatsappMessageLog.findMany({
      where: {
        status: 'failed',
        sentAt: {
          gte: last7Days
        }
      },
      orderBy: {
        sentAt: 'desc'
      }
    });
    
    console.log(`📊 عدد الرسائل الفاشلة آخر 7 أيام: ${failedMessages.length}`);
    
    if (failedMessages.length > 0) {
      console.log('\n📝 تفاصيل الرسائل الفاشلة:');
      failedMessages.forEach((msg, index) => {
        console.log(`   ${index + 1}. ID: ${msg.id}`);
        console.log(`      المستقبل: ${msg.recipient}`);
        console.log(`      النوع: ${msg.messageType}`);
        console.log(`      وقت الإرسال: ${msg.sentAt.toLocaleString('ar')}`);
        console.log(`      البيانات: ${JSON.stringify(msg.metadata, null, 2)}`);
        console.log('');
      });
      
      console.log('🔄 يُنصح بإعادة إرسال الرسائل الفاشلة يدوياً');
    }
    
    // 4. إحصائيات عامة
    console.log('\n📊 4. إحصائيات النظام:');
    console.log('-'.repeat(30));
    
    console.log(`📋 العقود العاجلة: ${urgentContracts.length}`);
    console.log(`💰 الدفعات العاجلة: ${urgentPayments.length}`);
    console.log(`❌ الرسائل الفاشلة: ${failedMessages.length}`);
    
    const totalReminders = urgentContracts.filter(c => c.renter.phone).length + 
                          urgentPayments.filter(p => p.client?.phone).length;
    
    console.log(`📱 إجمالي التذكيرات المُعدة للإرسال: ${totalReminders}`);
    
    // 5. نصائح للتحسين
    console.log('\n💡 5. نصائح للتحسين:');
    console.log('-'.repeat(30));
    
    const contractsWithoutPhone = urgentContracts.filter(c => !c.renter.phone);
    const paymentsWithoutClient = urgentPayments.filter(p => !p.client?.phone);
    
    if (contractsWithoutPhone.length > 0) {
      console.log(`⚠️  ${contractsWithoutPhone.length} عقد عاجل بدون رقم هاتف - يحتاج تحديث`);
    }
    
    if (paymentsWithoutClient.length > 0) {
      console.log(`⚠️  ${paymentsWithoutClient.length} دفعة عاجلة بدون عميل/هاتف - يحتاج تحديث`);
    }
    
    if (failedMessages.length > 0) {
      console.log(`⚠️  ${failedMessages.length} رسالة فاشلة تحتاج إعادة إرسال`);
    }
    
    console.log('\n🚀 ملاحظة: لإرسال الرسائل فعلياً، قم بإلغاء التعليق عن أكواد sendWhatsAppMessage');
    
  } catch (error) {
    console.error('❌ خطأ في إرسال التذكيرات:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل إرسال التذكيرات العاجلة
sendUrgentReminders()
  .then(() => {
    console.log('\n✅ انتهى إرسال التذكيرات العاجلة!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ خطأ في العملية:', error);
    process.exit(1);
  });
