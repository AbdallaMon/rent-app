/**
 * سكريپت إنشاء الهيكل الجديد المنظم للواتساب
 * ينشئ الهيكل المقترح ويوثق جميع APIs الموجودة
 */

const fs = require('fs');
const path = require('path');

console.log('🏗️ إنشاء الهيكل الجديد المنظم للواتساب...');
console.log('✅ هذا السكريپت آمن - فقط ينشئ مجلدات ويوثق');

const projectRoot = process.cwd();

// الهيكل الجديد المقترح
const newStructure = {
    'src/whatsapp': {
        'components': {
            'Dashboard.jsx': 'مكون لوحة التحكم الموحد',
            'Settings.jsx': 'مكون الإعدادات',
            'Reminders.jsx': 'مكون التذكيرات',
            'Analytics.jsx': 'مكون التحليلات'
        },
        'api': {
            'webhook': {
                'route.js': 'API البوت الأساسي'
            },
            'reminders': {
                'route.js': 'API التذكيرات'
            },
            'settings': {
                'route.js': 'API الإعدادات'
            },
            'dashboard': {
                'route.js': 'API لوحة التحكم'
            },
            'admin': {
                'route.js': 'API الإدارة الموحد'
            }
        },
        'utils': {
            'helpers.js': 'دوال مساعدة',
            'analytics.js': 'أدوات التحليل',
            'message-handler.js': 'معالج الرسائل',
            'database.js': 'أدوات قاعدة البيانات'
        },
        'types': {
            'whatsapp-types.ts': 'تعريفات TypeScript'
        }
    }
};

// APIs الموجودة حالياً والمقترح نقلها
const currentApis = [
    {
        current: 'src/app/api/notifications/whatsapp/webhook/route.js',
        newLocation: 'src/whatsapp/api/webhook/route.js',
        description: 'البوت الأساسي - استقبال ومعالجة الرسائل'
    },
    {
        current: 'src/app/api/admin/whatsapp/reminders/route.js',
        newLocation: 'src/whatsapp/api/reminders/route.js',
        description: 'إدارة التذكيرات والإشعارات'
    },
    {
        current: 'src/app/api/admin/whatsapp/settings/route.js',
        newLocation: 'src/whatsapp/api/settings/route.js',
        description: 'إعدادات الواتساب'
    },
    {
        current: 'src/app/api/admin/whatsapp/dashboard/route.js',
        newLocation: 'src/whatsapp/api/dashboard/route.js',
        description: 'بيانات لوحة التحكم'
    }
];

// المكونات الموجودة والمقترح توحيدها
const currentComponents = [
    {
        current: 'src/components/whatsapp/dashboard/EnhancedWhatsAppDashboard.jsx',
        newLocation: 'src/whatsapp/components/Dashboard.jsx',
        description: 'لوحة التحكم الرئيسية الموحدة'
    }
];

let createdItems = {
    directories: 0,
    files: 0,
    errors: []
};

function createDirectoryStructure(structure, basePath = '') {
    for (const [name, content] of Object.entries(structure)) {
        const fullPath = path.join(projectRoot, basePath, name);
        
        if (typeof content === 'object') {
            // إنشاء مجلد
            try {
                if (!fs.existsSync(fullPath)) {
                    fs.mkdirSync(fullPath, { recursive: true });
                    console.log(`📁 تم إنشاء مجلد: ${path.relative(projectRoot, fullPath)}`);
                    createdItems.directories++;
                } else {
                    console.log(`📁 مجلد موجود: ${path.relative(projectRoot, fullPath)}`);
                }
                
                // إنشاء المحتويات الفرعية
                createDirectoryStructure(content, path.join(basePath, name));
            } catch (err) {
                console.log(`❌ خطأ في إنشاء مجلد: ${fullPath} - ${err.message}`);
                createdItems.errors.push({ item: fullPath, error: err.message });
            }
        } else {
            // إنشاء ملف placeholder مع وصف
            try {
                if (!fs.existsSync(fullPath)) {
                    const placeholder = createPlaceholderContent(name, content);
                    fs.writeFileSync(fullPath, placeholder, 'utf8');
                    console.log(`📄 تم إنشاء ملف: ${path.relative(projectRoot, fullPath)}`);
                    createdItems.files++;
                } else {
                    console.log(`📄 ملف موجود: ${path.relative(projectRoot, fullPath)}`);
                }
            } catch (err) {
                console.log(`❌ خطأ في إنشاء ملف: ${fullPath} - ${err.message}`);
                createdItems.errors.push({ item: fullPath, error: err.message });
            }
        }
    }
}

