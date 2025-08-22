/**
 * 🕒 نظام Cron Jobs الموثوق للتذكيرات
 * ⏰ يضمن تشغيل التذكيرات في الأوقات المحددة
 * 🔄 يتعامل مع الأخطاء ويعيد المحاولة تلقائياً
 * 📊 يسجل جميع العمليات ويراقب الأداء
 */

const cron = require('node-cron');
const { runReminderJob } = require('./automated-reminder-cron-job');
const { runReliabilitySystem } = require('./reminder-reliability-system');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 📅 جدولة المهام
const CRON_SCHEDULES = {
    // التذكيرات الرئيسية - كل يوم في الساعة 9:00 صباحاً
    mainReminders: '0 9 * * *',
    
    // فحص التذكيرات المستحقة - كل ساعة
    hourlyCheck: '0 * * * *',
    
    // الفحص السريع - كل 15 دقيقة
    quickCheck: '*/15 * * * *',
    
    // تقرير صحة النظام - كل 6 ساعات
    healthReport: '0 */6 * * *',
    
    // تنظيف السجلات القديمة - يومياً في منتصف الليل
    cleanup: '0 0 * * *'
};

/**
 * 📊 تسجيل تشغيل المهام
 */
async function logCronExecution(jobName, status, duration = null, details = null) {
    try {
        const logEntry = {
            jobName,
            status, // 'started', 'completed', 'failed'
            timestamp: new Date(),
            duration,
            details: details || null,
            serverId: process.env.SERVER_ID || 'main'
        };
        
        // إنشاء جدول السجلات إذا لم يكن موجود
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS CronJobLogs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                jobName TEXT NOT NULL,
                status TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                duration INTEGER,
                details TEXT,
                serverId TEXT
            )
        `;
        
        await prisma.$executeRaw`
            INSERT INTO CronJobLogs (jobName, status, timestamp, duration, details, serverId)
            VALUES (${jobName}, ${status}, ${logEntry.timestamp.toISOString()}, ${duration}, ${details}, ${logEntry.serverId})
        `;
        
        console.log(`📝 [${jobName}] ${status}: ${details || ''}`);
        
    } catch (error) {
        console.error(`❌ خطأ في تسجيل Cron Job ${jobName}:`, error);
    }
}

/**
 * 🛡️ تشغيل مهمة محمية من الأخطاء
 */
async function runProtectedJob(jobName, jobFunction, retries = 3) {
    const startTime = Date.now();
    
    try {
        await logCronExecution(jobName, 'started');
        
        let lastError = null;
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`🚀 [${jobName}] بدء المحاولة ${attempt}/${retries}`);
                
                const result = await jobFunction();
                const duration = Date.now() - startTime;
                
                await logCronExecution(jobName, 'completed', duration, `نجحت في المحاولة ${attempt}`);
                
                console.log(`✅ [${jobName}] اكتملت بنجاح في ${duration}ms`);
                return result;
                
            } catch (error) {
                lastError = error;
                console.error(`❌ [${jobName}] فشلت المحاولة ${attempt}:`, error.message);
                
                if (attempt < retries) {
                    const delayTime = attempt * 2000; // زيادة تدريجية للانتظار
                    console.log(`⏳ [${jobName}] انتظار ${delayTime}ms قبل المحاولة التالية...`);
                    await new Promise(resolve => setTimeout(resolve, delayTime));
                }
            }
        }
        
        // إذا فشلت جميع المحاولات
        const duration = Date.now() - startTime;
        await logCronExecution(jobName, 'failed', duration, `فشل بعد ${retries} محاولات: ${lastError?.message}`);
        
        console.error(`💥 [${jobName}] فشل نهائياً بعد ${retries} محاولات`);
        
        // إرسال تنبيه (يمكن إضافة إرسال ايميل أو واتساب للمسؤولين)
        await sendFailureAlert(jobName, lastError);
        
    } catch (error) {
        const duration = Date.now() - startTime;
        await logCronExecution(jobName, 'error', duration, `خطأ نظام: ${error.message}`);
        console.error(`💥 [${jobName}] خطأ نظام:`, error);
    }
}

/**
 * 🚨 إرسال تنبيه في حالة الفشل
 */
async function sendFailureAlert(jobName, error) {
    try {
        console.log(`🚨 إرسال تنبيه فشل للمهمة: ${jobName}`);
        
        const alertMessage = `🚨 تنبيه فشل نظام التذكيرات
        
📋 المهمة: ${jobName}
⏰ الوقت: ${new Date().toLocaleString('ar-SA')}
❌ الخطأ: ${error?.message || 'خطأ غير معروف'}
🖥️ الخادم: ${process.env.SERVER_ID || 'main'}

يُرجى فحص النظام فوراً.`;

        // يمكن إضافة إرسال التنبيه عبر واتساب أو ايميل للمسؤولين
        console.log(alertMessage);
        
        // حفظ التنبيه في قاعدة البيانات
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS SystemAlerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                alertType TEXT NOT NULL,
                message TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                resolved BOOLEAN DEFAULT FALSE
            )
        `;
        
        await prisma.$executeRaw`
            INSERT INTO SystemAlerts (alertType, message)
            VALUES ('cron_failure', ${alertMessage})
        `;
        
    } catch (alertError) {
        console.error('❌ خطأ في إرسال التنبيه:', alertError);
    }
}

