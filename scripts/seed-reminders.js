const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedReminders() {
  try {
    console.log('إنشاء بيانات تجريبية للتذكيرات...');

    // إنشاء رسائل تذكيرات تجريبية في جدول WhatsappMessageLog
    const reminders = [
      {
        messageId: `reminder_${Date.now()}_1`,
        recipient: '+971501234567',
        messageType: 'payment_reminder',
        status: 'delivered',
        sentAt: new Date(),
        metadata: {
          reminderType: 'payment',
          amount: 5000,
          dueDate: '2025-06-25'
        }
      },
      {
        messageId: `reminder_${Date.now()}_2`,
        recipient: '+971509876543',
        messageType: 'maintenance_reminder',
        status: 'sent',
        sentAt: new Date(),
        metadata: {
          reminderType: 'maintenance',
          appointmentDate: '2025-06-23'
        }
      },
      {
        messageId: `reminder_${Date.now()}_3`,
        recipient: '+971556789012',
        messageType: 'contract_expiry_reminder',
        status: 'delivered',
        sentAt: new Date(),
        metadata: {
          reminderType: 'contract',
          expiryDate: '2025-07-15'
        }
      },
      {
        messageId: `reminder_${Date.now()}_4`,
        recipient: '+971504567890',
        messageType: 'payment_reminder',
        status: 'failed',
        sentAt: new Date(),
        metadata: {
          reminderType: 'payment',
          amount: 3500,
          dueDate: '2025-06-20'
        }
      },
      {
        messageId: `reminder_${Date.now()}_5`,
        recipient: '+971551234567',
        messageType: 'maintenance_reminder',
        status: 'read',
        sentAt: new Date(),
        metadata: {
          reminderType: 'maintenance',
          appointmentDate: '2025-06-24'
        }
      }
    ];

    // إدخال البيانات
    for (const reminder of reminders) {
      await prisma.whatsappMessageLog.create({
        data: reminder
      });
      console.log(`✅ تم إنشاء تذكير: ${reminder.messageType} - ${reminder.status}`);
    }

    console.log('🎉 تم إنشاء جميع التذكيرات التجريبية بنجاح!');
    
    // عرض الإحصائيات
    const stats = await prisma.whatsappMessageLog.groupBy({
      by: ['messageType', 'status'],
      _count: {
        id: true
      },
      where: {
        messageType: {
          in: ['payment_reminder', 'contract_expiry_reminder', 'maintenance_reminder']
        }
      }
    });

    console.log('\n📊 إحصائيات التذكيرات:');
    stats.forEach(stat => {
      console.log(`${stat.messageType} - ${stat.status}: ${stat._count.id}`);
    });

  } catch (error) {
    console.error('❌ خطأ في إنشاء البيانات التجريبية:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedReminders();
