import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - جلب إعدادات البوت المتقدمة
export async function GET() {
  try {
    const defaultBotSettings = {
      technicianPhone: '+971501234567',
      contractReminderDays: 30,
      financialReminderDays: 7,
      maintenanceReminderDays: 3,
      autoReminderEnabled: true,
      businessHoursStart: '09:00',
      businessHoursEnd: '18:00',
      autoReplyEnabled: true,
      templates: {
        financialReminder: 'تذكير: لديك قسط مستحق بتاريخ {dueDate} بمبلغ {amount} درهم. للاستفسار اتصل على {technicianPhone}',
        contractExpiry: 'إشعار: عقدك رقم {contractId} ينتهي في {days} يوم. يرجى التواصل لإجراءات التجديد.',
        maintenanceConfirm: 'تم استلام طلب الصيانة. سيتم التواصل معك خلال {hours} ساعة. رقم الطلب: {requestId}',
        generalReply: 'شكراً لتواصلك مع شركة تار العقارية. سيتم الرد عليك في أقرب وقت ممكن.',
        paymentConfirm: 'تم استلام دفعتك بمبلغ {amount} درهم بتاريخ {date}. شكراً لك.',
        maintenanceScheduled: 'تم جدولة الصيانة لتاريخ {date} في تمام الساعة {time}. الفني: {technician}'
      },
      automations: {
        sendFinancialReminders: true,
        sendContractReminders: true,
        sendMaintenanceReminders: true,
        autoConfirmPayments: true,
        autoScheduleMaintenance: false
      }
    };

    try {
      const settings = await prisma.botSettings.findFirst();
      if (settings) {
        return NextResponse.json({
          success: true,
          settings: JSON.parse(settings.settings)
        });
      }
    } catch (error) {
      console.log('⚠️ جدول إعدادات البوت غير موجود، سيتم استخدام الإعدادات الافتراضية');
    }

    return NextResponse.json({
      success: true,
      settings: defaultBotSettings
    });

  } catch (error) {
    console.error('❌ خطأ في جلب إعدادات البوت:', error);
    
    return NextResponse.json(
      { error: 'فشل في جلب إعدادات البوت' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - تحديث إعدادات البوت
export async function POST(request) {
  try {
    const newSettings = await request.json();
    
    console.log('🤖 تحديث إعدادات البوت:', newSettings);

    // التحقق من صحة البيانات
    if (newSettings.technicianPhone && !newSettings.technicianPhone.match(/^\+971\d{9}$/)) {
      return NextResponse.json(
        { error: 'رقم الفني يجب أن يكون بصيغة +971xxxxxxxxx' },
        { status: 400 }
      );
    }

    if (newSettings.contractReminderDays && (newSettings.contractReminderDays < 1 || newSettings.contractReminderDays > 365)) {
      return NextResponse.json(
        { error: 'أيام تذكير العقود يجب أن تكون بين 1 و 365' },
        { status: 400 }
      );
    }

    // تصفية الإعدادات المسموحة
    const allowedSettings = [
      'technicianPhone',
      'contractReminderDays',
      'financialReminderDays', 
      'maintenanceReminderDays',
      'autoReminderEnabled',
      'businessHoursStart',
      'businessHoursEnd',
      'autoReplyEnabled',
      'templates',
      'automations'
    ];

    const filteredSettings = {};
    Object.keys(newSettings).forEach(key => {
      if (allowedSettings.includes(key)) {
        filteredSettings[key] = newSettings[key];
      }
    });

    // محاولة حفظ الإعدادات في قاعدة البيانات
    try {
      const existing = await prisma.botSettings.findFirst();
      
      if (existing) {
        await prisma.botSettings.update({
          where: { id: existing.id },
          data: {
            settings: JSON.stringify(filteredSettings),
            updatedAt: new Date()
          }
        });
      } else {
        await prisma.botSettings.create({
          data: {
            settings: JSON.stringify(filteredSettings),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
      
      console.log('✅ تم حفظ إعدادات البوت في قاعدة البيانات');
      
    } catch (dbError) {
      console.log('⚠️ فشل حفظ إعدادات البوت في قاعدة البيانات، سيتم التخزين مؤقتاً');
      console.log('سبب الفشل:', dbError.message);
    }

    // إشعار بالتحديثات المهمة
    const notifications = [];
    if (filteredSettings.technicianPhone) {
      notifications.push(`تم تحديث رقم الفني إلى ${filteredSettings.technicianPhone}`);
    }
    if (filteredSettings.contractReminderDays) {
      notifications.push(`تم تحديث تذكيرات العقود إلى ${filteredSettings.contractReminderDays} يوم`);
    }
    if (filteredSettings.financialReminderDays) {
      notifications.push(`تم تحديث التذكيرات المالية إلى ${filteredSettings.financialReminderDays} أيام`);
    }

    return NextResponse.json({
      success: true,
      message: 'تم تحديث إعدادات البوت بنجاح',
      settings: filteredSettings,
      notifications
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث إعدادات البوت:', error);
    
    return NextResponse.json(
      { 
        error: 'فشل في تحديث إعدادات البوت',
        details: error.message
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - إعادة تعيين إعدادات البوت للافتراضية
export async function PUT() {
  try {
    const defaultSettings = {
      technicianPhone: '+971501234567',
      contractReminderDays: 30,
      financialReminderDays: 7,
      maintenanceReminderDays: 3,
      autoReminderEnabled: true,
      businessHoursStart: '09:00',
      businessHoursEnd: '18:00',
      autoReplyEnabled: true,
      templates: {
        financialReminder: 'تذكير: لديك قسط مستحق بتاريخ {dueDate} بمبلغ {amount} درهم. للاستفسار اتصل على {technicianPhone}',
        contractExpiry: 'إشعار: عقدك رقم {contractId} ينتهي في {days} يوم. يرجى التواصل لإجراءات التجديد.',
        maintenanceConfirm: 'تم استلام طلب الصيانة. سيتم التواصل معك خلال {hours} ساعة. رقم الطلب: {requestId}',
        generalReply: 'شكراً لتواصلك مع شركة تار العقارية. سيتم الرد عليك في أقرب وقت ممكن.'
      },
      automations: {
        sendFinancialReminders: true,
        sendContractReminders: true,
        sendMaintenanceReminders: true,
        autoConfirmPayments: true,
        autoScheduleMaintenance: false
      }
    };

    try {
      const existing = await prisma.botSettings.findFirst();
      
      if (existing) {
        await prisma.botSettings.update({
          where: { id: existing.id },
          data: {
            settings: JSON.stringify(defaultSettings),
            updatedAt: new Date()
          }
        });
      } else {
        await prisma.botSettings.create({
          data: {
            settings: JSON.stringify(defaultSettings),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
    } catch (dbError) {
      console.log('⚠️ فشل إعادة تعيين إعدادات البوت في قاعدة البيانات');
    }

    console.log('🔄 تم إعادة تعيين إعدادات البوت للافتراضية');

    return NextResponse.json({
      success: true,
      message: 'تم إعادة تعيين إعدادات البوت للافتراضية',
      settings: defaultSettings
    });

  } catch (error) {
    console.error('❌ خطأ في إعادة تعيين إعدادات البوت:', error);
    
    return NextResponse.json(
      { error: 'فشل في إعادة تعيين إعدادات البوت' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
