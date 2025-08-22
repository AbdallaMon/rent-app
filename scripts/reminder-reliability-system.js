/**
 * 🛡️ نظام ضمانات التذكيرات - Reminder Reliability System
 * 🔒 يضمن إرسال التذكيرات في الوقت المناسب وتسجيلها بشكل صحيح
 * 📊 يراقب ويتتبع جميع العمليات مع إنشاء تقارير مفصلة
 * 🔄 يتعامل مع الأخطاء والاستثناءات بذكاء
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();

// 🔧 إعدادات نظام الضمانات
const RELIABILITY_CONFIG = {
    // فترات المراقبة (بالدقائق)
    monitoringIntervals: {
        quickCheck: 5,      // فحص سريع كل 5 دقائق
        fullCheck: 15,      // فحص شامل كل 15 دقيقة
        healthCheck: 60     // فحص صحة النظام كل ساعة
    },
    
    // حدود التنبيهات
    alertThresholds: {
        maxFailureRate: 10,     // نسبة فشل قصوى 10%
        maxResponseTime: 30000, // زمن استجابة أقصى 30 ثانية
        minSuccessRate: 90      // نسبة نجاح دنيا 90%
    },
    
    // إعدادات إعادة المحاولة
    retrySettings: {
        maxRetries: 5,          // عدد محاولات إعادة الإرسال
        retryDelay: 2000,       // تأخير بين المحاولات (ميلي ثانية)
        exponentialBackoff: true // زيادة فترة الانتظار تدريجياً
    }
};

/**
 * 📊 إنشاء جدول مراقبة العمليات
 */
