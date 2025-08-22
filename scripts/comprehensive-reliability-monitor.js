/**
 * 🛡️ نظام المراقبة والضمان الشامل للتذكيرات
 * 📊 يضمن إرسال التذكيرات في الوقت المحدد ويراقب الأداء
 * 🔔 ينبه في حالة حدوث مشاكل ويوفر تقارير مفصلة
 * 🔄 يتعامل مع الأخطاء ويعيد المحاولة تلقائياً
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();

// 📋 إعدادات نظام المراقبة
const MONITOR_CONFIG = {
    // فترات المراقبة (بالدقائق)
    checkIntervals: {
        critical: 5,    // فحص حرج كل 5 دقائق
        normal: 15,     // فحص عادي كل 15 دقيقة
        health: 60      // فحص صحة النظام كل ساعة
    },
    
    // حدود التنبيه
    alertLimits: {
        maxFailureRate: 5,      // أقصى نسبة فشل 5%
        maxResponseTime: 15000, // أقصى زمن استجابة 15 ثانية
        minSuccessRate: 95,     // أدنى نسبة نجاح 95%
        maxPendingReminders: 50 // أقصى عدد تذكيرات معلقة
    },
    
    // إعادة المحاولة
    retryConfig: {
        maxAttempts: 5,
        baseDelay: 1000,        // ثانية واحدة
        maxDelay: 30000         // 30 ثانية كحد أقصى
    }
};

/**
 * 📊 إنشاء جداول المراقبة المطلوبة
 */
async function createMonitoringTables() {
    try {
        console.log('🔧 إنشاء جداول المراقبة...');
        
        // جدول مراقبة الأداء العام
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS SystemPerformanceLog (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                operation TEXT NOT NULL,
                duration INTEGER NOT NULL,
                status TEXT NOT NULL,
                details TEXT,
                systemLoad REAL,
                memoryUsage INTEGER,
                pendingReminders INTEGER DEFAULT 0,
                successRate REAL DEFAULT 0
            )
        `;
        
        // جدول التنبيهات والإنذارات
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS SystemAlerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                alertType TEXT NOT NULL,
                severity TEXT NOT NULL,
                message TEXT NOT NULL,
                details TEXT,
                resolved BOOLEAN DEFAULT FALSE,
                resolvedAt DATETIME,
                actionTaken TEXT
            )
        `;
        
        // جدول إحصائيات التذكيرات اليومية
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS DailyReminderStats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date DATE NOT NULL UNIQUE,
                totalReminders INTEGER DEFAULT 0,
                successfulReminders INTEGER DEFAULT 0,
                failedReminders INTEGER DEFAULT 0,
                paymentReminders INTEGER DEFAULT 0,
                contractReminders INTEGER DEFAULT 0,
                avgResponseTime REAL DEFAULT 0,
                systemUptime REAL DEFAULT 0,
                notes TEXT
            )
        `;
        
        // جدول سجل العمليات المفصل
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS OperationLog (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                operationType TEXT NOT NULL,
                subOperation TEXT,
                startTime DATETIME,
                endTime DATETIME,
                duration INTEGER,
                status TEXT NOT NULL,
                input TEXT,
                output TEXT,
                errorMessage TEXT,
                retryCount INTEGER DEFAULT 0,
                processId TEXT
            )
        `;
        
        console.log('✅ تم إنشاء جداول المراقبة بنجاح');
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء جداول المراقبة:', error);
        throw error;
    }
}

/**
 * 🔍 فحص شامل لحالة النظام
 */
