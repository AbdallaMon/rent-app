const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkReminderStatusDetailed() {
  try {
    console.log('🔍 فحص مفصل لحالة التذكيرات...\n');

    // 1. فحص إجمالي التذكيرات مع التفاصيل
    const allReminders = await prisma.whatsappMessageLog.findMany({
      where: {
        messageType: {
          in: ['payment_reminder', 'contract_expiry_reminder', 'maintenance_reminder']
        }
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      },
      orderBy: {
        sentAt: 'desc'
      },
      take: 20 // أول 20 فقط لتجنب الإفراط
    });

    console.log(`📊 عدد التذكيرات المفحوصة: ${allReminders.length}`);

    if (allReminders.length === 0) {
      console.log('❗ لا توجد تذكيرات في قاعدة البيانات!');
      
      // فحص الرسائل العادية
      const normalMessages = await prisma.whatsappMessageLog.count();
      console.log(`📱 إجمالي رسائل WhatsApp: ${normalMessages}`);
      
      if (normalMessages === 0) {
        console.log('❗ لا توجد رسائل WhatsApp على الإطلاق!');
        console.log('💡 الأسباب المحتملة:');
        console.log('  1. لم يتم تفعيل نظام WhatsApp');
        console.log('  2. لم يتم إرسال أي رسائل بعد');
        console.log('  3. مشكلة في الاتصال بقاعدة البيانات');
      }
      
      return;
    }

    // 2. تجميع حسب الحالة مع التفاصيل
    console.log('\n📈 تفاصيل الحالات:');
    
    const statusGroups = {};
    allReminders.forEach(reminder => {
      if (!statusGroups[reminder.status]) {
        statusGroups[reminder.status] = [];
      }
      statusGroups[reminder.status].push(reminder);
    });

    Object.entries(statusGroups).forEach(([status, reminders]) => {
      console.log(`\n${getStatusEmoji(status)} ${status.toUpperCase()} (${reminders.length}):`);
      
      reminders.slice(0, 3).forEach(reminder => {
        console.log(`  - ${reminder.recipient} | ${reminder.messageType} | ${new Date(reminder.sentAt).toLocaleString('ar-SA')}`);
        if (reminder.client) {
          console.log(`    عميل: ${reminder.client.name}`);
        } else {
          console.log(`    عميل: غير مربوط`);
        }
        
        // عرض metadata إذا كان فيه معلومات مفيدة
        if (reminder.metadata) {
          try {
            const meta = typeof reminder.metadata === 'string' ? 
              JSON.parse(reminder.metadata) : reminder.metadata;
            
            if (meta.error) {
              console.log(`    خطأ: ${meta.error}`);
            }
            if (meta.errorMessage) {
              console.log(`    رسالة الخطأ: ${meta.errorMessage}`);
            }
            if (meta.webhookResponse) {
              console.log(`    استجابة Webhook: ${JSON.stringify(meta.webhookResponse)}`);
            }
          } catch (e) {
            // تجاهل أخطاء parsing
          }
        }
      });
      
      if (reminders.length > 3) {
        console.log(`    ... و ${reminders.length - 3} آخرين`);
      }
    });

    // 3. فحص العملاء وأرقام الهواتف
    console.log('\n📱 فحص أرقام الهواتف:');
    
    const uniquePhones = [...new Set(allReminders.map(r => r.recipient))];
    console.log(`إجمالي الأرقام المختلفة: ${uniquePhones.length}`);
    
    const phoneFormats = {
      international_plus: 0,  // +971
      international_no_plus: 0,  // 971
      local: 0,  // 05
      other: 0
    };
    
    uniquePhones.forEach(phone => {
      if (phone.startsWith('+971')) {
        phoneFormats.international_plus++;
      } else if (phone.startsWith('971')) {
        phoneFormats.international_no_plus++;
      } else if (phone.startsWith('05') || phone.startsWith('0')) {
        phoneFormats.local++;
      } else {
        phoneFormats.other++;
      }
    });
    
    console.log('توزيع تنسيقات الأرقام:');
    console.log(`  +971: ${phoneFormats.international_plus}`);
    console.log(`  971: ${phoneFormats.international_no_plus}`);
    console.log(`  05x: ${phoneFormats.local}`);
    console.log(`  أخرى: ${phoneFormats.other}`);

    // 4. فحص التذكيرات اليوم
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const todayReminders = allReminders.filter(r => 
      new Date(r.sentAt) >= startOfDay
    );
    
    console.log(`\n📅 تذكيرات اليوم: ${todayReminders.length}`);
    
    if (todayReminders.length === 0) {
      console.log('❗ لم يتم إرسال أي تذكيرات اليوم!');
      console.log('💡 الأسباب المحتملة:');
      console.log('  1. التذكيرات التلقائية معطلة');
      console.log('  2. لا توجد تذكيرات مستحقة اليوم');
      console.log('  3. مشكلة في cron job');
    }

    // 5. فحص إعدادات النظام
    const settings = await prisma.reminderSettings.findFirst();
    console.log('\n⚙️ إعدادات التذكيرات:');
    
    if (!settings) {
      console.log('❗ لا توجد إعدادات للتذكيرات - هذا قد يكون السبب!');
      console.log('💡 الحل: إنشاء إعدادات افتراضية');
    } else {
      console.log(`التذكيرات التلقائية: ${settings.enableAutoReminders ? '✅ مفعلة' : '❌ معطلة'}`);
      console.log(`الأنواع المفعلة: ${settings.enabledReminderTypes?.join(', ') || '❌ غير محدد'}`);
      console.log(`النظام نشط: ${settings.isActive ? '✅ نعم' : '❌ لا'}`);
    }

    // 6. الخلاصة والتوصيات
    console.log('\n🎯 الخلاصة:');
    
    const totalFailed = statusGroups.failed?.length || 0;
    const totalPending = statusGroups.pending?.length || 0;
    const totalSuccess = (statusGroups.sent?.length || 0) + 
                        (statusGroups.delivered?.length || 0) + 
                        (statusGroups.read?.length || 0);
    
    console.log(`✅ ناجحة: ${totalSuccess}`);
    console.log(`⏳ معلقة: ${totalPending}`);
    console.log(`❌ فاشلة: ${totalFailed}`);
    
    const successRate = allReminders.length > 0 ? 
      ((totalSuccess / allReminders.length) * 100).toFixed(1) : 0;
    console.log(`📊 معدل النجاح: ${successRate}%`);

    console.log('\n💡 التوصيات:');
    
    if (totalFailed > 0) {
      console.log('  1. ✏️ راجع أرقام الهواتف الفاشلة');
    }
    
    if (totalPending > 0) {
      console.log('  2. 🔄 التذكيرات المعلقة تحتاج معالجة');
    }
    
    if (!settings?.enableAutoReminders) {
      console.log('  3. ⚡ فعّل التذكيرات التلقائية');
    }
    
    if (todayReminders.length === 0) {
      console.log('  4. 🤖 شغّل التذكيرات اليدوية:');
      console.log('     node scripts/automated-reminder-cron-job.js');
    }

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

function getStatusEmoji(status) {
  const emojis = {
    sent: '📤',
    delivered: '✅',
    read: '👁️',
    failed: '❌',
    pending: '⏳'
  };
  return emojis[status] || '❓';
}

checkReminderStatusDetailed();
