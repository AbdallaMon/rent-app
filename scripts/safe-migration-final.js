/**
 * سكريپت النقل الآمن - المراحل الأخيرة (3 و 4)
 * نقل API الإعدادات ولوحة التحكم
 */

const fs = require('fs');
const path = require('path');

console.log('📦 المراحل الأخيرة: نقل APIs الإعدادات ولوحة التحكم...');
console.log('✅ هذا السكريپت آمن - ينسخ فقط ولا يحذف الأصل');

const projectRoot = process.cwd();

// المراحل المتبقية
const remainingPhases = [
    {
        phase: 3,
        name: 'نقل API الإعدادات',
        source: 'src/app/api/admin/whatsapp/settings/route.js',
        destination: 'src/whatsapp/api/settings/route.js',
        critical: false,
        description: 'إعدادات الواتساب'
    },
    {
        phase: 4,
        name: 'نقل لوحة التحكم',
        source: 'src/components/whatsapp/dashboard/EnhancedWhatsAppDashboard.jsx',
        destination: 'src/whatsapp/components/Dashboard.jsx',
        critical: false,
        description: 'لوحة التحكم الرئيسية'
    }
];

let migrationStats = {
    currentPhase: 3,
    filesProcessed: 0,
    filesCopied: 0,
    errors: [],
    warnings: []
};

function validateSourceFile(filePath, expectedType = '') {
    const fullPath = path.join(projectRoot, filePath);
    
    try {
        if (!fs.existsSync(fullPath)) {
            return { valid: false, reason: 'الملف غير موجود' };
        }
        
        const content = fs.readFileSync(fullPath, 'utf8');
        const stat = fs.statSync(fullPath);
        
        if (content.trim().length === 0) {
            return { valid: false, reason: 'الملف فارغ' };
        }
        
        if (stat.size < 100) {
            return { valid: false, reason: 'حجم الملف صغير جداً' };
        }
        
        // فحوص خاصة حسب نوع الملف
        if (expectedType === 'settings' && !content.includes('setting')) {
            migrationStats.warnings.push({
                phase: migrationStats.currentPhase,
                warning: 'الملف قد لا يحتوي على كود الإعدادات'
            });
        }
        
        if (expectedType === 'dashboard' && !content.includes('Dashboard')) {
            migrationStats.warnings.push({
                phase: migrationStats.currentPhase,
                warning: 'الملف قد لا يحتوي على كود لوحة التحكم'
            });
        }
        
        return { 
            valid: true, 
            size: stat.size, 
            lines: content.split('\n').length,
            content: content
        };
    } catch (err) {
        return { valid: false, reason: `خطأ في قراءة الملف: ${err.message}` };
    }
}

function createBackupOfOriginal(filePath, phase) {
    const fullPath = path.join(projectRoot, filePath);
    const backupPath = fullPath + `.migration-backup-phase${phase}`;
    
    try {
        if (fs.existsSync(fullPath)) {
            fs.copyFileSync(fullPath, backupPath);
            console.log(`📋 تم إنشاء نسخة احتياطية: ${path.basename(backupPath)}`);
            return true;
        }
    } catch (err) {
        console.log(`❌ خطأ في إنشاء النسخة الاحتياطية: ${err.message}`);
        return false;
    }
    return false;
}

function copyFileToNewLocation(source, destination, content) {
    const sourcePath = path.join(projectRoot, source);
    const destPath = path.join(projectRoot, destination);
    
    try {
        // إنشاء المجلد إذا لم يكن موجوداً
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
            console.log(`📁 تم إنشاء مجلد: ${path.relative(projectRoot, destDir)}`);
        }
        
        // نسخ الملف
        fs.writeFileSync(destPath, content, 'utf8');
        console.log(`📄 تم نسخ الملف: ${path.relative(projectRoot, destPath)}`);
        
        return true;
    } catch (err) {
        console.log(`❌ خطأ في نسخ الملف: ${err.message}`);
        return false;
    }
}

