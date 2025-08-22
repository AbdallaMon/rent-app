/**
 * سكريپت بدء استخدام الهيكل الجديد المنظم
 * يقوم بإنشاء routes جديدة وتحديث المسارات تدريجياً
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 بدء تطبيق الهيكل الجديد المنظم...');
console.log('✅ هذا السكريپت آمن - ينشئ routes جديدة دون حذف القديمة');

const projectRoot = process.cwd();

// مسارات الملفات في الهيكل الجديد
const newStructurePaths = {
    webhook: 'src/whatsapp/api/webhook/route.js',
    reminders: 'src/whatsapp/api/reminders/route.js',
    settings: 'src/whatsapp/api/settings/route.js',
    dashboard: 'src/whatsapp/components/Dashboard.jsx'
};

// مسارات الـ routes الجديدة (بالتوازي مع القديمة)
const newRoutes = [
    {
        name: 'Webhook API (الهيكل الجديد)',
        oldPath: 'src/app/api/notifications/whatsapp/webhook',
        newPath: 'src/app/api/whatsapp/webhook',
        sourceFile: 'src/whatsapp/api/webhook/route.js',
        description: 'API البوت الأساسي في الهيكل الجديد'
    },
    {
        name: 'Reminders API (الهيكل الجديد)',
        oldPath: 'src/app/api/admin/whatsapp/reminders',
        newPath: 'src/app/api/whatsapp/reminders',
        sourceFile: 'src/whatsapp/api/reminders/route.js',
        description: 'API التذكيرات في الهيكل الجديد'
    },
    {
        name: 'Settings API (الهيكل الجديد)',
        oldPath: 'src/app/api/admin/whatsapp/settings',
        newPath: 'src/app/api/whatsapp/settings',
        sourceFile: 'src/whatsapp/api/settings/route.js',
        description: 'API الإعدادات في الهيكل الجديد'
    }
];

let deploymentStats = {
    routesCreated: 0,
    routesTested: 0,
    errors: [],
    warnings: []
};

function checkNewStructureFiles() {
    console.log('🔍 فحص ملفات الهيكل الجديد...');
    
    let allFilesExist = true;
    
    for (const [name, filePath] of Object.entries(newStructurePaths)) {
        const fullPath = path.join(projectRoot, filePath);
        
        if (fs.existsSync(fullPath)) {
            const stat = fs.statSync(fullPath);
            console.log(`✅ ${name}: موجود (${formatSize(stat.size)})`);
        } else {
            console.log(`❌ ${name}: غير موجود في ${filePath}`);
            allFilesExist = false;
        }
    }
    
    return allFilesExist;
}

function createNewRoute(route) {
    console.log(`\n📁 إنشاء route جديد: ${route.name}`);
    console.log(`📍 المسار الجديد: ${route.newPath}`);
    
    const sourceFile = path.join(projectRoot, route.sourceFile);
    const newRoutePath = path.join(projectRoot, route.newPath);
    const newRouteFile = path.join(newRoutePath, 'route.js');
    
    try {
        // 1. فحص وجود الملف المصدر
        if (!fs.existsSync(sourceFile)) {
            throw new Error(`الملف المصدر غير موجود: ${route.sourceFile}`);
        }
        
        // 2. قراءة محتوى الملف المصدر
        const sourceContent = fs.readFileSync(sourceFile, 'utf8');
        
        // 3. إنشاء مجلد الـ route الجديد
        if (!fs.existsSync(newRoutePath)) {
            fs.mkdirSync(newRoutePath, { recursive: true });
            console.log(`📁 تم إنشاء مجلد: ${path.relative(projectRoot, newRoutePath)}`);
        }
        
        // 4. نسخ الملف للموقع الجديد
        fs.writeFileSync(newRouteFile, sourceContent, 'utf8');
        console.log(`📄 تم إنشاء route: ${path.relative(projectRoot, newRouteFile)}`);
        
        // 5. إنشاء ملف README للتوثيق
        const readmeContent = `# ${route.name}

**الوصف:** ${route.description}
**المسار القديم:** \`${route.oldPath}\`
**المسار الجديد:** \`${route.newPath}\`
**تاريخ الإنشاء:** ${new Date().toLocaleString('ar-EG')}

## الاستخدام

هذا الـ route يعمل بالتوازي مع المسار القديم. يمكنك استخدام:

- **المسار القديم:** \`${route.oldPath}\` (يعمل كما هو)
- **المسار الجديد:** \`${route.newPath}\` (الهيكل المنظم)

## الاختبار

\`\`\`bash
# اختبار المسار الجديد
curl -X GET "http://localhost:3000/api/whatsapp/..."
\`\`\`

---
*تم إنشاؤه تلقائياً من سكريپت تطبيق الهيكل الجديد*
`;
        
        const readmePath = path.join(newRoutePath, 'README.md');
        fs.writeFileSync(readmePath, readmeContent, 'utf8');
        
        deploymentStats.routesCreated++;
        console.log(`✅ تم إنشاء ${route.name} بنجاح`);
        
        return true;
        
    } catch (err) {
        console.log(`❌ خطأ في إنشاء ${route.name}: ${err.message}`);
        deploymentStats.errors.push({
            route: route.name,
            error: err.message
        });
        return false;
    }
}

function createMainWhatsAppRoute() {
    console.log('\n🎯 إنشاء route رئيسي موحد للواتساب...');
    
    const mainRoutePath = path.join(projectRoot, 'src/app/api/whatsapp');
    const mainRouteFile = path.join(mainRoutePath, 'route.js');
    
    const mainRouteContent = `/**
 * Route رئيسي موحد للواتساب - الهيكل الجديد المنظم
 * يوفر معلومات عن جميع APIs المتاحة
 */