async function performSystemHealthCheck() {
    const startTime = Date.now();
    const checkId = `health_${Date.now()}`;
    
    try {
        console.log('🏥 بدء الفحص الشامل لصحة النظام...');
        
        // 1. فحص قاعدة البيانات
        const dbHealth = await checkDatabaseHealth();
        
        // 2. فحص التذكيرات المعلقة
        const pendingReminders = await checkPendingReminders();
        
        // 3. فحص معدل النجاح الأخير
        const recentPerformance = await checkRecentPerformance();
        
        // 4. فحص استخدام الذاكرة والنظام
        const systemResources = await checkSystemResources();
        
        // 5. فحص آخر تشغيل للتذكيرات
        const lastExecution = await checkLastExecution();
        
        const duration = Date.now() - startTime;
        
        const healthReport = {
            timestamp: new Date().toISOString(),
            duration,
            database: dbHealth,
            pendingReminders,
            performance: recentPerformance,
            system: systemResources,
            lastExecution,
            overallStatus: 'healthy' // سيتم تحديثه حسب النتائج
        };
        
        // تحديد الحالة العامة
        healthReport.overallStatus = determineOverallHealth(healthReport);
        
        // تسجيل النتائج
        await logPerformanceData('health_check', duration, 'completed', JSON.stringify(healthReport));
        
        // إرسال تنبيهات إذا لزم الأمر
        await checkForAlerts(healthReport);
        
        console.log(`✅ اكتمل الفحص الصحي في ${duration}ms - الحالة: ${healthReport.overallStatus}`);
        
        return healthReport;
        
    } catch (error) {
        const duration = Date.now() - startTime;
        await logPerformanceData('health_check', duration, 'failed', error.message);
        
        console.error('❌ خطأ في الفحص الصحي:', error);
        
        // إرسال تنبيه فشل الفحص
        await createAlert('health_check_failed', 'critical', 'فشل في فحص صحة النظام', error.message);
        
        throw error;
    }
}

/**
 * 💾 فحص صحة قاعدة البيانات
 */
async function checkDatabaseHealth() {
    try {
        const startTime = Date.now();
        
        // فحص الاتصال بقاعدة البيانات
        await prisma.$queryRaw`SELECT 1`;
        
        // فحص الجداول الأساسية
        const tables = await prisma.$queryRaw`
            SELECT name FROM sqlite_master WHERE type='table'
        `;
        
        // فحص آخر عمليات الكتابة
        const lastActivity = await prisma.whatsappMessageLog.findFirst({
            orderBy: { id: 'desc' }
        });
        
        const responseTime = Date.now() - startTime;
        
        return {
            connected: true,
            responseTime,
            tableCount: tables.length,
            lastActivity: lastActivity?.sentAt || null,
            status: responseTime < 1000 ? 'excellent' : responseTime < 3000 ? 'good' : 'slow'
        };
        
    } catch (error) {
        return {
            connected: false,
            error: error.message,
            status: 'failed'
        };
    }
}

/**
 * ⏳ فحص التذكيرات المعلقة
 */
async function checkPendingReminders() {
    try {
        // فحص التذكيرات المعلقة الحالية
        const pendingCount = await prisma.$queryRaw`
            SELECT COUNT(*) as count FROM ScheduledReminders 
            WHERE status = 'pending'
        `;
        
        // فحص التذكيرات المتأخرة
        const overdueCount = await prisma.$queryRaw`
            SELECT COUNT(*) as count FROM ScheduledReminders 
            WHERE status = 'pending' 
            AND targetDate < datetime('now')
        `;
        
        // فحص التذكيرات المُجدولة لليوم
        const todayCount = await prisma.$queryRaw`
            SELECT COUNT(*) as count FROM ScheduledReminders 
            WHERE status = 'pending' 
            AND date(targetDate) = date('now')
        `;
        
        const pending = pendingCount[0].count;
        const overdue = overdueCount[0].count;
        const today = todayCount[0].count;
        
        return {
            pending,
            overdue,
            today,
            status: overdue > 0 ? 'critical' : pending > MONITOR_CONFIG.alertLimits.maxPendingReminders ? 'warning' : 'normal'
        };
        
    } catch (error) {
        console.error('خطأ في فحص التذكيرات المعلقة:', error);
        return {
            pending: -1,
            overdue: -1,
            today: -1,
            status: 'error',
            error: error.message
        };
    }
}

/**
 * 📈 فحص الأداء الأخير
 */