/**
 * 🧹 تنظيف السجلات القديمة
 */
async function cleanupOldLogs() {
    try {
        console.log('🧹 تنظيف السجلات القديمة...');
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // حذف سجلات Cron Jobs القديمة
        const deletedCronLogs = await prisma.$executeRaw`
            DELETE FROM CronJobLogs 
            WHERE timestamp < ${thirtyDaysAgo.toISOString()}
        `;
        
        // حذف سجلات الأداء القديمة
        const deletedPerfLogs = await prisma.$executeRaw`
            DELETE FROM ReminderPerformanceLog 
            WHERE timestamp < ${thirtyDaysAgo.toISOString()}
        `;
        
        // حذف التذكيرات المكتملة القديمة
        const deletedReminders = await prisma.$executeRaw`
            DELETE FROM ScheduledReminders 
            WHERE status IN ('sent', 'failed') 
            AND processedAt < ${thirtyDaysAgo.toISOString()}
        `;
        
        console.log(`✅ تم حذف ${deletedCronLogs} سجل Cron، ${deletedPerfLogs} سجل أداء، ${deletedReminders} تذكير قديم`);
        
    } catch (error) {
        console.error('❌ خطأ في تنظيف السجلات:', error);
        throw error;
    }
}

/**
 * 📊 إنشاء تقرير يومي
 */
async function generateDailyReport() {
    try {
        console.log('📊 إنشاء التقرير اليومي...');
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // إحصائيات التذكيرات
        const reminderStats = await prisma.whatsappMessageLog.findMany({
            where: {
                sentAt: {
                    gte: yesterday,
                    lt: today
                }
            }
        });
        
        // إحصائيات Cron Jobs
        const cronStats = await prisma.$queryRaw`
            SELECT 
                jobName,
                COUNT(*) as executions,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                AVG(duration) as avgDuration
            FROM CronJobLogs
            WHERE timestamp >= ${yesterday.toISOString()} AND timestamp < ${today.toISOString()}
            GROUP BY jobName
        `;
        
        const totalReminders = reminderStats.length;
        const successfulReminders = reminderStats.filter(r => r.status === 'sent').length;
        const successRate = totalReminders > 0 ? (successfulReminders / totalReminders * 100).toFixed(2) : 0;
        
        const report = {
            date: yesterday.toDateString(),
            reminders: {
                total: totalReminders,
                successful: successfulReminders,
                failed: totalReminders - successfulReminders,
                successRate: `${successRate}%`
            },
            cronJobs: cronStats,
            systemHealth: await getSystemHealth()
        };
        
        // حفظ التقرير
        const reportJson = JSON.stringify(report, null, 2);
        require('fs').writeFileSync(
            `daily-report-${yesterday.toISOString().split('T')[0]}.json`,
            reportJson,
            'utf8'
        );
        
        console.log(`📋 تم إنشاء التقرير اليومي: ${totalReminders} تذكير، معدل النجاح: ${successRate}%`);
        
        return report;
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء التقرير اليومي:', error);
        throw error;
    }
}

/**
 * 🏥 فحص صحة النظام البسيط
 */
async function getSystemHealth() {
    const memoryUsage = process.memoryUsage();
    return {
        uptime: Math.round(process.uptime() / 3600), // ساعات
        memoryUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        timestamp: new Date().toISOString()
    };
}

/**
 * 🚀 تهيئة وتشغيل جميع المهام المجدولة
 */
