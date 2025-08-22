import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - جلب التذكيرات الحقيقية أو الإعدادات
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    if (action === 'settings') {
      return await getReminderSettings();
    }
    
    console.log('📨 جلب التذكيرات الحقيقية...');
    
    const type = url.searchParams.get('type') || 'all';
    const status = url.searchParams.get('status') || 'all';
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    
    // جلب رسائل التذكيرات من قاعدة البيانات
    const whereClause = {
      messageType: {
        in: ['payment_reminder', 'contract_expiry_reminder', 'maintenance_reminder']
      }
    };
    
    // فلترة حسب النوع
    if (type !== 'all') {
      if (type === 'payment') {
        whereClause.messageType = 'payment_reminder';
      } else if (type === 'contract') {
        whereClause.messageType = 'contract_expiry_reminder';
      } else if (type === 'maintenance') {
        whereClause.messageType = 'maintenance_reminder';
      }
    }
    
    // فلترة حسب الحالة
    if (status !== 'all') {
      whereClause.status = status;
    }      // جلب الرسائل مع بيانات العملاء
    const reminderMessages = await prisma.whatsappMessageLog.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        }
      },
      orderBy: {
        sentAt: 'desc'
      },
      take: limit});
    
    // ربط الرسائل بالعملاء حسب رقم الهاتف (للرسائل غير المرتبطة)
    const linkedMessages = await linkMessagesToClients(reminderMessages);
    
    // تجميع الإحصائيات
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
      // تنظيم الإحصائيات
    const summary = {
      total: reminderMessages.length,
      byType: {
        payment_reminder: stats.filter(s => s.messageType === 'payment_reminder').reduce((sum, s) => sum + s._count.id, 0),
        contract_expiry_reminder: stats.filter(s => s.messageType === 'contract_expiry_reminder').reduce((sum, s) => sum + s._count.id, 0),
        maintenance_reminder: stats.filter(s => s.messageType === 'maintenance_reminder').reduce((sum, s) => sum + s._count.id, 0),
        // إضافة مفاتيح مختصرة للتوافق
        payment: stats.filter(s => s.messageType === 'payment_reminder').reduce((sum, s) => sum + s._count.id, 0),
        contract: stats.filter(s => s.messageType === 'contract_expiry_reminder').reduce((sum, s) => sum + s._count.id, 0),
        maintenance: stats.filter(s => s.messageType === 'maintenance_reminder').reduce((sum, s) => sum + s._count.id, 0)
      },
      byStatus: {
        sent: stats.filter(s => s.status === 'sent').reduce((sum, s) => sum + s._count.id, 0),
        delivered: stats.filter(s => s.status === 'delivered').reduce((sum, s) => sum + s._count.id, 0),
        read: stats.filter(s => s.status === 'read').reduce((sum, s) => sum + s._count.id, 0),
        failed: stats.filter(s => s.status === 'failed').reduce((sum, s) => sum + s._count.id, 0),
        pending: stats.filter(s => s.status === 'pending').reduce((sum, s) => sum + s._count.id, 0)
      },
      successRate: stats.length > 0 ? 
        ((stats.filter(s => ['delivered', 'read'].includes(s.status)).reduce((sum, s) => sum + s._count.id, 0) / 
          stats.reduce((sum, s) => sum + s._count.id, 0)) * 100).toFixed(1) : 0
    };
    
    // إحصائيات اليوم
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const todayStats = await prisma.whatsappMessageLog.groupBy({
      by: ['messageType', 'status'],
      _count: {
        id: true
      },
      where: {
        messageType: {
          in: ['payment_reminder', 'contract_expiry_reminder', 'maintenance_reminder']
        },
        sentAt: {
          gte: startOfDay
        }
      }
    });
      const todaySummary = {
      total: todayStats.reduce((sum, s) => sum + s._count.id, 0),
      sent: todayStats.filter(s => s.status === 'sent').reduce((sum, s) => sum + s._count.id, 0),
      delivered: todayStats.filter(s => s.status === 'delivered').reduce((sum, s) => sum + s._count.id, 0),
      failed: todayStats.filter(s => s.status === 'failed').reduce((sum, s) => sum + s._count.id, 0),
      pending: todayStats.filter(s => s.status === 'pending').reduce((sum, s) => sum + s._count.id, 0),
      successRate: todayStats.length > 0 ? 
        ((todayStats.filter(s => ['delivered', 'read'].includes(s.status)).reduce((sum, s) => sum + s._count.id, 0) / 
          todayStats.reduce((sum, s) => sum + s._count.id, 0)) * 100).toFixed(1) : 0
    };    // إحصائيات التذكيرات المجدولة - باستخدام الحقول الموجودة فعلاً
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfTomorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    const endOfTomorrow = new Date(startOfTomorrow);
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);    // جلب التذكيرات المجدولة للغد (حالة scheduled و pending)
    const scheduledTomorrow = await prisma.whatsappMessageLog.count({
      where: {
        messageType: {
          in: ['payment_reminder', 'contract_expiry_reminder', 'maintenance_reminder']
        },
        status: {
          in: ['scheduled', 'pending']
        },
        sentAt: {
          gte: startOfTomorrow,
          lt: endOfTomorrow
        }
      }    });

    // جلب التذكيرات المجدولة لهذا الأسبوع (حالة scheduled و pending)
    const scheduledThisWeek = await prisma.whatsappMessageLog.count({
      where: {
        messageType: {
          in: ['payment_reminder', 'contract_expiry_reminder', 'maintenance_reminder']
        },
        status: {
          in: ['scheduled', 'pending']
        },
        sentAt: {
          gte: startOfDay,
          lte: nextWeek
        }
      }
    });

    // إحصائيات الدفعات
    const paymentStats = {
      totalPendingPayments: await prisma.payment.count({
        where: { 
          status: { in: ['PENDING', 'OVERDUE'] },
          installmentId: { not: null }
        }
      }),
      totalPaidPayments: await prisma.payment.count({
        where: { 
          status: 'PAID',
          installmentId: { not: null }
        }
      }),
      overduePayments: await prisma.payment.count({
        where: { 
          status: { in: ['PENDING', 'OVERDUE'] },
          dueDate: { lt: new Date() },
          installmentId: { not: null }
        }
      }),
      upcomingPayments: await prisma.payment.count({
        where: {
          status: 'PENDING',
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 يوم
          },
          installmentId: { not: null }
        }
      })
    };

    // إحصائيات العقود
    const contractStats = {
      totalActiveContracts: await prisma.rentAgreement.count({
        where: { status: 'ACTIVE' }
      }),
      expiringContracts: await prisma.rentAgreement.count({
        where: {
          status: 'ACTIVE',
          endDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 يوم
          }
        }
      }),
      contractReminders: await prisma.whatsappMessageLog.count({
        where: { messageType: 'contract_expiry_reminder' }
      })
    };

    // دمج الإحصائيات
    const paymentStatistics = {
      payments: paymentStats,
      contracts: contractStats
    };

    const scheduledSummary = {
      tomorrow: scheduledTomorrow,
      thisWeek: scheduledThisWeek
    };    // إضافة summary للـ API response
    summary.todaySummary = todaySummary;
    summary.scheduledSummary = scheduledSummary;
    summary.scheduled = scheduledSummary; // للتوافق
    summary.paymentStats = paymentStats;

    return NextResponse.json({
      success: true,
      data: {
        reminders: linkedMessages.map(msg => ({
          id: msg.id,
          messageId: msg.messageId,
          type: msg.messageType, // نوع التذكير
          messageType: msg.messageType, // إضافة كلاهما للتوافق
          status: msg.status,
          recipient: msg.recipient,
          client: msg.client,
          message: msg.message || 'لا توجد رسالة',
          sentAt: msg.sentAt,
          updatedAt: msg.updatedAt,
          metadata: msg.metadata,
          // إضافة البيانات المحسنة للدفعات والعقود
          clientName: msg.clientName,
          amount: msg.amount,
          dueDate: msg.dueDate,
          paymentStatus: msg.paymentStatus,
          contractNumber: msg.contractNumber,
          propertyName: msg.propertyName,
          unitNumber: msg.unitNumber,
          daysUntilDue: msg.daysUntilDue,
          paymentDetails: msg.paymentDetails        })),
        summary,
        deliveryStats: {
          successRate: summary.successRate
        },
        todaySummary,
        scheduledSummary,
        paymentStats,
        contractStats,
        paymentStatistics // الإحصائيات الموحدة للواجهة الأمامية
      },
      message: 'تم جلب التذكيرات بنجاح',
      source: 'database'
    });

  } catch (error) {
    console.error('خطأ في جلب التذكيرات:', error);
    return NextResponse.json({
      success: false,
      error: 'خطأ في تحميل التذكيرات',
      details: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST - تحديث إعدادات التذكيرات أو تشغيل التذكيرات أو إضافة تذكير جديد
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (action === 'update_settings') {
      return await updateReminderSettings(data);
    } else if (action === 'trigger_reminders') {
      return await triggerReminders(data);
    } else if (action === 'add_reminder' || !action) {
      // إضافة تذكير جديد (للتوافق مع النسخة القديمة)
      return NextResponse.json({
        success: true,
        message: 'تم إضافة التذكير بنجاح (محاكاة)',
        reminder: {
          id: `reminder_${Date.now()}`,
          ...body,
          createdAt: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'إجراء غير معروف'
    }, { status: 400 });

  } catch (error) {
    console.error('خطأ في POST reminders:', error);
    return NextResponse.json({
      success: false,
      error: 'خطأ في الخادم',
      details: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// تحديث إعدادات التذكيرات
async function updateReminderSettings(data) {
  try {
    // البحث عن الإعدادات الحالية
    let settings = await prisma.reminderSettings.findFirst({
      where: { id: 'default_reminder_settings' }
    });

    if (settings) {
      // حفظ القيم القديمة في التاريخ
      await prisma.reminderSettingsHistory.create({
        data: {
          settingsId: settings.id,
          changeType: 'UPDATE',
          oldValues: settings,
          newValues: data,
          changedBy: data.updatedBy || 'system',
          changeReason: data.reason || 'Manual update'
        }
      });

      // تحديث الإعدادات
      settings = await prisma.reminderSettings.update({
        where: { id: 'default_reminder_settings' },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });
    } else {
      // إنشاء إعدادات جديدة
      settings = await prisma.reminderSettings.create({
        data: {
          id: 'default_reminder_settings',
          ...data
        }
      });

      await prisma.reminderSettingsHistory.create({
        data: {
          settingsId: settings.id,
          changeType: 'CREATE',
          newValues: settings,
          changedBy: data.updatedBy || 'system',
          changeReason: 'Initial setup'
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
      message: 'تم تحديث إعدادات التذكيرات بنجاح'
    });

  } catch (error) {
    console.error('خطأ في تحديث الإعدادات:', error);
    throw error;
  }
}

// تشغيل التذكيرات يدوياً
async function triggerReminders(data) {
  try {
    // تشغيل script التذكيرات
    const { spawn } = require('child_process');
    
    const child = spawn('node', ['scripts/automated-reminder-cron-job.js'], {
      cwd: process.cwd(),
      stdio: 'pipe'
    });

    let output = '';
    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      output += chunk.toString();
    });

    return new Promise((resolve) => {
      child.on('close', (code) => {
        resolve(NextResponse.json({
          success: code === 0,
          output,
          message: code === 0 ? 'تم تشغيل التذكيرات بنجاح' : 'فشل في تشغيل التذكيرات'
        }));
      });
    });
  } catch (error) {
    console.error('خطأ في تشغيل التذكيرات:', error);
    throw error;
  }
}

// جلب إعدادات التذكيرات
async function getReminderSettings() {
  try {
    console.log('⚙️ جلب إعدادات التذكيرات...');
    
    let settings = await prisma.reminderSettings.findFirst({
      where: { id: 'default_reminder_settings' }
    });

    if (!settings) {
      // إنشاء إعدادات افتراضية إذا لم تكن موجودة
      settings = await prisma.reminderSettings.create({
        data: {
          id: 'default_reminder_settings',
          paymentReminderDays: [7, 3, 1],
          contractReminderDays: [60, 30, 15, 7],
          maintenanceFollowupDays: [3, 7, 14],
          maxRetries: 3,
          messageDelay: 2000,
          enableAutoReminders: true,
          enabledReminderTypes: ["payment_reminder", "contract_expiry_reminder"],
          workingHoursStart: "09:00:00",
          workingHoursEnd: "18:00:00",
          workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          highPriorityThreshold: 3,
          mediumPriorityThreshold: 7,
          defaultLanguage: "ar_AE",
          includeCompanySignature: true,
          isActive: true
        }
      });
    }

    // جلب آخر 5 تغييرات في التاريخ
    const history = await prisma.reminderSettingsHistory.findMany({
      where: { settingsId: settings.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return NextResponse.json({
      success: true,
      data: {
        settings,
        history
      },
      message: 'تم جلب إعدادات التذكيرات بنجاح'
    });

  } catch (error) {
    console.error('خطأ في جلب الإعدادات:', error);
    throw error;
  }
}

// دالة مساعدة لربط الرسائل بالعملاء حسب رقم الهاتف وبيانات الدفعات
async function linkMessagesToClients(messages) {
  const enhancedMessages = [];
  
  for (const message of messages) {
    let enhancedMessage = { ...message };
    
    // ربط العميل إذا لم يكن مرتبط
    if (!message.clientId && message.recipient) {
      let client = null;
      
      // تنسيق رقم الهاتف للبحث
      const phoneFormats = [];
      
      if (message.recipient.startsWith('+971')) {
        const localPhone = '0' + message.recipient.substring(4);
        phoneFormats.push(message.recipient, localPhone);
      } else if (message.recipient.startsWith('971')) {
        const withPlus = '+' + message.recipient;
        const localPhone = '0' + message.recipient.substring(3);
        phoneFormats.push(message.recipient, withPlus, localPhone);
      } else if (message.recipient.startsWith('0')) {
        const internationalPhone = '+971' + message.recipient.substring(1);
        const internationalNoPLus = '971' + message.recipient.substring(1);
        phoneFormats.push(message.recipient, internationalPhone, internationalNoPLus);
      } else {
        phoneFormats.push(message.recipient);
      }
      
      // البحث عن عميل بأي من الصيغ
      client = await prisma.client.findFirst({
        where: {
          phone: {
            in: phoneFormats
          }
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true
        }
      });
      
      if (client) {
        enhancedMessage.client = client;
        // تحديث الرسالة بمعرف العميل في قاعدة البيانات
        try {
          await prisma.whatsappMessageLog.update({
            where: { id: message.id },
            data: { clientId: client.id }
          });
          console.log(`ربط رسالة ${message.id} بالعميل ${client.name}`);
        } catch (updateError) {
          console.warn(`تعذر تحديث الرسالة ${message.id}:`, updateError.message);
        }
      } else {
        console.warn(`لم يتم العثور على عميل لرقم ${message.recipient}`);
        enhancedMessage.client = {
          id: null,
          name: `عميل ${message.recipient}`,
          phone: message.recipient,
          email: null
        };
      }
    }
    
    // ربط بيانات الدفعة للتذكيرات المالية
    if (message.messageType === 'payment_reminder' && message.metadata?.paymentId) {
      try {
        const paymentDetails = await prisma.payment.findUnique({
          where: { id: parseInt(message.metadata.paymentId) },
          include: {
            installment: {
              include: {
                rentAgreement: {
                  include: {
                    renter: true,
                    unit: {
                      include: {
                        property: true
                      }
                    }
                  }
                }
              }
            }
          }
        });
        
        if (paymentDetails) {
          const renter = paymentDetails.installment?.rentAgreement?.renter;
          
          enhancedMessage.paymentDetails = paymentDetails;
          enhancedMessage.clientName = renter?.name || 
                                      (renter?.firstName + ' ' + renter?.lastName).trim() || 
                                      enhancedMessage.client?.name || 'غير محدد';
          enhancedMessage.amount = paymentDetails.amount;
          enhancedMessage.dueDate = paymentDetails.dueDate;
          enhancedMessage.paymentStatus = paymentDetails.status;
          enhancedMessage.contractNumber = paymentDetails.installment?.rentAgreement?.rentAgreementNumber;
          enhancedMessage.propertyName = paymentDetails.installment?.rentAgreement?.unit?.property?.name || 
                                        paymentDetails.installment?.rentAgreement?.unit?.property?.propertyName;
          enhancedMessage.unitNumber = paymentDetails.installment?.rentAgreement?.unit?.number;
          enhancedMessage.daysUntilDue = message.metadata?.daysUntilDue ? parseInt(message.metadata.daysUntilDue) : null;
        }
      } catch (error) {
        console.error('خطأ في جلب بيانات الدفعة:', error);
      }
    }
    
    enhancedMessages.push(enhancedMessage);
  }
  
  return enhancedMessages;
}