async function checkRecentPerformance() {
    try {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        // إحصائيات آخر 24 ساعة
        const recentMessages = await prisma.whatsappMessageLog.findMany({
            where: {
                sentAt: {
                    gte: oneDayAgo
                }
            }
        });
        
        const total = recentMessages.length;
        const successful = recentMessages.filter(m => m.status === 'sent').length;
        const failed = recentMessages.filter(m => m.status === 'failed').length;
        
        const successRate = total > 0 ? (successful / total * 100) : 100;
        
        // متوسط زمن الاستجابة
        const avgResponseTime = recentMessages.length > 0 
            ? recentMessages.reduce((sum, m) => sum + (m.responseTime || 0), 0) / recentMessages.length 
            : 0;
        
        return {
            period: '24h',
            total,
            successful,
            failed,
            successRate: Math.round(successRate * 100) / 100,
            avgResponseTime: Math.round(avgResponseTime),
            status: successRate >= MONITOR_CONFIG.alertLimits.minSuccessRate ? 'good' : 'poor'
        };
        
    } catch (error) {
        console.error('خطأ في فحص الأداء الأخير:', error);
        return {
            period: '24h',
            total: -1,
            status: 'error',
            error: error.message
        };
    }
}

/**
 * 💻 فحص موارد النظام
 */
async function checkSystemResources() {
    try {
        const memoryUsage = process.memoryUsage();
        const uptime = process.uptime();
        
        return {
            memoryUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
            memoryTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
            uptime: Math.round(uptime / 3600), // ساعات
            pid: process.pid,
            nodeVersion: process.version,
            status: memoryUsage.heapUsed / memoryUsage.heapTotal > 0.9 ? 'high' : 'normal'
        };
        
    } catch (error) {
        return {
            status: 'error',
            error: error.message
        };
    }
}

/**
 * 🕐 فحص آخر تشغيل للتذكيرات
 */
async function checkLastExecution() {
    try {
        // البحث عن آخر تشغيل ناجح للتذكيرات
        const lastExecution = await prisma.$queryRaw`
            SELECT MAX(timestamp) as lastRun
            FROM SystemPerformanceLog 
            WHERE operation = 'reminder_job' AND status = 'completed'
        `;
        
        const lastRun = lastExecution[0]?.lastRun;
        
        if (!lastRun) {
            return {
                lastRun: null,
                timeSince: null,
                status: 'no_data'
            };
        }
        
        const timeSince = Date.now() - new Date(lastRun).getTime();
        const hoursSince = Math.round(timeSince / (1000 * 60 * 60));
        
        return {
            lastRun,
            timeSince,
            hoursSince,
            status: hoursSince > 25 ? 'overdue' : hoursSince > 12 ? 'warning' : 'normal'
        };
        
    } catch (error) {
        return {
            status: 'error',
            error: error.message
        };
    }
}

/**
 * 🎯 تحديد الحالة العامة للنظام
 */
function determineOverallHealth(healthReport) {
    const issues = [];
    
    // فحص قاعدة البيانات
    if (!healthReport.database.connected) {
        issues.push('database_disconnected');
    } else if (healthReport.database.status === 'slow') {
        issues.push('database_slow');
    }
    
    // فحص التذكيرات المعلقة
    if (healthReport.pendingReminders.status === 'critical') {
        issues.push('overdue_reminders');
    } else if (healthReport.pendingReminders.status === 'warning') {
        issues.push('high_pending_reminders');
    }
    
    // فحص الأداء
    if (healthReport.performance.status === 'poor') {
        issues.push('poor_performance');
    }
    
    // فحص الذاكرة
    if (healthReport.system.status === 'high') {
        issues.push('high_memory_usage');
    }
    
    // فحص آخر تشغيل
    if (healthReport.lastExecution.status === 'overdue') {
        issues.push('missed_execution');
    }
    
    // تحديد الحالة النهائية
    if (issues.length === 0) {
        return 'healthy';
    } else if (issues.some(issue => ['database_disconnected', 'overdue_reminders', 'missed_execution'].includes(issue))) {
        return 'critical';
    } else if (issues.length > 2) {
        return 'warning';
    } else {
        return 'minor_issues';
    }
}

/**
 * 🚨 فحص وإرسال التنبيهات
 */