function createPlaceholderContent(fileName, description) {
    const extension = path.extname(fileName);
    
    if (extension === '.js') {
        return `/**
 * ${description}
 * TODO: نقل الكود من الملف الأصلي هنا
 * 
 * هذا ملف placeholder - يحتاج إلى تنفيذ
 */

// TODO: إضافة الكود هنا

export default function placeholder() {
    throw new Error('${description} - لم يتم تنفيذه بعد');
}
`;
    } else if (extension === '.jsx') {
        return `/**
 * ${description}
 * TODO: نقل المكون من الملف الأصلي هنا
 */

import React from 'react';

export default function PlaceholderComponent() {
    return (
        <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
            <h2 className="text-lg font-bold text-yellow-800">
                {/* ${description} */}
                TODO: تنفيذ المكون
            </h2>
            <p className="text-yellow-700">
                هذا مكون placeholder - يحتاج إلى نقل الكود من الملف الأصلي
            </p>
        </div>
    );
}
`;
    } else if (extension === '.ts') {
        return `/**
 * ${description}
 * TODO: إضافة تعريفات TypeScript للواتساب
 */

// TODO: إضافة التعريفات هنا

export interface WhatsAppMessage {
    id: string;
    from: string;
    body: string;
    timestamp: Date;
}

export interface WhatsAppSettings {
    apiKey: string;
    webhookUrl: string;
    enableReminders: boolean;
}

// TODO: إضافة المزيد من التعريفات
`;
    } else {
        return `# ${description}

TODO: تنفيذ هذا الملف

هذا ملف placeholder تم إنشاؤه كجزء من الهيكل الجديد المنظم.
`;
    }
}

function createMigrationPlan() {
    const planPath = path.join(projectRoot, 'docs', 'WHATSAPP_MIGRATION_PLAN.md');
    
    const plan = `# خطة الهجرة للهيكل الجديد المنظم

**تاريخ الإنشاء:** ${new Date().toLocaleString('ar-EG')}

## 🎯 الهدف

نقل جميع ملفات الواتساب إلى هيكل منظم وموحد تحت مجلد \`src/whatsapp/\`

## 📁 الهيكل الجديد

\`\`\`
src/whatsapp/
├── components/          # جميع مكونات الواجهة
│   ├── Dashboard.jsx    # لوحة التحكم الموحدة
│   ├── Settings.jsx     # إعدادات الواتساب
│   ├── Reminders.jsx    # إدارة التذكيرات
│   └── Analytics.jsx    # التحليلات والإحصائيات
├── api/                 # جميع APIs الواتساب
│   ├── webhook/         # البوت الأساسي
│   ├── reminders/       # التذكيرات
│   ├── settings/        # الإعدادات
│   ├── dashboard/       # لوحة التحكم
│   └── admin/           # الإدارة الموحدة
├── utils/               # الأدوات المساعدة
│   ├── helpers.js       # دوال مساعدة عامة
│   ├── analytics.js     # أدوات التحليل
│   ├── message-handler.js # معالج الرسائل
│   └── database.js      # أدوات قاعدة البيانات
└── types/               # تعريفات TypeScript
    └── whatsapp-types.ts
\`\`\`

## 🔄 خطة النقل (APIs)

### المرحلة 1: نقل APIs الأساسية

${currentApis.map(api => `
#### ${path.basename(api.current)}
- **الموقع الحالي:** \`${api.current}\`
- **الموقع الجديد:** \`${api.newLocation}\`
- **الوصف:** ${api.description}
- **الإجراء:** نسخ + تحديث المسارات + اختبار
`).join('')}

### المرحلة 2: نقل المكونات

${currentComponents.map(component => `
#### ${path.basename(component.current)}
- **الموقع الحالي:** \`${component.current}\`
- **الموقع الجديد:** \`${component.newLocation}\`
- **الوصف:** ${component.description}
- **الإجراء:** نسخ + تحديث imports + اختبار
`).join('')}

## ⚡ خطوات التنفيذ

### الخطوة 1: إنشاء الهيكل الجديد ✅
- [x] إنشاء مجلدات الهيكل الجديد
- [x] إنشاء ملفات placeholder
- [x] توثيق خطة النقل

### الخطوة 2: نقل APIs (تدريجي)
- [ ] نسخ API البوت الأساسي
- [ ] تحديث مسارات الاستيراد
- [ ] اختبار البوت
- [ ] نسخ API التذكيرات
- [ ] اختبار التذكيرات
- [ ] نسخ باقي APIs

### الخطوة 3: نقل المكونات
- [ ] نسخ لوحة التحكم الرئيسية
- [ ] تحديث imports في المكونات
- [ ] اختبار الواجهة
- [ ] إنشاء مكونات منفصلة للإعدادات والتذكيرات

### الخطوة 4: تنظيم الأدوات المساعدة
- [ ] جمع جميع helper functions
- [ ] إنشاء utils منظمة
- [ ] تحديث imports في جميع الملفات

### الخطوة 5: تنظيف نهائي
- [ ] حذف الملفات القديمة (بعد التأكد)
- [ ] تحديث جميع المسارات
- [ ] اختبار شامل
- [ ] توثيق التغييرات

