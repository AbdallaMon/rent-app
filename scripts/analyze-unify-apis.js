/**
 * سكريپت تحليل وتوحيد APIs الواتساب
 * يحلل جميع APIs الواتساب ويقترح خطة توحيد آمنة
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 تحليل وتوحيد APIs الواتساب...');
console.log('✅ هذا السكريپت آمن - فقط يحلل ولا يعدل');

const projectRoot = process.cwd();

// مجلدات APIs الواتساب
const apiDirs = [
    'src/app/api/admin/whatsapp',
    'src/app/api/notifications/whatsapp',
    'src/pages/api/whatsapp',
    'api/whatsapp'
];

let apis = [];
let apisByFunction = {};
let stats = {
    totalApis: 0,
    redundantApis: 0,
    coreApis: 0,
    utilityApis: 0
};

// تصنيف APIs الأساسية
const coreApiTypes = {
    'webhook': 'البوت الأساسي',
    'reminders': 'التذكيرات',
    'settings': 'الإعدادات',
    'dashboard': 'لوحة التحكم'
};

function getApiInfo(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const stat = fs.statSync(filePath);
        
        // تحديد نوع API
        let apiType = 'unknown';
        let functionality = [];
        
        if (filePath.includes('webhook')) {
            apiType = 'webhook';
            if (content.includes('reminder')) functionality.push('reminders');
            if (content.includes('complaint')) functionality.push('complaints');
            if (content.includes('message')) functionality.push('messaging');
        } else if (filePath.includes('reminder')) {
            apiType = 'reminders';
            functionality.push('reminders');
        } else if (filePath.includes('setting')) {
            apiType = 'settings';
            functionality.push('settings');
        } else if (filePath.includes('complaint')) {
            apiType = 'complaints';
            functionality.push('complaints');
        } else if (filePath.includes('dashboard')) {
            apiType = 'dashboard';
            functionality.push('dashboard');
        } else if (filePath.includes('admin')) {
            apiType = 'admin';
            functionality.push('admin');
        }
        
        // تحليل المحتوى
        const methods = [];
        if (content.includes('export async function GET') || content.includes('async function GET')) methods.push('GET');
        if (content.includes('export async function POST') || content.includes('async function POST')) methods.push('POST');
        if (content.includes('export async function PUT') || content.includes('async function PUT')) methods.push('PUT');
        if (content.includes('export async function DELETE') || content.includes('async function DELETE')) methods.push('DELETE');
        
        // تحديد الاعتماديات
        const dependencies = [];
        if (content.includes('prisma')) dependencies.push('database');
        if (content.includes('whatsapp-web.js')) dependencies.push('whatsapp-client');
        if (content.includes('axios') || content.includes('fetch')) dependencies.push('http-client');
        if (content.includes('cron')) dependencies.push('scheduler');
        
        // تحديد الوظائف
        const functions = [...content.matchAll(/(?:async\s+)?function\s+(\w+)/g)]
            .map(match => match[1]);
        
        const asyncFunctions = [...content.matchAll(/const\s+(\w+)\s*=\s*async/g)]
            .map(match => match[1]);
        
        // حساب التعقيد
        const complexity = calculateApiComplexity(content);
        
        // تحديد إذا كان API حرج
        const isCritical = (
            apiType === 'webhook' ||
            apiType === 'reminders' ||
            content.includes('reminder') ||
            content.includes('bot') ||
            content.toLowerCase().includes('critical')
        );
        
        return {
            path: filePath,
            name: path.basename(filePath, path.extname(filePath)),
            type: apiType,
            functionality: functionality,
            methods: methods,
            dependencies: dependencies,
            functions: functions,
            asyncFunctions: asyncFunctions,
            size: stat.size,
            lines: content.split('\n').length,
            complexity: complexity,
            isCritical: isCritical,
            lastModified: stat.mtime,
            hasTests: checkForTests(filePath),
            isActive: checkIfActive(content, filePath)
        };
    } catch (err) {
        return null;
    }
}

function calculateApiComplexity(content) {
    let complexity = 0;
    
    // عدد الدوال
    complexity += (content.match(/function\s+\w+/g) || []).length;
    complexity += (content.match(/const\s+\w+\s*=\s*async/g) || []).length;
    
    // عدد الشروط
    complexity += (content.match(/if\s*\(/g) || []).length;
    complexity += (content.match(/switch\s*\(/g) || []).length;
    complexity += (content.match(/\?\s*.*?\s*:/g) || []).length;
    
    // عدد المعالجات
    complexity += (content.match(/try\s*{/g) || []).length;
    complexity += (content.match(/catch\s*\(/g) || []).length;
    
    // عدد طلبات قاعدة البيانات
    complexity += (content.match(/prisma\.\w+/g) || []).length;
    
    // عدد طلبات HTTP
    complexity += (content.match(/fetch\(/g) || []).length;
    complexity += (content.match(/axios\./g) || []).length;
    
    return complexity;
}

function checkForTests(filePath) {
    const testPaths = [
        filePath.replace('.js', '.test.js'),
        filePath.replace('.js', '.spec.js'),
        filePath.replace('/route.js', '/test.js'),
        path.join(path.dirname(filePath), '__tests__', path.basename(filePath))
    ];
    
    return testPaths.some(testPath => fs.existsSync(testPath));
}

function checkIfActive(content, filePath) {
    // فحص إذا كان API نشط
    if (content.includes('// TODO: Remove') || content.includes('// DEPRECATED')) {
        return false;
    }
    
    // فحص إذا كان يحتوي على أسماء ملفات تدل على أنه قديم
    const fileName = path.basename(filePath).toLowerCase();
    const inactiveKeywords = ['old', 'backup', 'deprecated', 'unused', 'temp', 'broken'];
    
    return !inactiveKeywords.some(keyword => fileName.includes(keyword));
}

function findApis() {
    console.log('📂 البحث عن APIs الواتساب...');
    
    for (const apiDir of apiDirs) {
        const fullPath = path.join(projectRoot, apiDir);
        if (fs.existsSync(fullPath)) {
            scanApiDirectory(fullPath);
        }
    }
    
    console.log(`🔍 تم العثور على ${apis.length} API`);
}

function scanApiDirectory(dirPath) {
    try {
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
                scanApiDirectory(itemPath);
            } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.ts'))) {
                const apiInfo = getApiInfo(itemPath);
                if (apiInfo) {
                    apis.push(apiInfo);
                }
            }
        }
    } catch (err) {
        console.log(`⚠️ خطأ في مسح مجلد APIs: ${dirPath}`);
    }
}

function categorizeApis() {
    console.log('📊 تصنيف APIs...');
    
    // تجميع حسب الوظيفة
    for (const api of apis) {
        const key = api.type;
        if (!apisByFunction[key]) {
            apisByFunction[key] = [];
        }
        apisByFunction[key].push(api);
    }
    
    stats.totalApis = apis.length;
    stats.coreApis = apis.filter(api => api.isCritical).length;
    stats.utilityApis = apis.filter(api => !api.isCritical).length;
    
    // حساب المكررة
    for (const [type, apiList] of Object.entries(apisByFunction)) {
        if (apiList.length > 1) {
            stats.redundantApis += apiList.length - 1;
        }
    }
}

function generateUnificationPlan() {
    const reportPath = path.join(projectRoot, 'docs', 'WHATSAPP_API_UNIFICATION_PLAN.md');
    
    let report = `# خطة توحيد APIs الواتساب

**تاريخ التحليل:** ${new Date().toLocaleString('ar-EG')}

## 📊 الإحصائيات العامة

- **إجمالي APIs:** ${stats.totalApis}
- **APIs أساسية:** ${stats.coreApis}
- **APIs مساعدة:** ${stats.utilityApis}
- **APIs مكررة:** ${stats.redundantApis}

## 🎯 APIs الأساسية المُوصى بالاحتفاظ بها

### 1. API البوت الأساسي (Webhook)
`;

    // APIs البوت
    const webhookApis = apisByFunction['webhook'] || [];
    if (webhookApis.length > 0) {
        const primaryWebhook = webhookApis
            .filter(api => api.isActive)
            .sort((a, b) => b.size - a.size)[0];
        
        if (primaryWebhook) {
            report += `- **الأساسي:** \`${path.relative(projectRoot, primaryWebhook.path)}\`\n`;
            report += `  - الحجم: ${formatSize(primaryWebhook.size)}\n`;
            report += `  - الطرق: ${primaryWebhook.methods.join(', ')}\n`;
            report += `  - التعقيد: ${primaryWebhook.complexity}\n\n`;
        }
        
        if (webhookApis.length > 1) {
            report += `**APIs مكررة للدمج أو الحذف:**\n`;
            for (const api of webhookApis) {
                if (api !== primaryWebhook) {
                    report += `- \`${path.relative(projectRoot, api.path)}\`\n`;
                }
            }
            report += '\n';
        }
    }

    // APIs التذكيرات
    report += `### 2. API التذكيرات\n`;
    const reminderApis = apisByFunction['reminders'] || [];
    if (reminderApis.length > 0) {
        const primaryReminder = reminderApis
            .filter(api => api.isActive)
            .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))[0];
        
        if (primaryReminder) {
            report += `- **الأساسي:** \`${path.relative(projectRoot, primaryReminder.path)}\`\n`;
            report += `  - الحجم: ${formatSize(primaryReminder.size)}\n`;
            report += `  - آخر تعديل: ${new Date(primaryReminder.lastModified).toLocaleDateString('ar-EG')}\n\n`;
        }
    }

    // APIs الإعدادات
    report += `### 3. API الإعدادات\n`;
    const settingsApis = apisByFunction['settings'] || [];
    if (settingsApis.length > 0) {
        const primarySettings = settingsApis
            .filter(api => api.isActive)
            .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))[0];
        
        if (primarySettings) {
            report += `- **الأساسي:** \`${path.relative(projectRoot, primarySettings.path)}\`\n\n`;
        }
    }

    // خطة التوحيد
    report += `## 🔄 خطة التوحيد المقترحة

### المرحلة 1: حماية APIs الأساسية
- ✅ عدم المساس بـ API البوت الأساسي
- ✅ عدم المساس بـ API التذكيرات
- ✅ عدم المساس بـ API الإعدادات الأساسي

### المرحلة 2: دمج APIs المكررة
`;

    for (const [type, apiList] of Object.entries(apisByFunction)) {
        if (apiList.length > 1) {
            report += `\n#### ${type.toUpperCase()}\n`;
            report += `- **عدد المكررات:** ${apiList.length}\n`;
            report += `- **الإجراء:** دمج في API واحد\n`;
            
            const primaryApi = apiList
                .filter(api => api.isActive && api.isCritical)
                .sort((a, b) => b.complexity - a.complexity)[0] || apiList[0];
            
            report += `- **API الأساسي:** \`${path.relative(projectRoot, primaryApi.path)}\`\n`;
            report += `- **APIs للحذف:**\n`;
            
            for (const api of apiList) {
                if (api !== primaryApi) {
                    report += `  - \`${path.relative(projectRoot, api.path)}\`\n`;
                }
            }
        }
    }

    report += `\n### المرحلة 3: تنظيم الهيكل الجديد

\`\`\`
src/app/api/whatsapp/
├── webhook/
│   └── route.js          # البوت الأساسي الموحد
├── reminders/
│   └── route.js          # التذكيرات
├── settings/
│   └── route.js          # الإعدادات
└── admin/
    ├── dashboard/
    │   └── route.js      # لوحة التحكم
    └── complaints/
        └── route.js      # الشكاوى
\`\`\`

## 📋 جدول APIs التفصيلي

| المسار | النوع | الحجم | الطرق | التعقيد | نشط | حرج |
|--------|------|-------|--------|----------|------|-----|
`;

    // ترتيب APIs
    const sortedApis = apis.sort((a, b) => {
        if (a.isCritical !== b.isCritical) return b.isCritical - a.isCritical;
        return b.size - a.size;
    });

    for (const api of sortedApis) {
        const relativePath = path.relative(projectRoot, api.path);
        const active = api.isActive ? '✅' : '❌';
        const critical = api.isCritical ? '🔥' : '📄';
        
        report += `| \`${relativePath}\` | ${api.type} | ${formatSize(api.size)} | ${api.methods.join(', ')} | ${api.complexity} | ${active} | ${critical} |\n`;
    }

    report += `\n## 🔒 ملاحظات الأمان

- **لا تحذف:** APIs البوت، التذكيرات، الإعدادات الأساسية
- **اختبر دائماً:** بعد أي تعديل أو دمج
- **نسخ احتياطي:** متوفر لجميع الملفات
- **تدريجي:** نفذ خطوة واحدة في كل مرة

## 💡 الخطوات التنفيذية

1. **✅ مراجعة الخطة**
2. **📋 تحديد APIs المكررة الآمنة**
3. **🔄 دمج APIs متدرج**
4. **🧪 اختبار شامل**
5. **📁 إعادة تنظيم الهيكل**
`;

    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`📄 تم إنشاء خطة التوحيد: ${reportPath}`);
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
        findApis();
        categorizeApis();
        generateUnificationPlan();
        
        console.log('\n============================================================');
        console.log('✅ انتهى تحليل وتخطيط توحيد APIs!');
        console.log('============================================================');
        console.log(`📊 إجمالي APIs: ${stats.totalApis}`);
        console.log(`🔥 APIs أساسية: ${stats.coreApis}`);
        console.log(`📄 APIs مساعدة: ${stats.utilityApis}`);
        console.log(`🔄 APIs مكررة: ${stats.redundantApis}`);
        
        if (stats.redundantApis > 0) {
            console.log(`\n💡 يمكن توحيد ${stats.redundantApis} API مكرر`);
            console.log('📄 راجع خطة التوحيد التفصيلية في: docs/WHATSAPP_API_UNIFICATION_PLAN.md');
        }
        
        console.log('\n🎯 الخطوات التالية:');
        console.log('1. مراجعة خطة التوحيد');
        console.log('2. اختبار APIs الأساسية');
        console.log('3. بدء عملية الدمج التدريجي');
        
        console.log('\n🔒 ملاحظة: التحليل فقط - لم يتم تعديل أي API');
        console.log('🎉 العملية مكتملة بأمان!');
        
    } catch (error) {
        console.error('❌ خطأ في تحليل APIs:', error);
        process.exit(1);
    }
}

main();