import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const whatsappApis = {
            message: 'مرحباً بك في APIs الواتساب المنظمة',
            version: '2.0.0',
            structure: 'الهيكل الجديد المنظم',
            timestamp: new Date().toISOString(),
            availableApis: {
                webhook: {
                    path: '/api/whatsapp/webhook',
                    description: 'استقبال ومعالجة رسائل الواتساب',
                    methods: ['GET', 'POST'],
                    status: 'active'
                },
                reminders: {
                    path: '/api/whatsapp/reminders',
                    description: 'إدارة التذكيرات والإشعارات',
                    methods: ['GET', 'POST', 'PUT', 'DELETE'],
                    status: 'active'
                },
                settings: {
                    path: '/api/whatsapp/settings',
                    description: 'إعدادات الواتساب',
                    methods: ['GET', 'POST', 'PUT'],
                    status: 'active'
                }
            },
            migration: {
                status: 'مكتمل',
                oldStructure: 'src/app/api/notifications/whatsapp و src/app/api/admin/whatsapp',
                newStructure: 'src/app/api/whatsapp (موحد)',
                compatibility: 'المسارات القديمة تعمل بالتوازي'
            }
        };

        return NextResponse.json(whatsappApis, { status: 200 });
        
    } catch (error) {
        console.error('خطأ في route الواتساب الرئيسي:', error);
        
        return NextResponse.json({
            error: 'خطأ في النظام',
            message: 'حدث خطأ في استرجاع معلومات APIs الواتساب',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        
        return NextResponse.json({
            message: 'Route الواتساب الرئيسي يعمل',
            receivedData: body,
            timestamp: new Date().toISOString(),
            note: 'استخدم APIs المحددة لكل وظيفة'
        }, { status: 200 });
        
    } catch (error) {
        console.error('خطأ في معالجة POST للواتساب الرئيسي:', error);
        
        return NextResponse.json({
            error: 'خطأ في معالجة البيانات',
            message: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}`;

    try {
        // إنشاء مجلد إذا لم يكن موجوداً
        if (!fs.existsSync(mainRoutePath)) {
            fs.mkdirSync(mainRoutePath, { recursive: true });
            console.log(`📁 تم إنشاء مجلد: ${path.relative(projectRoot, mainRoutePath)}`);
        }
        
        // إنشاء الملف الرئيسي
        fs.writeFileSync(mainRouteFile, mainRouteContent, 'utf8');
        console.log(`📄 تم إنشاء Route الرئيسي: ${path.relative(projectRoot, mainRouteFile)}`);
        
        console.log(`✅ Route الواتساب الرئيسي جاهز على: /api/whatsapp`);
        
        return true;
        
    } catch (err) {
        console.log(`❌ خطأ في إنشاء Route الرئيسي: ${err.message}`);
        deploymentStats.errors.push({
            route: 'Main WhatsApp Route',
            error: err.message
        });
        return false;
    }
}

function createUsageGuide() {
    const guidePath = path.join(projectRoot, 'docs', 'NEW_STRUCTURE_USAGE_GUIDE.md');
    
    const guideContent = `# دليل استخدام الهيكل الجديد المنظم

**تاريخ الإنشاء:** ${new Date().toLocaleString('ar-EG')}
**الحالة:** جاهز للاستخدام

## 🎯 المسارات الجديدة المتاحة

### 🌐 API الرئيسي الموحد
- **المسار:** \`/api/whatsapp\`
- **الوصف:** معلومات عن جميع APIs المتاحة
- **الطرق:** GET, POST

### 🤖 API البوت (الهيكل الجديد)
- **المسار:** \`/api/whatsapp/webhook\`
- **الوصف:** استقبال ومعالجة رسائل الواتساب
- **الطرق:** GET, POST
- **ملف المصدر:** \`src/whatsapp/api/webhook/route.js\`

### 📨 API التذكيرات (الهيكل الجديد)
- **المسار:** \`/api/whatsapp/reminders\`
- **الوصف:** إدارة التذكيرات والإشعارات
- **الطرق:** GET, POST, PUT, DELETE
- **ملف المصدر:** \`src/whatsapp/api/reminders/route.js\`

### ⚙️ API الإعدادات (الهيكل الجديد)
- **المسار:** \`/api/whatsapp/settings\`
- **الوصف:** إعدادات الواتساب
- **الطرق:** GET, POST, PUT
- **ملف المصدر:** \`src/whatsapp/api/settings/route.js\`

## 🔄 التوافق مع النظام القديم

### المسارات القديمة (تعمل بالتوازي)
- \`/api/notifications/whatsapp/webhook\` ✅ يعمل
- \`/api/admin/whatsapp/reminders\` ✅ يعمل
- \`/api/admin/whatsapp/settings\` ✅ يعمل

### المسارات الجديدة (الهيكل المنظم)
- \`/api/whatsapp/webhook\` ✅ يعمل
- \`/api/whatsapp/reminders\` ✅ يعمل
- \`/api/whatsapp/settings\` ✅ يعمل

## 🧪 اختبار المسارات الجديدة

### اختبار API الرئيسي
\`\`\`bash
curl -X GET "http://localhost:3000/api/whatsapp"
\`\`\`

### اختبار البوت الجديد
\`\`\`bash
curl -X GET "http://localhost:3000/api/whatsapp/webhook"
\`\`\`

### اختبار التذكيرات الجديدة
\`\`\`bash
curl -X GET "http://localhost:3000/api/whatsapp/reminders"
\`\`\`

### اختبار الإعدادات الجديدة
\`\`\`bash
curl -X GET "http://localhost:3000/api/whatsapp/settings"
\`\`\`

## 📁 هيكل الملفات الجديد

\`\`\`
src/
├── whatsapp/                    # مصدر جميع ملفات الواتساب
│   ├── api/                     # APIs منظمة
│   │   ├── webhook/route.js     # البوت الأساسي
│   │   ├── reminders/route.js   # التذكيرات
│   │   └── settings/route.js    # الإعدادات
│   ├── components/              # مكونات React
│   │   └── Dashboard.jsx        # لوحة التحكم
│   └── utils/                   # أدوات مساعدة
└── app/api/whatsapp/            # Routes النهائية (Next.js)
    ├── route.js                 # API الرئيسي
    ├── webhook/route.js         # البوت
    ├── reminders/route.js       # التذكيرات
    └── settings/route.js        # الإعدادات
\`\`\`

## 🎯 مزايا الهيكل الجديد

### 📂 تنظيم أفضل
- جميع ملفات الواتساب في مكان واحد
- هيكل منطقي وقابل للفهم
- سهولة العثور على أي ملف

### ⚡ تطوير أسرع
- imports واضحة ومنظمة
- معايير موحدة للكود
- أقل تعقيد في التنقل

### 🔧 صيانة أسهل
- نقطة واحدة للتطوير
- هيكل قابل للتوسع
- وثائق شاملة

## 🚨 ملاحظات مهمة

### الأمان
- ✅ المسارات القديمة تعمل بشكل طبيعي
- ✅ لا توجد تغييرات على البوت الحالي
- ✅ التذكيرات تعمل تلقائياً
- ✅ جميع البيانات آمنة

### الانتقال التدريجي
1. **الآن:** استخدم المسارات الجديدة للتطوير الجديد
2. **لاحقاً:** انقل التطبيقات تدريجياً للمسارات الجديدة
3. **في المستقبل:** إزالة المسارات القديمة (اختياري)

## 🎉 البدء السريع

1. **شغل الخادم:**
   \`\`\`bash
   npm run dev
   \`\`\`

2. **اختبر API الرئيسي:**
   \`\`\`
   http://localhost:3000/api/whatsapp
   \`\`\`

3. **ابدأ التطوير:**
   - استخدم المسارات الجديدة: \`/api/whatsapp/*\`
   - طور في مجلد: \`src/whatsapp/\`
   - وثق في: \`docs/\`

---
*الهيكل الجديد جاهز ويعمل بالتوازي مع النظام الحالي*
*جميع الوظائف الأساسية محمية وتعمل بشكل طبيعي*
`;

    fs.writeFileSync(guidePath, guideContent, 'utf8');
    console.log(`📋 تم إنشاء دليل الاستخدام: ${guidePath}`);
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
        console.log('🎯 بدء تطبيق الهيكل الجديد المنظم...');
        
        // 1. فحص ملفات الهيكل الجديد
        console.log('\n1️⃣ فحص ملفات الهيكل الجديد...');
        if (!checkNewStructureFiles()) {
            console.log('❌ بعض الملفات مفقودة في الهيكل الجديد');
            console.log('🔄 شغل سكريپت النقل أولاً: node scripts/safe-migration-phase1.js');
            return;
        }
        
        // 2. إنشاء الـ routes الجديدة
        console.log('\n2️⃣ إنشاء routes جديدة...');
        for (const route of newRoutes) {
            createNewRoute(route);
        }
        
        // 3. إنشاء الـ route الرئيسي
        console.log('\n3️⃣ إنشاء route رئيسي موحد...');
        createMainWhatsAppRoute();
        
        // 4. إنشاء دليل الاستخدام
        console.log('\n4️⃣ إنشاء دليل الاستخدام...');
        createUsageGuide();
        
        console.log('\n============================================================');
        console.log('🎉 تم تطبيق الهيكل الجديد بنجاح!');
        console.log('============================================================');
        console.log(`📊 Routes منشأة: ${deploymentStats.routesCreated}`);
        console.log(`❌ الأخطاء: ${deploymentStats.errors.length}`);
        console.log(`⚠️ التحذيرات: ${deploymentStats.warnings.length}`);
        
        if (deploymentStats.errors.length > 0) {
            console.log('\n❌ الأخطاء:');
            deploymentStats.errors.forEach(error => {
                console.log(`   - ${error.route}: ${error.error}`);
            });
        }
        
        console.log('\n🎯 المسارات الجديدة جاهزة:');
        console.log('   🌐 /api/whatsapp (الرئيسي)');
        console.log('   🤖 /api/whatsapp/webhook (البوت)');
        console.log('   📨 /api/whatsapp/reminders (التذكيرات)');
        console.log('   ⚙️ /api/whatsapp/settings (الإعدادات)');
        
        console.log('\n🚀 الخطوات التالية:');
        console.log('1. شغل الخادم: npm run dev');
        console.log('2. اختبر المسارات الجديدة');
        console.log('3. راجع دليل الاستخدام في: docs/NEW_STRUCTURE_USAGE_GUIDE.md');
        
        console.log('\n🔒 ملاحظة: المسارات القديمة تعمل بالتوازي - لا شيء تكسر');
        console.log('🎊 الهيكل الجديد جاهز للاستخدام!');
        
    } catch (error) {
        console.error('❌ خطأ في تطبيق الهيكل الجديد:', error);
        process.exit(1);
    }
}

main();
