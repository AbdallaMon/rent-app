/**
 * سكريپت النقل الآمن للهيكل الجديد - مرحلة أولى
 * ينقل ملف واحد في كل مرة مع اختبار شامل
 */

const fs = require('fs');
const path = require('path');

console.log('📦 بدء النقل الآمن للهيكل الجديد...');
console.log('✅ هذا السكريپت آمن - ينسخ فقط ولا يحذف الأصل');

const projectRoot = process.cwd();

// خطة النقل المرحلية (ملف واحد في كل مرة)
const migrationPhases = [
    {
        phase: 1,
        name: 'نقل API البوت الأساسي',
        source: 'src/app/api/notifications/whatsapp/webhook/route.js',
        destination: 'src/whatsapp/api/webhook/route.js',
        critical: true,
        description: 'البوت الأساسي - استقبال ومعالجة الرسائل'
    },
    {
        phase: 2,
        name: 'نقل API التذكيرات',
        source: 'src/app/api/admin/whatsapp/reminders/route.js',
        destination: 'src/whatsapp/api/reminders/route.js',
        critical: true,
        description: 'إدارة التذكيرات والإشعارات'
    },
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
    currentPhase: 0,
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
    const backupPath = fullPath + '.migration-backup';
    
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
        if (filePath.endsWith('.js')) {
            if (!content.includes('export') && !content.includes('module.exports')) {
                return { success: false, reason: 'الملف لا يحتوي على exports' };
            }
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
    
    // 1. فحص الملف المصدر
    console.log(`\n1️⃣ فحص الملف المصدر...`);
    const validation = validateSourceFile(phase.source);
    
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
    if (!createBackupOfOriginal(phase.source)) {
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
    const testResult = testFileAfterCopy(phase.destination);
    
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
        console.log(`🔥 هذا ملف حرج - يُنصح بالاختبار اليدوي قبل المتابعة`);
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

function generateMigrationReport() {
    const reportPath = path.join(projectRoot, 'docs', 'MIGRATION_PROGRESS_REPORT.md');
    
    const report = `# تقرير تقدم الهجرة للهيكل الجديد

**تاريخ البدء:** ${new Date().toLocaleString('ar-EG')}
**المرحلة الحالية:** ${migrationStats.currentPhase}

## 📊 الإحصائيات

- **الملفات المعالجة:** ${migrationStats.filesProcessed}
- **الملفات المنسوخة:** ${migrationStats.filesCopied}
- **الأخطاء:** ${migrationStats.errors.length}
- **التحذيرات:** ${migrationStats.warnings.length}

## 🚀 المراحل المكتملة

${migrationPhases.slice(0, migrationStats.currentPhase).map(phase => 
    `### ✅ المرحلة ${phase.phase}: ${phase.name}
- **المصدر:** \`${phase.source}\`
- **الوجهة:** \`${phase.destination}\`
- **الحالة:** مكتملة
`).join('\n')}

## ⏳ المراحل المتبقية

${migrationPhases.slice(migrationStats.currentPhase).map(phase => 
    `### ⏳ المرحلة ${phase.phase}: ${phase.name}
- **المصدر:** \`${phase.source}\`
- **الوجهة:** \`${phase.destination}\`
- **الحالة:** في الانتظار
`).join('\n')}

${migrationStats.errors.length > 0 ? `
## ❌ الأخطاء

${migrationStats.errors.map(error => 
    `- **المرحلة ${error.phase}:** ${error.error}`
).join('\n')}
` : ''}

${migrationStats.warnings.length > 0 ? `
## ⚠️ التحذيرات

${migrationStats.warnings.map(warning => 
    `- **المرحلة ${warning.phase}:** ${warning.warning}`
).join('\n')}
` : ''}

## 📋 الخطوات التالية

1. راجع الملفات المنسوخة في المواقع الجديدة
2. اختبر الوظائف الحرجة (البوت والتذكيرات)
3. تابع المراحل المتبقية إذا كان كل شيء يعمل
4. لا تحذف الملفات الأصلية حتى تتأكد من عمل الجديدة

---
*تقرير تم إنشاؤه تلقائياً من سكريپت الهجرة الآمنة*
`;

    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`📄 تم إنشاء تقرير التقدم: ${reportPath}`);
}

async function main() {
    try {
        console.log(`📋 خطة الهجرة: ${migrationPhases.length} مراحل`);
        console.log(`🔒 ملاحظة: سيتم نسخ الملفات فقط - الأصل محفوظ`);
        
        // تشغيل مرحلة واحدة فقط (الأولى)
        const firstPhase = migrationPhases[0];
        
        console.log(`\n🎯 سيتم تشغيل المرحلة الأولى فقط للاختبار:`);
        console.log(`📦 ${firstPhase.name}`);
        
        const success = migratePhase(firstPhase);
        
        generateMigrationReport();
        
        console.log('\n============================================================');
        if (success) {
            console.log('✅ المرحلة الأولى اكتملت بنجاح!');
            console.log('============================================================');
            console.log(`📊 الملفات المعالجة: ${migrationStats.filesProcessed}`);
            console.log(`📄 الملفات المنسوخة: ${migrationStats.filesCopied}`);
            console.log(`❌ الأخطاء: ${migrationStats.errors.length}`);
            console.log(`⚠️ التحذيرات: ${migrationStats.warnings.length}`);
            
            console.log('\n🎯 الخطوات التالية:');
            console.log('1. اختبر البوت في الموقع الجديد');
            console.log('2. تأكد من عمل جميع الوظائف');
            console.log('3. شغل المرحلة التالية إذا كان كل شيء يعمل');
            
            console.log('\n📁 الملف الجديد متوفر في:');
            console.log(`   ${firstPhase.destination}`);
        } else {
            console.log('❌ فشلت المرحلة الأولى!');
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
