/**
 * 🔍 نظام مراقبة بسيط للتأكد من إرسال التذكيرات
 * 📊 يستخدم الجداول الموجودة فقط
 * ✅ يضمن إرسال التذكيرات في الوقت المناسب
 * 📝 يتحقق من التسجيل الصحيح
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();

/**
 * 🔍 فحص التذكيرات المعلقة والمتأخرة
 */
async function checkPendingReminders() {
    try {
        console.log('🔍 فحص التذكيرات المعلقة...');
        
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // 1. فحص الدفعات المتأخرة
        const overduePayments = await prisma.payment.findMany({
            where: {
                dueDate: { lt: now },
                status: { in: ['PENDING', 'OVERDUE'] },
                installmentId: { not: null }
            },
            include: {
                installment: {
                    include: {
                        rentAgreement: {
                            include: { renter: true }
                        }
                    }
                }
            }
        });
        
        // 2. فحص العقود المنتهية
        const expiredContracts = await prisma.rentAgreement.findMany({
            where: {
                endDate: { lt: now },
                status: 'ACTIVE'
            },
            include: { renter: true }
        });
        
        // 3. فحص التذكيرات المرسلة اليوم
        const todayReminders = await prisma.whatsappMessageLog.findMany({
            where: {
                sentAt: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                },
                messageType: { in: ['payment_reminder', 'contract_expiry_reminder'] }
            }
        });
        
        console.log(`📊 النتائج:`);
        console.log(`   🚨 دفعات متأخرة: ${overduePayments.length}`);
        console.log(`   📋 عقود منتهية: ${expiredContracts.length}`);
        console.log(`   📱 تذكيرات مرسلة اليوم: ${todayReminders.length}`);
        
        return {
            overduePayments: overduePayments.length,
            expiredContracts: expiredContracts.length,
            todayReminders: todayReminders.length,
            needsAttention: overduePayments.length > 0 || expiredContracts.length > 0
        };
        
    } catch (error) {
        console.error('❌ خطأ في فحص التذكيرات:', error);
        return { error: error.message };
    }
}

/**
 * 📈 فحص معدل النجاح في آخر 24 ساعة
 */
async function checkSuccessRate() {
    try {
        console.log('📈 فحص معدل النجاح...');
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const recentMessages = await prisma.whatsappMessageLog.findMany({
            where: {
                sentAt: { gte: yesterday },
                messageType: { in: ['payment_reminder', 'contract_expiry_reminder'] }
            }
        });
        
        const total = recentMessages.length;
        const successful = recentMessages.filter(m => m.status === 'sent').length;
        const failed = recentMessages.filter(m => m.status === 'failed').length;
        
        const successRate = total > 0 ? (successful / total * 100) : 100;
        
        console.log(`📊 معدل النجاح (آخر 24 ساعة):`);
        console.log(`   📨 إجمالي: ${total}`);
        console.log(`   ✅ نجح: ${successful}`);
        console.log(`   ❌ فشل: ${failed}`);
        console.log(`   📈 معدل النجاح: ${Math.round(successRate)}%`);
        
        return {
            total,
            successful,
            failed,
            successRate: Math.round(successRate * 100) / 100,
            isHealthy: successRate >= 90
        };
        
    } catch (error) {
        console.error('❌ خطأ في فحص معدل النجاح:', error);
        return { error: error.message };
    }
}

/**
 * ⏰ فحص آخر تشغيل للتذكيرات
 */
async function checkLastExecution() {
    try {
        console.log('⏰ فحص آخر تشغيل...');
        
        // البحث عن آخر رسالة تذكير مرسلة
        const lastReminder = await prisma.whatsappMessageLog.findFirst({
            where: {
                messageType: { in: ['payment_reminder', 'contract_expiry_reminder'] }
            },
            orderBy: { sentAt: 'desc' }
        });
        
        if (!lastReminder) {
            console.log('⚠️ لم يتم العثور على أي تذكيرات مرسلة');
            return { lastExecution: null, status: 'no_data' };
        }
        
        const now = new Date();
        const timeDiff = now - new Date(lastReminder.sentAt);
        const hoursSince = Math.floor(timeDiff / (1000 * 60 * 60));
        
        console.log(`📊 آخر تذكير:`);
        console.log(`   📅 التاريخ: ${new Date(lastReminder.sentAt).toLocaleString('ar-SA')}`);
        console.log(`   ⏱️ منذ: ${hoursSince} ساعة`);
        console.log(`   📱 النوع: ${lastReminder.messageType}`);
        
        const status = hoursSince > 25 ? 'overdue' : hoursSince > 12 ? 'warning' : 'normal';
        
        return {
            lastExecution: lastReminder.sentAt,
            hoursSince,
            messageType: lastReminder.messageType,
            status
        };
        
    } catch (error) {
        console.error('❌ خطأ في فحص آخر تشغيل:', error);
        return { error: error.message };
    }
}

/**
 * 🔧 إصلاح التذكيرات المفقودة
 */
