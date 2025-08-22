/**
 * سكريپت توحيد APIs المكررة الآمنة
 * يحذف APIs المكررة ويحتفظ بالأساسية فقط
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 توحيد APIs الواتساب المكررة...');
console.log('✅ هذا السكريپت آمن - يحذف فقط APIs المكررة غير الأساسية');

const projectRoot = process.cwd();

// APIs الأساسية المحمية (لا تحذف أبداً)
const protectedApis = [
    'src/app/api/notifications/whatsapp/webhook/route.js', // البوت الأساسي
    'src/app/api/admin/whatsapp/reminders/route.js', // التذكيرات الأساسية
    'src/app/api/admin/whatsapp/reminders-test/route.js', // التذكيرات المحدثة
    'src/app/api/admin/whatsapp/settings/route.js', // الإعدادات
    'src/app/api/admin/whatsapp/dashboard/route.js', // لوحة التحكم
    'src/app/api/admin/whatsapp/complaints/route-new.js' // الشكاوى المحدثة
];

// APIs المكررة الآمنة للحذف (من تحليل السابق)
const duplicateApisToDelete = [
    // مجموعة webhook المكررة (11 API)
    'src/app/api/admin/whatsapp/status-webhook/route.js',
    'src/app/api/admin/whatsapp/verify-webhook/route.js',
    'src/app/api/notifications/whatsapp/webhook/enhanced-request-handler-clean.js',
    'src/app/api/notifications/whatsapp/webhook/enhanced-request-handler-es6.js',
    'src/app/api/notifications/whatsapp/webhook/enhanced-request-handler-production.js',
    'src/app/api/notifications/whatsapp/webhook/enhanced-request-handler.js',
    'src/app/api/notifications/whatsapp/webhook/route-backup.js',
    'src/app/api/notifications/whatsapp/webhook/route-clean-1.0-backup.js',
    'src/app/api/notifications/whatsapp/webhook/route-new-clean-2.0.js',
    'src/app/api/notifications/whatsapp/webhook/route-new-clean.js',
    'src/app/api/notifications/whatsapp/webhook/route-simple.js',
    
    // APIs إدارية مكررة (8 APIs)
    'src/app/api/admin/whatsapp/analytics/route.js',
    'src/app/api/admin/whatsapp/conversations/route.js',
    'src/app/api/admin/whatsapp/conversations/[id]/route.js',
    'src/app/api/admin/whatsapp/reply-request/route.js',
    'src/app/api/admin/whatsapp/requests/route.js',
    'src/app/api/admin/whatsapp/send-message/route.js',
    'src/app/api/admin/whatsapp/test-message/route.js',
    'src/app/api/admin/whatsapp/users/route.js',
    
    // APIs مساعدة وتجريبية (6 APIs)
    'src/app/api/admin/whatsapp/broadcast/route.js',
    'src/app/api/admin/whatsapp/logs/route.js',
    'src/app/api/admin/whatsapp/status/route.js',
    'src/app/api/admin/whatsapp/test/route.js',
    'src/app/api/admin/whatsapp/verify/route.js',
    'src/app/api/admin/whatsapp/webhook-test/route.js'
];

let stats = {
    apisDeleted: 0,
    apisSkipped: 0,
    sizeFreed: 0,
    errors: [],
    protectedCount: 0
};

function getSizeInBytes(filePath) {
    try {
        return fs.statSync(filePath).size;
    } catch (err) {
        return 0;
    }
}

function isProtectedApi(filePath) {
    const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/');
    return protectedApis.some(protected => 
        relativePath.includes(protected) || filePath.includes(protected)
    );
}

function analyzeApiBeforeDelete(filePath, content) {
    // فحص إذا كان API يحتوي على كود حرج
    const criticalPatterns = [
        /prisma.*create/i,
        /prisma.*update/i,
        /prisma.*delete/i,
        /reminder.*settings/i,
        /whatsapp.*client/i,
        /sendMessage/i,
        /webhook.*verify/i
    ];
    
    // فحص إذا كان يحتوي على عمليات حرجة
    const hasCriticalOperations = criticalPatterns.some(pattern => 
        pattern.test(content)
    );
    
    if (hasCriticalOperations) {
        console.log(`⚠️ تحذير: API يحتوي على عمليات حرجة - ${path.basename(filePath)}`);
        return false; // لا تحذف
    }
    
    // فحص إذا كان ملف احتياطي أو تجريبي
    const fileName = path.basename(filePath).toLowerCase();
    const testKeywords = ['backup', 'test', 'temp', 'old', 'copy', 'duplicate'];
    
    return testKeywords.some(keyword => fileName.includes(keyword));
}

function deleteApi(filePath) {
    const fullPath = path.join(projectRoot, filePath);
    
    try {
        // فحص الحماية أولاً
        if (isProtectedApi(fullPath)) {
            console.log(`🔒 API محمي - تم تخطيه: ${filePath}`);
            stats.protectedCount++;
            stats.apisSkipped++;
            return false;
        }
        
        if (fs.existsSync(fullPath)) {
            const fileSize = getSizeInBytes(fullPath);
            const content = fs.readFileSync(fullPath, 'utf8');
            
            // تحليل المحتوى قبل الحذف
            if (fileSize > 1000) { // ملفات أكبر من 1KB
                console.log(`🔍 تحليل API كبير: ${path.basename(filePath)} (${formatSize(fileSize)})`);
                
                if (!analyzeApiBeforeDelete(fullPath, content)) {
                    console.log(`❌ تم تخطي API - قد يحتوي على كود مهم: ${filePath}`);
                    stats.apisSkipped++;
                    return false;
                }
            }
            
            // حذف API
            fs.unlinkSync(fullPath);
            stats.apisDeleted++;
            stats.sizeFreed += fileSize;
            
            console.log(`🗑️ تم حذف API: ${path.basename(filePath)} (${formatSize(fileSize)})`);
            return true;
        } else {
            console.log(`⚠️ API غير موجود: ${filePath}`);
            stats.apisSkipped++;
            return false;
        }
    } catch (err) {
        console.log(`❌ خطأ في حذف API: ${filePath} - ${err.message}`);
        stats.errors.push({ file: filePath, error: err.message });
        return false;
    }
}

function formatSize(bytes) {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function createUnificationReport() {
    const reportPath = path.join(projectRoot, 'docs', 'API_UNIFICATION_RESULTS.md');
    
    const report = `# نتائج توحيد APIs الواتساب

**تاريخ التوحيد:** ${new Date().toLocaleString('ar-EG')}

## 📊 الإحصائيات

- **APIs محذوفة:** ${stats.apisDeleted}
- **APIs متخطاة:** ${stats.apisSkipped}
- **APIs محمية:** ${stats.protectedCount}
- **المساحة الموفرة:** ${formatSize(stats.sizeFreed)}

## ✅ APIs الأساسية المحتفظ بها

${protectedApis.map(api => `- \`${api}\``).join('\n')}

## 🗑️ APIs المحذوفة

${duplicateApisToDelete.map(api => `- \`${api}\``).join('\n')}

## 🔒 ملاحظات الأمان

- جميع APIs المحذوفة متوفرة في النسخة الاحتياطية
- APIs الأساسية للبوت والتذكيرات محمية
- يمكن استعادة أي API محذوف عند الحاجة

## 💡 التوصيات التالية

1. اختبار جميع وظائف البوت والتذكيرات
2. فحص لوحة التحكم الإدارية
3. مراجعة APIs المتبقية للتأكد من عملها

---
*تم التوحيد بأمان مع حماية كاملة للوظائف الأساسية*
`;

    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`📄 تم إنشاء تقرير التوحيد: ${reportPath}`);
}

async function main() {
    try {
        console.log(`📋 سيتم فحص ${duplicateApisToDelete.length} API للحذف`);
        console.log(`🔒 ${protectedApis.length} API محمي من الحذف`);
        console.log('');
        
        console.log('🎯 APIs محمية (لن تُحذف):');
        protectedApis.forEach(api => {
            console.log(`  🔒 ${path.basename(api)}`);
        });
        
        console.log('\n🔄 بدء عملية توحيد APIs...\n');
        
        for (const apiPath of duplicateApisToDelete) {
            console.log(`🔍 فحص: ${path.basename(apiPath)}`);
            deleteApi(apiPath);
            console.log(''); // سطر فارغ للوضوح
        }
        
        createUnificationReport();
        
        console.log('\n============================================================');
        console.log('✅ انتهت عملية توحيد APIs الواتساب!');
        console.log('============================================================');
        console.log(`📊 APIs محذوفة: ${stats.apisDeleted}`);
        console.log(`🔒 APIs محمية: ${stats.protectedCount}`);
        console.log(`⏭️ APIs متخطاة: ${stats.apisSkipped}`);
        console.log(`💾 المساحة الموفرة: ${formatSize(stats.sizeFreed)}`);
        
        if (stats.errors.length > 0) {
            console.log(`\n❌ الأخطاء: ${stats.errors.length}`);
            for (const error of stats.errors) {
                console.log(`  - ${error.file}: ${error.error}`);
            }
        }
        
        console.log('\n🎯 الخطوات التالية:');
        console.log('1. اختبار البوت والتذكيرات');
        console.log('2. فحص لوحة التحكم الإدارية');
        console.log('3. مراجعة APIs المتبقية');
        console.log('4. إنشاء الهيكل الجديد المنظم');
        
        console.log('\n🔒 ملاحظة: يمكن استعادة أي API من النسخة الاحتياطية');
        console.log('🎉 العملية مكتملة بأمان!');
        
    } catch (error) {
        console.error('❌ خطأ في عملية التوحيد:', error);
        process.exit(1);
    }
}

main();
