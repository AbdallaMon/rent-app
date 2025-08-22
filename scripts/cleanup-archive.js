/**
 * سكريبت تنظيف مجلد Archive - خطوة آمنة أولى
 * يحذف فقط الملفات المكررة والقديمة من مجلد archive
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 بدء تنظيف مجلد Archive...');
console.log('✅ هذا السكريپت آمن - يحذف فقط ملفات archive القديمة');

const projectRoot = process.cwd();
const archiveDir = path.join(projectRoot, 'archive');

// قائمة الملفات الآمنة للحذف من archive
const safeToDeleteFromArchive = [
    'unused-whatsapp-components', // المكونات غير المستخدمة
    'debug-info.json', // معلومات التشخيص القديمة
];

// إحصائيات
let stats = {
    filesDeleted: 0,
    foldersDeleted: 0,
    sizeFreed: 0
};

function getSizeInBytes(filePath) {
    try {
        return fs.statSync(filePath).size;
    } catch (err) {
        return 0;
    }
}

function getFolderSize(folderPath) {
    let totalSize = 0;
    try {
        const files = fs.readdirSync(folderPath);
        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                totalSize += getFolderSize(filePath);
            } else {
                totalSize += stat.size;
            }
        }
    } catch (err) {
        console.log(`⚠️ خطأ في قراءة المجلد: ${folderPath}`);
    }
    return totalSize;
}

function deleteFolder(folderPath) {
    try {
        if (fs.existsSync(folderPath)) {
            const folderSize = getFolderSize(folderPath);
            fs.rmSync(folderPath, { recursive: true, force: true });
            stats.foldersDeleted++;
            stats.sizeFreed += folderSize;
            console.log(`🗑️ تم حذف المجلد: ${path.relative(projectRoot, folderPath)}`);
            return true;
        }
    } catch (err) {
        console.log(`❌ خطأ في حذف المجلد: ${folderPath} - ${err.message}`);
        return false;
    }
    return false;
}

function deleteFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const fileSize = getSizeInBytes(filePath);
            fs.unlinkSync(filePath);
            stats.filesDeleted++;
            stats.sizeFreed += fileSize;
            console.log(`🗑️ تم حذف الملف: ${path.relative(projectRoot, filePath)}`);
            return true;
        }
    } catch (err) {
        console.log(`❌ خطأ في حذف الملف: ${filePath} - ${err.message}`);
        return false;
    }
    return false;
}

async function cleanupArchive() {
    if (!fs.existsSync(archiveDir)) {
        console.log('📂 مجلد archive غير موجود');
        return;
    }

    console.log(`📂 تنظيف مجلد: ${archiveDir}`);
    
    // حذف العناصر الآمنة
    for (const item of safeToDeleteFromArchive) {
        const itemPath = path.join(archiveDir, item);
        
        if (fs.existsSync(itemPath)) {
            const stat = fs.statSync(itemPath);
            if (stat.isDirectory()) {
                console.log(`📁 حذف المجلد: ${item}`);
                deleteFolder(itemPath);
            } else {
                console.log(`📄 حذف الملف: ${item}`);
                deleteFile(itemPath);
            }
        } else {
            console.log(`⚠️ العنصر غير موجود: ${item}`);
        }
    }
}

function formatSize(bytes) {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function main() {
    try {
        await cleanupArchive();
        
        console.log('\n============================================================');
        console.log('✅ انتهت عملية تنظيف مجلد Archive!');
        console.log('============================================================');
        console.log(`📊 الملفات المحذوفة: ${stats.filesDeleted}`);
        console.log(`📁 المجلدات المحذوفة: ${stats.foldersDeleted}`);
        console.log(`💾 المساحة المتوفرة: ${formatSize(stats.sizeFreed)}`);
        
        if (stats.filesDeleted > 0 || stats.foldersDeleted > 0) {
            console.log('\n💡 الخطوات التالية:');
            console.log('1. التحقق من عدم تأثر أي وظيفة أساسية');
            console.log('2. الانتقال لتنظيف المكونات المكررة');
            console.log('3. توحيد APIs الواتساب');
        } else {
            console.log('\n💡 لم يتم العثور على ملفات للحذف في archive');
        }
        
        console.log('\n🔒 ملاحظة: يمكن استعادة أي ملف من النسخة الاحتياطية');
        console.log('🎉 العملية آمنة ومكتملة!');
        
    } catch (error) {
        console.error('❌ خطأ في عملية التنظيف:', error);
        process.exit(1);
    }
}

main();
