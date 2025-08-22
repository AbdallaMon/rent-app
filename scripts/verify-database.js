// Verify data saved in database after WhatsApp bot test
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDatabaseData() {
  try {
    console.log('🔍 التحقق من البيانات المحفوظة في قاعدة البيانات...\n');
    
    // Find the test client
    const client = await prisma.client.findFirst({
      where: {
        phone: {
          contains: '501234567'
        }
      }
    });
    
    if (!client) {
      console.log('❌ العميل غير موجود في قاعدة البيانات');
      return;
    }
    
    console.log('✅ العميل موجود:');
    console.log(`   الاسم: ${client.name}`);
    console.log(`   الهاتف: ${client.phone}`);
    console.log(`   ID: ${client.id}\n`);
    
    // Check maintenance requests
    const maintenanceRequests = await prisma.maintenanceRequest.findMany({
      where: {
        clientId: client.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('🔧 طلبات الصيانة:');
    if (maintenanceRequests.length === 0) {
      console.log('   ❌ لا توجد طلبات صيانة محفوظة');
    } else {
      maintenanceRequests.forEach((request, index) => {
        console.log(`   ${index + 1}. طلب #${request.id}`);
        console.log(`      النوع: ${request.type || 'غير محدد'}`);
        console.log(`      الأولوية: ${request.priority || 'غير محدد'}`);
        console.log(`      الوصف: ${request.description}`);
        console.log(`      الحالة: ${request.status}`);
        console.log(`      تاريخ الإنشاء: ${request.createdAt}`);
        console.log('');
      });
    }
    
    // Check complaints
    const complaints = await prisma.complaint.findMany({
      where: {
        clientId: client.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('📝 الشكاوى:');
    if (complaints.length === 0) {
      console.log('   ❌ لا توجد شكاوى محفوظة');
    } else {
      complaints.forEach((complaint, index) => {
        console.log(`   ${index + 1}. شكوى #${complaint.id}`);
        console.log(`      الفئة: ${complaint.category || 'غير محدد'}`);
        console.log(`      الوصف: ${complaint.description}`);
        console.log(`      الحالة: ${complaint.status}`);
        console.log(`      تاريخ الإنشاء: ${complaint.createdAt}`);
        console.log('');
      });
    }
      // Check WhatsApp messages log
    const whatsappMessages = await prisma.whatsappMessageLog.findMany({
      where: {
        clientId: client.id
      },
      orderBy: {
        sentAt: 'desc'
      },
      take: 5
    });
    
    console.log('💬 سجل رسائل واتساب (آخر 5 رسائل):');
    if (whatsappMessages.length === 0) {
      console.log('   ❌ لا توجد رسائل واتساب محفوظة');
    } else {
      whatsappMessages.forEach((message, index) => {
        console.log(`   ${index + 1}. رسالة #${message.id}`);
        console.log(`      النوع: ${message.messageType}`);
        console.log(`      الحالة: ${message.status}`);
        console.log(`      تاريخ الإرسال: ${message.sentAt}`);
        console.log('');
      });
    }
    
    console.log('📊 الإحصائيات النهائية:');
    console.log(`   عدد طلبات الصيانة: ${maintenanceRequests.length}`);
    console.log(`   عدد الشكاوى: ${complaints.length}`);
    console.log(`   عدد رسائل واتساب: ${whatsappMessages.length}`);
    
  } catch (error) {
    console.error('❌ خطأ في التحقق من البيانات:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyDatabaseData();
