/**
 * سكريپت تحليل المكونات المكررة في الواتساب
 * يحدد المكونات المتشابهة والمكررة ويقترح خطة دمج آمنة
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔍 تحليل المكونات المكررة للواتساب...');
console.log('✅ هذا السكريپت آمن - فقط يحلل ولا يحذف');

const projectRoot = process.cwd();

// قائمة مجلدات البحث
const searchDirs = [
    'src/components',
    'src/app',
    'components',
    'pages'
];

// أنماط ملفات المكونات
const componentPatterns = [
    /whatsapp.*\.(jsx|js|tsx|ts)$/i,
    /dashboard.*whatsapp.*\.(jsx|js|tsx|ts)$/i,
    /.*whatsapp.*dashboard.*\.(jsx|js|tsx|ts)$/i
];

let components = [];
let duplicateGroups = [];
let stats = {
    totalComponents: 0,
    duplicateComponents: 0,
    uniqueComponents: 0,
    similarComponents: 0
};

function calculateFileHash(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        // تنظيف المحتوى من المسافات والتعليقات للمقارنة الأفضل
        const cleanContent = content
            .replace(/\/\*[\s\S]*?\*\//g, '') // حذف تعليقات متعددة الأسطر
            .replace(/\/\/.*$/gm, '') // حذف تعليقات السطر الواحد
            .replace(/\s+/g, ' ') // توحيد المسافات
            .trim();
        
        return crypto.createHash('md5').update(cleanContent).digest('hex');
    } catch (err) {
        return null;
    }
}

function getComponentInfo(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const stat = fs.statSync(filePath);
        
        // استخراج اسم المكون
        const componentNameMatch = content.match(/(?:export\s+default\s+(?:function\s+)?|const\s+|function\s+)(\w+)/);
        const componentName = componentNameMatch ? componentNameMatch[1] : path.basename(filePath, path.extname(filePath));
        
        // البحث عن الواردات
        const imports = [...content.matchAll(/import\s+.*?from\s+['"]([^'"]+)['"]/g)]
            .map(match => match[1]);
        
        // البحث عن الدوال والهوكس
        const functions = [...content.matchAll(/(?:const\s+|function\s+)(\w+)/g)]
            .map(match => match[1]);
        
        const hooks = [...content.matchAll(/use(\w+)/g)]
            .map(match => 'use' + match[1]);
        
        // تحديد نوع المكون
        let componentType = 'Unknown';
        if (content.includes('Dashboard')) componentType = 'Dashboard';
        else if (content.includes('Button')) componentType = 'Button';
        else if (content.includes('Form')) componentType = 'Form';
        else if (content.includes('Modal')) componentType = 'Modal';
        else if (content.includes('Table')) componentType = 'Table';
        else if (content.includes('Chart')) componentType = 'Chart';
        else if (content.includes('Api') || content.includes('API')) componentType = 'API';
        
        return {
            path: filePath,
            name: componentName,
            type: componentType,
            size: stat.size,
            lines: content.split('\n').length,
            hash: calculateFileHash(filePath),
            imports: imports,
            functions: functions,
            hooks: hooks,
            lastModified: stat.mtime,
            isLarge: stat.size > 50000, // أكبر من 50KB
            complexity: calculateComplexity(content)
        };
    } catch (err) {
        return null;
    }
}

function calculateComplexity(content) {
    let complexity = 0;
    
    // عدد الدوال
    complexity += (content.match(/function\s+\w+/g) || []).length;
    
    // عدد الهوكس
    complexity += (content.match(/use\w+\(/g) || []).length;
    
    // عدد الشروط
    complexity += (content.match(/if\s*\(/g) || []).length;
    complexity += (content.match(/\?\s*.*?\s*:/g) || []).length;
    
    // عدد الحلقات
    complexity += (content.match(/for\s*\(/g) || []).length;
    complexity += (content.match(/while\s*\(/g) || []).length;
    complexity += (content.match(/\.map\(/g) || []).length;
    complexity += (content.match(/\.filter\(/g) || []).length;
    
    return complexity;
}

function findComponents() {
    console.log('📂 البحث عن مكونات الواتساب...');
    
    for (const searchDir of searchDirs) {
        const fullPath = path.join(projectRoot, searchDir);
        if (fs.existsSync(fullPath)) {
            scanDirectory(fullPath);
        }
    }
    
    console.log(`🔍 تم العثور على ${components.length} مكون`);
}

function scanDirectory(dirPath) {
    try {
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
                scanDirectory(itemPath);
            } else if (stat.isFile()) {
                // فحص إذا كان الملف يطابق أنماط مكونات الواتساب
                const isWhatsAppComponent = componentPatterns.some(pattern => 
                    pattern.test(itemPath)
                );
                
                if (isWhatsAppComponent) {
                    const componentInfo = getComponentInfo(itemPath);
                    if (componentInfo) {
                        components.push(componentInfo);
                    }
                }
            }
        }
    } catch (err) {
        console.log(`⚠️ خطأ في مسح المجلد: ${dirPath}`);
    }
}

function findDuplicates() {
    console.log('🔍 البحث عن المكونات المكررة...');
    
    const hashGroups = {};
    
    // تجميع المكونات حسب الهاش
    for (const component of components) {
        if (!component.hash) continue;
        
        if (!hashGroups[component.hash]) {
            hashGroups[component.hash] = [];
        }
        hashGroups[component.hash].push(component);
    }
    
    // العثور على المجموعات المكررة
    for (const [hash, group] of Object.entries(hashGroups)) {
        if (group.length > 1) {
            duplicateGroups.push({
                hash: hash,
                components: group,
                count: group.length
            });
        }
    }
    
    console.log(`🔄 تم العثور على ${duplicateGroups.length} مجموعة مكررة`);
}

function findSimilarComponents() {
    console.log('🔍 البحث عن المكونات المتشابهة...');
    
    const similarGroups = {};
    
    // تجميع حسب النوع والحجم المتشابه
    for (const component of components) {
        const key = `${component.type}_${Math.floor(component.size / 10000)}k`;
        
        if (!similarGroups[key]) {
            similarGroups[key] = [];
        }
        similarGroups[key].push(component);
    }
    
    let similarCount = 0;
    for (const group of Object.values(similarGroups)) {
        if (group.length > 1) {
            similarCount += group.length;
        }
    }
    
    stats.similarComponents = similarCount;
    console.log(`🔗 تم العثور على ${similarCount} مكون متشابه`);
}

function analyzeComponents() {
    console.log('📊 تحليل المكونات...');
    
    stats.totalComponents = components.length;
    stats.duplicateComponents = duplicateGroups.reduce((sum, group) => sum + group.count, 0);
    stats.uniqueComponents = stats.totalComponents - stats.duplicateComponents;
    
    findSimilarComponents();
}

function generateReport() {
    const reportPath = path.join(projectRoot, 'docs', 'DUPLICATE_COMPONENTS_ANALYSIS.md');
    
    let report = `# تحليل المكونات المكررة في الواتساب

**تاريخ التحليل:** ${new Date().toLocaleString('ar-EG')}

## 📊 الإحصائيات العامة

- **إجمالي المكونات:** ${stats.totalComponents}
- **المكونات المكررة:** ${stats.duplicateComponents}
- **المكونات الفريدة:** ${stats.uniqueComponents}
- **المكونات المتشابهة:** ${stats.similarComponents}

## 🔄 المكونات المكررة (نفس المحتوى)

`;

    for (const group of duplicateGroups) {
        report += `### مجموعة مكررة (${group.count} مكونات)\n\n`;
        report += `**الهاش:** \`${group.hash.substring(0, 8)}\`\n\n`;
        
        // ترتيب المكونات حسب تاريخ التعديل (الأحدث أولاً)
        const sortedComponents = group.components.sort((a, b) => 
            new Date(b.lastModified) - new Date(a.lastModified)
        );
        
        report += `**المكون المُوصى بالاحتفاظ به:** \`${sortedComponents[0].path}\` (الأحدث)\n\n`;
        report += `**المكونات المُوصى بحذفها:**\n`;
        
        for (let i = 1; i < sortedComponents.length; i++) {
            const component = sortedComponents[i];
            report += `- \`${component.path}\` (${formatSize(component.size)}, ${component.lines} سطر)\n`;
        }
        report += '\n';
    }

    report += `## 📋 جميع المكونات

| المسار | الاسم | النوع | الحجم | الأسطر | التعقيد | آخر تعديل |
|--------|------|------|-------|--------|---------|-----------|
`;

    // ترتيب المكونات حسب النوع ثم الحجم
    const sortedComponents = components.sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return b.size - a.size;
    });

    for (const component of sortedComponents) {
        const relativePath = path.relative(projectRoot, component.path);
        const lastModified = new Date(component.lastModified).toLocaleDateString('ar-EG');
        
        report += `| \`${relativePath}\` | ${component.name} | ${component.type} | ${formatSize(component.size)} | ${component.lines} | ${component.complexity} | ${lastModified} |\n`;
    }

    report += `\n## 💡 التوصيات

### المكونات الآمنة للحذف
`;

    if (duplicateGroups.length > 0) {
        report += `\n**المكونات المكررة تماماً:**\n`;
        for (const group of duplicateGroups) {
            const sortedComponents = group.components.sort((a, b) => 
                new Date(b.lastModified) - new Date(a.lastModified)
            );
            
            for (let i = 1; i < sortedComponents.length; i++) {
                const relativePath = path.relative(projectRoot, sortedComponents[i].path);
                report += `- \`${relativePath}\` (مكرر من \`${path.relative(projectRoot, sortedComponents[0].path)}\`)\n`;
            }
        }
    }

    report += `\n### خطة الدمج المقترحة

1. **احتفظ بالمكونات الحديثة والمستخدمة**
2. **ادمج المكونات المتشابهة في مكون واحد**
3. **انقل المكونات المساعدة إلى مجلد منفصل**
4. **احذف المكونات المكررة تماماً**

### الملفات المحمية (لا تحذف)

- مكونات البوت الأساسية
- مكونات التذكيرات
- APIs الحرجة
- مكونات لوحة التحكم النشطة

## 🔒 ملاحظات الأمان

- جميع الملفات محفوظة في النسخة الاحتياطية
- يمكن استعادة أي ملف محذوف
- اختبر جميع الوظائف بعد أي تعديل
- ابدأ بحذف المكونات المكررة تماماً أولاً
`;

    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`📄 تم إنشاء التقرير: ${reportPath}`);
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
        findComponents();
        findDuplicates();
        analyzeComponents();
        generateReport();
        
        console.log('\n============================================================');
        console.log('✅ انتهى تحليل المكونات المكررة!');
        console.log('============================================================');
        console.log(`📊 إجمالي المكونات: ${stats.totalComponents}`);
        console.log(`🔄 المكونات المكررة: ${stats.duplicateComponents}`);
        console.log(`✨ المكونات الفريدة: ${stats.uniqueComponents}`);
        console.log(`🔗 المكونات المتشابهة: ${stats.similarComponents}`);
        
        if (duplicateGroups.length > 0) {
            console.log(`\n💡 يمكن حذف ${duplicateGroups.reduce((sum, group) => sum + group.count - 1, 0)} مكون مكرر`);
            console.log('📄 راجع التقرير التفصيلي في: docs/DUPLICATE_COMPONENTS_ANALYSIS.md');
            
            console.log('\n🎯 الخطوات التالية:');
            console.log('1. مراجعة قائمة المكونات المكررة');
            console.log('2. حذف المكونات المكررة الآمنة');
            console.log('3. دمج المكونات المتشابهة');
        } else {
            console.log('\n✅ لم يتم العثور على مكونات مكررة');
        }
        
        console.log('\n🔒 ملاحظة: التحليل فقط - لم يتم حذف أي ملف');
        console.log('🎉 العملية مكتملة بأمان!');
        
    } catch (error) {
        console.error('❌ خطأ في تحليل المكونات:', error);
        process.exit(1);
    }
}

main();