async function fixMissedReminders() {
    try {
        console.log('🔧 البحث عن التذكيرات المفقودة وإصلاحها...');
        
        const { runReminderJob } = require('./automated-reminder-cron-job');
        
        console.log('▶️ تشغيل مهمة التذكيرات...');
        const result = await runReminderJob();
        
        console.log('✅ تم تشغيل مهمة التذكيرات بنجاح');
        console.log(`📊 النتائج: ${result.paymentReminders.sent} دفع، ${result.contractReminders.sent} عقد`);
        
        return {
            success: true,
            paymentsSent: result.paymentReminders.sent,
            contractsSent: result.contractReminders.sent,
            errors: result.errors
        };
        
    } catch (error) {
        console.error('❌ خطأ في إصلاح التذكيرات:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 📊 تقرير شامل مبسط
 */
async function generateSimpleReport() {
    try {
        console.log('📊 إنشاء تقرير شامل...');
        console.log('='.repeat(50));
        
        // فحص التذكيرات المعلقة
        const pendingCheck = await checkPendingReminders();
        
        // فحص معدل النجاح
        const successCheck = await checkSuccessRate();
        
        // فحص آخر تشغيل
        const executionCheck = await checkLastExecution();
        
        // تحديد الحالة العامة
        let overallStatus = 'healthy';
        const issues = [];
        
        if (pendingCheck.needsAttention) {
            issues.push('تذكيرات معلقة');
        }
        
        if (successCheck.successRate < 90) {
            issues.push('معدل نجاح منخفض');
        }
        
        if (executionCheck.status === 'overdue') {
            issues.push('تأخر في التشغيل');
            overallStatus = 'critical';
        } else if (issues.length > 0) {
            overallStatus = 'warning';
        }
        
        const report = {
            timestamp: new Date().toISOString(),
            overallStatus,
            issues,
            pending: pendingCheck,
            success: successCheck,
            execution: executionCheck
        };
        
        console.log('\n📋 ملخص الحالة:');
        console.log(`🏥 الحالة العامة: ${overallStatus}`);
        if (issues.length > 0) {
            console.log(`⚠️ المشاكل: ${issues.join(', ')}`);
        } else {
            console.log('✅ النظام يعمل بشكل طبيعي');
        }
        
        // حفظ التقرير
        const fs = require('fs');
        const fileName = `simple-monitor-report-${Date.now()}.json`;
        fs.writeFileSync(fileName, JSON.stringify(report, null, 2), 'utf8');
        console.log(`💾 تم حفظ التقرير: ${fileName}`);
        
        return report;
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء التقرير:', error);
        return { error: error.message };
    }
}

/**
 * 🚀 تشغيل الفحص الشامل
 */
async function runSimpleMonitor() {
    try {
        console.log('🚀 بدء الفحص البسيط للتذكيرات');
        console.log(`⏰ الوقت: ${new Date().toLocaleString('ar-SA')}`);
        console.log('='.repeat(50));
        
        // إنشاء التقرير
        const report = await generateSimpleReport();
        
        // إذا كانت هناك مشاكل، اقترح الحلول
        if (report.overallStatus !== 'healthy') {
            console.log('\n🔧 اقتراحات للإصلاح:');
            
            if (report.pending?.needsAttention) {
                console.log('  • تشغيل مهمة التذكيرات لمعالجة المتأخرات');
            }
            
            if (report.success?.successRate < 90) {
                console.log('  • فحص إعدادات واتساب والتوكن');
            }
            
            if (report.execution?.status === 'overdue') {
                console.log('  • فحص جدولة المهام أو تشغيل التذكيرات يدوياً');
            }
            
            // عرض خيار الإصلاح التلقائي
            console.log('\n💡 هل تريد تشغيل الإصلاح التلقائي؟');
            console.log('   يمكنك تشغيل: node scripts/simple-reminder-monitor.js --fix');
        }
        
        return report;
        
    } catch (error) {
        console.error('💥 خطأ في الفحص:', error);
        return { error: error.message };
    }
}

/**
 * 🔧 تشغيل الإصلاح التلقائي
 */
async function runAutoFix() {
    try {
        console.log('🔧 بدء الإصلاح التلقائي...');
        
        // تشغيل التذكيرات
        const fixResult = await fixMissedReminders();
        
        if (fixResult.success) {
            console.log('✅ تم الإصلاح بنجاح');
            
            // فحص النتائج بعد الإصلاح
            console.log('\n🔍 فحص النتائج بعد الإصلاح...');
            await new Promise(resolve => setTimeout(resolve, 2000)); // انتظار قصير
            
            const afterReport = await generateSimpleReport();
            
            if (afterReport.overallStatus === 'healthy') {
                console.log('🎉 النظام يعمل بشكل طبيعي الآن!');
            } else {
                console.log('⚠️ قد تحتاج لتدخل يدوي إضافي');
            }
            
        } else {
            console.log('❌ فشل في الإصلاح:', fixResult.error);
        }
        
        return fixResult;
        
    } catch (error) {
        console.error('💥 خطأ في الإصلاح التلقائي:', error);
        return { success: false, error: error.message };
    }
}

// التحقق من معاملات سطر الأوامر
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');

// تشغيل النظام
if (require.main === module) {
    if (shouldFix) {
        runAutoFix()
            .then(() => process.exit(0))
            .catch(error => {
                console.error('💥 فشل في الإصلاح:', error);
                process.exit(1);
            });
    } else {
        runSimpleMonitor()
            .then(report => {
                if (report.overallStatus === 'healthy') {
                    console.log('\n🎉 النظام يعمل بشكل ممتاز!');
                    process.exit(0);
                } else {
                    console.log('\n⚠️ النظام يحتاج انتباه');
                    process.exit(1);
                }
            })
            .catch(error => {
                console.error('💥 فشل في الفحص:', error);
                process.exit(1);
            });
    }
}

module.exports = {
    checkPendingReminders,
    checkSuccessRate,
    checkLastExecution,
    fixMissedReminders,
    generateSimpleReport,
    runSimpleMonitor,
    runAutoFix
};
