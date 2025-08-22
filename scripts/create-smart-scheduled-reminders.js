const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSmartScheduledReminders() {
    console.log('🔧 إنشاء التذكيرات المجدولة الذكية...\n');

    try {
        const today = new Date();
        let totalCreated = 0;

        // 1. الحصول على الدفعات المستحقة في الأيام القادمة (من البيانات الفعلية)
        console.log('💰 معالجة الدفعات المستحقة:');
        
        const next14Days = new Date();
        next14Days.setDate(today.getDate() + 14);

        const upcomingPayments = await prisma.payment.findMany({
            where: {
                status: 'PENDING',
                dueDate: {
                    gte: today,
                    lte: next14Days
                }
            },
            include: {
                client: true,
                property: true,
                unit: true,
                rentAgreement: true
            },
            orderBy: {
                dueDate: 'asc'
            }
        });

        console.log(`📅 دفعات مستحقة خلال 14 يوم: ${upcomingPayments.length}`);

        for (const payment of upcomingPayments) {
            const daysUntilDue = Math.ceil((new Date(payment.dueDate) - today) / (1000 * 60 * 60 * 24));
            
            // تحديد مواعيد التذكيرات بناءً على المدة المتبقية
            let reminderDays = [];
            if (daysUntilDue >= 14) reminderDays = [14, 7, 3, 1];
            else if (daysUntilDue >= 7) reminderDays = [7, 3, 1];
            else if (daysUntilDue >= 3) reminderDays = [3, 1];
            else if (daysUntilDue >= 1) reminderDays = [1];

            for (const daysBefore of reminderDays) {
                if (daysBefore > daysUntilDue) continue;

                const reminderDate = new Date(payment.dueDate);
                reminderDate.setDate(reminderDate.getDate() - daysBefore);
                reminderDate.setHours(9, 0, 0, 0); // الساعة 9 صباحاً                // التحقق من عدم وجود تذكير مسبق
                const existingReminder = await prisma.whatsappMessageLog.findFirst({
                    where: {
                        clientId: payment.clientId,
                        messageType: 'payment_reminder',
                        messageId: {
                            contains: `payment_reminder_${payment.id}_${daysBefore}d`
                        }
                    }
                });

                if (!existingReminder && payment.client?.phone) {
                    const reminderMessage = createPaymentReminderMessage(payment, daysBefore);

                    const newReminder = await prisma.whatsappMessageLog.create({
                        data: {
                            messageId: `payment_reminder_${payment.id}_${daysBefore}d_${Date.now()}`,
                            recipient: payment.client.phone,
                            messageType: 'payment_reminder',
                            templateName: 'payment_reminder_ar',
                            language: 'ar_AE',
                            status: reminderDate <= today ? 'pending' : 'scheduled',
                            metadata: {
                                paymentId: payment.id,
                                daysBeforeDue: daysBefore,
                                amount: payment.amount,
                                dueDate: payment.dueDate,
                                contractNumber: payment.rentAgreement?.rentAgreementNumber || 'غير محدد',
                                propertyName: payment.property?.name || 'غير محدد',
                                unitNumber: payment.unit?.number || null,
                                scheduledFor: reminderDate,
                                reminderType: 'payment',
                                message: reminderMessage
                            },
                            sentAt: reminderDate,
                            clientId: payment.clientId
                        }
                    });

                    totalCreated++;
                    console.log(`    ✅ تذكير دفعة ${payment.id} - ${daysBefore} أيام قبل الاستحقاق (${reminderDate.toLocaleDateString('ar-SA')})`);
                }
            }
        }

        // 2. معالجة العقود المنتهية
        console.log('\n📋 معالجة العقود المنتهية:');
        
        const next90Days = new Date();
        next90Days.setDate(today.getDate() + 90);

        const upcomingContracts = await prisma.rentAgreement.findMany({
            where: {
                status: 'ACTIVE',
                endDate: {
                    gte: today,
                    lte: next90Days
                }
            },
            include: {
                renter: true,
                unit: {
                    include: {
                        property: true
                    }
                }
            },
            orderBy: {
                endDate: 'asc'
            }
        });

        console.log(`📅 عقود منتهية خلال 90 يوم: ${upcomingContracts.length}`);

        for (const contract of upcomingContracts) {
            const daysUntilExpiry = Math.ceil((new Date(contract.endDate) - today) / (1000 * 60 * 60 * 24));
            
            // تحديد مواعيد التذكيرات بناءً على المدة المتبقية
            let reminderDays = [];
            if (daysUntilExpiry >= 90) reminderDays = [90, 60, 30, 15, 7];
            else if (daysUntilExpiry >= 60) reminderDays = [60, 30, 15, 7];
            else if (daysUntilExpiry >= 30) reminderDays = [30, 15, 7];
            else if (daysUntilExpiry >= 15) reminderDays = [15, 7];
            else if (daysUntilExpiry >= 7) reminderDays = [7];

            for (const daysBefore of reminderDays) {
                if (daysBefore > daysUntilExpiry) continue;

                const reminderDate = new Date(contract.endDate);
                reminderDate.setDate(reminderDate.getDate() - daysBefore);
                reminderDate.setHours(10, 0, 0, 0); // الساعة 10 صباحاً                // التحقق من عدم وجود تذكير مسبق
                const existingReminder = await prisma.whatsappMessageLog.findFirst({
                    where: {
                        clientId: contract.renter.id,
                        messageType: 'contract_expiry_reminder',
                        messageId: {
                            contains: `contract_reminder_${contract.id}_${daysBefore}d`
                        }
                    }
                });

                if (!existingReminder && contract.renter?.phone) {
                    const reminderMessage = createContractReminderMessage(contract, daysBefore);

                    const newReminder = await prisma.whatsappMessageLog.create({
                        data: {
                            messageId: `contract_reminder_${contract.id}_${daysBefore}d_${Date.now()}`,
                            recipient: contract.renter.phone,
                            messageType: 'contract_expiry_reminder',
                            templateName: 'contract_expiry_ar',
                            language: 'ar_AE',
                            status: reminderDate <= today ? 'pending' : 'scheduled',
                            metadata: {
                                contractId: contract.id,
                                daysBeforeExpiry: daysBefore,
                                endDate: contract.endDate,
                                contractNumber: contract.rentAgreementNumber,
                                propertyName: contract.unit?.property?.name || 'غير محدد',
                                unitNumber: contract.unit?.number || null,
                                scheduledFor: reminderDate,
                                reminderType: 'contract',
                                message: reminderMessage
                            },
                            sentAt: reminderDate,
                            clientId: contract.renter.id
                        }
                    });

                    totalCreated++;
                    console.log(`    ✅ تذكير عقد ${contract.rentAgreementNumber} - ${daysBefore} أيام قبل الانتهاء (${reminderDate.toLocaleDateString('ar-SA')})`);
                }
            }
        }

        // 3. عرض النتائج النهائية
        console.log('\n📊 ملخص النتائج:');
        console.log('================');
        console.log(`✅ إجمالي التذكيرات المُنشأة: ${totalCreated}`);

        // إحصائيات التذكيرات المجدولة
        const allScheduledReminders = await prisma.whatsappMessageLog.findMany({
            where: {
                status: {
                    in: ['scheduled', 'pending']
                }
            },
            orderBy: {
                sentAt: 'asc'
            }
        });

        console.log(`📤 إجمالي التذكيرات المجدولة في النظام: ${allScheduledReminders.length}`);

        // تذكيرات الغد
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        const tomorrowStart = new Date(tomorrow);
        tomorrowStart.setHours(0, 0, 0, 0);
        const tomorrowEnd = new Date(tomorrow);
        tomorrowEnd.setHours(23, 59, 59, 999);

        const tomorrowReminders = await prisma.whatsappMessageLog.count({
            where: {
                status: {
                    in: ['scheduled', 'pending']
                },
                sentAt: {
                    gte: tomorrowStart,
                    lte: tomorrowEnd
                }
            }
        });

        // تذكيرات هذا الأسبوع
        const weekEnd = new Date();
        weekEnd.setDate(today.getDate() + 7);

        const thisWeekReminders = await prisma.whatsappMessageLog.count({
            where: {
                status: {
                    in: ['scheduled', 'pending']
                },
                sentAt: {
                    gte: today,
                    lte: weekEnd
                }
            }
        });

        console.log(`📅 مجدولة للغد: ${tomorrowReminders}`);
        console.log(`📆 مجدولة هذا الأسبوع: ${thisWeekReminders}`);

        // عرض أمثلة على التذكيرات المجدولة
        if (allScheduledReminders.length > 0) {
            console.log('\n📋 أمثلة على التذكيرات المجدولة:');
            allScheduledReminders.slice(0, 5).forEach((reminder, index) => {
                const metadata = reminder.metadata || {};
                console.log(`  ${index + 1}. ${reminder.messageType} - ${reminder.sentAt.toLocaleDateString('ar-SA')} - ${metadata.reminderType || 'غير محدد'}`);
            });
        }

    } catch (error) {
        console.error('❌ خطأ في إنشاء التذكيرات:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// دالة إنشاء رسالة تذكير الدفعة
function createPaymentReminderMessage(payment, daysBeforeDue) {
    const propertyName = payment.property?.name || 'العقار';
    const unitNumber = payment.unit?.number ? ` - وحدة ${payment.unit.number}` : '';
    const contractNumber = payment.rentAgreement?.rentAgreementNumber || 'غير محدد';
    
    if (daysBeforeDue === 1) {
        return `🔔 تذكير هام - استحقاق دفعة غداً

عزيزي ${payment.client?.name || 'العميل الكريم'},
نذكركم بأن لديكم دفعة مستحقة غداً:

💰 المبلغ: ${payment.amount.toLocaleString('ar-SA')} درهم
📅 تاريخ الاستحقاق: ${payment.dueDate.toLocaleDateString('ar-SA')}
🏢 العقار: ${propertyName}${unitNumber}
📋 رقم العقد: ${contractNumber}

يرجى سداد المبلغ في الموعد المحدد لتجنب أي رسوم تأخير.

شكراً لتعاونكم`;
    } else if (daysBeforeDue === 3) {
        return `⏰ تذكير - استحقاق دفعة خلال 3 أيام

عزيزي ${payment.client?.name || 'العميل الكريم'},
نود تذكيركم بأن لديكم دفعة مستحقة خلال 3 أيام:

💰 المبلغ: ${payment.amount.toLocaleString('ar-SA')} درهم
📅 تاريخ الاستحقاق: ${payment.dueDate.toLocaleDateString('ar-SA')}
🏢 العقار: ${propertyName}${unitNumber}
📋 رقم العقد: ${contractNumber}

يرجى التحضير لسداد المبلغ في الموعد المحدد.`;
    } else {
        return `📋 تذكير - استحقاق دفعة خلال ${daysBeforeDue} أيام

عزيزي ${payment.client?.name || 'العميل الكريم'},
نود إعلامكم بأن لديكم دفعة مستحقة خلال ${daysBeforeDue} أيام:

💰 المبلغ: ${payment.amount.toLocaleString('ar-SA')} درهم
📅 تاريخ الاستحقاق: ${payment.dueDate.toLocaleDateString('ar-SA')}
🏢 العقار: ${propertyName}${unitNumber}
📋 رقم العقد: ${contractNumber}

يرجى التحضير لسداد المبلغ في الموعد المحدد.`;
    }
}

// دالة إنشاء رسالة تذكير العقد
function createContractReminderMessage(contract, daysBeforeExpiry) {
    const propertyName = contract.unit?.property?.name || 'العقار';
    const unitNumber = contract.unit?.number ? ` - وحدة ${contract.unit.number}` : '';
    
    if (daysBeforeExpiry <= 7) {
        return `🚨 عاجل - انتهاء العقد خلال ${daysBeforeExpiry} أيام

عزيزي ${contract.renter?.name || 'العميل الكريم'},
ننبهكم إلى أن عقد الإيجار الخاص بكم سينتهي قريباً:

📅 تاريخ انتهاء العقد: ${contract.endDate.toLocaleDateString('ar-SA')}
🏢 العقار: ${propertyName}${unitNumber}
📋 رقم العقد: ${contract.rentAgreementNumber}

يرجى التواصل معنا فوراً لتجديد العقد أو ترتيب تسليم الوحدة.`;
    } else if (daysBeforeExpiry <= 30) {
        return `📋 تذكير - انتهاء العقد خلال ${daysBeforeExpiry} يوماً

عزيزي ${contract.renter?.name || 'العميل الكريم'},
نود تذكيركم بأن عقد الإيجار الخاص بكم سينتهي خلال ${daysBeforeExpiry} يوماً:

📅 تاريخ انتهاء العقد: ${contract.endDate.toLocaleDateString('ar-SA')}
🏢 العقار: ${propertyName}${unitNumber}
📋 رقم العقد: ${contract.rentAgreementNumber}

يرجى التواصل معنا لمناقشة تجديد العقد أو ترتيبات التسليم.`;
    } else {
        return `📋 إشعار - انتهاء العقد خلال ${daysBeforeExpiry} يوماً

عزيزي ${contract.renter?.name || 'العميل الكريم'},
نود إعلامكم بأن عقد الإيجار الخاص بكم سينتهي خلال ${daysBeforeExpiry} يوماً:

📅 تاريخ انتهاء العقد: ${contract.endDate.toLocaleDateString('ar-SA')}
🏢 العقار: ${propertyName}${unitNumber}
📋 رقم العقد: ${contract.rentAgreementNumber}

للتخطيط المسبق، يرجى التواصل معنا لمناقشة خياراتكم.`;
    }
}

createSmartScheduledReminders();
