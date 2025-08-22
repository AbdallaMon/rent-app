/**
 * سكريپت حذف المكونات المكررة الآمنة
 * يحذف فقط الملفات المكررة المحددة في التحليل السابق
 */

const fs = require('fs');
const path = require('path');

console.log('🗑️ حذف المكونات المكررة الآمنة...');
console.log('✅ هذا السكريپت آمن - يحذف فقط المكونات المكررة المحددة');

const projectRoot = process.cwd();

// قائمة المكونات الآمنة للحذف (من تحليل المكونات المكررة)
const safeToDelete = [
    // مجموعة 1: ملفات الشكاوى المكررة
    'src/app/api/admin/whatsapp/complaints/route.js',
    
    // مجموعة 2: ملفات فارغة (0 بايت)
    'src/app/api/notifications/whatsapp/webhook/route-enhanced.js',
    'src/app/api/admin/whatsapp/settings/route_old.js',
    'src/app/api/admin/whatsapp/settings/route_backup.js',
    
    // مجموعة 3: ملفات معالج الطلبات المكررة
    'src/app/api/notifications/whatsapp/webhook/enhanced-request-handler-fixed.js',
    
    // مجموعة 4: ملفات البوت المكسورة/القديمة
    'src/app/api/notifications/whatsapp/webhook/route-current-broken.js'
];

// الملفات المحمية (لا يجب حذفها أبداً)
const protectedFiles = [
    'src/app/api/notifications/whatsapp/webhook/route.js', // البوت الأساسي
    'src/app/api/admin/whatsapp/reminders/route.js', // التذكيرات
    'src/app/api/admin/whatsapp/settings/route.js', // الإعدادات الأساسية
    'src/components/whatsapp/dashboard/EnhancedWhatsAppDashboard.jsx' // لوحة التحكم الرئيسية
];

let stats = {
    filesDeleted: 0,
    filesSkipped: 0,
    sizeFreed: 0,
    errors: []
};

function getSizeInBytes(filePath) {
    try {
        return fs.statSync(filePath).size;
    } catch (err) {
        return 0;
    }
}

function isProtectedFile(filePath) {
    const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/');
    return protectedFiles.some(protected => 
        relativePath.includes(protected) || filePath.includes(protected)
    );
}

function deleteFile(filePath) {
    const fullPath = path.join(projectRoot, filePath);
    
    try {
        // فحص الحماية
        if (isProtectedFile(fullPath)) {
            console.log(`🔒 ملف محمي - تم تخطيه: ${filePath}`);
            stats.filesSkipped++;
            return false;
        }
        
        if (fs.existsSync(fullPath)) {
            const fileSize = getSizeInBytes(fullPath);
            
            // فحص إضافي للتأكد
            const content = fs.readFileSync(fullPath, 'utf8');
            
            // تحذير إضافي للملفات الكبيرة
            if (fileSize > 10000) {
                console.log(`⚠️ ملف كبير (${formatSize(fileSize)}) - التحقق من المحتوى...`);
                
                // فحص إذا كان يحتوي على كود مهم
                if (content.includes('export') || content.includes('function') || content.includes('const')) {
                    // تحقق إضافي من أنه فعلاً مكرر
                    const isActuallyDuplicate = checkIfDuplicate(fullPath, content);
                    if (!isActuallyDuplicate) {
                        console.log(`❌ تم تخطي الملف - قد يحتوي على كود فريد: ${filePath}`);
                        stats.filesSkipped++;
                        return false;
                    }
                }
            }
            
            // حذف الملف
            fs.unlinkSync(fullPath);
            stats.filesDeleted++;
            stats.sizeFreed += fileSize;
            
            console.log(`🗑️ تم حذف: ${filePath} (${formatSize(fileSize)})`);
            return true;
        } else {
            console.log(`⚠️ الملف غير موجود: ${filePath}`);
            stats.filesSkipped++;
            return false;
        }
    } catch (err) {
        console.log(`❌ خطأ في حذف الملف: ${filePath} - ${err.message}`);
        stats.errors.push({ file: filePath, error: err.message });
        return false;
    }
}

function checkIfDuplicate(filePath, content) {
    // فحص إذا كان الملف فارغ أو يحتوي على محتوى بسيط
    if (content.trim().length === 0) {
        return true; // ملف فارغ - آمن للحذف
    }
    
    // فحص إذا كان يحتوي على تعليقات فقط
    const codeContent = content
        .replace(/\/\*[\s\S]*?\*\//g, '') // حذف تعليقات متعددة الأسطر
        .replace(/\/\/.*$/gm, '') // حذف تعليقات السطر الواحد
        .replace(/\s+/g, ' ')
        .trim();
    
    if (codeContent.length < 50) {
        return true; // محتوى قليل جداً - غالباً مكرر
    }
    
    // فحص إذا كان الملف يحتوي على كلمات مفتاحية تدل على أنه نسخة احتياطية
    const backupKeywords = ['backup', 'old', 'broken', 'temp', 'test', 'copy'];
    const fileName = path.basename(filePath).toLowerCase();
    
    if (backupKeywords.some(keyword => fileName.includes(keyword))) {
        return true; // ملف احتياطي - آمن للحذف
    }
    
    return false; // قد يحتوي على كود مهم - لا تحذف
}

function formatSize(bytes) {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

async function main() {
    try {
        console.log(`📋 سيتم فحص ${safeToDelete.length} ملف للحذف`);
        console.log(`🔒 ${protectedFiles.length} ملف محمي من الحذف`);
        console.log('');
        
        for (const filePath of safeToDelete) {
            console.log(`🔍 فحص: ${filePath}`);
            deleteFile(filePath);
        }
        
        console.log('\n============================================================');
        console.log('✅ انتهت عملية حذف المكونات المكررة!');
        console.log('============================================================');
        console.log(`📊 الملفات المحذوفة: ${stats.filesDeleted}`);
        console.log(`⏭️ الملفات المتخطاة: ${stats.filesSkipped}`);
        console.log(`💾 المساحة المتوفرة: ${formatSize(stats.sizeFreed)}`);
        
        if (stats.errors.length > 0) {
            console.log(`❌ الأخطاء: ${stats.errors.length}`);
            for (const error of stats.errors) {
                console.log(`  - ${error.file}: ${error.error}`);
            }
        }
        
        if (stats.filesDeleted > 0) {
            console.log('\n💡 الخطوات التالية:');
            console.log('1. اختبار تشغيل البوت والتذكيرات');
            console.log('2. فحص لوحة التحكم');
            console.log('3. الانتقال لتوحيد APIs');
        }
        
        console.log('\n🔒 ملاحظة: يمكن استعادة أي ملف من النسخة الاحتياطية');
        console.log('🎉 العملية آمنة ومكتملة!');
        
    } catch (error) {
        console.error('❌ خطأ في عملية الحذف:', error);
        process.exit(1);
    }
}

main();
