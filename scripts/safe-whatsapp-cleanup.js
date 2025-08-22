#!/usr/bin/env node

/**
 * 🧹 أداة التنظيف الآمن لنظام الواتساب
 * تقوم بإزالة الملفات المتضاربة مع إنشاء نسخ احتياطية
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ألوان للطباعة
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class SafeCleanup {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backup-whatsapp-cleanup');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.results = {
      backed_up: [],
      removed: [],
      errors: [],
      skipped: []
    };
  }

  // طباعة ملونة
  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  // إنشاء مجلد النسخ الاحتياطي
  createBackupDir() {
    const fullBackupPath = `${this.backupDir}-${this.timestamp}`;
    
    if (!fs.existsSync(fullBackupPath)) {
      fs.mkdirSync(fullBackupPath, { recursive: true });
      this.log(`✅ تم إنشاء مجلد النسخ الاحتياطي: ${fullBackupPath}`, 'green');
    }
    
    this.backupDir = fullBackupPath;
    return fullBackupPath;
  }

  // نسخ ملف للنسخ الاحتياطي
  backupFile(filePath) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      if (!fs.existsSync(fullPath)) {
        this.log(`⚠️ الملف غير موجود: ${filePath}`, 'yellow');
        return false;
      }

      // إنشاء نفس البنية في النسخ الاحتياطي
      const backupFilePath = path.join(this.backupDir, filePath);
      const backupDirPath = path.dirname(backupFilePath);
      
      if (!fs.existsSync(backupDirPath)) {
        fs.mkdirSync(backupDirPath, { recursive: true });
      }

      // نسخ الملف أو المجلد
      if (fs.lstatSync(fullPath).isDirectory()) {
        this.copyDirectory(fullPath, backupFilePath);
      } else {
        fs.copyFileSync(fullPath, backupFilePath);
      }

      this.results.backed_up.push(filePath);
      this.log(`✅ تم نسخ: ${filePath}`, 'green');
      return true;
    } catch (error) {
      this.log(`❌ خطأ في نسخ ${filePath}: ${error.message}`, 'red');
      this.results.errors.push({ file: filePath, error: error.message, action: 'backup' });
      return false;
    }
  }

  // نسخ مجلد كامل
  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const items = fs.readdirSync(src);
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      if (fs.lstatSync(srcPath).isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  // فحص التبعيات قبل الحذف
  checkDependencies(filePath) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      
      // فحص إذا كان الملف مستخدم في ملفات أخرى
      const normalizedPath = filePath.replace(/\\/g, '/');
      const relativePath = './' + normalizedPath;
      const absolutePath = '../' + normalizedPath;
      
      // البحث في الملفات المهمة فقط
      const searchDirs = ['src/app', 'src/components', 'src/lib'];
      let dependencies = [];
      
      for (const dir of searchDirs) {
        const fullDir = path.join(process.cwd(), dir);
        if (fs.existsSync(fullDir)) {
          const files = this.findFilesRecursive(fullDir, ['.js', '.jsx', '.ts', '.tsx']);
          
          for (const file of files) {
            // تجاهل الملف نفسه والملفات في المجلد المراد حذفه
            if (!file.includes(filePath) && !filePath.includes(file)) {
              const content = fs.readFileSync(file, 'utf8');
              
              // البحث عن import أو require صريح
              const importPatterns = [
                `import.*from.*['"]${normalizedPath}['"]`,
                `import.*from.*['"]${relativePath}['"]`,
                `import.*from.*['"]${absolutePath}['"]`,
                `require\\(['"]${normalizedPath}['"]\\)`,
                `require\\(['"]${relativePath}['"]\\)`,
                `require\\(['"]${absolutePath}['"]\\)`
              ];
              
              const hasImport = importPatterns.some(pattern => {
                const regex = new RegExp(pattern, 'i');
                return regex.test(content);
              });
              
              if (hasImport) {
                dependencies.push(file);
              }
            }
          }
        }
      }
      
      return dependencies;
    } catch (error) {
      this.log(`⚠️ خطأ في فحص التبعيات لـ ${filePath}: ${error.message}`, 'yellow');
      return [];
    }
  }

  // البحث عن الملفات بشكل تكراري
  findFilesRecursive(dir, extensions) {
    let files = [];
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.lstatSync(fullPath);
        
        if (stat.isDirectory()) {
          files = files.concat(this.findFilesRecursive(fullPath, extensions));
        } else if (extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // تجاهل أخطاء الوصول للمجلدات
    }
    
    return files;
  }

  // حذف ملف أو مجلد بأمان
  safeRemove(filePath) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      
      if (!fs.existsSync(fullPath)) {
        this.log(`⚠️ الملف غير موجود: ${filePath}`, 'yellow');
        this.results.skipped.push(filePath);
        return false;
      }

      // فحص التبعيات
      const dependencies = this.checkDependencies(filePath);
      
      if (dependencies.length > 0) {
        this.log(`⚠️ تم العثور على تبعيات لـ ${filePath}:`, 'yellow');
        dependencies.slice(0, 3).forEach(dep => {
          this.log(`   - ${dep.replace(process.cwd(), '')}`, 'yellow');
        });
        
        if (dependencies.length > 3) {
          this.log(`   ... و ${dependencies.length - 3} ملف آخر`, 'yellow');
        }
        
        this.log(`   سيتم تخطي ${filePath} لتجنب كسر النظام`, 'yellow');
        this.results.skipped.push(filePath);
        return false;
      }

      // نسخ احتياطي أولاً
      if (!this.backupFile(filePath)) {
        this.log(`❌ فشل في النسخ الاحتياطي، لن يتم حذف: ${filePath}`, 'red');
        return false;
      }

      // حذف الملف أو المجلد
      if (fs.lstatSync(fullPath).isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(fullPath);
      }

      this.results.removed.push(filePath);
      this.log(`🗑️ تم حذف: ${filePath}`, 'cyan');
      return true;
    } catch (error) {
      this.log(`❌ خطأ في حذف ${filePath}: ${error.message}`, 'red');
      this.results.errors.push({ file: filePath, error: error.message, action: 'remove' });
      return false;
    }
  }

  // تنظيف الصفحات القديمة
  cleanObsoletePages() {
    this.log('\n📄 تنظيف الصفحات القديمة...', 'cyan');
    this.log('═'.repeat(50), 'blue');

    const obsoletePages = [
      'src/app/whatsapp-api',
      'src/app/whatsapp-bot-messages',
      'src/app/whatsapp-dashboard', 
      'src/app/whatsapp-new',
      'src/app/whatsapp-reminders',
      'src/app/whatsapp-settings'
    ];

    let cleanedCount = 0;
    
    for (const page of obsoletePages) {
      if (this.safeRemove(page)) {
        cleanedCount++;
      }
    }

    this.log(`\n📊 تم تنظيف ${cleanedCount} من ${obsoletePages.length} صفحة قديمة`, 'green');
    return cleanedCount;
  }

  // تنظيف APIs المكررة (الاحتفاظ بالجديدة فقط)
  cleanDuplicateAPIs() {
    this.log('\n🔄 تنظيف APIs المكررة...', 'cyan');
    this.log('═'.repeat(50), 'blue');

    const oldApis = [
      'src/whatsapp/api/dashboard/route.js',
      'src/whatsapp/api/webhook/route.js',
      'src/whatsapp/api/reminders/route.js',
      'src/whatsapp/api/settings/route.js'
    ];

    let cleanedCount = 0;
    
    for (const api of oldApis) {
      if (this.safeRemove(api)) {
        cleanedCount++;
      }
    }

    this.log(`\n📊 تم تنظيف ${cleanedCount} من ${oldApis.length} API مكرر`, 'green');
    return cleanedCount;
  }

  // إنشاء script الاستعادة
  createRestoreScript() {
    const restoreScript = `#!/usr/bin/env node

/**
 * 🔄 أداة استعادة النسخ الاحتياطي
 * تستعيد الملفات من النسخة الاحتياطية المنشأة في ${this.timestamp}
 */

