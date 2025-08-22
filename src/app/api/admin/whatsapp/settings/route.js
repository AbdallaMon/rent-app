import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - جلب جميع الإعدادات
export async function GET() {
  try {
    console.log('🔍 جلب إعدادات الواتساب...');

    // جلب إعدادات التذكيرات
    const reminderSettings = await prisma.reminderSettings.findFirst({
      where: { id: 'default_reminder_settings' }
    });

    // جلب إعدادات فريق العمل
    const teamSettings = await prisma.whatsAppTeamSettings.findFirst({
      where: { id: 'default_team_settings' }
    });

    console.log('✅ تم جلب الإعدادات بنجاح');

    return NextResponse.json({
      success: true,
      reminderSettings: reminderSettings || {
        paymentReminderDays: [7, 3, 1],
        contractReminderDays: [60, 30, 15, 7],
        maintenanceFollowupDays: [3, 7, 14],
        maxRetries: 3,
        messageDelay: 2000,
        enableAutoReminders: true,
        workingHoursStart: '09:00:00',
        workingHoursEnd: '18:00:00',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        enabledReminderTypes: ['payment_reminder', 'contract_expiry_reminder'],
        highPriorityThreshold: 3,
        mediumPriorityThreshold: 7,
        defaultLanguage: 'ar_AE',
        includeCompanySignature: true,
        isActive: true
      },
      teamSettings: teamSettings || {
        technicianPhone: '',
        technicianName: 'الفني',
        notifyTechnicianForMaintenance: true,
        technicianWorkingHours: 'من 8:00 صباحاً إلى 5:00 مساءً',
        customerServicePhone: '',
        customerServiceName: 'خدمة العملاء',
        notifyCustomerServiceForComplaints: true,
        notifyCustomerServiceForContacts: true,
        customerServiceWorkingHours: 'من 9:00 صباحاً إلى 6:00 مساءً',
        maxDailyNotifications: 10,
        notificationDelay: 5,
        enableUrgentNotifications: true,
        enableBackupNotifications: false,
        customNotificationMessage: ''
      }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب الإعدادات:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب الإعدادات', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - تحديث الإعدادات
export async function POST(request) {
  try {
    const body = await request.json();
    const { reminderSettings, teamSettings } = body;

    console.log('💾 تحديث إعدادات الواتساب...');

    // التحقق من صحة البيانات
    if (!reminderSettings && !teamSettings) {
      return NextResponse.json(
        { error: 'لا توجد بيانات للتحديث' },
        { status: 400 }
      );
    }

    const results = {};

    // تحديث إعدادات التذكيرات
    if (reminderSettings) {
      console.log('📅 تحديث إعدادات التذكيرات...');
      
      // التحقق من صحة البيانات
      const validatedReminderSettings = {
        ...reminderSettings,
        paymentReminderDays: Array.isArray(reminderSettings.paymentReminderDays) 
          ? reminderSettings.paymentReminderDays.filter(day => day > 0)
          : [7, 3, 1],
        contractReminderDays: Array.isArray(reminderSettings.contractReminderDays)
          ? reminderSettings.contractReminderDays.filter(day => day > 0)
          : [60, 30, 15, 7],
        maintenanceFollowupDays: Array.isArray(reminderSettings.maintenanceFollowupDays)
          ? reminderSettings.maintenanceFollowupDays.filter(day => day > 0)
          : [3, 7, 14],
        maxRetries: Math.max(1, Math.min(10, parseInt(reminderSettings.maxRetries) || 3)),
        messageDelay: Math.max(1000, Math.min(10000, parseInt(reminderSettings.messageDelay) || 2000)),
        updatedBy: 'admin_interface',
        updatedAt: new Date()
      };

      results.reminderSettings = await prisma.reminderSettings.upsert({
        where: { id: 'default_reminder_settings' },
        update: validatedReminderSettings,
        create: {
          id: 'default_reminder_settings',
          ...validatedReminderSettings
        }
      });

      console.log('✅ تم تحديث إعدادات التذكيرات');
    }

    // تحديث إعدادات فريق العمل
    if (teamSettings) {
      console.log('👥 تحديث إعدادات فريق العمل...');
      
      // التحقق من صحة أرقام الهواتف
      const validatePhoneNumber = (phone) => {
        if (!phone) return true; // اختياري
        const phoneRegex = /^971[0-9]{9}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
      };

      if (teamSettings.technicianPhone && !validatePhoneNumber(teamSettings.technicianPhone)) {
        return NextResponse.json(
          { error: 'رقم هاتف الفني غير صحيح. يجب أن يبدأ بـ 971 ويتكون من 12 رقماً' },
          { status: 400 }
        );
      }

      if (teamSettings.customerServicePhone && !validatePhoneNumber(teamSettings.customerServicePhone)) {
        return NextResponse.json(
          { error: 'رقم هاتف خدمة العملاء غير صحيح. يجب أن يبدأ بـ 971 ويتكون من 12 رقماً' },
          { status: 400 }
        );
      }

      // التحقق من صحة البيانات
      const validatedTeamSettings = {
        ...teamSettings,
        maxDailyNotifications: Math.max(1, Math.min(50, parseInt(teamSettings.maxDailyNotifications) || 10)),
        notificationDelay: Math.max(1, Math.min(60, parseInt(teamSettings.notificationDelay) || 5)),
        updatedAt: new Date()
      };

      results.teamSettings = await prisma.whatsAppTeamSettings.upsert({
        where: { id: 'default_team_settings' },
        update: validatedTeamSettings,
        create: {
          id: 'default_team_settings',
          ...validatedTeamSettings
        }
      });

      console.log('✅ تم تحديث إعدادات فريق العمل');
    }

    console.log('🎉 تم تحديث جميع الإعدادات بنجاح');

    return NextResponse.json({
      success: true,
      message: 'تم حفظ الإعدادات بنجاح',
      data: results
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث الإعدادات:', error);
    return NextResponse.json(
      { error: 'خطأ في حفظ الإعدادات', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
