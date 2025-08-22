const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

console.log('🔍 تحليل شامل لنظام التذكيرات والإشعارات');
console.log('='.repeat(70));

async function analyzeRemindersSystem() {
  try {
    console.log('\n📊 1. فحص جداول قاعدة البيانات المتعلقة بالتذكيرات:');
    console.log('-'.repeat(50));
    
    // التحقق من الجداول الموجودة
    const tables = {
      rentAgreement: 'جدول عقود الإيجار',
      installment: 'جدول الأقساط',
      payment: 'جدول الدفعات', 
      whatsappMessageLog: 'سجل رسائل WhatsApp',
      whatsappIncomingMessage: 'الرسائل الواردة',
      whatsappConversation: 'المحادثات'
    };
    
    for (const [table, description] of Object.entries(tables)) {
      try {
        const count = await prisma[table].count();
        console.log(`✅ ${description}: ${count} سجل`);
      } catch (error) {
        console.log(`❌ ${description}: خطأ - ${error.message}`);
      }
    }
    
    console.log('\n📋 2. فحص عقود الإيجار القريبة من الانتهاء:');
    console.log('-'.repeat(50));
    
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const expiringContracts = await prisma.rentAgreement.findMany({
      where: {
        endDate: {
          gte: today,
          lte: thirtyDaysFromNow
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
    
    console.log(`📅 عدد العقود التي تنتهي خلال 30 يوم: ${expiringContracts.length}`);
    
    if (expiringContracts.length > 0) {
      console.log('\n📝 تفاصيل العقود المنتهية:');
      expiringContracts.forEach((contract, index) => {
        const daysLeft = Math.ceil((new Date(contract.endDate) - today) / (1000 * 60 * 60 * 24));
        const priority = daysLeft <= 7 ? '🔴 عالية' : daysLeft <= 15 ? '🟡 متوسطة' : '🟢 منخفضة';
        
        console.log(`   ${index + 1}. العقد #${contract.id}`);
        console.log(`      المستأجر: ${contract.renter.name}`);
        console.log(`      الهاتف: ${contract.renter.phone || 'غير محدد'}`);
        console.log(`      الوحدة: ${contract.unit.number} - ${contract.unit.property.name}`);
        console.log(`      تاريخ الانتهاء: ${contract.endDate.toLocaleDateString('ar')}`);
        console.log(`      الأيام المتبقية: ${daysLeft} يوم`);
        console.log(`      الأولوية: ${priority}`);
        console.log('');
      });
    }
    
    console.log('\n💰 3. فحص الدفعات المستحقة:');
    console.log('-'.repeat(50));
    
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(today.getDate() + 14);
    
    const duePayments = await prisma.payment.findMany({
      where: {
        dueDate: {
          gte: today,
          lte: twoWeeksFromNow
        },
        status: 'PENDING'
      },
      include: {
        client: true,
        property: true
      }
    });
    
    console.log(`💳 عدد الدفعات المستحقة خلال أسبوعين: ${duePayments.length}`);
    
    if (duePayments.length > 0) {
      console.log('\n📝 تفاصيل الدفعات المستحقة:');
      duePayments.forEach((payment, index) => {
        const daysLeft = Math.ceil((new Date(payment.dueDate) - today) / (1000 * 60 * 60 * 24));
        const priority = daysLeft <= 3 ? '🔴 عالية' : daysLeft <= 7 ? '🟡 متوسطة' : '🟢 منخفضة';
        
        console.log(`   ${index + 1}. الدفعة #${payment.id}`);
        console.log(`      العميل: ${payment.client?.name || 'غير محدد'}`);
        console.log(`      الهاتف: ${payment.client?.phone || 'غير محدد'}`);
        console.log(`      المبلغ: ${payment.amount} ريال`);
        console.log(`      تاريخ الاستحقاق: ${payment.dueDate.toLocaleDateString('ar')}`);
        console.log(`      الأيام المتبقية: ${daysLeft} يوم`);
        console.log(`      الأولوية: ${priority}`);
        console.log('');
      });
    }
    
    console.log('\n🛠️ 4. فحص طلبات الصيانة المعلقة:');
    console.log('-'.repeat(50));
    
    const pendingMaintenance = await prisma.maintenanceRequest.findMany({
      where: {
        status: {
          in: ['PENDING', 'IN_PROGRESS']
        }
      },
      include: {
        client: true,
        property: true,
        unit: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`🔧 عدد طلبات الصيانة المعلقة: ${pendingMaintenance.length}`);
    
    if (pendingMaintenance.length > 0) {
      console.log('\n📝 تفاصيل طلبات الصيانة:');
      pendingMaintenance.slice(0, 10).forEach((request, index) => {
        const daysOld = Math.floor((today - new Date(request.createdAt)) / (1000 * 60 * 60 * 24));
        const priority = daysOld >= 7 ? '🔴 عالية' : daysOld >= 3 ? '🟡 متوسطة' : '🟢 منخفضة';
          console.log(`   ${index + 1}. طلب #${request.id}`);
        console.log(`      العميل: ${request.client?.name || 'غير محدد'}`);
        console.log(`      الهاتف: ${request.client?.phone || 'غير محدد'}`);
        console.log(`      النوع: ${request.type}`);
        console.log(`      الحالة: ${request.status}`);
        console.log(`      العمر: ${daysOld} يوم`);
        console.log(`      الأولوية: ${priority}`);
        console.log('');
      });
    }
    
    console.log('\n📱 5. فحص سجل رسائل WhatsApp:');
    console.log('-'.repeat(50));
    
    const last7Days = new Date();
    last7Days.setDate(today.getDate() - 7);
    
    const whatsappLogs = await prisma.whatsappMessageLog.findMany({
      where: {
        sentAt: {
          gte: last7Days
        }
      },
      orderBy: {
        sentAt: 'desc'
      }
    });
    
    console.log(`📊 رسائل WhatsApp المرسلة آخر 7 أيام: ${whatsappLogs.length}`);
    
    // إحصائيات الرسائل
    const messageStats = {
      sent: whatsappLogs.filter(log => log.status === 'sent').length,
      delivered: whatsappLogs.filter(log => log.status === 'delivered').length,
      failed: whatsappLogs.filter(log => log.status === 'failed').length,
      reminders: whatsappLogs.filter(log => log.metadata?.type === 'reminder').length
    };
    
    console.log(`   ✅ مرسلة: ${messageStats.sent}`);
    console.log(`   📬 مستلمة: ${messageStats.delivered}`);
    console.log(`   ❌ فاشلة: ${messageStats.failed}`);
    console.log(`   ⏰ تذكيرات: ${messageStats.reminders}`);
    
    console.log('\n🔧 6. فحص مشاكل النظام المحتملة:');
    console.log('-'.repeat(50));
    
    const issues = [];
    
    // التحقق من العقود بدون هاتف
    const contractsWithoutPhone = expiringContracts.filter(c => !c.renter.phone);
    if (contractsWithoutPhone.length > 0) {
      issues.push(`⚠️  ${contractsWithoutPhone.length} عقد منتهي بدون رقم هاتف`);
    }
    
    // التحقق من الدفعات بدون عميل
    const paymentsWithoutClient = duePayments.filter(p => !p.client);
    if (paymentsWithoutClient.length > 0) {
      issues.push(`⚠️  ${paymentsWithoutClient.length} دفعة بدون عميل محدد`);
    }
    
    // التحقق من الرسائل الفاشلة
    if (messageStats.failed > 0) {
      issues.push(`⚠️  ${messageStats.failed} رسالة فاشلة آخر 7 أيام`);
    }
    
    // التحقق من طلبات الصيانة القديمة
    const oldMaintenance = pendingMaintenance.filter(r => {
      const daysOld = Math.floor((today - new Date(r.createdAt)) / (1000 * 60 * 60 * 24));
      return daysOld >= 7;
    });
    if (oldMaintenance.length > 0) {
      issues.push(`⚠️  ${oldMaintenance.length} طلب صيانة معلق أكثر من أسبوع`);
    }
    
    if (issues.length === 0) {
      console.log('✅ لا توجد مشاكل واضحة في النظام');
    } else {
      issues.forEach(issue => console.log(issue));
    }
    
    console.log('\n📈 7. توصيات تحسين النظام:');
    console.log('-'.repeat(50));
    
    const recommendations = [
      '✅ إضافة جدول خاص بالتذكيرات المجدولة (Scheduled Reminders)',
      '✅ إضافة حقل nextPaymentDate في جدول RentAgreement',
      '✅ إضافة حقل monthlyRent في جدول RentAgreement',
      '✅ إنشاء نظام cron jobs لإرسال التذكيرات التلقائية',
      '✅ إضافة إشعارات للإدارة عند فشل إرسال الرسائل',
      '✅ إضافة نظام إعادة المحاولة للرسائل الفاشلة',
      '✅ إضافة لوحة تحكم للتذكيرات والإحصائيات',
      '✅ إضافة نظام تصنيف الأولويات التلقائي'
    ];
    
    recommendations.forEach(rec => console.log(rec));
    
    console.log('\n🎯 8. الخلاصة والإجراءات المطلوبة:');
    console.log('-'.repeat(50));
    
    console.log('📊 إحصائيات النظام الحالي:');
    console.log(`   • عقود منتهية: ${expiringContracts.length}`);
    console.log(`   • دفعات مستحقة: ${duePayments.length}`);
    console.log(`   • طلبات صيانة معلقة: ${pendingMaintenance.length}`);
    console.log(`   • رسائل مرسلة (7 أيام): ${whatsappLogs.length}`);
    console.log(`   • مشاكل مكتشفة: ${issues.length}`);
    
    console.log('\n🚀 الإجراءات المطلوبة فوراً:');
    if (expiringContracts.filter(c => Math.ceil((new Date(c.endDate) - today) / (1000 * 60 * 60 * 24)) <= 7).length > 0) {
      console.log('   🔴 إرسال تذكيرات عاجلة للعقود المنتهية خلال أسبوع');
    }
    if (duePayments.filter(p => Math.ceil((new Date(p.dueDate) - today) / (1000 * 60 * 60 * 24)) <= 3).length > 0) {
      console.log('   🔴 إرسال تذكيرات دفع عاجلة للدفعات المستحقة خلال 3 أيام');
    }
    if (oldMaintenance.length > 0) {
      console.log('   🔴 متابعة طلبات الصيانة المعلقة أكثر من أسبوع');
    }
    
  } catch (error) {
    console.error('❌ خطأ في تحليل النظام:', error);
  }
}

// تشغيل التحليل
analyzeRemindersSystem()
  .then(() => {
    console.log('\n✅ انتهى التحليل الشامل للنظام!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ خطأ في التحليل:', error);
    process.exit(1);
  });