const fs = require('fs');
const path = require('path');

const backupDir = '${this.backupDir}';
const projectRoot = '${process.cwd()}';

console.log('🔄 بدء استعادة النسخ الاحتياطي...');

const backedUpFiles = ${JSON.stringify(this.results.backed_up, null, 2)};

for (const file of backedUpFiles) {
  try {
    const backupPath = path.join(backupDir, file);
    const originalPath = path.join(projectRoot, file);
    
    if (fs.existsSync(backupPath)) {
      // إنشاء المجلد إذا لم يكن موجود
      const originalDir = path.dirname(originalPath);
      if (!fs.existsSync(originalDir)) {
        fs.mkdirSync(originalDir, { recursive: true });
      }
      
      // نسخ الملف
      if (fs.lstatSync(backupPath).isDirectory()) {
        copyDirectory(backupPath, originalPath);
      } else {
        fs.copyFileSync(backupPath, originalPath);
      }
      
      console.log(\`✅ تم استعادة: \${file}\`);
    }
  } catch (error) {
    console.error(\`❌ خطأ في استعادة \${file}: \${error.message}\`);
  }
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const items = fs.readdirSync(src);
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (fs.lstatSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('✅ تم الانتهاء من الاستعادة!');
`;

    const restoreScriptPath = path.join(this.backupDir, 'restore.js');
    fs.writeFileSync(restoreScriptPath, restoreScript);
    this.log(`✅ تم إنشاء script الاستعادة: ${restoreScriptPath}`, 'green');
  }

  // تنظيف آمن شامل
  async performSafeCleanup() {
    this.log('🧹 بدء التنظيف الآمن لنظام الواتساب...', 'bright');
    this.log(`⏰ الوقت: ${new Date().toLocaleString('ar-SA')}`, 'blue');
    
    // إنشاء مجلد النسخ الاحتياطي
    this.createBackupDir();
    
    // تنظيف الصفحات القديمة
    const pagesCleanedCount = this.cleanObsoletePages();
    
    // تنظيف APIs المكررة
    const apisCleanedCount = this.cleanDuplicateAPIs();
    
    // إنشاء script الاستعادة
    this.createRestoreScript();
    
    // تقرير النتائج
    this.printFinalReport(pagesCleanedCount, apisCleanedCount);
    
    return this.results;
  }

  // طباعة التقرير النهائي
  printFinalReport(pagesCleanedCount, apisCleanedCount) {
    this.log('\n' + '═'.repeat(60), 'blue');
    this.log('📋 تقرير التنظيف الآمن', 'bright');
    this.log('═'.repeat(60), 'blue');

    const totalCleaned = this.results.removed.length;
    const totalBackedUp = this.results.backed_up.length;
    const totalErrors = this.results.errors.length;
    const totalSkipped = this.results.skipped.length;

    this.log(`\n📊 النتائج:`, 'cyan');
    this.log(`   🗑️ ملفات تم حذفها: ${totalCleaned}`, totalCleaned > 0 ? 'green' : 'yellow');
    this.log(`   💾 ملفات تم نسخها احتياطياً: ${totalBackedUp}`, totalBackedUp > 0 ? 'green' : 'yellow');
    this.log(`   ⏭️ ملفات تم تخطيها: ${totalSkipped}`, totalSkipped > 0 ? 'yellow' : 'green');
    this.log(`   ❌ أخطاء: ${totalErrors}`, totalErrors > 0 ? 'red' : 'green');

    this.log(`\n📈 التفاصيل:`, 'cyan');
    this.log(`   📄 صفحات قديمة تم تنظيفها: ${pagesCleanedCount}/6`);
    this.log(`   🔄 APIs مكررة تم تنظيفها: ${apisCleanedCount}/4`);

    if (this.results.skipped.length > 0) {
      this.log(`\n⚠️ الملفات المتخطاة (بسبب التبعيات):`, 'yellow');
      this.results.skipped.forEach(file => {
        this.log(`   - ${file}`, 'yellow');
      });
    }

    if (this.results.errors.length > 0) {
      this.log(`\n❌ الأخطاء:`, 'red');
      this.results.errors.forEach(error => {
        this.log(`   - ${error.file}: ${error.error}`, 'red');
      });
    }

    this.log(`\n💾 النسخ الاحتياطي:`, 'green');
    this.log(`   📁 المجلد: ${this.backupDir}`);
    this.log(`   🔄 للاستعادة: node "${path.join(this.backupDir, 'restore.js')}"`);

    this.log(`\n💡 التوصيات:`, 'magenta');
    if (totalCleaned > 0) {
      this.log('   • تم التنظيف بنجاح! اختبر النظام للتأكد من عمله', 'green');
      this.log('   • شغل فحص النظام: npm run system:check', 'green');
    }
    if (totalSkipped > 0) {
      this.log('   • راجع الملفات المتخطاة وتأكد من عدم الحاجة إليها', 'yellow');
    }
    
    this.log('\n' + '═'.repeat(60), 'blue');
  }
}

// تشغيل التنظيف
async function main() {
  const cleanup = new SafeCleanup();
  
  try {
    await cleanup.performSafeCleanup();
    console.log('✅ انتهى التنظيف بنجاح!');
  } catch (error) {
    console.error(`❌ خطأ في التنظيف: ${error.message}`);
    process.exit(1);
  }
}

// تشغيل إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  main();
}

module.exports = SafeCleanup;