function initializeCronJobs() {
    console.log('🕒 تهيئة نظام Cron Jobs...');
    
    // 1️⃣ التذكيرات الرئيسية - يومياً في 9:00 صباحاً
    cron.schedule(CRON_SCHEDULES.mainReminders, () => {
        runProtectedJob('main_reminders', async () => {
            const result = await runReminderJob();
            return `إرسال ${result.paymentReminders.sent + result.contractReminders.sent} تذكير`;
        });
    }, {
        scheduled: true,
        timezone: "Asia/Dubai"
    });
    
    // 2️⃣ الفحص كل ساعة
    cron.schedule(CRON_SCHEDULES.hourlyCheck, () => {
        runProtectedJob('hourly_check', async () => {
            const result = await runReliabilitySystem();
            return `معالجة ${result.processed?.processed || 0} تذكير مجدول`;
        });
    }, {
        scheduled: true,
        timezone: "Asia/Dubai"
    });
    
    // 3️⃣ الفحص السريع كل 15 دقيقة
    cron.schedule(CRON_SCHEDULES.quickCheck, () => {
        runProtectedJob('quick_check', async () => {
            // فحص سريع للتذكيرات العاجلة فقط
            const urgentReminders = await prisma.$queryRaw`
                SELECT COUNT(*) as count FROM ScheduledReminders 
                WHERE status = 'pending' 
                AND targetDate <= datetime('now') 
                AND priority >= 3
            `;
            
            if (urgentReminders[0].count > 0) {
                const result = await runReliabilitySystem();
                return `معالجة ${urgentReminders[0].count} تذكير عاجل`;
            }
            
            return 'لا توجد تذكيرات عاجلة';
        });
    }, {
        scheduled: true,
        timezone: "Asia/Dubai"
    });
    
    // 4️⃣ تقرير صحة النظام كل 6 ساعات
    cron.schedule(CRON_SCHEDULES.healthReport, () => {
        runProtectedJob('health_report', async () => {
            const health = await getSystemHealth();
            return `الذاكرة: ${health.memoryUsed}MB، وقت التشغيل: ${health.uptime}h`;
        });
    }, {
        scheduled: true,
        timezone: "Asia/Dubai"
    });
    
    // 5️⃣ تنظيف السجلات يومياً في منتصف الليل
    cron.schedule(CRON_SCHEDULES.cleanup, () => {
        runProtectedJob('cleanup', cleanupOldLogs);
    }, {
        scheduled: true,
        timezone: "Asia/Dubai"
    });
    
    // 6️⃣ التقرير اليومي في الساعة 11:00 مساءً
    cron.schedule('0 23 * * *', () => {
        runProtectedJob('daily_report', generateDailyReport);
    }, {
        scheduled: true,
        timezone: "Asia/Dubai"
    });
    
    console.log('✅ تم تهيئة جميع مهام Cron Jobs بنجاح');
    console.log('📋 المهام المفعلة:');
    console.log('  • التذكيرات الرئيسية: يومياً 9:00 ص');
    console.log('  • الفحص كل ساعة: كل ساعة');
    console.log('  • الفحص السريع: كل 15 دقيقة');
    console.log('  • تقرير الصحة: كل 6 ساعات');
    console.log('  • تنظيف السجلات: يومياً 12:00 ص');
    console.log('  • التقرير اليومي: يومياً 11:00 م');
}

/**
 * 🔧 تشغيل النظام
 */
async function startReliableCronSystem() {
    try {
        console.log('🛡️ بدء نظام Cron Jobs الموثوق للتذكيرات');
        console.log(`⏰ الوقت: ${new Date().toLocaleString('ar-SA')}`);
        
        // تهيئة المهام المجدولة
        initializeCronJobs();
        
        // تشغيل فحص أولي
        console.log('\n🔍 تشغيل فحص أولي...');
        await runProtectedJob('initial_check', async () => {
            const result = await runReliabilitySystem();
            return 'فحص أولي مكتمل';
        });
        
        console.log('\n🎉 نظام Cron Jobs جاهز ويعمل!');
        console.log('📊 يمكنك مراقبة الأداء من خلال جداول قاعدة البيانات:');
        console.log('  • CronJobLogs - سجلات تشغيل المهام');
        console.log('  • ReminderPerformanceLog - سجلات أداء التذكيرات');
        console.log('  • SystemAlerts - تنبيهات النظام');
        
        // إبقاء العملية قيد التشغيل
        process.on('SIGINT', () => {
            console.log('\n⏹️ تم إيقاف نظام Cron Jobs');
            process.exit(0);
        });
        
    } catch (error) {
        console.error('💥 خطأ في بدء نظام Cron Jobs:', error);
        process.exit(1);
    }
}

// تشغيل النظام إذا تم استدعاء الملف مباشرة
if (require.main === module) {
    startReliableCronSystem();
}

module.exports = {
    initializeCronJobs,
    runProtectedJob,
    logCronExecution,
    cleanupOldLogs,
    generateDailyReport,
    CRON_SCHEDULES
};