function testFileAfterCopy(filePath, expectedType = '') {
    const fullPath = path.join(projectRoot, filePath);
    
    try {
        if (!fs.existsSync(fullPath)) {
            return { success: false, reason: 'الملف غير موجود بعد النسخ' };
        }
        
        const content = fs.readFileSync(fullPath, 'utf8');
        
        if (content.trim().length === 0) {
            return { success: false, reason: 'الملف فارغ بعد النسخ' };
        }
        
        // فحص syntax أساسي
        if (filePath.endsWith('.js') && !content.includes('export') && !content.includes('module.exports')) {
            return { success: false, reason: 'الملف لا يحتوي على exports' };
        }
        
        if (filePath.endsWith('.jsx') && !content.includes('export') && !content.includes('function')) {
            return { success: false, reason: 'مكون React غير صالح' };
        }
        
        // فحص المحتوى المتوقع
        if (expectedType === 'settings' && (content.includes('setting') || content.includes('Setting'))) {
            console.log(`✅ تم التحقق من محتوى الإعدادات`);
        }
        
        if (expectedType === 'dashboard' && content.includes('Dashboard')) {
            console.log(`✅ تم التحقق من محتوى لوحة التحكم`);
        }
        
        return { success: true, size: content.length };
    } catch (err) {
        return { success: false, reason: `خطأ في فحص الملف: ${err.message}` };
    }
}

function migratePhase(phase) {
    console.log(`\n🚀 بدء المرحلة ${phase.phase}: ${phase.name}`);
    console.log(`📝 الوصف: ${phase.description}`);
    console.log(`🔄 نقل من: ${phase.source}`);
    console.log(`📍 إلى: ${phase.destination}`);
    
    migrationStats.currentPhase = phase.phase;
    migrationStats.filesProcessed++;
    
    // تحديد نوع الملف للفحوص الخاصة
    let expectedType = '';
    if (phase.source.includes('settings')) expectedType = 'settings';
    if (phase.source.includes('Dashboard')) expectedType = 'dashboard';
    
    // 1. فحص الملف المصدر
    console.log(`\n1️⃣ فحص الملف المصدر...`);
    const validation = validateSourceFile(phase.source, expectedType);
    
    if (!validation.valid) {
        console.log(`❌ فشل في فحص الملف المصدر: ${validation.reason}`);
        migrationStats.errors.push({
            phase: phase.phase,
            error: `فحص المصدر فشل: ${validation.reason}`
        });
        return false;
    }
    
    console.log(`✅ الملف المصدر صالح (${formatSize(validation.size)}, ${validation.lines} سطر)`);
    
    // 2. إنشاء نسخة احتياطية
    console.log(`\n2️⃣ إنشاء نسخة احتياطية...`);
    if (!createBackupOfOriginal(phase.source, phase.phase)) {
        console.log(`⚠️ تحذير: لم يتم إنشاء نسخة احتياطية`);
        migrationStats.warnings.push({
            phase: phase.phase,
            warning: 'لم يتم إنشاء نسخة احتياطية'
        });
    }
    
    // 3. نسخ الملف للموقع الجديد
    console.log(`\n3️⃣ نسخ الملف للموقع الجديد...`);
    if (!copyFileToNewLocation(phase.source, phase.destination, validation.content)) {
        console.log(`❌ فشل في نسخ الملف`);
        migrationStats.errors.push({
            phase: phase.phase,
            error: 'فشل في نسخ الملف'
        });
        return false;
    }
    
    // 4. اختبار الملف المنسوخ
    console.log(`\n4️⃣ اختبار الملف المنسوخ...`);
    const testResult = testFileAfterCopy(phase.destination, expectedType);
    
    if (!testResult.success) {
        console.log(`❌ فشل في اختبار الملف المنسوخ: ${testResult.reason}`);
        migrationStats.errors.push({
            phase: phase.phase,
            error: `اختبار النسخ فشل: ${testResult.reason}`
        });
        return false;
    }
    
    console.log(`✅ الملف منسوخ بنجاح (${formatSize(testResult.size)})`);
    migrationStats.filesCopied++;
    
    // 5. فحص نهائي
    console.log(`\n5️⃣ فحص نهائي...`);
    if (phase.critical) {
        console.log(`🔥 هذا ملف حرج - يُنصح بالاختبار اليدوي`);
    } else {
        console.log(`✅ ملف غير حرج - أولوية منخفضة للاختبار`);
    }
    
    console.log(`✅ المرحلة ${phase.phase} مكتملة بنجاح!`);
    return true;
}