async function checkForAlerts(healthReport) {
    try {
        const alerts = [];
        
        // تنبيهات قاعدة البيانات
        if (!healthReport.database.connected) {
            alerts.push({
                type: 'database_connection',
                severity: 'critical',
                message: 'فقدان الاتصال بقاعدة البيانات',
                details: healthReport.database.error
            });
        }
        
        // تنبيهات التذكيرات المتأخرة
        if (healthReport.pendingReminders.overdue > 0) {
            alerts.push({
                type: 'overdue_reminders',
                severity: 'critical',
                message: `يوجد ${healthReport.pendingReminders.overdue} تذكير متأخر`,
                details: `إجمالي المعلق: ${healthReport.pendingReminders.pending}`
            });
        }
        
        // تنبيهات الأداء
        if (healthReport.performance.successRate < MONITOR_CONFIG.alertLimits.minSuccessRate) {
            alerts.push({
                type: 'low_success_rate',
                severity: 'warning',
                message: `معدل النجاح منخفض: ${healthReport.performance.successRate}%`,
                details: `فشل ${healthReport.performance.failed} من ${healthReport.performance.total} رسالة`
            });
        }
        
        // تنبيهات التشغيل
        if (healthReport.lastExecution.status === 'overdue') {
            alerts.push({
                type: 'missed_execution',
                severity: 'critical',
                message: `لم يتم تشغيل التذكيرات منذ ${healthReport.lastExecution.hoursSince} ساعة`,
                details: `آخر تشغيل: ${healthReport.lastExecution.lastRun}`
            });
        }
        
        // إنشاء التنبيهات
        for (const alert of alerts) {
            await createAlert(alert.type, alert.severity, alert.message, alert.details);
        }
        
        if (alerts.length > 0) {
            console.log(`🚨 تم إنشاء ${alerts.length} تنبيه جديد`);
        }
        
    } catch (error) {
        console.error('❌ خطأ في فحص التنبيهات:', error);
    }
}

/**
 * 📝 إنشاء تنبيه جديد
 */
async function createAlert(alertType, severity, message, details = null) {
    try {
        await prisma.$executeRaw`
            INSERT INTO SystemAlerts (alertType, severity, message, details)
            VALUES (${alertType}, ${severity}, ${message}, ${details})
        `;
        
        console.log(`🚨 [${severity.toUpperCase()}] ${message}`);
        
        // يمكن إضافة إرسال تنبيهات عبر واتساب أو ايميل للمسؤولين هنا
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء التنبيه:', error);
    }
}

/**
 * 📊 تسجيل بيانات الأداء
 */
async function logPerformanceData(operation, duration, status, details = null) {
    try {
        const systemLoad = process.cpuUsage();
        const memoryUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        
        // فحص عدد التذكيرات المعلقة
        const pendingReminders = await prisma.$queryRaw`
            SELECT COUNT(*) as count FROM ScheduledReminders 
            WHERE status = 'pending'
        `;
        
        await prisma.$executeRaw`
            INSERT INTO SystemPerformanceLog 
            (operation, duration, status, details, systemLoad, memoryUsage, pendingReminders)
            VALUES (${operation}, ${duration}, ${status}, ${details}, ${0}, ${memoryUsage}, ${pendingReminders[0].count})
        `;
        
    } catch (error) {
        console.error('❌ خطأ في تسجيل بيانات الأداء:', error);
    }
}

/**
 * 📈 إنشاء تقرير يومي شامل
 */
