const fs = require('fs');
const path = require('path');

// إعدادات السكريبت
const config = {
  srcDir: path.join(__dirname, '..', 'src'),
  reportFile: path.join(__dirname, '..', 'pages-analysis-report.json'),
  logFile: path.join(__dirname, '..', 'pages-update.log'),
  backupDir: path.join(__dirname, '..', 'backup', new Date().toISOString().slice(0, 10))
};

// قائمة بجميع التحديثات المطلوبة
const replacements = [
  // مراجع المكونات
  { from: '@/app/UiComponents', to: '@/components/ui' },
  { from: '@/app/components', to: '@/components' },
  { from: '@/app/constants', to: '@/config' },
  { from: '../../UiComponents', to: '@/components/ui' },
  { from: '../UiComponents', to: '@/components/ui' },
  { from: './UiComponents', to: '@/components/ui' },
  { from: '../../components', to: '@/components' },
  { from: '../components', to: '@/components' },
  { from: './components', to: '@/components' },
  { from: '../../constants', to: '@/config' },
  { from: '../constants', to: '@/config' },
  { from: './constants', to: '@/config' },
  
  // مراجع المساعدات والخدمات
  { from: '@/app/helpers', to: '@/helpers' },
  { from: '@/app/services', to: '@/services' },
  { from: '@/app/lib', to: '@/lib' },
  { from: '@/app/types', to: '@/types' },
  
  // مراجع نسبية شائعة
  { from: '../../helpers', to: '@/helpers' },
  { from: '../helpers', to: '@/helpers' },
  { from: '../../services', to: '@/services' },
  { from: '../services', to: '@/services' },
];

// الإحصائيات
let stats = {
  totalFiles: 0,
  updatedFiles: 0,
  errors: 0,
  warnings: 0,
  pageAnalysis: {},
  componentUsage: {},
  importPatterns: {}
};

