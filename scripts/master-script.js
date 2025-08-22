const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// السكريبت الرئيسي الشامل
class MasterScript {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.scriptsDir = __dirname;
    this.results = {
      analysis: null,
      fixes: null,
      clean: null,
      build: null,
      lint: null
    };
  }

  // تشغيل سكريبت فرعي
  async runScript(scriptName, description) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 ${description}`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      const scriptPath = path.join(this.scriptsDir, scriptName);
      
      if (!fs.existsSync(scriptPath)) {
        throw new Error(`السكريبت غير موجود: ${scriptPath}`);
      }
      
      const { stdout, stderr } = await execAsync(`node "${scriptPath}"`, {
        cwd: this.projectRoot,
        timeout: 300000 // 5 دقائق
      });
      
      if (stderr && !stderr.includes('Warning')) {
        console.log('⚠️ تحذيرات:', stderr);
      }
      
      console.log(stdout);
      return { success: true, output: stdout, error: stderr };
      
    } catch (error) {
      console.error(`❌ خطأ في تشغيل ${scriptName}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // تشغيل أوامر npm
  async runNpmCommand(command, description) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📦 ${description}`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      const { stdout, stderr } = await execAsync(`npm run ${command}`, {
        cwd: this.projectRoot,
        timeout: 600000 // 10 دقائق
      });
      
      console.log(stdout);
      if (stderr && !stderr.includes('Warning')) {
        console.log('⚠️ تحذيرات:', stderr);
      }
      
      return { success: true, output: stdout, error: stderr };
      
    } catch (error) {
      console.error(`❌ خطأ في تشغيل ${command}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // إنشاء تقرير شامل
  generateMasterReport() {
    const report = {
      timestamp: new Date().toISOString(),
      projectName: 'Tar Real Estate Company',
      version: '1.0.0',
      results: this.results,
      summary: {
        totalSteps: 6,
        successfulSteps: 0,
        failedSteps: 0,
        warnings: 0
      },
      recommendations: []
    };

    // حساب الإحصائيات
    Object.values(this.results).forEach(result => {
      if (result) {
        if (result.success) {
          report.summary.successfulSteps++;
        } else {
          report.summary.failedSteps++;
        }
        if (result.error && result.error.includes('Warning')) {
          report.summary.warnings++;
        }
      }
    });

    // إضافة توصيات
    if (report.summary.failedSteps > 0) {
      report.recommendations.push('راجع الأخطاء المذكورة أعلاه وأصلحها');
    }
    if (report.summary.warnings > 0) {
      report.recommendations.push('راجع التحذيرات وفكر في إصلاحها لتحسين جودة الكود');
    }
    if (report.summary.successfulSteps === report.summary.totalSteps) {
      report.recommendations.push('المشروع في حالة ممتازة! يمكنك البدء في التطوير');
    }

    return report;
  }

  // طباعة التقرير النهائي
  printFinalReport(report) {
    console.log(`\n${'═'.repeat(80)}`);
    console.log('📋 التقرير النهائي الشامل');
    console.log(`${'═'.repeat(80)}`);
    console.log(`🏢 المشروع: ${report.projectName}`);
    console.log(`📅 التاريخ: ${new Date(report.timestamp).toLocaleString('ar-SA')}`);
    console.log(`📊 إجمالي الخطوات: ${report.summary.totalSteps}`);
    console.log(`✅ خطوات ناجحة: ${report.summary.successfulSteps}`);
    console.log(`❌ خطوات فاشلة: ${report.summary.failedSteps}`);
    console.log(`⚠️ تحذيرات: ${report.summary.warnings}`);
    
    console.log(`\n📈 معدل النجاح: ${Math.round((report.summary.successfulSteps / report.summary.totalSteps) * 100)}%`);
    
    if (report.recommendations.length > 0) {
      console.log(`\n💡 التوصيات:`);
      report.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }
    
    console.log(`\n🎯 الحالة العامة: ${
      report.summary.failedSteps === 0 ? '🟢 ممتاز' :
      report.summary.failedSteps <= 2 ? '🟡 جيد' : '🔴 يحتاج عمل'
    }`);
    
    console.log(`${'═'.repeat(80)}`);
  }

  // الدالة الرئيسية
  async runMasterScript() {
    console.log('🎯 بدء السكريبت الشامل لتحليل وإصلاح المشروع');
    console.log('⏰ هذا قد يستغرق عدة دقائق...\n');
    
    const startTime = Date.now();
    
    try {
      // 1. التحليل الشامل
      this.results.analysis = await this.runScript(
        'complete-pages-analysis.js',
        'تحليل شامل لجميع صفحات ومكونات المشروع'
      );
      
      // 2. إصلاح المشاكل
      this.results.fixes = await this.runScript(
        'pages-fixer.js',
        'إصلاح المشاكل الشائعة والمكونات المفقودة'
      );
      
      // 3. التنظيف الشامل
      this.results.clean = await this.runScript(
        'project-cleaner.js',
        'تنظيف شامل للمشروع من الملفات غير المرغوبة'
      );
      
      // 4. تحديث المراجع
      await this.runScript(
        'update-imports.js',
        'تحديث جميع مراجع الملفات'
      );
      
      // 5. فحص الكود
      this.results.lint = await this.runNpmCommand(
        'lint',
        'فحص جودة الكود والتنسيق'
      );
      
      // 6. اختبار البناء
      this.results.build = await this.runNpmCommand(
        'build',
        'اختبار بناء المشروع للإنتاج'
      );
      
      // إنشاء التقرير النهائي
      const report = this.generateMasterReport();
      
      // حفظ التقرير
      const reportPath = path.join(this.projectRoot, 'master-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
      
      // طباعة التقرير
      this.printFinalReport(report);
      
      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);
      
      console.log(`\n⏱️ إجمالي الوقت المستغرق: ${duration} ثانية`);
      console.log(`📄 التقرير محفوظ في: master-report.json`);
      
      // تشغيل التطبيق في النهاية إذا كان كل شيء جيد
      if (report.summary.failedSteps === 0) {
        console.log('\n🚀 سيتم تشغيل التطبيق الآن...');
        
        setTimeout(() => {
          execAsync('npm run dev', { cwd: this.projectRoot });
          console.log('🌐 التطبيق متاح على: http://localhost:3000');
        }, 2000);
      }
      
    } catch (error) {
      console.error('❌ خطأ في السكريبت الرئيسي:', error.message);
      process.exit(1);
    }
  }
}

// تشغيل السكريبت
if (require.main === module) {
  const master = new MasterScript();
  master.runMasterScript();
}

module.exports = MasterScript;