async function generateDailyReport() {
    try {
        console.log('📊 إنشاء التقرير اليومي الشامل...');
        
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);
        
        // إحصائيات التذكيرات
        const reminderStats = await prisma.whatsappMessageLog.findMany({
            where: {
                sentAt: {
                    gte: yesterday,
                    lt: todayStart
                }
            }
        });
        
        // إحصائيات الأداء
        const performanceStats = await prisma.$queryRaw`
            SELECT 
                COUNT(*) as totalOperations,
                AVG(duration) as avgDuration,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
            FROM SystemPerformanceLog
            WHERE timestamp >= ${yesterday.toISOString()} AND timestamp < ${todayStart.toISOString()}
        `;
        
        // إحصائيات التنبيهات
        const alertStats = await prisma.$queryRaw`
            SELECT 
                COUNT(*) as totalAlerts,
                SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
                SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END) as warnings
            FROM SystemAlerts
            WHERE timestamp >= ${yesterday.toISOString()} AND timestamp < ${todayStart.toISOString()}
        `;
        
        const totalReminders = reminderStats.length;
        const successfulReminders = reminderStats.filter(r => r.status === 'sent').length;
        const failedReminders = totalReminders - successfulReminders;
        const successRate = totalReminders > 0 ? (successfulReminders / totalReminders * 100) : 100;
        
        const paymentReminders = reminderStats.filter(r => r.messageType === 'payment_reminder').length;
        const contractReminders = reminderStats.filter(r => r.messageType === 'contract_expiry_reminder').length;
        
        const avgResponseTime = reminderStats.length > 0 
            ? reminderStats.reduce((sum, r) => sum + (r.responseTime || 0), 0) / reminderStats.length 
            : 0;
        
        const report = {
            date: yesterday.toDateString(),
            period: 'يومي',
            reminders: {
                total: totalReminders,
                successful: successfulReminders,
                failed: failedReminders,
                successRate: Math.round(successRate * 100) / 100,
                payment: paymentReminders,
                contract: contractReminders,
                avgResponseTime: Math.round(avgResponseTime)
            },
            performance: {
                totalOperations: performanceStats[0]?.totalOperations || 0,
                avgDuration: Math.round(performanceStats[0]?.avgDuration || 0),
                successful: performanceStats[0]?.successful || 0,
                failed: performanceStats[0]?.failed || 0
            },
            alerts: {
                total: alertStats[0]?.totalAlerts || 0,
                critical: alertStats[0]?.critical || 0,
                warnings: alertStats[0]?.warnings || 0
            },
            systemHealth: await checkSystemResources(),
            timestamp: new Date().toISOString()
        };
        
        // حفظ الإحصائيات اليومية
        await prisma.$executeRaw`
            INSERT OR REPLACE INTO DailyReminderStats 
            (date, totalReminders, successfulReminders, failedReminders, 
             paymentReminders, contractReminders, avgResponseTime)
            VALUES (${yesterday.toISOString().split('T')[0]}, ${totalReminders}, 
                    ${successfulReminders}, ${failedReminders}, ${paymentReminders}, 
                    ${contractReminders}, ${avgResponseTime})
        `;
        
        // حفظ التقرير كملف
        const reportJson = JSON.stringify(report, null, 2);
        const fs = require('fs');
        const fileName = `comprehensive-daily-report-${yesterday.toISOString().split('T')[0]}.json`;
        fs.writeFileSync(fileName, reportJson, 'utf8');
        
        console.log(`📋 تم إنشاء التقرير اليومي: ${fileName}`);
        console.log(`📊 الملخص: ${totalReminders} تذكير، نجح ${successfulReminders}، فشل ${failedReminders} (${Math.round(successRate)}%)`);
        
        return report;
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء التقرير اليومي:', error);
        throw error;
    }
}

/**
 * 🔄 تشغيل دورة مراقبة شاملة
 */