## 🔒 ملاحظات الأمان

1. **لا تحذف الملفات الأصلية** حتى تتأكد من عمل الجديدة
2. **اختبر كل خطوة** قبل المتابعة للتالية
3. **احتفظ بالنسخة الاحتياطية** للتراجع عند الحاجة
4. **تحديث تدريجي** لتجنب كسر المشروع

## 💡 الفوائد المتوقعة

- **تنظيم أفضل:** جميع ملفات الواتساب في مكان واحد
- **صيانة أسهل:** هيكل واضح ومنطقي
- **تطوير أسرع:** سهولة العثور على الملفات
- **أقل تعقيد:** تقليل التكرار والفوضى

---
*خطة آمنة ومدروسة لتحسين تنظيم المشروع*
`;

    fs.writeFileSync(planPath, plan, 'utf8');
    console.log(`📋 تم إنشاء خطة الهجرة: ${planPath}`);
}

function createCurrentStructureAnalysis() {
    const analysisPath = path.join(projectRoot, 'docs', 'CURRENT_WHATSAPP_STRUCTURE.md');
    
    const analysis = `# تحليل الهيكل الحالي للواتساب

**تاريخ التحليل:** ${new Date().toLocaleString('ar-EG')}

## 📊 الملفات الموجودة حالياً

### APIs الأساسية
${currentApis.map(api => {
    const exists = fs.existsSync(path.join(projectRoot, api.current));
    const size = exists ? fs.statSync(path.join(projectRoot, api.current)).size : 0;
    return `- ${exists ? '✅' : '❌'} \`${api.current}\` (${formatSize(size)}) - ${api.description}`;
}).join('\n')}

### المكونات الأساسية
${currentComponents.map(component => {
    const exists = fs.existsSync(path.join(projectRoot, component.current));
    const size = exists ? fs.statSync(path.join(projectRoot, component.current)).size : 0;
    return `- ${exists ? '✅' : '❌'} \`${component.current}\` (${formatSize(size)}) - ${component.description}`;
}).join('\n')}

## 🎯 التوصيات

### فورية
1. **إنشاء الهيكل الجديد** ✅ (مكتمل)
2. **توثيق خطة النقل** ✅ (مكتمل)

### قريبة المدى
1. **نقل API البوت الأساسي** إلى الهيكل الجديد
2. **اختبار البوت** في الموقع الجديد
3. **نقل API التذكيرات** إلى الهيكل الجديد

### متوسطة المدى
1. **توحيد لوحة التحكم** في مكون واحد
2. **إنشاء مكونات منفصلة** للإعدادات والتذكيرات
3. **تنظيم الأدوات المساعدة**

---
*تحليل دقيق للوضع الحالي وخطة واضحة للتحسين*
`;

    fs.writeFileSync(analysisPath, analysis, 'utf8');
    console.log(`📊 تم إنشاء تحليل الهيكل الحالي: ${analysisPath}`);
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
        console.log('🏗️ إنشاء الهيكل الجديد المنظم...\n');
        
        createDirectoryStructure(newStructure);
        
        console.log('\n📋 إنشاء خطة الهجرة...');
        createMigrationPlan();
        
        console.log('\n📊 تحليل الهيكل الحالي...');
        createCurrentStructureAnalysis();
        
        console.log('\n============================================================');
        console.log('✅ تم إنشاء الهيكل الجديد بنجاح!');
        console.log('============================================================');
        console.log(`📁 مجلدات جديدة: ${createdItems.directories}`);
        console.log(`📄 ملفات placeholder: ${createdItems.files}`);
        
        if (createdItems.errors.length > 0) {
            console.log(`❌ الأخطاء: ${createdItems.errors.length}`);
            for (const error of createdItems.errors) {
                console.log(`  - ${error.item}: ${error.error}`);
            }
        }
        
        console.log('\n🎯 الخطوات التالية:');
        console.log('1. مراجعة خطة الهجرة في docs/WHATSAPP_MIGRATION_PLAN.md');
        console.log('2. بدء نقل APIs تدريجياً');
        console.log('3. اختبار كل API بعد النقل');
        console.log('4. نقل المكونات وتحديث imports');
        
        console.log('\n📁 الهيكل الجديد جاهز في: src/whatsapp/');
        console.log('📋 خطة الهجرة متوفرة في: docs/WHATSAPP_MIGRATION_PLAN.md');
        console.log('📊 تحليل الوضع الحالي في: docs/CURRENT_WHATSAPP_STRUCTURE.md');
        
        console.log('\n🔒 ملاحظة: هذا هيكل جديد منظم - الملفات الأصلية آمنة');
        console.log('🎉 يمكنك الآن البدء في النقل التدريجي!');
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء الهيكل:', error);
        process.exit(1);
    }
}

main();
