const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function validateDashboardData() {
  console.log('✅ فحص صحة البيانات للوحة التحكم...\n');

  try {
    // 1. فحص إعدادات التذكيرات
    console.log('🔔 فحص إعدادات التذكيرات:');
    try {
      const reminderSettings = await prisma.reminderSettings.findMany();
      console.log(`   📊 عدد الإعدادات: ${reminderSettings.length}`);
      
      if (reminderSettings.length > 0) {
        console.log('   📋 الإعدادات الموجودة:');
        reminderSettings.forEach((setting, index) => {
          console.log(`     ${index + 1}. نوع: ${setting.reminderType}, أيام: ${setting.daysBeforeDue}, نشط: ${setting.isActive ? 'نعم' : 'لا'}`);
        });
      } else {
        console.log('   ⚠️  لا توجد إعدادات تذكيرات');
      }
    } catch (error) {
      console.log(`   ❌ خطأ في جلب إعدادات التذكيرات: ${error.message}`);
    }

    console.log('\n' + '-'.repeat(50));

    // 2. فحص رسائل واتساب
    console.log('\n📱 فحص رسائل واتساب:');
    try {
      const whatsappMessages = await prisma.whatsappMessageLog.findMany({
        take: 5,
        orderBy: { sentAt: 'desc' }
      });
      console.log(`   📊 عدد الرسائل: ${whatsappMessages.length}`);
      
      if (whatsappMessages.length > 0) {
        console.log('   📋 آخر الرسائل:');
        whatsappMessages.forEach((msg, index) => {
          const metadata = typeof msg.metadata === 'string' ? msg.metadata.substring(0, 30) + '...' : msg.metadata;
          console.log(`     ${index + 1}. للعميل: ${msg.clientId || 'غير محدد'}, نوع: ${msg.messageType}, تاريخ: ${msg.sentAt ? msg.sentAt.toLocaleDateString() : 'غير محدد'}`);
        });
      } else {
        console.log('   ⚠️  لا توجد رسائل واتساب');
      }
    } catch (error) {
      console.log(`   ❌ خطأ في جلب رسائل واتساب: ${error.message}`);
    }

    console.log('\n' + '-'.repeat(50));

    // 3. فحص الشكاوى
    console.log('\n📢 فحص الشكاوى:');
    try {
      const complaints = await prisma.complaint.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      });
      console.log(`   📊 عدد الشكاوى: ${complaints.length}`);
      
      if (complaints.length > 0) {
        console.log('   📋 آخر الشكاوى:');
        complaints.forEach((complaint, index) => {
          console.log(`     ${index + 1}. عنوان: ${complaint.title}, حالة: ${complaint.status}, تاريخ: ${complaint.createdAt ? complaint.createdAt.toLocaleDateString() : 'غير محدد'}`);
        });
      } else {
        console.log('   ⚠️  لا توجد شكاوى');
      }
    } catch (error) {
      console.log(`   ❌ خطأ في جلب الشكاوى: ${error.message}`);
    }

    console.log('\n' + '-'.repeat(50));

    // 4. فحص طلبات الصيانة
    console.log('\n🔧 فحص طلبات الصيانة:');
    try {
      const maintenanceRequests = await prisma.maintenanceRequest.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      });
      console.log(`   📊 عدد طلبات الصيانة: ${maintenanceRequests.length}`);
      
      if (maintenanceRequests.length > 0) {
        console.log('   📋 آخر طلبات الصيانة:');
        maintenanceRequests.forEach((request, index) => {
          console.log(`     ${index + 1}. عنوان: ${request.title}, حالة: ${request.status}, أولوية: ${request.priority}, تاريخ: ${request.createdAt ? request.createdAt.toLocaleDateString() : 'غير محدد'}`);
        });
      } else {
        console.log('   ⚠️  لا توجد طلبات صيانة');
      }
    } catch (error) {
      console.log(`   ❌ خطأ في جلب طلبات الصيانة: ${error.message}`);
    }

    console.log('\n' + '-'.repeat(50));

    // 5. فحص العملاء
    console.log('\n👥 فحص العملاء:');
    try {
      const clients = await prisma.client.findMany({
        take: 3
      });
      console.log(`   📊 عدد العملاء: ${clients.length}`);
      
      if (clients.length > 0) {
        console.log('   📋 بعض العملاء:');
        clients.forEach((client, index) => {
          console.log(`     ${index + 1}. اسم: ${client.name || 'غير محدد'}, هاتف: ${client.phoneNumber || 'غير محدد'}, ايميل: ${client.email || 'غير محدد'}`);
        });
      } else {
        console.log('   ⚠️  لا يوجد عملاء');
      }
    } catch (error) {
      console.log(`   ❌ خطأ في جلب العملاء: ${error.message}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ انتهى فحص صحة البيانات');

  } catch (error) {
    console.error('❌ خطأ عام في فحص البيانات:', error);
  } finally {
    await prisma.$disconnect();
  }
}

validateDashboardData().catch(console.error);
