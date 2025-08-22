/**
 * 🔍 تشخيص شامل لنظام التذكيرات التلقائية
 * يفحص جميع جوانب النظام لمعرفة سبب عدم إرسال التذكيرات
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnoseReminderSystem() {
    console.log('🔍 بدء التشخيص الشامل لنظام التذكيرات...\n');
    
    const report = {
        settings: { status: 'unknown', data: null },
        overdueParts: { count: 0, withPhones: 0, examples: [] },
        expiringContracts: { count: 0, withPhones: 0, examples: [] },
        reminderLogs: { total: 0, recent: 0, successful: 0, failed: 0 },
        recommendations: []
    };

    try {
        // 1️⃣ فحص إعدادات التذكيرات
        console.log('1️⃣ فحص إعدادات التذكيرات...');
        const reminderSettings = await prisma.reminderSettings.findFirst({
            where: { id: 'default_reminder_settings' }
        });
        
        if (reminderSettings) {
            report.settings.status = 'found';
            report.settings.data = {
                isActive: reminderSettings.isActive,
                enableAutoReminders: reminderSettings.enableAutoReminders,
                paymentReminderDays: reminderSettings.paymentReminderDays,
                contractReminderDays: reminderSettings.contractReminderDays,
                maxRetries: reminderSettings.maxRetries,
                messageDelay: reminderSettings.messageDelay,
                workingHours: `${reminderSettings.workingHoursStart} - ${reminderSettings.workingHoursEnd}`
            };
            console.log('✅ تم العثور على إعدادات التذكيرات');
            console.log(`   - النظام مفعّل: ${reminderSettings.isActive ? 'نعم ✅' : 'لا ❌'}`);
            console.log(`   - التذكيرات التلقائية: ${reminderSettings.enableAutoReminders ? 'نعم ✅' : 'لا ❌'}`);
        } else {
            report.settings.status = 'not_found';
            console.log('❌ لم يتم العثور على إعدادات التذكيرات');
        }

        // 2️⃣ فحص الأقساط المستحقة
        console.log('\n2️⃣ فحص الأقساط المستحقة...');
        const today = new Date();        const overdueParts = await prisma.installment.findMany({
            where: {
                endDate: { lt: today },
                status: false, // غير مدفوع
                rentAgreement: {
                    status: 'ACTIVE'
                }
            },
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
            },
            take: 5
        });

        // عدّ جميع الأقساط المستحقة
        const totalOverdue = await prisma.installment.count({
            where: {
                endDate: { lt: today },
                status: false,
                rentAgreement: {
                    status: 'ACTIVE'
                }
            }
        });

        // عدّ الأقساط المستحقة مع أرقام هواتف
        const overdueWithPhones = await prisma.installment.count({
            where: {
                endDate: { lt: today },
                status: false,
                rentAgreement: {
                    status: 'ACTIVE',
                    renter: {
                        phone: { not: null }
                    }
                }
            }
        });

        report.overdueParts = {
            count: totalOverdue,
            withPhones: overdueWithPhones,
            examples: overdueParts.map(part => ({
                id: part.id,
                dueDate: part.endDate,
                renterName: part.rentAgreement.renter.name || 
                          `${part.rentAgreement.renter.firstName || ''} ${part.rentAgreement.renter.lastName || ''}`.trim(),
                phone: part.rentAgreement.renter.phone,
                contractNumber: part.rentAgreement.rentAgreementNumber
            }))
        };

        console.log(`   📊 إجمالي الأقساط المستحقة: ${totalOverdue}`);
        console.log(`   📱 الأقساط مع أرقام هواتف: ${overdueWithPhones}`);

        // 3️⃣ فحص العقود المنتهية قريباً
        console.log('\n3️⃣ فحص العقود المنتهية قريباً...');
        const next60Days = new Date();
        next60Days.setDate(today.getDate() + 60);        const expiringContracts = await prisma.rentAgreement.findMany({
            where: {
                status: 'ACTIVE',
                endDate: {
                    gte: today,
                    lte: next60Days
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
            take: 5
        });

        const totalExpiring = await prisma.rentAgreement.count({
            where: {
                status: 'ACTIVE',
                endDate: {
                    gte: today,
                    lte: next60Days
                }
            }
        });

        const expiringWithPhones = await prisma.rentAgreement.count({
            where: {
                status: 'ACTIVE',
                endDate: {
                    gte: today,
                    lte: next60Days
                },
                renter: {
                    phone: { not: null }
                }
            }
        });

        report.expiringContracts = {
            count: totalExpiring,
            withPhones: expiringWithPhones,
            examples: expiringContracts.map(contract => ({
                id: contract.id,
                endDate: contract.endDate,
                renterName: contract.renter.name || 
                          `${contract.renter.firstName || ''} ${contract.renter.lastName || ''}`.trim(),
                phone: contract.renter.phone,
                contractNumber: contract.rentAgreementNumber
            }))
        };

        console.log(`   📊 إجمالي العقود المنتهية خلال 60 يوم: ${totalExpiring}`);
        console.log(`   📱 العقود مع أرقام هواتف: ${expiringWithPhones}`);        // 4️⃣ فحص سجلات التذكيرات
        console.log('\n4️⃣ فحص سجلات التذكيرات...');
        const totalReminders = await prisma.whatsappMessageLog.count({
            where: {
                messageType: { in: ['payment_reminder', 'contract_reminder'] }
            }
        });

        // التذكيرات الحديثة (آخر 7 أيام)
        const last7Days = new Date();
        last7Days.setDate(today.getDate() - 7);
        
        const recentReminders = await prisma.whatsappMessageLog.count({
            where: {
                messageType: { in: ['payment_reminder', 'contract_reminder'] },
                sentAt: { gte: last7Days }
            }
        });

        const successfulReminders = await prisma.whatsappMessageLog.count({
            where: {
                messageType: { in: ['payment_reminder', 'contract_reminder'] },
                status: 'SENT'
            }
        });

        const failedReminders = await prisma.whatsappMessageLog.count({
            where: {
                messageType: { in: ['payment_reminder', 'contract_reminder'] },
                status: 'FAILED'
            }
        });

        report.reminderLogs = {
            total: totalReminders,
            recent: recentReminders,
            successful: successfulReminders,
            failed: failedReminders
        };

        console.log(`   📊 إجمالي رسائل التذكيرات: ${totalReminders}`);
        console.log(`   📅 التذكيرات الحديثة (7 أيام): ${recentReminders}`);
        console.log(`   ✅ التذكيرات الناجحة: ${successfulReminders}`);
        console.log(`   ❌ التذكيرات الفاشلة: ${failedReminders}`);

        // 5️⃣ تحليل وتوصيات
        console.log('\n📋 تحليل النتائج والتوصيات:');
        
        if (!reminderSettings) {
            report.recommendations.push('❌ إنشاء إعدادات التذكيرات في قاعدة البيانات');
            console.log('1. ❌ إعدادات التذكيرات غير موجودة - يجب إنشاؤها');
        } else if (!reminderSettings.isActive || !reminderSettings.enableAutoReminders) {
            report.recommendations.push('⚠️ تفعيل نظام التذكيرات في الإعدادات');
            console.log('2. ⚠️ نظام التذكيرات معطّل - يجب تفعيله');
        }

        if (totalOverdue > 0 && overdueWithPhones > 0 && recentReminders === 0) {
            report.recommendations.push('🔄 تشغيل سكريپت التذكيرات التلقائي يدوياً لاختبار العملية');
            console.log('3. 🔄 يوجد أقساط مستحقة لكن لا توجد تذكيرات حديثة - يجب تشغيل السكريپت');
        }

        if (totalExpiring > 0 && expiringWithPhones > 0) {
            report.recommendations.push('📅 إضافة مهمة cron job لتشغيل التذكيرات يومياً');
            console.log('4. 📅 يوجد عقود منتهية قريباً - يجب جدولة التذكيرات');
        }

        if (failedReminders > successfulReminders) {
            report.recommendations.push('🔧 فحص إعدادات WhatsApp API لحل مشاكل الإرسال');
            console.log('5. 🔧 معدل فشل التذكيرات مرتفع - يجب فحص إعدادات الإرسال');
        }

        console.log('\n📊 ملخص التقرير:');
        console.log(`   🔧 حالة الإعدادات: ${report.settings.status === 'found' ? 'موجودة' : 'غير موجودة'}`);
        console.log(`   💰 أقساط مستحقة: ${report.overdueParts.count} (${report.overdueParts.withPhones} مع هواتف)`);
        console.log(`   📋 عقود منتهية قريباً: ${report.expiringContracts.count} (${report.expiringContracts.withPhones} مع هواتف)`);
        console.log(`   📱 تذكيرات حديثة: ${report.reminderLogs.recent} من أصل ${report.reminderLogs.total}`);

        return report;

    } catch (error) {
        console.error('❌ خطأ في التشخيص:', error);
        report.recommendations.push(`❌ خطأ في النظام: ${error.message}`);
        return report;
    } finally {
        await prisma.$disconnect();
    }
}

// تشغيل التشخيص
if (require.main === module) {
    diagnoseReminderSystem()
        .then(report => {
            console.log('\n✅ انتهى التشخيص بنجاح');
            
            if (report.recommendations.length > 0) {
                console.log('\n🔧 إجراءات مطلوبة:');
                report.recommendations.forEach((rec, index) => {
                    console.log(`   ${index + 1}. ${rec}`);
                });
            } else {
                console.log('\n🎉 النظام يبدو جاهزاً للعمل!');
            }
        })
        .catch(error => {
            console.error('❌ فشل التشخيص:', error);
            process.exit(1);
        });
}

module.exports = { diagnoseReminderSystem };
