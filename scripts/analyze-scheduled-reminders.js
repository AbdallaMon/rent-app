/**
 * 🔍 اختبار التذكيرات المجدولة ومعرفة كيفية احتسابها
 * Test scheduled reminders logic and calculations
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeScheduledReminders() {
    console.log('🔍 تحليل التذكيرات المجدولة...\n');

    try {
        // 1. فحص التذكيرات الحالية حسب الحالة
        console.log('📊 1. إحصائيات التذكيرات الحالية:');
        const currentStats = await prisma.whatsappMessageLog.groupBy({
            by: ['status', 'messageType'],
            _count: {
                id: true
            },
            where: {
                messageType: {
                    in: ['payment_reminder', 'contract_expiry_reminder', 'maintenance_reminder']
                }
            }
        });

        console.log('الإحصائيات الحالية:');
        currentStats.forEach(stat => {
            console.log(`  - ${stat.messageType} (${stat.status}): ${stat._count.id}`);
        });

        // 2. فحص كيفية حساب "للغد"
        console.log('\n📅 2. حساب التذكيرات "للغد":');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const startOfTomorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
        const endOfTomorrow = new Date(startOfTomorrow);
        endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);

        console.log(`بداية الغد: ${startOfTomorrow.toISOString()}`);
        console.log(`نهاية الغد: ${endOfTomorrow.toISOString()}`);

        // البحث عن التذكيرات المجدولة للغد (حسب الطريقة الحالية)
        const scheduledTomorrow = await prisma.whatsappMessageLog.findMany({
            where: {
                messageType: {
                    in: ['payment_reminder', 'contract_expiry_reminder', 'maintenance_reminder']
                },
                status: 'pending', // النظام يستخدم 'pending' بدلاً من 'scheduled'
                sentAt: {
                    gte: startOfTomorrow,
                    lt: endOfTomorrow
                }
            },
            include: {
                client: {
                    select: {
                        name: true,
                        phone: true
                    }
                }
            }
        });

        console.log(`📤 التذكيرات المجدولة للغد (pending): ${scheduledTomorrow.length}`);
        scheduledTomorrow.forEach(reminder => {
            console.log(`  - ${reminder.messageType} للعميل ${reminder.client?.name || 'غير محدد'} في ${reminder.sentAt}`);
        });

        // 3. فحص التذكيرات المجدولة فعلياً (بحالة scheduled)
        console.log('\n📋 3. التذكيرات المجدولة الفعلية (scheduled):');
        const actualScheduled = await prisma.whatsappMessageLog.findMany({
            where: {
                status: 'scheduled',
                messageType: {
                    in: ['payment_reminder', 'contract_expiry_reminder', 'maintenance_reminder']
                }
            },
            include: {
                client: {
                    select: {
                        name: true,
                        phone: true
                    }
                }
            }
        });

        console.log(`📋 التذكيرات المجدولة فعلياً: ${actualScheduled.length}`);
        actualScheduled.forEach(reminder => {
            console.log(`  - ${reminder.messageType} للعميل ${reminder.client?.name || 'غير محدد'} مجدولة في ${reminder.sentAt}`);
        });

        // 4. فحص كيفية حساب "هذا الأسبوع"
        console.log('\n📆 4. حساب التذكيرات "هذا الأسبوع":');
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        console.log(`من اليوم: ${startOfDay.toISOString()}`);
        console.log(`إلى الأسبوع القادم: ${nextWeek.toISOString()}`);

        const scheduledThisWeek = await prisma.whatsappMessageLog.findMany({
            where: {
                messageType: {
                    in: ['payment_reminder', 'contract_expiry_reminder', 'maintenance_reminder']
                },
                status: 'pending',
                sentAt: {
                    gte: startOfDay,
                    lte: nextWeek
                }
            },
            include: {
                client: {
                    select: {
                        name: true,
                        phone: true
                    }
                }
            }
        });

        console.log(`📆 التذكيرات المجدولة هذا الأسبوع: ${scheduledThisWeek.length}`);
        scheduledThisWeek.forEach(reminder => {
            console.log(`  - ${reminder.messageType} للعميل ${reminder.client?.name || 'غير محدد'} في ${reminder.sentAt}`);
        });        // 5. فحص الدفعات المستحقة التي قد تحتاج تذكيرات
        console.log('\n💰 5. الدفعات المستحقة للتذكير:');
        const upcomingPayments = await prisma.payment.findMany({
            where: {
                status: { in: ['PENDING', 'OVERDUE'] },
                dueDate: {
                    gte: new Date(),
                    lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // خلال 14 يوم
                },
                installmentId: { not: null }
            },
            include: {
                installment: {
                    include: {
                        rentAgreement: {
                            include: {
                                renter: {
                                    select: {
                                        name: true,
                                        phone: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                dueDate: 'asc'
            },
            take: 10
        });

        console.log(`💰 الدفعات المستحقة خلال 14 يوم: ${upcomingPayments.length}`);
        upcomingPayments.forEach(payment => {
            const daysUntilDue = Math.ceil((new Date(payment.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
            const renterName = payment.installment.rentAgreement.renter.name || 'غير محدد';
            console.log(`  - ${payment.amount} د.إ للعميل ${renterName} خلال ${daysUntilDue} أيام (${payment.dueDate.toDateString()})`);
        });

        // 6. فحص العقود المنتهية التي قد تحتاج تذكيرات
        console.log('\n📋 6. العقود المنتهية للتذكير:');
        const expiringContracts = await prisma.rentAgreement.findMany({
            where: {
                status: 'ACTIVE',
                endDate: {
                    gte: new Date(),
                    lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // خلال 90 يوم
                }
            },
            include: {
                renter: {
                    select: {
                        name: true,
                        phone: true
                    }
                }
            },
            orderBy: {
                endDate: 'asc'
            },
            take: 10
        });

        console.log(`📋 العقود المنتهية خلال 90 يوم: ${expiringContracts.length}`);
        expiringContracts.forEach(contract => {
            const daysUntilExpiry = Math.ceil((new Date(contract.endDate) - new Date()) / (1000 * 60 * 60 * 24));
            const renterName = contract.renter.name || 'غير محدد';
            console.log(`  - عقد ${contract.rentAgreementNumber} للعميل ${renterName} خلال ${daysUntilExpiry} أيام (${contract.endDate.toDateString()})`);
        });

        console.log('\n📊 ملخص التحليل:');
        console.log('================');
        console.log(`✅ التذكيرات "للغد" تُحسب من التذكيرات بحالة 'pending' المجدولة للغد`);
        console.log(`✅ التذكيرات "هذا الأسبوع" تُحسب من اليوم حتى 7 أيام قادمة`);
        console.log(`⚠️ النظام يستخدم 'pending' بدلاً من 'scheduled' في الحساب`);
        console.log(`📤 عدد التذكيرات "للغد": ${scheduledTomorrow.length}`);
        console.log(`📆 عدد التذكيرات "هذا الأسبوع": ${scheduledThisWeek.length}`);
        console.log(`💰 دفعات تحتاج تذكيرات: ${upcomingPayments.length}`);
        console.log(`📋 عقود تحتاج تذكيرات: ${expiringContracts.length}`);

        // تحليل المشكلة
        console.log('\n🔧 تحليل المشكلة:');
        console.log('=================');
        
        if (scheduledTomorrow.length === 0 && actualScheduled.length === 0 && upcomingPayments.length > 0) {
            console.log('⚠️ هناك دفعات تحتاج تذكيرات لكن لا توجد تذكيرات مجدولة');
            console.log('💡 يجب تشغيل سكريبت التذكيرات لإنشاء التذكيرات المجدولة');
        } else if (actualScheduled.length > 0) {
            console.log('✅ يوجد تذكيرات مجدولة فعلياً بحالة "scheduled"');
        } else {
            console.log('ℹ️ النظام يعمل بحالة التذكيرات "pending" وليس "scheduled"');
        }

    } catch (error) {
        console.error('❌ خطأ في تحليل التذكيرات:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// تشغيل التحليل
analyzeScheduledReminders();
