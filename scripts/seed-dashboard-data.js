const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    console.log('🌱 بدء إضافة البيانات التجريبية...');

    // 1. إضافة إعدادات التذكيرات
    console.log('📝 إضافة إعدادات التذكيرات...');
    const reminderSettings = await prisma.$executeRaw`
      INSERT INTO ReminderSettings (
        id, paymentReminderDays, contractReminderDays, maintenanceFollowupDays,
        maxRetries, messageDelay, enableAutoReminders, enabledReminderTypes,
        workingHoursStart, workingHoursEnd, workingDays, highPriorityThreshold,
        mediumPriorityThreshold, defaultLanguage, includeCompanySignature,
        isActive, updatedBy, createdAt, updatedAt
      ) VALUES (
        'default_settings_001',
        JSON_ARRAY(7, 3, 1),
        JSON_ARRAY(60, 30, 15, 7),
        JSON_ARRAY(3, 7, 14),
        3,
        2000,
        true,
        JSON_ARRAY('payment_reminder', 'contract_expiry_reminder', 'maintenance_followup'),
        '09:00:00',
        '18:00:00',
        JSON_ARRAY('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
        3,
        7,
        'ar_AE',
        true,
        true,
        'system_seed',
        NOW(),
        NOW()
      )
      ON DUPLICATE KEY UPDATE
        paymentReminderDays = VALUES(paymentReminderDays),
        contractReminderDays = VALUES(contractReminderDays),
        maintenanceFollowupDays = VALUES(maintenanceFollowupDays),
        updatedAt = NOW()
    `;    // 2. إضافة رسائل واتساب تجريبية
    console.log('📱 إضافة رسائل واتساب تجريبية...');
    const messages = [
      {
        id: 'msg_001',
        messageId: 'unique_msg_001',
        recipient: '+971501234567',
        messageType: 'payment_reminder',
        templateName: 'payment_reminder_ar',
        language: 'ar_AE',
        status: 'sent',
        metadata: JSON.stringify({
          message: 'مرحباً، هذا تذكير بدفع القسط المستحق غداً لعقد رقم 12345',
          contractId: 'contract_001',
          reminderDay: 1,
          amount: 5000,
          dueDate: '2024-12-20'
        }),
        clientId: 1
      },
      {
        id: 'msg_002',
        messageId: 'unique_msg_002',
        recipient: '+971507654321',
        messageType: 'contract_expiry_reminder',
        templateName: 'contract_expiry_ar',
        language: 'ar_AE',
        status: 'delivered',
        metadata: JSON.stringify({
          message: 'تنبيه: عقدكم رقم 67890 ينتهي خلال 30 يوماً',
          contractId: 'contract_002',
          reminderDay: 30,
          expiryDate: '2025-01-20'
        }),
        clientId: 2
      },
      {
        id: 'msg_003',
        messageId: 'unique_msg_003',
        recipient: '+971503456789',
        messageType: 'maintenance_followup',
        templateName: 'maintenance_followup_ar',
        language: 'ar_AE',
        status: 'read',
        metadata: JSON.stringify({
          message: 'متابعة طلب الصيانة رقم 555 - يرجى التواصل معنا',
          maintenanceRequestId: 'maint_001',
          reminderDay: 3,
          requestType: 'صيانة عامة'
        }),
        clientId: 3
      }
    ];

    for (const msg of messages) {
      await prisma.$executeRaw`
        INSERT INTO WhatsappMessageLog (
          id, messageId, recipient, messageType, templateName, language,
          status, metadata, clientId, sentAt, updatedAt
        ) VALUES (
          ${msg.id}, ${msg.messageId}, ${msg.recipient}, ${msg.messageType}, 
          ${msg.templateName}, ${msg.language}, ${msg.status}, ${msg.metadata},
          ${msg.clientId}, NOW(), NOW()
        )
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          updatedAt = NOW()
      `;
    }    // 3. إضافة شكاوى تجريبية
    console.log('📞 إضافة شكاوى تجريبية...');
    const complaints = [
      {
        id: 'complaint_001',
        clientId: 1,
        description: 'مشكلة في نظام التكييف بالوحدة رقم 101',
        status: 'PENDING',
        priority: 'HIGH',
        type: 'MAINTENANCE_ISSUE',
        assignedTo: null,
        resolution: null,
        resolvedAt: null,
        propertyId: null,
        unitId: null,
        displayId: 'COMP-001'
      },
      {
        id: 'complaint_002',
        clientId: 2,
        description: 'استفسار حول مواعيد دفع الأقساط',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        type: 'PAYMENT_ISSUE',
        assignedTo: 'support_001',
        resolution: 'تم التواصل مع العميل وتوضيح المواعيد',
        resolvedAt: null,
        propertyId: null,
        unitId: null,
        displayId: 'COMP-002'
      },
      {
        id: 'complaint_003',
        clientId: 3,
        description: 'عدم الرد على المكالمات في الوقت المناسب',
        status: 'COMPLETED',
        priority: 'LOW',
        type: 'SERVICE_QUALITY',
        assignedTo: 'manager_001',
        resolution: 'تم حل المشكلة وتحسين أوقات الاستجابة',
        resolvedAt: new Date(),
        propertyId: null,
        unitId: null,
        displayId: 'COMP-003'
      }
    ];

    for (const complaint of complaints) {
      await prisma.$executeRaw`
        INSERT INTO Complaint (
          id, clientId, description, status, priority, type, assignedTo,
          resolution, resolvedAt, propertyId, unitId, displayId,
          createdAt, updatedAt, submittedAt
        ) VALUES (
          ${complaint.id}, ${complaint.clientId}, ${complaint.description}, ${complaint.status},
          ${complaint.priority}, ${complaint.type}, ${complaint.assignedTo}, ${complaint.resolution},
          ${complaint.resolvedAt}, ${complaint.propertyId}, ${complaint.unitId}, ${complaint.displayId},
          NOW(), NOW(), NOW()
        )
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          updatedAt = NOW()
      `;
    }    // 4. إضافة طلبات صيانة تجريبية
    console.log('🔧 إضافة طلبات صيانة تجريبية...');
    const maintenanceRequests = [
      {
        id: 'maint_001',
        clientId: 3,
        propertyId: null,
        unitId: null,
        description: 'صيانة دورية للمصاعد والتكييف',
        type: 'AC_HEATING',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        assignedTo: 'tech_001',
        completedAt: null,
        notes: 'يتطلب فني متخصص في المصاعد',
        displayId: 'MAINT-001'
      },
      {
        id: 'maint_002',
        clientId: 1,
        propertyId: null,
        unitId: null,
        description: 'تسريب في السباكة بالحمام الرئيسي',
        type: 'PLUMBING',
        priority: 'HIGH',
        status: 'COMPLETED',
        assignedTo: 'tech_002',
        completedAt: new Date(),
        notes: 'تم إصلاح التسريب واستبدال الأنابيب',
        displayId: 'MAINT-002'
      }
    ];

    for (const request of maintenanceRequests) {
      await prisma.$executeRaw`
        INSERT INTO MaintenanceRequest (
          id, clientId, propertyId, unitId, description, type, priority,
          status, assignedTo, completedAt, notes, displayId,
          createdAt, updatedAt, requestDate
        ) VALUES (
          ${request.id}, ${request.clientId}, ${request.propertyId}, ${request.unitId},
          ${request.description}, ${request.type}, ${request.priority}, ${request.status},
          ${request.assignedTo}, ${request.completedAt}, ${request.notes}, ${request.displayId},
          NOW(), NOW(), NOW()
        )
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          updatedAt = NOW()
      `;
    }

    console.log('✅ تم إضافة البيانات التجريبية بنجاح!');
    
    // عرض ملخص البيانات المضافة
    const settingsCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ReminderSettings WHERE isActive = true`;
    const messagesCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM WhatsappMessageLog`;
    const complaintsCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM Complaint`;
    const maintenanceCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM MaintenanceRequest`;

    console.log('\n📊 ملخص البيانات:');
    console.log(`• إعدادات التذكيرات: ${settingsCount[0].count}`);
    console.log(`• رسائل واتساب: ${messagesCount[0].count}`);
    console.log(`• الشكاوى: ${complaintsCount[0].count}`);
    console.log(`• طلبات الصيانة: ${maintenanceCount[0].count}`);

    return {
      success: true,
      summary: {
        reminderSettings: settingsCount[0].count,
        whatsappMessages: messagesCount[0].count,
        complaints: complaintsCount[0].count,
        maintenanceRequests: maintenanceCount[0].count
      }
    };

  } catch (error) {
    console.error('❌ خطأ في إضافة البيانات:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل السكريبت
if (require.main === module) {
  seedDatabase()
    .then((result) => {
      console.log('\n🎉 تم إنجاز المهمة بنجاح!');
      console.log('📊 النتائج:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 فشل في تنفيذ المهمة:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