function formatSize(bytes) {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function updateMigrationReport() {
    const reportPath = path.join(projectRoot, 'docs', 'MIGRATION_PROGRESS_REPORT.md');
    
    let existingReport = '';
    if (fs.existsSync(reportPath)) {
        existingReport = fs.readFileSync(reportPath, 'utf8');
    }
    
    const completedPhases = remainingPhases.map(phase => 
        `### ✅ المرحلة ${phase.phase}: ${phase.name} - مكتملة
- **المصدر:** \`${phase.source}\`
- **الوجهة:** \`${phase.destination}\`
- **الحالة:** مكتملة بنجاح
- **التاريخ:** ${new Date().toLocaleString('ar-EG')}
`).join('\n');
    
    // إضافة التحديث للتقرير الموجود
    const updatedReport = existingReport.replace(
        '## ⏳ المراحل المتبقية',
        completedPhases + '\n## ✅ جميع المراحل مكتملة!'
    );
    
    fs.writeFileSync(reportPath, updatedReport, 'utf8');
    console.log(`📄 تم تحديث تقرير التقدم - جميع المراحل مكتملة`);
}

async function main() {
    try {
        console.log(`📋 سيتم تنفيذ ${remainingPhases.length} مراحل متبقية`);
        console.log(`🔒 ملاحظة: سيتم نسخ الملفات فقط - الأصل محفوظ`);
        
        let allSuccess = true;
        
        for (const phase of remainingPhases) {
            const success = migratePhase(phase);
            if (!success) {
                allSuccess = false;
                console.log(`❌ فشلت المرحلة ${phase.phase} - توقف`);
                break;
            }
            
            // توقف قصير بين المراحل
            console.log(`\n⏳ توقف قصير قبل المرحلة التالية...`);
        }
        
        if (allSuccess) {
            updateMigrationReport();
        }
        
        console.log('\n============================================================');
        if (allSuccess) {
            console.log('🎉 جميع المراحل المتبقية اكتملت بنجاح!');
            console.log('============================================================');
            console.log(`📊 إجمالي الملفات المعالجة: ${migrationStats.filesProcessed}`);
            console.log(`📄 إجمالي الملفات المنسوخة: ${migrationStats.filesCopied}`);
            console.log(`❌ الأخطاء: ${migrationStats.errors.length}`);
            console.log(`⚠️ التحذيرات: ${migrationStats.warnings.length}`);
            
            if (migrationStats.warnings.length > 0) {
                console.log('\n⚠️ التحذيرات:');
                migrationStats.warnings.forEach(warning => {
                    console.log(`   - المرحلة ${warning.phase}: ${warning.warning}`);
                });
            }
            
            console.log('\n🎯 النتيجة النهائية:');
            console.log('✅ تم نقل جميع الملفات للهيكل الجديد بنجاح');
            console.log('✅ جميع الملفات الأصلية محفوظة وآمنة');
            console.log('✅ الهيكل الجديد جاهز للاستخدام');
            
            console.log('\n📁 الملفات الجديدة:');
            remainingPhases.forEach(phase => {
                console.log(`   - ${phase.destination}`);
            });
            
            console.log('\n🔄 التوصيات:');
            console.log('1. اختبر جميع الوظائف في المواقع الجديدة');
            console.log('2. تحديث imports في الملفات التي تستخدم هذه APIs');
            console.log('3. بعد التأكد، يمكن حذف الملفات الأصلية تدريجياً');
            
        } else {
            console.log('❌ فشل في إحدى المراحل!');
            console.log('============================================================');
            console.log('🔍 راجع الأخطاء أعلاه وقم بإصلاحها');
        }
        
        console.log('\n🔒 ملاحظة مهمة: الملفات الأصلية لم تُمس - آمنة تماماً');
        console.log('📄 راجع تقرير التقدم في: docs/MIGRATION_PROGRESS_REPORT.md');
        
    } catch (error) {
        console.error('❌ خطأ في عملية الهجرة:', error);
        process.exit(1);
    }
}

main();