async function runComprehensiveMonitoring() {
    const startTime = Date.now();
    
    try {
        console.log('🚀 بدء دورة المراقبة الشاملة...');
        
        // إنشاء الجداول إذا لم تكن موجودة
        await createMonitoringTables();
        
        // تشغيل فحص صحة النظام
        const healthReport = await performSystemHealthCheck();
        
        // فحص التذكيرات المتأخرة وتشغيلها
        await processOverdueReminders();
        
        // تنظيف البيانات القديمة
        await cleanupOldData();
        
        const duration = Date.now() - startTime;
        
        console.log(`✅ اكتملت دورة المراقبة في ${duration}ms`);
        console.log(`🏥 حالة النظام: ${healthReport.overallStatus}`);
        
        return {
            success: true,
            duration,
            healthStatus: healthReport.overallStatus,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        const duration = Date.now() - startTime;
        
        console.error('❌ خطأ في دورة المراقبة:', error);
        
        await createAlert('monitoring_failed', 'critical', 'فشل في دورة المراقبة', error.message);
        
        return {
            success: false,
            duration,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * ⚡ معالجة التذكيرات المتأخرة
 */
async function processOverdueReminders() {
    try {
        console.log('⚡ فحص ومعالجة التذكيرات المتأخرة...');
        
        // البحث عن التذكيرات المتأخرة
        const overdueReminders = await prisma.$queryRaw`
            SELECT * FROM ScheduledReminders 
            WHERE status = 'pending' 
            AND targetDate < datetime('now')
            ORDER BY priority DESC, targetDate ASC
            LIMIT 20
        `;
        
        if (overdueReminders.length === 0) {
            console.log('✅ لا توجد تذكيرات متأخرة');
            return { processed: 0 };
        }
        
        console.log(`🔄 معالجة ${overdueReminders.length} تذكير متأخر`);
        
        // تشغيل نظام المعالجة الموثوق
        const { runReliabilitySystem } = require('./reminder-reliability-system');
        const result = await runReliabilitySystem();
        
        return result;
        
    } catch (error) {
        console.error('❌ خطأ في معالجة التذكيرات المتأخرة:', error);
        throw error;
    }
}

/**
 * 🧹 تنظيف البيانات القديمة
 */
async function cleanupOldData() {
    try {
        console.log('🧹 تنظيف البيانات القديمة...');
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // حذف سجلات الأداء القديمة
        const deletedPerformance = await prisma.$executeRaw`
            DELETE FROM SystemPerformanceLog 
            WHERE timestamp < ${thirtyDaysAgo.toISOString()}
        `;
        
        // حذف التنبيهات المحلولة القديمة
        const deletedAlerts = await prisma.$executeRaw`
            DELETE FROM SystemAlerts 
            WHERE resolved = TRUE 
            AND timestamp < ${thirtyDaysAgo.toISOString()}
        `;
        
        // حذف سجلات العمليات القديمة
        const deletedOperations = await prisma.$executeRaw`
            DELETE FROM OperationLog 
            WHERE timestamp < ${thirtyDaysAgo.toISOString()}
        `;
        
        console.log(`🗑️ تم حذف ${deletedPerformance} سجل أداء، ${deletedAlerts} تنبيه، ${deletedOperations} عملية`);
        
    } catch (error) {
        console.error('❌ خطأ في تنظيف البيانات:', error);
        // لا نريد أن يوقف خطأ التنظيف دورة المراقبة
    }
}

/**
 * 🎯 تشغيل النظام الشامل
 */
async function startComprehensiveReliabilitySystem() {
    try {
        console.log('🛡️ بدء نظام الضمان والمراقبة الشامل للتذكيرات');
        console.log(`⏰ الوقت: ${new Date().toLocaleString('ar-SA')}`);
        console.log('=====================================');
        
        // تشغيل دورة أولية
        const initialResult = await runComprehensiveMonitoring();
        
        if (initialResult.success) {
            console.log('✅ تم تشغيل النظام بنجاح');
            console.log(`🏥 حالة النظام: ${initialResult.healthStatus}`);
        } else {
            console.error('❌ فشل في التشغيل الأولي:', initialResult.error);
        }
        
        console.log('\n📊 النظام الآن يراقب:');
        console.log('  • التذكيرات المعلقة والمتأخرة');
        console.log('  • أداء قاعدة البيانات');
        console.log('  • معدلات النجاح والفشل');
        console.log('  • استخدام موارد النظام');
        console.log('  • التنبيهات والإنذارات');
        
        return initialResult;
        
    } catch (error) {
        console.error('💥 خطأ حرج في بدء النظام:', error);
        process.exit(1);
    }
}

// تشغيل النظام إذا تم استدعاء الملف مباشرة
if (require.main === module) {
    startComprehensiveReliabilitySystem()
        .then(() => {
            console.log('\n🎉 نظام المراقبة الشامل جاهز!');
            console.log('💡 يمكنك الآن مراقبة الأداء من خلال جداول قاعدة البيانات');
        })
        .catch(error => {
            console.error('💥 فشل في تشغيل النظام:', error);
            process.exit(1);
        });
}

module.exports = {
    runComprehensiveMonitoring,
    performSystemHealthCheck,
    generateDailyReport,
    createMonitoringTables,
    checkPendingReminders,
    processOverdueReminders,
    MONITOR_CONFIG
};