async function createMonitoringTables() {
    try {
        console.log('🔧 إنشاء جداول مراقبة النظام...');
        
        // إنشاء جدول مراقبة الأداء
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS ReminderPerformanceLog (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                operationType TEXT NOT NULL,
                executionTime INTEGER,
                successCount INTEGER DEFAULT 0,
                failureCount INTEGER DEFAULT 0,
                totalProcessed INTEGER DEFAULT 0,
                errorDetails TEXT,
                systemHealth TEXT,
                memoryUsage REAL,
                cpuUsage REAL
            )
        `;
        
        // إنشاء جدول التذكيرات المجدولة
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS ScheduledReminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reminderType TEXT NOT NULL,
                targetDate DATETIME NOT NULL,
                recipientPhone TEXT NOT NULL,
                reminderData JSON,
                status TEXT DEFAULT 'pending',
                scheduledAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                processedAt DATETIME,
                attempts INTEGER DEFAULT 0,
                lastError TEXT,
                priority INTEGER DEFAULT 1
            )
        `;
        
        // إنشاء جدول تقارير النظام
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS SystemHealthReports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reportDate DATETIME DEFAULT CURRENT_TIMESTAMP,
                totalReminders INTEGER,
                successfulReminders INTEGER,
                failedReminders INTEGER,
                averageResponseTime REAL,
                systemUptime INTEGER,
                issuesDetected TEXT,
                recommendations TEXT
            )
        `;
        
        console.log('✅ تم إنشاء جداول المراقبة بنجاح');
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء جداول المراقبة:', error);
    }
}

/**
 * 📋 جدولة التذكيرات مسبقاً
 */
async function scheduleUpcomingReminders() {
    try {
        console.log('📅 جدولة التذكيرات للأيام القادمة...');
        
        const startTime = Date.now();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // جدولة تذكيرات الدفعات للأسبوع القادم
        const upcomingPayments = await findUpcomingPayments(7); // 7 أيام قادمة
        let scheduledPayments = 0;
        
        for (const payment of upcomingPayments) {
            const reminderDate = new Date(payment.dueDate);
            reminderDate.setDate(reminderDate.getDate() - 3); // تذكير قبل 3 أيام
            
            const existingSchedule = await prisma.$queryRaw`
                SELECT id FROM ScheduledReminders 
                WHERE reminderType = 'payment_reminder' 
                AND JSON_EXTRACT(reminderData, '$.paymentId') = ${payment.id.toString()}
                AND status = 'pending'
            `;
            
            if (existingSchedule.length === 0) {
                await prisma.$executeRaw`
                    INSERT INTO ScheduledReminders 
                    (reminderType, targetDate, recipientPhone, reminderData, priority)
                    VALUES (
                        'payment_reminder',
                        ${reminderDate.toISOString()},
                        ${payment.installment.rentAgreement.renter.phone},
                        ${JSON.stringify({
                            paymentId: payment.id,
                            amount: payment.amount,
                            dueDate: payment.dueDate,
                            renterName: `${payment.installment.rentAgreement.renter.firstName} ${payment.installment.rentAgreement.renter.lastName}`
                        })},
                        ${payment.isOverdue ? 3 : 1}
                    )
                `;
                scheduledPayments++;
            }
        }
        
        // جدولة تذكيرات العقود للشهر القادم
        const upcomingContracts = await findUpcomingContracts(30); // 30 يوم قادم
        let scheduledContracts = 0;
        
        for (const contract of upcomingContracts) {
            const reminderDate = new Date(contract.endDate);
            reminderDate.setDate(reminderDate.getDate() - 15); // تذكير قبل 15 يوم
            
            const existingSchedule = await prisma.$queryRaw`
                SELECT id FROM ScheduledReminders 
                WHERE reminderType = 'contract_expiry_reminder' 
                AND JSON_EXTRACT(reminderData, '$.contractId') = ${contract.id.toString()}
                AND status = 'pending'
            `;
            
            if (existingSchedule.length === 0) {
                await prisma.$executeRaw`
                    INSERT INTO ScheduledReminders 
                    (reminderType, targetDate, recipientPhone, reminderData, priority)
                    VALUES (
                        'contract_expiry_reminder',
                        ${reminderDate.toISOString()},
                        ${contract.renter.phone},
                        ${JSON.stringify({
                            contractId: contract.id,
                            contractNumber: contract.rentAgreementNumber,
                            endDate: contract.endDate,
                            renterName: `${contract.renter.firstName} ${contract.renter.lastName}`
                        })},
                        2
                    )
                `;
                scheduledContracts++;
            }
        }
        
        const executionTime = Date.now() - startTime;
        
        // تسجيل العملية
        await logPerformance('schedule_reminders', executionTime, scheduledPayments + scheduledContracts, 0);
        
        console.log(`✅ تم جدولة ${scheduledPayments} تذكير دفع و ${scheduledContracts} تذكير عقد`);
        console.log(`⏱️ وقت التنفيذ: ${executionTime}ms`);
        
        return { scheduledPayments, scheduledContracts };
        
    } catch (error) {
        console.error('❌ خطأ في جدولة التذكيرات:', error);
        await logPerformance('schedule_reminders', 0, 0, 1, error.message);
        throw error;
    }
}

/**
 * 🔍 العثور على الدفعات القادمة
 */
async function findUpcomingPayments(days) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    
    return await prisma.payment.findMany({
        where: {
            dueDate: {
                lte: endDate
            },
            status: { in: ['PENDING', 'OVERDUE'] },
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
}

/**
 * 🔍 العثور على العقود القادمة
 */
async function findUpcomingContracts(days) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    
    return await prisma.rentAgreement.findMany({
        where: {
            endDate: {
                lte: endDate
            },
            status: 'ACTIVE'
        },
        include: {
            renter: true
        }
    });
}

/**
 * ⚡ معالجة التذكيرات المجدولة
 */
async function processScheduledReminders() {
    try {
        console.log('⚡ معالجة التذكيرات المجدولة...');
        
        const startTime = Date.now();
        const now = new Date();
        
        // جلب التذكيرات المستحقة
        const dueReminders = await prisma.$queryRaw`
            SELECT * FROM ScheduledReminders 
            WHERE status = 'pending' 
            AND targetDate <= ${now.toISOString()}
            ORDER BY priority DESC, targetDate ASC
            LIMIT 50
        `;
        
        console.log(`📋 وُجد ${dueReminders.length} تذكير مستحق للمعالجة`);
        
        let processed = 0;
        let successful = 0;
        let failed = 0;
        
        for (const reminder of dueReminders) {
            try {
                // تحديث حالة التذكير إلى "معالجة"
                await prisma.$executeRaw`
                    UPDATE ScheduledReminders 
                    SET status = 'processing', attempts = attempts + 1
                    WHERE id = ${reminder.id}
                `;
                
                const reminderData = JSON.parse(reminder.reminderData);
                const result = await sendScheduledReminder(reminder.reminderType, reminder.recipientPhone, reminderData);
                
                if (result.success) {
                    // تحديث الحالة إلى "مرسل"
                    await prisma.$executeRaw`
                        UPDATE ScheduledReminders 
                        SET status = 'sent', processedAt = ${new Date().toISOString()}
                        WHERE id = ${reminder.id}
                    `;
                    successful++;
                } else {
                    // في حالة الفشل، تحديد ما إذا كان يجب إعادة المحاولة
                    if (reminder.attempts < RELIABILITY_CONFIG.retrySettings.maxRetries) {
                        const nextRetry = new Date();
                        nextRetry.setMinutes(nextRetry.getMinutes() + (reminder.attempts * 5)); // زيادة فترة الانتظار
                        
                        await prisma.$executeRaw`
                            UPDATE ScheduledReminders 
                            SET status = 'retry', targetDate = ${nextRetry.toISOString()}, lastError = ${result.error}
                            WHERE id = ${reminder.id}
                        `;
                    } else {
                        await prisma.$executeRaw`
                            UPDATE ScheduledReminders 
                            SET status = 'failed', processedAt = ${new Date().toISOString()}, lastError = ${result.error}
                            WHERE id = ${reminder.id}
                        `;
                    }
                    failed++;
                }
                
                processed++;
                
            } catch (error) {
                console.error(`❌ خطأ في معالجة التذكير ${reminder.id}:`, error);
                
                await prisma.$executeRaw`
                    UPDATE ScheduledReminders 
                    SET status = 'error', lastError = ${error.message}
                    WHERE id = ${reminder.id}
                `;
                failed++;
            }
            
            // انتظار قصير بين التذكيرات
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const executionTime = Date.now() - startTime;
        
        // تسجيل الأداء
        await logPerformance('process_scheduled', executionTime, successful, failed, null, processed);
        
        console.log(`✅ تم معالجة ${processed} تذكير: ${successful} نجح، ${failed} فشل`);
        console.log(`⏱️ وقت التنفيذ: ${executionTime}ms`);
        
        return { processed, successful, failed };
        
    } catch (error) {
        console.error('❌ خطأ في معالجة التذكيرات المجدولة:', error);
        await logPerformance('process_scheduled', 0, 0, 1, error.message);
        throw error;
    }
}

/**
 * 📤 إرسال تذكير مجدول
 */
async function sendScheduledReminder(reminderType, recipientPhone, reminderData) {
    // استيراد دالة الإرسال من الملف الرئيسي
    const { runReminderJob } = require('./automated-reminder-cron-job');
    
    try {
        // هنا يمكن استخدام نفس منطق الإرسال من الملف الرئيسي
        // مع تخصيص البيانات للتذكير المجدول
        
        console.log(`📤 إرسال ${reminderType} للرقم ${recipientPhone}`);
        
        // محاكاة إرسال التذكير (يجب استبدال هذا بالمنطق الفعلي)
        const success = Math.random() > 0.1; // 90% نسبة نجاح افتراضية
        
        if (success) {
            return { success: true, messageId: `msg_${Date.now()}` };
        } else {
            throw new Error('فشل في إرسال الرسالة');
        }
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * 📊 تسجيل أداء العمليات
 */
async function logPerformance(operationType, executionTime, successCount = 0, failureCount = 0, errorDetails = null, totalProcessed = null) {
    try {
        const systemHealth = await getSystemHealth();
        
        await prisma.$executeRaw`
            INSERT INTO ReminderPerformanceLog 
            (operationType, executionTime, successCount, failureCount, totalProcessed, errorDetails, systemHealth)
            VALUES (
                ${operationType},
                ${executionTime},
                ${successCount},
                ${failureCount},
                ${totalProcessed || (successCount + failureCount)},
                ${errorDetails},
                ${JSON.stringify(systemHealth)}
            )
        `;
        
    } catch (error) {
        console.error('❌ خطأ في تسجيل الأداء:', error);
    }
}

/**
 * 🏥 فحص صحة النظام
 */
async function getSystemHealth() {
    try {
        const memoryUsage = process.memoryUsage();
        const uptime = process.uptime();
        
        return {
            memoryUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
            memoryTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
            uptime: Math.round(uptime),
            nodeVersion: process.version,
            platform: process.platform
        };
    } catch (error) {
        return { error: error.message };
    }
}

/**
 * 🔍 مراقبة النظام والتنبيهات
 */
async function monitorSystemHealth() {
    try {
        console.log('🔍 مراقبة صحة النظام...');
        
        const last24Hours = new Date();
        last24Hours.setHours(last24Hours.getHours() - 24);
        
        // فحص الأداء في آخر 24 ساعة
        const performanceStats = await prisma.$queryRaw`
            SELECT 
                COUNT(*) as totalOperations,
                SUM(successCount) as totalSuccess,
                SUM(failureCount) as totalFailures,
                AVG(executionTime) as avgExecutionTime,
                MAX(executionTime) as maxExecutionTime
            FROM ReminderPerformanceLog 
            WHERE timestamp >= ${last24Hours.toISOString()}
        `;
        
        const stats = performanceStats[0];
        const failureRate = stats.totalFailures / (stats.totalSuccess + stats.totalFailures) * 100;
        
        // فحص التذكيرات المعلقة
        const pendingReminders = await prisma.$queryRaw`
            SELECT COUNT(*) as pendingCount 
            FROM ScheduledReminders 
            WHERE status = 'pending' AND targetDate < ${new Date().toISOString()}
        `;
        
        const issues = [];
        const recommendations = [];
        
        // تحليل المشاكل المحتملة
        if (failureRate > RELIABILITY_CONFIG.alertThresholds.maxFailureRate) {
            issues.push(`نسبة فشل عالية: ${failureRate.toFixed(2)}%`);
            recommendations.push('فحص اتصال واتساب وصحة الـ API');
        }
        
        if (stats.avgExecutionTime > RELIABILITY_CONFIG.alertThresholds.maxResponseTime) {
            issues.push(`بطء في الاستجابة: ${stats.avgExecutionTime.toFixed(0)}ms`);
            recommendations.push('تحسين استعلامات قاعدة البيانات');
        }
        
        if (pendingReminders[0].pendingCount > 10) {
            issues.push(`تذكيرات معلقة: ${pendingReminders[0].pendingCount}`);
            recommendations.push('زيادة تكرار معالجة التذكيرات');
        }
        
        // إنشاء تقرير الصحة
        await prisma.$executeRaw`
            INSERT INTO SystemHealthReports 
            (totalReminders, successfulReminders, failedReminders, averageResponseTime, systemUptime, issuesDetected, recommendations)
            VALUES (
                ${stats.totalSuccess + stats.totalFailures},
                ${stats.totalSuccess},
                ${stats.totalFailures},
                ${stats.avgExecutionTime},
                ${process.uptime()},
                ${issues.join('; ')},
                ${recommendations.join('; ')}
            )
        `;
        
        // طباعة التقرير
        console.log('\n📊 تقرير صحة النظام:');
        console.log(`✅ العمليات الناجحة: ${stats.totalSuccess}`);
        console.log(`❌ العمليات الفاشلة: ${stats.totalFailures}`);
        console.log(`📈 نسبة النجاح: ${(100 - failureRate).toFixed(2)}%`);
        console.log(`⏱️ متوسط وقت الاستجابة: ${stats.avgExecutionTime?.toFixed(0) || 0}ms`);
        console.log(`⏰ وقت تشغيل النظام: ${Math.round(process.uptime() / 3600)} ساعة`);
        
        if (issues.length > 0) {
            console.log('\n⚠️ مشاكل مكتشفة:');
            issues.forEach(issue => console.log(`  • ${issue}`));
            
            console.log('\n💡 توصيات:');
            recommendations.forEach(rec => console.log(`  • ${rec}`));
        } else {
            console.log('\n🎉 النظام يعمل بشكل مثالي!');
        }
        
        return {
            healthy: issues.length === 0,
            stats,
            issues,
            recommendations
        };
        
    } catch (error) {
        console.error('❌ خطأ في مراقبة النظام:', error);
        return { healthy: false, error: error.message };
    }
}

/**
 * 🚀 تشغيل نظام الضمانات
 */
async function runReliabilitySystem() {
    console.log('🛡️ بدء نظام ضمانات التذكيرات...');
    console.log(`⏰ الوقت: ${new Date().toLocaleString('ar-SA')}`);
    
    try {
        // إنشاء الجداول إذا لم تكن موجودة
        await createMonitoringTables();
        
        // 1️⃣ جدولة التذكيرات القادمة
        console.log('\n📅 المرحلة 1: جدولة التذكيرات...');
        const scheduleResult = await scheduleUpcomingReminders();
        
        // 2️⃣ معالجة التذكيرات المستحقة
        console.log('\n⚡ المرحلة 2: معالجة التذكيرات المستحقة...');
        const processResult = await processScheduledReminders();
        
        // 3️⃣ مراقبة صحة النظام
        console.log('\n🔍 المرحلة 3: مراقبة صحة النظام...');
        const healthResult = await monitorSystemHealth();
        
        // تقرير شامل
        console.log('\n' + '='.repeat(60));
        console.log('📋 تقرير نظام الضمانات');
        console.log('='.repeat(60));
        console.log(`📅 التذكيرات المجدولة: ${scheduleResult.scheduledPayments + scheduleResult.scheduledContracts}`);
        console.log(`⚡ التذكيرات المعالجة: ${processResult.processed}`);
        console.log(`✅ النجح: ${processResult.successful}`);
        console.log(`❌ الفاشل: ${processResult.failed}`);
        console.log(`🏥 صحة النظام: ${healthResult.healthy ? 'ممتاز' : 'يحتاج انتباه'}`);
        console.log('='.repeat(60));
        
        return {
            scheduled: scheduleResult,
            processed: processResult,
            health: healthResult
        };
        
    } catch (error) {
        console.error('💥 خطأ فادح في نظام الضمانات:', error);
        throw error;
    }
}

// تشغيل النظام إذا تم استدعاء الملف مباشرة
if (require.main === module) {
    runReliabilitySystem()
        .then(result => {
            console.log('\n🏁 انتهى تشغيل نظام الضمانات بنجاح');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 فشل نظام الضمانات:', error);
            process.exit(1);
        });
}

module.exports = {
    runReliabilitySystem,
    scheduleUpcomingReminders,
    processScheduledReminders,
    monitorSystemHealth,
    logPerformance,
    RELIABILITY_CONFIG
};
