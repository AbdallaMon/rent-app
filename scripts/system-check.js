#!/usr/bin/env node

/**
 * 🔍 أداة فحص النظام قبل التطوير
 * تتحقق من سلامة الهيكل والـ APIs قبل البدء بأي تطوير
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ألوان للطباعة في الكونسول
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

// مسارات الملفات الأساسية
const CORE_FILES = {
  // واجهات المستخدم
  'src/app/whatsapp/dashboard/page.jsx': 'لوحة التحكم الرئيسية',
  'src/app/whatsapp/reminders/page.jsx': 'واجهة التذكيرات',
  'src/app/whatsapp/settings/page.jsx': 'واجهة الإعدادات',
  
  // APIs
  'src/app/api/whatsapp/route.js': 'API الواتساب الموحد',
  'src/app/api/whatsapp/webhook/route.js': 'API البوت',
  'src/app/api/whatsapp/reminders/route.js': 'API التذكيرات',
  'src/app/api/whatsapp/settings/route.js': 'API الإعدادات',
  
  // المكونات الأساسية
  'src/app/UiComponents/Navigation/Navbar/Navbar.js': 'القائمة الجانبية',
  'src/app/context/AuthProvider/AuthProvider.js': 'نظام الصلاحيات',
  
  // الوثائق
  'docs/WHATSAPP_COMPREHENSIVE_SYSTEM_REFERENCE.md': 'المرجع الشامل',
  'docs/PRE_DEVELOPMENT_REVIEW_GUIDE.md': 'دليل المراجعة'
};

// مسارات APIs للاختبار
const API_ENDPOINTS = [
  '/api/whatsapp',
  '/api/whatsapp/reminders',
  '/api/whatsapp/settings'
];

// إعدادات قاعدة البيانات
const DB_TABLES = [
  'whatsapp_messages',
  'whatsapp_reminders', 
  'whatsapp_settings',
  'whatsapp_conversations'
];

class SystemChecker {
  constructor() {
    this.results = {
      files: { passed: 0, failed: 0, details: [] },
      apis: { passed: 0, failed: 0, details: [] },
      database: { passed: 0, failed: 0, details: [] },
      overall: 'unknown'
    };
  }

  // طباعة ملونة
  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  // فحص وجود الملفات الأساسية
  checkFiles() {
    this.log('\n🔍 فحص الملفات الأساسية...', 'cyan');
    this.log('═'.repeat(50), 'blue');

    for (const [filePath, description] of Object.entries(CORE_FILES)) {
      const fullPath = path.join(process.cwd(), filePath);
      const exists = fs.existsSync(fullPath);
      
      if (exists) {
        this.log(`✅ ${description}`, 'green');
        this.results.files.passed++;
      } else {
        this.log(`❌ ${description} - مفقود: ${filePath}`, 'red');
        this.results.files.failed++;
      }
      
      this.results.files.details.push({
        file: filePath,
        description,
        exists,
        status: exists ? 'موجود' : 'مفقود'
      });
    }

    const total = this.results.files.passed + this.results.files.failed;
    const percentage = ((this.results.files.passed / total) * 100).toFixed(1);
    
    this.log(`\n📊 نتائج فحص الملفات: ${this.results.files.passed}/${total} (${percentage}%)`, 
             percentage == 100 ? 'green' : 'yellow');
  }

  // فحص APIs (إذا كان الخادم يعمل)
  async checkAPIs() {
    this.log('\n🌐 فحص APIs الأساسية...', 'cyan');
    this.log('═'.repeat(50), 'blue');

    // تحقق من وجود ملفات APIs أولاً
    for (const endpoint of API_ENDPOINTS) {
      const routeFile = `src/app${endpoint}/route.js`;
      const fullPath = path.join(process.cwd(), routeFile);
      const exists = fs.existsSync(fullPath);
      
      if (exists) {
        this.log(`✅ ملف API موجود: ${endpoint}`, 'green');
        this.results.apis.passed++;
        this.results.apis.details.push({
          endpoint,
          file: routeFile,
          exists: true,
          status: 'ملف موجود'
        });
      } else {
        this.log(`❌ ملف API مفقود: ${routeFile}`, 'red');
        this.results.apis.failed++;
        this.results.apis.details.push({
          endpoint,
          file: routeFile,
          exists: false,
          status: 'ملف مفقود'
        });
      }
    }

    const total = this.results.apis.passed + this.results.apis.failed;
    const percentage = total > 0 ? ((this.results.apis.passed / total) * 100).toFixed(1) : 0;
    
    this.log(`\n📊 نتائج فحص APIs: ${this.results.apis.passed}/${total} (${percentage}%)`, 
             percentage == 100 ? 'green' : 'yellow');
  }

  // فحص قاعدة البيانات (فحص أساسي)
  checkDatabase() {
    this.log('\n🗄️ فحص إعداد قاعدة البيانات...', 'cyan');
    this.log('═'.repeat(50), 'blue');

    // فحص ملف إعداد قاعدة البيانات
    const dbFiles = [
      'lib/database-connection.js',
      'schema.prisma',
      'sql/whatsapp_tables.sql'
    ];

    for (const dbFile of dbFiles) {
      const fullPath = path.join(process.cwd(), dbFile);
      const exists = fs.existsSync(fullPath);
      
      if (exists) {
        this.log(`✅ ملف قاعدة البيانات: ${dbFile}`, 'green');
        this.results.database.passed++;
      } else {
        this.log(`⚠️ ملف قاعدة البيانات: ${dbFile} - غير موجود`, 'yellow');
        this.results.database.failed++;
      }
      
      this.results.database.details.push({
        file: dbFile,
        exists,
        status: exists ? 'موجود' : 'مفقود'
      });
    }

    // فحص متغيرات البيئة
    const envFile = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envFile)) {
      this.log(`✅ ملف متغيرات البيئة موجود`, 'green');
      this.results.database.passed++;
    } else {
      this.log(`⚠️ ملف .env.local غير موجود`, 'yellow');
      this.results.database.failed++;
    }

    const total = this.results.database.passed + this.results.database.failed;
    const percentage = total > 0 ? ((this.results.database.passed / total) * 100).toFixed(1) : 0;
    
    this.log(`\n📊 نتائج فحص قاعدة البيانات: ${this.results.database.passed}/${total} (${percentage}%)`, 
             percentage >= 75 ? 'green' : 'yellow');
  }

  // فحص الهيكل العام
  checkStructure() {
    this.log('\n🏗️ فحص الهيكل العام...', 'cyan');
    this.log('═'.repeat(50), 'blue');

    const directories = [
      'src/app/whatsapp',
      'src/app/api/whatsapp',
      'src/whatsapp/components',
      'docs'
    ];

    let structureScore = 0;
    for (const dir of directories) {
      const fullPath = path.join(process.cwd(), dir);
      if (fs.existsSync(fullPath)) {
        this.log(`✅ مجلد: ${dir}`, 'green');
        structureScore++;
      } else {
        this.log(`❌ مجلد مفقود: ${dir}`, 'red');
      }
    }

    const structurePercentage = ((structureScore / directories.length) * 100).toFixed(1);
    this.log(`\n📊 نتائج فحص الهيكل: ${structureScore}/${directories.length} (${structurePercentage}%)`, 
             structurePercentage == 100 ? 'green' : 'yellow');

    return structurePercentage >= 75;
  }

  // حساب النتيجة الإجمالية
  calculateOverallScore() {
    const filesTotal = this.results.files.passed + this.results.files.failed;
    const apisTotal = this.results.apis.passed + this.results.apis.failed;
    const dbTotal = this.results.database.passed + this.results.database.failed;

    const filesScore = filesTotal > 0 ? (this.results.files.passed / filesTotal) * 100 : 0;
    const apisScore = apisTotal > 0 ? (this.results.apis.passed / apisTotal) * 100 : 0;
    const dbScore = dbTotal > 0 ? (this.results.database.passed / dbTotal) * 100 : 0;

    const overallScore = (filesScore + apisScore + dbScore) / 3;

    if (overallScore >= 90) {
      this.results.overall = 'excellent';
    } else if (overallScore >= 75) {
      this.results.overall = 'good';
    } else if (overallScore >= 50) {
      this.results.overall = 'warning';
    } else {
      this.results.overall = 'critical';
    }

    return overallScore;
  }

  // طباعة التقرير النهائي
  printFinalReport() {
    const overallScore = this.calculateOverallScore();
    
    this.log('\n' + '═'.repeat(60), 'blue');
    this.log('📋 التقرير النهائي لفحص النظام', 'bright');
    this.log('═'.repeat(60), 'blue');

    // حالة النظام العامة
    let statusColor = 'green';
    let statusIcon = '✅';
    let statusText = 'النظام جاهز للتطوير';

    switch (this.results.overall) {
      case 'excellent':
        statusColor = 'green';
        statusIcon = '🎉';
        statusText = 'النظام في حالة ممتازة - جاهز للتطوير';
        break;
      case 'good':
        statusColor = 'green';
        statusIcon = '✅';
        statusText = 'النظام في حالة جيدة - جاهز للتطوير';
        break;
      case 'warning':
        statusColor = 'yellow';
        statusIcon = '⚠️';
        statusText = 'النظام يحتاج بعض التحسينات قبل التطوير';
        break;
      case 'critical':
        statusColor = 'red';
        statusIcon = '❌';
        statusText = 'النظام يحتاج إصلاحات كبيرة قبل التطوير';
        break;
    }

    this.log(`\n${statusIcon} الحالة العامة: ${statusText}`, statusColor);
    this.log(`📊 النتيجة الإجمالية: ${overallScore.toFixed(1)}%`, statusColor);

    // تفاصيل النتائج
    this.log('\n📈 تفاصيل النتائج:', 'cyan');
    this.log(`   📁 الملفات: ${this.results.files.passed} موجود، ${this.results.files.failed} مفقود`);
    this.log(`   🌐 APIs: ${this.results.apis.passed} جاهز، ${this.results.apis.failed} غير جاهز`);
    this.log(`   🗄️ قاعدة البيانات: ${this.results.database.passed} جاهز، ${this.results.database.failed} غير جاهز`);

    // توصيات
    this.log('\n💡 التوصيات:', 'magenta');
    if (this.results.files.failed > 0) {
      this.log('   • راجع الملفات المفقودة وتأكد من إنشائها', 'yellow');
    }
    if (this.results.apis.failed > 0) {
      this.log('   • تأكد من وجود جميع ملفات APIs المطلوبة', 'yellow');
    }
    if (this.results.database.failed > 0) {
      this.log('   • راجع إعدادات قاعدة البيانات ومتغيرات البيئة', 'yellow');
    }
    if (overallScore >= 90) {
      this.log('   • النظام جاهز! يمكنك البدء بالتطوير بثقة', 'green');
    }

    this.log('\n📚 للمراجعة التفصيلية:', 'cyan');
    this.log('   • docs/WHATSAPP_COMPREHENSIVE_SYSTEM_REFERENCE.md');
    this.log('   • docs/PRE_DEVELOPMENT_REVIEW_GUIDE.md');

    this.log('\n' + '═'.repeat(60), 'blue');
    
    return this.results.overall !== 'critical';
  }

  // تشغيل جميع الفحوصات
  async runAllChecks() {
    this.log('🚀 بدء فحص نظام الواتساب...', 'bright');
    this.log(`⏰ الوقت: ${new Date().toLocaleString('ar-SA')}`, 'blue');
    
    this.checkFiles();
    await this.checkAPIs();
    this.checkDatabase();
    this.checkStructure();
    
    return this.printFinalReport();
  }

  // إنشاء تقرير JSON
  generateJSONReport() {
    const report = {
      timestamp: new Date().toISOString(),
      overall_status: this.results.overall,
      overall_score: this.calculateOverallScore(),
      details: this.results,
      recommendations: []
    };

    if (this.results.files.failed > 0) {
      report.recommendations.push('راجع الملفات المفقودة وتأكد من إنشائها');
    }
    if (this.results.apis.failed > 0) {
      report.recommendations.push('تأكد من وجود جميع ملفات APIs المطلوبة');
    }
    if (this.results.database.failed > 0) {
      report.recommendations.push('راجع إعدادات قاعدة البيانات ومتغيرات البيئة');
    }

    // حفظ التقرير
    const reportPath = path.join(process.cwd(), 'docs', 'system-check-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    
    this.log(`\n💾 تم حفظ التقرير في: ${reportPath}`, 'green');
    
    return report;
  }
}

// تشغيل الفحص
async function main() {
  const checker = new SystemChecker();
  
  try {
    const isHealthy = await checker.runAllChecks();
    checker.generateJSONReport();
    
    // رمز الخروج
    process.exit(isHealthy ? 0 : 1);
  } catch (error) {
    console.error(`❌ خطأ في فحص النظام: ${error.message}`);
    process.exit(1);
  }
}

// تشغيل الفحص إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  main();
}

module.exports = SystemChecker;