// دالة للكتابة في ملف السجل
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`;
  fs.appendFileSync(config.logFile, logMessage, 'utf8');
  console.log(logMessage.trim());
}

// دالة لإنشاء نسخة احتياطية
function createBackup(filePath) {
  try {
    const relativePath = path.relative(config.srcDir, filePath);
    const backupPath = path.join(config.backupDir, relativePath);
    const backupDir = path.dirname(backupPath);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    fs.copyFileSync(filePath, backupPath);
    log(`تم إنشاء نسخة احتياطية: ${relativePath}`);
  } catch (error) {
    log(`خطأ في إنشاء النسخة الاحتياطية لـ ${filePath}: ${error.message}`, 'error');
  }
}

// دالة للبحث عن جميع الملفات
function findAllFiles(dir, extensions = ['.js', '.jsx', '.ts', '.tsx'], files = []) {
  try {
    const dirFiles = fs.readdirSync(dir);
    
    for (const file of dirFiles) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        findAllFiles(filePath, extensions, files);
      } else if (extensions.some(ext => file.endsWith(ext))) {
        files.push(filePath);
      }
    }
  } catch (error) {
    log(`خطأ في قراءة المجلد ${dir}: ${error.message}`, 'error');
  }
  
  return files;
}

// دالة لتحليل الصفحة
function analyzePage(filePath, content) {
  const relativePath = path.relative(config.srcDir, filePath);
  const analysis = {
    path: relativePath,
    type: getPageType(filePath),
    imports: [],
    components: [],
    issues: [],
    size: content.length,
    lines: content.split('\n').length
  };

  // تحليل الـ imports
  const importRegex = /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    analysis.imports.push(match[1]);
    
    // تتبع أنماط الـ imports
    const importPath = match[1];
    if (!stats.importPatterns[importPath]) {
      stats.importPatterns[importPath] = 0;
    }
    stats.importPatterns[importPath]++;
  }

  // تحليل المكونات المستخدمة
  const componentRegex = /<([A-Z][A-Za-z0-9]*)/g;
  while ((match = componentRegex.exec(content)) !== null) {
    const componentName = match[1];
    analysis.components.push(componentName);
    
    if (!stats.componentUsage[componentName]) {
      stats.componentUsage[componentName] = 0;
    }
    stats.componentUsage[componentName]++;
  }

  // البحث عن مشاكل محتملة
  if (content.includes('UiComponents')) {
    analysis.issues.push('يحتوي على مراجع UiComponents قديمة');
  }
  if (content.includes('@/app/components')) {
    analysis.issues.push('يحتوي على مراجع @/app/components قديمة');
  }
  if (content.includes('../../') && content.includes('../')) {
    analysis.issues.push('يحتوي على مراجع نسبية معقدة');
  }

  return analysis;
}

// دالة لتحديد نوع الصفحة
function getPageType(filePath) {
  const fileName = path.basename(filePath);
  const dirPath = path.dirname(filePath);
  
  if (fileName === 'page.jsx' || fileName === 'page.js') return 'page';
  if (fileName === 'layout.jsx' || fileName === 'layout.js') return 'layout';
  if (fileName === 'loading.jsx' || fileName === 'loading.js') return 'loading';
  if (fileName === 'error.jsx' || fileName === 'error.js') return 'error';
  if (fileName === 'not-found.jsx' || fileName === 'not-found.js') return 'not-found';
  if (dirPath.includes('components')) return 'component';
  if (dirPath.includes('api')) return 'api';
  if (fileName.includes('Modal') || fileName.includes('modal')) return 'modal';
  if (fileName.includes('Form') || fileName.includes('form')) return 'form';
  if (fileName.includes('Table') || fileName.includes('table')) return 'table';
  if (fileName.includes('Card') || fileName.includes('card')) return 'card';
  if (fileName.includes('Button') || fileName.includes('button')) return 'button';
  
  return 'other';
}

// دالة لتحديث محتوى الملف
function updateFileContent(filePath, content) {
  let updatedContent = content;
  let hasChanges = false;
  
  for (const replacement of replacements) {
    const regex = new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    if (updatedContent.includes(replacement.from)) {
      updatedContent = updatedContent.replace(regex, replacement.to);
      hasChanges = true;
    }
  }
  
  return { content: updatedContent, hasChanges };
}

// دالة لمعالجة ملف واحد
function processFile(filePath) {
  try {
    stats.totalFiles++;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const analysis = analyzePage(filePath, content);
    
    // حفظ تحليل الصفحة
    stats.pageAnalysis[analysis.path] = analysis;
    
    // تحديث المحتوى
    const updateResult = updateFileContent(filePath, content);
    
    if (updateResult.hasChanges) {
      // إنشاء نسخة احتياطية
      createBackup(filePath);
      
      // كتابة المحتوى المحدث
      fs.writeFileSync(filePath, updateResult.content, 'utf8');
      stats.updatedFiles++;
      log(`تم تحديث: ${path.relative(config.srcDir, filePath)}`);
    }
    
    // تسجيل المشاكل
    if (analysis.issues.length > 0) {
      stats.warnings += analysis.issues.length;
      log(`تحذيرات في ${analysis.path}: ${analysis.issues.join(', ')}`, 'warning');
    }
    
  } catch (error) {
    stats.errors++;
    log(`خطأ في معالجة ${filePath}: ${error.message}`, 'error');
  }
}

// دالة لإنشاء التقرير
function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: stats.totalFiles,
      updatedFiles: stats.updatedFiles,
      errors: stats.errors,
      warnings: stats.warnings
    },
    pageTypes: {},
    topComponents: Object.entries(stats.componentUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20),
    topImports: Object.entries(stats.importPatterns)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20),
    pageAnalysis: stats.pageAnalysis
  };

  // تجميع أنواع الصفحات
  Object.values(stats.pageAnalysis).forEach(page => {
    if (!report.pageTypes[page.type]) {
      report.pageTypes[page.type] = 0;
    }
    report.pageTypes[page.type]++;
  });

  return report;
}

// دالة لطباعة ملخص النتائج
function printSummary(report) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 تقرير تحليل وتحديث الصفحات');
  console.log('='.repeat(60));
  console.log(`📁 إجمالي الملفات: ${report.summary.totalFiles}`);
  console.log(`✅ ملفات محدثة: ${report.summary.updatedFiles}`);
  console.log(`⚠️  تحذيرات: ${report.summary.warnings}`);
  console.log(`❌ أخطاء: ${report.summary.errors}`);
  
  console.log('\n📋 أنواع الصفحات:');
  Object.entries(report.pageTypes).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  
  console.log('\n🔝 أكثر المكونات استخداماً:');
  report.topComponents.slice(0, 10).forEach(([component, count]) => {
    console.log(`  ${component}: ${count}`);
  });
  
  console.log('\n🔗 أكثر المراجع استخداماً:');
  report.topImports.slice(0, 10).forEach(([importPath, count]) => {
    console.log(`  ${importPath}: ${count}`);
  });
  
  console.log('\n' + '='.repeat(60));
}

// الدالة الرئيسية
async function main() {
  try {
    console.log('🚀 بدء تحليل وتحديث جميع الصفحات...');
    
    // إنشاء مجلد النسخ الاحتياطية
    if (!fs.existsSync(config.backupDir)) {
      fs.mkdirSync(config.backupDir, { recursive: true });
    }
    
    // تهيئة ملف السجل
    fs.writeFileSync(config.logFile, '', 'utf8');
    log('بدء عملية التحليل والتحديث');
    
    // البحث عن جميع الملفات
    const files = findAllFiles(config.srcDir);
    log(`تم العثور على ${files.length} ملف`);
    
    // معالجة كل ملف
    for (const file of files) {
      processFile(file);
    }
    
    // إنشاء التقرير
    const report = generateReport();
    fs.writeFileSync(config.reportFile, JSON.stringify(report, null, 2), 'utf8');
    
    // طباعة الملخص
    printSummary(report);
    
    log(`تم الانتهاء بنجاح. التقرير محفوظ في: ${config.reportFile}`);
    
  } catch (error) {
    log(`خطأ في التنفيذ: ${error.message}`, 'error');
    process.exit(1);
  }
}

// تشغيل السكريبت
if (require.main === module) {
  main();
}

module.exports = { main, config, stats };
