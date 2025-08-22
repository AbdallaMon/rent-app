/**
 * 🔧 إصلاح حساب التذكيرات المجدولة
 * Fix scheduled reminders calculation in the API
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createScheduledReminders() {
    console.log('🔧 إنشاء التذكيرات المجدولة...\n');

    try {
        // 1. إنشاء تذكيرات للدفعات المستحقة
        console.log('💰 1. إنشاء تذكيرات الدفعات:');
        
        // البحث عن الدفعات التي تحتاج تذكيرات خلال الأيام القادمة
        const reminderDays = [14, 7, 3, 1]; // أيام التذكير للدفعات
        let createdPaymentReminders = 0;
        
        for (const days of reminderDays) {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + days);
            targetDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(targetDate);
            endDate.setDate(endDate.getDate() + 1);
            
            const payments = await prisma.payment.findMany({
                where: {
                    status: { in: ['PENDING', 'OVERDUE'] },
                    dueDate: {
                        gte: targetDate,
                        lt: endDate
                    },
                    installmentId: { not: null }
                },
                include: {
                    installment: {
                        include: {
                            rentAgreement: {
                                include: {
                                    renter: true
                                }
                            }
                        }
                    }
                }
            });
            
            console.log(`  📅 دفعات مستحقة خلال ${days} أيام: ${payments.length}`);
            
            for (const payment of payments) {
                const renter = payment.installment.rentAgreement.renter;
                const phoneNumber = renter.phone;
                
                if (!phoneNumber) {
                    console.log(`    ⚠️ لا يوجد رقم هاتف للعميل: ${renter.name}`);
                    continue;
                }
                
                // تنسيق رقم الهاتف
                const formattedPhone = phoneNumber.startsWith('971') ? phoneNumber : `971${phoneNumber.replace(/^0+/, '')}`;
                
                // التحقق من عدم وجود تذكير مجدول مسبقاً
                const existingReminder = await prisma.whatsappMessageLog.findFirst({
                    where: {
                        recipient: formattedPhone,
                        messageType: 'payment_reminder',
                        status: 'scheduled',
                        metadata: {
                            path: 'paymentId',
                            equals: payment.id.toString()
                        }
                    }
                });
                
                if (existingReminder) {
                    console.log(`    ⏭️ تذكير موجود مسبقاً للدفع ${payment.id}`);
                    continue;
                }
                
                // حساب تاريخ الإرسال (قبل X أيام من الاستحقاق في الساعة 9:00 صباحاً)
                const reminderDate = new Date(payment.dueDate);
                reminderDate.setDate(reminderDate.getDate() - days);
                reminderDate.setHours(9, 0, 0, 0); // 9:00 صباحاً
                
                // إنشاء تذكير مجدول
                const metadata = {
                    paymentId: payment.id,
                    renterName: renter.name || 'العميل',
                    amount: payment.amount.toString(),
                    dueDate: payment.dueDate.toLocaleDateString('en-GB'),
                    daysUntilDue: days.toString(),
                    contractNumber: payment.installment.rentAgreement?.rentAgreementNumber || 'غير محدد',
                    reminderType: 'payment_reminder',
                    priority: 'normal'
                };
                
                await prisma.whatsappMessageLog.create({
                    data: {
                        recipient: formattedPhone,
                        messageType: 'payment_reminder',
                        status: 'scheduled',
                        sentAt: reminderDate,
                        message: `تذكير بدفعة بقيمة ${payment.amount} د.إ مستحقة خلال ${days} أيام`,
                        metadata: metadata,
                        clientId: renter.id
                    }
                });
                
                createdPaymentReminders++;
                console.log(`    ✅ تم إنشاء تذكير للدفع ${payment.id} (${renter.name}) - ${payment.amount} د.إ`);
            }
        }
        
        // 2. إنشاء تذكيرات للعقود المنتهية
        console.log(`\n📋 2. إنشاء تذكيرات العقود:`);
        
        const contractReminderDays = [90, 60, 30, 15, 7]; // أيام التذكير للعقود
        let createdContractReminders = 0;
        
        for (const days of contractReminderDays) {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + days);
            targetDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(targetDate);
            endDate.setDate(endDate.getDate() + 1);
            
            const contracts = await prisma.rentAgreement.findMany({
                where: {
                    status: 'ACTIVE',
                    endDate: {
                        gte: targetDate,
                        lt: endDate
                    }
                },
                include: {
                    renter: true
                }
            });
            
            console.log(`  📅 عقود منتهية خلال ${days} أيام: ${contracts.length}`);
            
            for (const contract of contracts) {
                const renter = contract.renter;
                const phoneNumber = renter.phone;
                
                if (!phoneNumber) {
                    console.log(`    ⚠️ لا يوجد رقم هاتف للعميل: ${renter.name}`);
                    continue;
                }
                
                // تنسيق رقم الهاتف
                const formattedPhone = phoneNumber.startsWith('971') ? phoneNumber : `971${phoneNumber.replace(/^0+/, '')}`;
                
                // التحقق من عدم وجود تذكير مجدول مسبقاً
                const existingReminder = await prisma.whatsappMessageLog.findFirst({
                    where: {
                        recipient: formattedPhone,
                        messageType: 'contract_expiry_reminder',
                        status: 'scheduled',
                        metadata: {
                            path: 'contractId',
                            equals: contract.id.toString()
                        }
                    }
                });
                
                if (existingReminder) {
                    console.log(`    ⏭️ تذكير موجود مسبقاً للعقد ${contract.rentAgreementNumber}`);
                    continue;
                }
                
                // حساب تاريخ الإرسال (قبل X أيام من انتهاء العقد في الساعة 9:00 صباحاً)
                const reminderDate = new Date(contract.endDate);
                reminderDate.setDate(reminderDate.getDate() - days);
                reminderDate.setHours(9, 0, 0, 0); // 9:00 صباحاً
                
                // إنشاء تذكير مجدول
                const metadata = {
                    contractId: contract.id,
                    renterName: renter.name || 'العميل',
                    contractNumber: contract.rentAgreementNumber,
                    endDate: contract.endDate.toLocaleDateString('en-GB'),
                    daysUntilExpiry: days.toString(),
                    totalAmount: contract.totalAmount?.toString() || '0',
                    reminderType: 'contract_expiry_reminder',
                    priority: 'high'
                };
                
                await prisma.whatsappMessageLog.create({
                    data: {
                        recipient: formattedPhone,
                        messageType: 'contract_expiry_reminder',
                        status: 'scheduled',
                        sentAt: reminderDate,
                        message: `تذكير بانتهاء العقد ${contract.rentAgreementNumber} خلال ${days} أيام`,
                        metadata: metadata,
                        clientId: renter.id
                    }
                });
                
                createdContractReminders++;
                console.log(`    ✅ تم إنشاء تذكير للعقد ${contract.rentAgreementNumber} (${renter.name})`);
            }
        }
        
        console.log(`\n📊 ملخص النتائج:`);
        console.log(`================`);
        console.log(`✅ تم إنشاء ${createdPaymentReminders} تذكير للدفعات`);
        console.log(`✅ تم إنشاء ${createdContractReminders} تذكير للعقود`);
        console.log(`📋 إجمالي التذكيرات المجدولة: ${createdPaymentReminders + createdContractReminders}`);
        
        // 3. فحص النتائج
        console.log(`\n🔍 فحص التذكيرات المجدولة الجديدة:`);
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const startOfTomorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
        const endOfTomorrow = new Date(startOfTomorrow);
        endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
        
        const scheduledTomorrow = await prisma.whatsappMessageLog.count({
            where: {
                status: 'scheduled',
                sentAt: {
                    gte: startOfTomorrow,
                    lt: endOfTomorrow
                }
            }
        });
        
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        const scheduledThisWeek = await prisma.whatsappMessageLog.count({
            where: {
                status: 'scheduled',
                sentAt: {
                    gte: new Date(),
                    lte: nextWeek
                }
            }
        });
        
        console.log(`📤 التذكيرات المجدولة للغد: ${scheduledTomorrow}`);
        console.log(`📆 التذكيرات المجدولة هذا الأسبوع: ${scheduledThisWeek}`);
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء التذكيرات:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// تشغيل إنشاء التذكيرات
createScheduledReminders();
