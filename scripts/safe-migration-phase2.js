/**
 * سكريپت النقل الآمن - المرحلة الثانية
 * نقل API التذكيرات مع اختبار شامل
 */

const fs = require('fs');
const path = require('path');

console.log('📦 المرحلة الثانية: نقل API التذكيرات...');
console.log('✅ هذا السكريپت آمن - ينسخ فقط ولا يحذف الأصل');

const projectRoot = process.cwd();

// مرحلة نقل API التذكيرات
const phase2 = {
    phase: 2,
    name: 'نقل API التذكيرات',
    source: 'src/app/api/admin/whatsapp/reminders/route.js',
    destination: 'src/whatsapp/api/reminders/route.js',
    critical: true,
    description: 'إدارة التذكيرات والإشعارات'
};

let migrationStats = {
    currentPhase: 2,
    filesProcessed: 0,
    filesCopied: 0,
    errors: [],
    warnings: []
};

function validateSourceFile(filePath) {
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
        
        // فحص خاص للتذكيرات
        if (!content.includes('reminder') && !content.includes('Reminder')) {
            migrationStats.warnings.push({
                phase: 2,
                warning: 'الملف قد لا يحتوي على كود التذكيرات'
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

function createBackupOfOriginal(filePath) {
    const fullPath = path.join(projectRoot, filePath);
    const backupPath = fullPath + '.migration-backup-phase2';
    
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

function testFileAfterCopy(filePath) {
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
        if (!content.includes('export') && !content.includes('module.exports')) {
            return { success: false, reason: 'الملف لا يحتوي على exports' };
        }
        
        // فحص محتوى التذكيرات
        if (content.includes('reminder') || content.includes('Reminder')) {
            console.log(`✅ تم التحقق من محتوى التذكيرات`);
        }
        
        return { success: true, size: content.length };
    } catch (err) {
        return { success: false, reason: `خطأ في فحص الملف: ${err.message}` };
    }
}

function migratePhase2() {
    console.log(`\n🚀 بدء المرحلة ${phase2.phase}: ${phase2.name}`);
    console.log(`📝 الوصف: ${phase2.description}`);
    console.log(`🔄 نقل من: ${phase2.source}`);
    console.log(`📍 إلى: ${phase2.destination}`);
    
    migrationStats.filesProcessed++;
    
    // 1. فحص الملف المصدر
    console.log(`\n1️⃣ فحص الملف المصدر...`);
    const validation = validateSourceFile(phase2.source);
    
    if (!validation.valid) {
        console.log(`❌ فشل في فحص الملف المصدر: ${validation.reason}`);
        migrationStats.errors.push({
            phase: phase2.phase,
            error: `فحص المصدر فشل: ${validation.reason}`
        });
        return false;
    }
    
    console.log(`✅ الملف المصدر صالح (${formatSize(validation.size)}, ${validation.lines} سطر)`);
    
    // 2. إنشاء نسخة احتياطية
    console.log(`\n2️⃣ إنشاء نسخة احتياطية...`);
    if (!createBackupOfOriginal(phase2.source)) {
        console.log(`⚠️ تحذير: لم يتم إنشاء نسخة احتياطية`);
        migrationStats.warnings.push({
            phase: phase2.phase,
            warning: 'لم يتم إنشاء نسخة احتياطية'
        });
    }
    
    // 3. نسخ الملف للموقع الجديد
    console.log(`\n3️⃣ نسخ الملف للموقع الجديد...`);
    if (!copyFileToNewLocation(phase2.source, phase2.destination, validation.content)) {
        console.log(`❌ فشل في نسخ الملف`);
        migrationStats.errors.push({
            phase: phase2.phase,
            error: 'فشل في نسخ الملف'
        });
        return false;
    }
    
    // 4. اختبار الملف المنسوخ
    console.log(`\n4️⃣ اختبار الملف المنسوخ...`);
    const testResult = testFileAfterCopy(phase2.destination);
    
    if (!testResult.success) {
        console.log(`❌ فشل في اختبار الملف المنسوخ: ${testResult.reason}`);
        migrationStats.errors.push({
            phase: phase2.phase,
            error: `اختبار النسخ فشل: ${testResult.reason}`
        });
        return false;
    }
    
    console.log(`✅ الملف منسوخ بنجاح (${formatSize(testResult.size)})`);
    migrationStats.filesCopied++;
    
    // 5. فحص نهائي
    console.log(`\n5️⃣ فحص نهائي...`);
    console.log(`🔥 هذا ملف حرج - API التذكيرات مهم جداً`);
    console.log(`📋 يُنصح بالاختبار اليدوي للتذكيرات قبل المتابعة`);
    
    console.log(`✅ المرحلة ${phase2.phase} مكتملة بنجاح!`);
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
    
    const phase2Update = `
## ✅ المرحلة 2: ${phase2.name} - مكتملة

- **المصدر:** \`${phase2.source}\`
- **الوجهة:** \`${phase2.destination}\`
- **الحالة:** مكتملة بنجاح
- **التاريخ:** ${new Date().toLocaleString('ar-EG')}
- **الملاحظات:** ${migrationStats.warnings.length > 0 ? 'يوجد تحذيرات' : 'لا توجد مشاكل'}

`;

    // إضافة التحديث للتقرير الموجود
    const updatedReport = existingReport.replace(
        '## ⏳ المراحل المتبقية',
        phase2Update + '\n## ⏳ المراحل المتبقية'
    );
    
    fs.writeFileSync(reportPath, updatedReport, 'utf8');
    console.log(`📄 تم تحديث تقرير التقدم`);
}

async function main() {
    try {
        console.log(`📋 المرحلة الثانية: نقل API التذكيرات`);
        console.log(`🔒 ملاحظة: سيتم نسخ الملف فقط - الأصل محفوظ`);
        
        const success = migratePhase2();
        
        if (success) {
            updateMigrationReport();
        }
        
        console.log('\n============================================================');
        if (success) {
            console.log('✅ المرحلة الثانية اكتملت بنجاح!');
            console.log('============================================================');
            console.log(`📊 الملفات المعالجة: ${migrationStats.filesProcessed}`);
            console.log(`📄 الملفات المنسوخة: ${migrationStats.filesCopied}`);
            console.log(`❌ الأخطاء: ${migrationStats.errors.length}`);
            console.log(`⚠️ التحذيرات: ${migrationStats.warnings.length}`);
            
            if (migrationStats.warnings.length > 0) {
                console.log('\n⚠️ التحذيرات:');
                migrationStats.warnings.forEach(warning => {
                    console.log(`   - ${warning.warning}`);
                });
            }
            
            console.log('\n🎯 الخطوات التالية:');
            console.log('1. اختبر API التذكيرات في الموقع الجديد');
            console.log('2. تأكد من عمل التذكيرات التلقائية');
            console.log('3. شغل المرحلة التالية (API الإعدادات)');
            
            console.log('\n📁 الملف الجديد متوفر في:');
            console.log(`   ${phase2.destination}`);
        } else {
            console.log('❌ فشلت المرحلة الثانية!');
            console.log('============================================================');
            console.log('🔍 راجع الأخطاء أعلاه وقم بإصلاحها قبل المتابعة');
        }
        
        console.log('\n🔒 ملاحظة مهمة: الملفات الأصلية لم تُمس - آمنة تماماً');
        console.log('📄 راجع تقرير التقدم في: docs/MIGRATION_PROGRESS_REPORT.md');
        
    } catch (error) {
        console.error('❌ خطأ في عملية الهجرة:', error);
        process.exit(1);
    }
}

main();
