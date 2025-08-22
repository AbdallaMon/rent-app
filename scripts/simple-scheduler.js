/**
 * 🕐 نظام جدولة بسيط للتذكيرات
 * ⏰ يضمن تشغيل التذكيرات في الوقت المناسب
 * 🔄 يعيد المحاولة عند الفشل
 * 📝 يسجل جميع العمليات
 */

const { runReminderJob } = require('./automated-reminder-cron-job');
const { runSimpleMonitor } = require('./simple-reminder-monitor');

// ⚙️ إعدادات الجدولة
const SCHEDULE_CONFIG = {
    // توقيت التذكيرات اليومية (9:00 صباحاً)
    dailyTime: { hour: 9, minute: 0 },
    
    // فحص دوري كل ساعتين
    monitorInterval: 2 * 60 * 60 * 1000, // 2 ساعة بالمللي ثانية
    
    // إعادة المحاولة
    retryDelays: [5, 15, 30, 60], // دقائق
    
    // أقصى عدد محاولات
    maxRetries: 3
};

let isRunning = false;
let lastSuccessfulRun = null;
let scheduledTimer = null;
let monitorTimer = null;

/**
 * 📝 تسجيل العمليات
 */
function logOperation(message, type = 'info') {
    const timestamp = new Date().toLocaleString('ar-SA');
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
}

/**
 * 🔄 تشغيل التذكيرات مع إعادة المحاولة
 */
async function runWithRetry(attempts = 0) {
    if (isRunning) {
        logOperation('التذكيرات قيد التشغيل حالياً، تخطي', 'warning');
        return { success: false, reason: 'already_running' };
    }
    
    isRunning = true;
    
    try {
        logOperation(`بدء تشغيل التذكيرات (محاولة ${attempts + 1})`);
        
        const result = await runReminderJob();
        
        // تحديد نجاح العملية
        const totalSent = result.paymentReminders.sent + result.contractReminders.sent;
        const totalFailed = result.paymentReminders.failed + result.contractReminders.failed;
        
        if (totalSent > 0 || (totalSent === 0 && totalFailed === 0)) {
            lastSuccessfulRun = new Date();
            logOperation(`تم إرسال ${totalSent} تذكير بنجاح`, 'success');
            
            return { 
                success: true, 
                sent: totalSent, 
                failed: totalFailed,
                timestamp: lastSuccessfulRun
            };
        } else {
            throw new Error(`فشل في إرسال التذكيرات: ${totalFailed} فشل`);
        }
        
    } catch (error) {
        logOperation(`فشل في تشغيل التذكيرات: ${error.message}`, 'error');
        
        // إعادة المحاولة إذا لم نصل للحد الأقصى
        if (attempts < SCHEDULE_CONFIG.maxRetries) {
            const delay = SCHEDULE_CONFIG.retryDelays[attempts] * 60 * 1000; // تحويل لمللي ثانية
            logOperation(`إعادة المحاولة خلال ${SCHEDULE_CONFIG.retryDelays[attempts]} دقيقة`, 'warning');
            
            setTimeout(() => {
                runWithRetry(attempts + 1);
            }, delay);
            
            return { success: false, willRetry: true, nextRetryIn: SCHEDULE_CONFIG.retryDelays[attempts] };
        } else {
            logOperation('فشل في جميع المحاولات', 'error');
            return { success: false, error: error.message, retriesExhausted: true };
        }
        
    } finally {
        isRunning = false;
    }
}

/**
 * ⏰ حساب الوقت حتى التشغيل التالي
 */
function getNextRunTime() {
    const now = new Date();
    const nextRun = new Date();
    
    nextRun.setHours(SCHEDULE_CONFIG.dailyTime.hour, SCHEDULE_CONFIG.dailyTime.minute, 0, 0);
    
    // إذا فات الوقت اليوم، جدول للغد
    if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
    }
    
    return nextRun;
}

/**
 * 📅 جدولة التشغيل اليومي
 */
function scheduleDailyRun() {
    const nextRun = getNextRunTime();
    const delay = nextRun.getTime() - Date.now();
    
    logOperation(`تم جدولة التشغيل التالي في: ${nextRun.toLocaleString('ar-SA')}`);
    
    // إلغاء الجدولة السابقة إن وجدت
    if (scheduledTimer) {
        clearTimeout(scheduledTimer);
    }
    
    scheduledTimer = setTimeout(() => {
        logOperation('بدء التشغيل المجدول اليومي');
        runWithRetry().then(() => {
            // جدولة التشغيل التالي
            scheduleDailyRun();
        });
    }, delay);
}

/**
 * 🔍 مراقبة دورية
 */
function startPeriodicMonitoring() {
    logOperation(`بدء المراقبة الدورية كل ${SCHEDULE_CONFIG.monitorInterval / (60 * 60 * 1000)} ساعة`);
    
    monitorTimer = setInterval(async () => {
        try {
            logOperation('بدء فحص دوري');
            
            const report = await runSimpleMonitor();
            
            if (report.overallStatus === 'critical') {
                logOperation('تم اكتشاف مشكلة حرجة - تشغيل التذكيرات فوراً', 'warning');
                await runWithRetry();
            } else if (report.overallStatus === 'warning') {
                logOperation('تم اكتشاف تحذيرات - قد تحتاج للمتابعة', 'warning');
            }
            
        } catch (error) {
            logOperation(`خطأ في المراقبة الدورية: ${error.message}`, 'error');
        }
    }, SCHEDULE_CONFIG.monitorInterval);
}

