const { PrismaClient } = require('@prisma/client');

con                        metadata: {
                            path: 'paymentId',
                            equals: payment.id
                        }risma = new PrismaClient();

async function createRealScheduledReminders() {
    console.log('🔧 إنشاء التذكيرات المجدولة الفعلية...\n');

    try {
        const today = new Date();
        let totalCreated = 0;

        // 1. إنشاء تذكيرات الدفعات
        console.log('💰 إنشاء تذكيرات الدفعات:');
        
        // الحصول على الدفعات المستحقة في الأيام القادمة
        const reminderDays = [1, 3, 7, 14]; // قبل 1, 3, 7, 14 يوم من الاستحقاق
        
        for (const days of reminderDays) {
            const targetDate = new Date();
            targetDate.setDate(today.getDate() + days);
            
            // تحديد نطاق التاريخ (نفس اليوم)
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);

            const paymentsForDay = await prisma.payment.findMany({
                where: {
                    status: 'PENDING',
                    dueDate: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                include: {
                    client: true,
                    property: true,
                    unit: true,
                    rentAgreement: true
                }
            });

            console.log(`  📅 دفعات مستحقة في ${targetDate.toLocaleDateString('ar-SA')}: ${paymentsForDay.length}`);

            for (const payment of paymentsForDay) {
                // التحقق من عدم وجود تذكير مسبق لنفس الدفعة في نفس اليوم
                const existingReminder = await prisma.whatsappMessageLog.findFirst({
                    where: {
                        clientId: payment.clientId,
                        messageType: 'payment_reminder',
                        sentAt: {
                            gte: startOfDay,
                            lte: endOfDay
                        },
                        metadata: {
                            path: ['paymentId'],
                            equals: payment.id
                        }
                    }
                });

                if (!existingReminder && payment.client?.phone) {
                    // إنشاء تذكير جديد
                    const scheduledTime = new Date(targetDate);
                    scheduledTime.setHours(9, 0, 0, 0); // الساعة 9 صباحاً

                    const reminderMessage = createPaymentReminderMessage(payment, days);

                    const newReminder = await prisma.whatsappMessageLog.create({
                        data: {
                            messageId: `payment_reminder_${payment.id}_${days}d_${Date.now()}`,
                            recipient: payment.client.phone,
                            messageType: 'payment_reminder',
                            templateName: 'payment_reminder_ar',
                            language: 'ar_AE',
                            status: 'scheduled',
                            metadata: {
                                paymentId: payment.id,
                                daysBeforeDue: days,
                                amount: payment.amount,
                                dueDate: payment.dueDate,
                                contractNumber: payment.rentAgreement?.rentAgreementNumber || 'غير محدد',
                                propertyName: payment.property?.name || 'غير محدد',
                                unitNumber: payment.unit?.number || null,
                                scheduledFor: scheduledTime,
                                reminderType: 'payment',
                                message: reminderMessage
                            },
                            sentAt: scheduledTime,
                            clientId: payment.clientId
                        }
                    });

                    totalCreated++;
                    console.log(`    ✅ تم إنشاء تذكير للدفعة ${payment.id} - ${payment.amount} د.إ`);
                }
            }
        }

        // 2. إنشاء تذكيرات العقود
        console.log('\n📋 إنشاء تذكيرات العقود:');
        
        const contractReminderDays = [7, 15, 30, 60, 90]; // قبل 7, 15, 30, 60, 90 يوم من انتهاء العقد
        
        for (const days of contractReminderDays) {
            const targetDate = new Date();
            targetDate.setDate(today.getDate() + days);
            
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);

            const contractsForDay = await prisma.rentAgreement.findMany({
                where: {
                    status: 'ACTIVE',
                    endDate: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
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

            console.log(`  📅 عقود منتهية في ${targetDate.toLocaleDateString('ar-SA')}: ${contractsForDay.length}`);

            for (const contract of contractsForDay) {
                // التحقق من عدم وجود تذكير مسبق
                const existingReminder = await prisma.whatsappMessageLog.findFirst({
                    where: {
                        clientId: contract.renter.id,
                        messageType: 'contract_expiry_reminder',
                        sentAt: {
                            gte: startOfDay,
                            lte: endOfDay
                        },
                        metadata: {
                            path: 'contractId',
                            equals: contract.id
                        }
                    }
                });

                if (!existingReminder && contract.renter?.phone) {
                    const scheduledTime = new Date(targetDate);
                    scheduledTime.setHours(10, 0, 0, 0); // الساعة 10 صباحاً

                    const reminderMessage = createContractReminderMessage(contract, days);

                    const newReminder = await prisma.whatsappMessageLog.create({
                        data: {
                            messageId: `contract_reminder_${contract.id}_${days}d_${Date.now()}`,
                            recipient: contract.renter.phone,
                            messageType: 'contract_expiry_reminder',
                            templateName: 'contract_expiry_ar',
                            language: 'ar_AE',
                            status: 'scheduled',
                            metadata: {
                                contractId: contract.id,
                                daysBeforeExpiry: days,
                                endDate: contract.endDate,
                                contractNumber: contract.rentAgreementNumber,
                                propertyName: contract.unit?.property?.name || 'غير محدد',
                                unitNumber: contract.unit?.number || null,
                                scheduledFor: scheduledTime,
                                reminderType: 'contract',
                                message: reminderMessage
                            },
                            sentAt: scheduledTime,
                            clientId: contract.renter.id
                        }
                    });

                    totalCreated++;
                    console.log(`    ✅ تم إنشاء تذكير للعقد ${contract.rentAgreementNumber}`);
                }
            }
        }

        // 3. عرض النتائج النهائية
        console.log('\n📊 ملخص النتائج:');
        console.log('================');
        console.log(`✅ إجمالي التذكيرات المجدولة: ${totalCreated}`);

        // فحص التذكيرات المجدولة الجديدة
        const scheduledReminders = await prisma.whatsappMessageLog.findMany({
            where: {
                status: 'scheduled'
            },
            orderBy: {
                sentAt: 'asc'
            }
        });

        console.log(`📤 التذكيرات المجدولة في النظام: ${scheduledReminders.length}`);

        // إحصائيات التذكيرات المجدولة
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const tomorrowEnd = new Date(tomorrow);
        tomorrowEnd.setHours(23, 59, 59, 999);

        const tomorrowReminders = await prisma.whatsappMessageLog.count({
            where: {
                status: 'scheduled',
                sentAt: {
                    gte: tomorrow,
                    lte: tomorrowEnd
                }
            }
        });

        const thisWeek = new Date();
        thisWeek.setDate(today.getDate() + 7);

        const thisWeekReminders = await prisma.whatsappMessageLog.count({
            where: {
                status: 'scheduled',
                sentAt: {
                    gte: today,
                    lte: thisWeek
                }
            }
        });

        console.log(`📅 مجدولة للغد: ${tomorrowReminders}`);
        console.log(`📆 مجدولة هذا الأسبوع: ${thisWeekReminders}`);

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

createRealScheduledReminders();