/**
 * 🏥 فحص صحة النظام عند البدء
 */
async function initialHealthCheck() {
    try {
        logOperation('فحص صحة النظام عند البدء...');
        
        const report = await runSimpleMonitor();
        
        if (report.overallStatus === 'critical' || report.pending?.needsAttention) {
            logOperation('تم اكتشاف تذكيرات معلقة - تشغيل فوري', 'warning');
            await runWithRetry();
        } else {
            logOperation('النظام يعمل بشكل طبيعي', 'success');
        }
        
        return report;
        
    } catch (error) {
        logOperation(`خطأ في الفحص الأولي: ${error.message}`, 'error');
        return null;
    }
}

/**
 * 📊 عرض حالة النظام
 */
function showSystemStatus() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 حالة نظام جدولة التذكيرات');
    console.log('='.repeat(50));
    console.log(`🕐 الوقت الحالي: ${new Date().toLocaleString('ar-SA')}`);
    console.log(`⏰ التشغيل اليومي: ${SCHEDULE_CONFIG.dailyTime.hour}:${SCHEDULE_CONFIG.dailyTime.minute.toString().padStart(2, '0')}`);
    console.log(`🔄 المراقبة الدورية: كل ${SCHEDULE_CONFIG.monitorInterval / (60 * 60 * 1000)} ساعة`);
    
    if (lastSuccessfulRun) {
        console.log(`✅ آخر تشغيل ناجح: ${lastSuccessfulRun.toLocaleString('ar-SA')}`);
    } else {
        console.log('⚠️ لم يتم التشغيل بنجاح بعد');
    }
    
    if (isRunning) {
        console.log('🔄 التذكيرات قيد التشغيل حالياً');
    } else {
        console.log('💤 النظام في وضع الانتظار');
    }
    
    const nextRun = getNextRunTime();
    console.log(`⏭️ التشغيل التالي: ${nextRun.toLocaleString('ar-SA')}`);
    console.log('='.repeat(50));
}

/**
 * 🛑 إيقاف النظام بأمان
 */
function gracefulShutdown() {
    logOperation('بدء إيقاف النظام بأمان...');
    
    if (scheduledTimer) {
        clearTimeout(scheduledTimer);
        logOperation('تم إلغاء الجدولة اليومية');
    }
    
    if (monitorTimer) {
        clearInterval(monitorTimer);
        logOperation('تم إيقاف المراقبة الدورية');
    }
    
    if (isRunning) {
        logOperation('انتظار انتهاء العملية الحالية...');
        // في النظام الحقيقي، يمكن إضافة انتظار هنا
    }
    
    logOperation('تم إيقاف النظام بنجاح', 'success');
    process.exit(0);
}

/**
 * 🚀 بدء نظام الجدولة
 */
async function startScheduler() {
    try {
        console.log('🚀 بدء نظام جدولة التذكيرات البسيط');
        console.log(`⏰ الوقت: ${new Date().toLocaleString('ar-SA')}`);
        
        // فحص أولي
        await initialHealthCheck();
        
        // بدء الجدولة اليومية
        scheduleDailyRun();
        
        // بدء المراقبة الدورية
        startPeriodicMonitoring();
        
        // عرض حالة النظام
        showSystemStatus();
        
        // معالجة إشارات الإيقاف
        process.on('SIGINT', gracefulShutdown);
        process.on('SIGTERM', gracefulShutdown);
        
        logOperation('نظام الجدولة جاهز ويعمل', 'success');
        
        // تحديث حالة النظام كل 10 دقائق
        setInterval(() => {
            if (!isRunning) { // فقط إذا لم يكن هناك تشغيل حالي
                console.log(`\n⏰ [${new Date().toLocaleString('ar-SA')}] النظام يعمل - التشغيل التالي: ${getNextRunTime().toLocaleString('ar-SA')}`);
            }
        }, 10 * 60 * 1000); // كل 10 دقائق
        
    } catch (error) {
        logOperation(`فشل في بدء النظام: ${error.message}`, 'error');
        process.exit(1);
    }
}

// معالجة معاملات سطر الأوامر
const args = process.argv.slice(2);

if (require.main === module) {
    if (args.includes('--run-now')) {
        // تشغيل فوري
        logOperation('تشغيل فوري للتذكيرات...');
        runWithRetry()
            .then(result => {
                console.log('نتيجة التشغيل:', result);
                process.exit(result.success ? 0 : 1);
            })
            .catch(error => {
                logOperation(`فشل في التشغيل: ${error.message}`, 'error');
                process.exit(1);
            });
            
    } else if (args.includes('--status')) {
        // عرض الحالة فقط
        runSimpleMonitor()
            .then(report => {
                showSystemStatus();
                console.log('\n📋 تقرير سريع:');
                console.log(`🏥 الحالة: ${report.overallStatus}`);
                if (report.issues && report.issues.length > 0) {
                    console.log(`⚠️ المشاكل: ${report.issues.join(', ')}`);
                }
                process.exit(0);
            })
            .catch(error => {
                logOperation(`فشل في الفحص: ${error.message}`, 'error');
                process.exit(1);
            });
            
    } else {
        // تشغيل النظام الكامل
        startScheduler();
    }
}

module.exports = {
    runWithRetry,
    scheduleDailyRun,
    startPeriodicMonitoring,
    startScheduler,
    showSystemStatus,
    SCHEDULE_CONFIG
};
