const fs = require('fs');
const path = require('path');

/**
 * تحليل وتوحيد لوحات التحكم المتعددة للواتساب
 */

async function analyzeWhatsAppDashboards() {
  console.log('🔍 تحليل لوحات التحكم المتعددة للواتساب...\n');
  console.log('⚠️  هذا السكريبت للتحليل فقط - لن يقوم بحذف أو تعديل أي ملفات\n');

  const dashboardsDir = path.join(__dirname, '../src/components/whatsapp/dashboard');
  
  // التحقق من وجود المجلد
  if (!fs.existsSync(dashboardsDir)) {
    console.log('❌ مجلد لوحات التحكم غير موجود:', dashboardsDir);
    return;
  }

  const results = {
    title: 'تحليل شامل للوحات التحكم المتعددة للواتساب',
    generatedAt: new Date().toISOString(),
    dashboards: [],
    recommendations: [],
    unificationPlan: {},
    safetyNote: 'هذا التحليل للاستطلاع فقط - لم يتم حذف أو تعديل أي ملفات'
  };

  try {
    // قائمة لوحات التحكم الموجودة
    const dashboardFiles = [
      'SimpleWhatsAppDashboard.jsx',
      'SimpleWhatsAppDashboard-New.jsx', 
      'EnhancedWhatsAppDashboard.jsx',
      'EnhancedWhatsAppDashboard-Tabbed.jsx',
      'RemindersTracker.jsx'
    ];

    console.log('📊 تحليل لوحات التحكم الموجودة:\n');

    for (const file of dashboardFiles) {
      const filePath = path.join(dashboardsDir, file);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const analysis = analyzeDashboardFile(file, content);
        results.dashboards.push(analysis);
        
        console.log(`✅ ${file}:`);
        console.log(`   - الحجم: ${analysis.size} سطر`);
        console.log(`   - المميزات: ${analysis.features.length}`);
        console.log(`   - الحالة: ${analysis.status}`);
        console.log(`   - آخر تحديث: ${analysis.lastModified}`);
        console.log('');
      } else {
        console.log(`❌ ${file}: غير موجود`);
      }
    }

    // تحليل الاستخدام الفعلي
    console.log('📋 تحليل الاستخدام الفعلي:\n');
    const usageAnalysis = await analyzeActualUsage();
    
    console.log('🎯 التوصيات:');
    
    // تحديد اللوحة الرئيسية المُوصى بها
    const recommendedDashboard = determineRecommendedDashboard(results.dashboards);
    console.log(`\n✨ اللوحة المُوصى باستخدامها: ${recommendedDashboard.name}`);
    console.log(`   السبب: ${recommendedDashboard.reason}`);    // خطة التوحيد - للمراجعة فقط
    results.unificationPlan = createUnificationPlan(results.dashboards, recommendedDashboard);
    
    console.log('\n📋 خطة التوحيد المقترحة (للمراجعة فقط):');
    results.unificationPlan.steps.forEach((step, index) => {
      console.log(`${index + 1}. ${step}`);
    });

    console.log('\n⚠️  ملاحظة مهمة: هذا تحليل فقط - لن يتم تنفيذ أي تغييرات تلقائياً');
    console.log('✋ يمكنك مراجعة الخطة والموافقة عليها قبل التنفيذ');

    // كتابة التقرير فقط
    const reportContent = generateReport(results);
    const reportPath = path.join(__dirname, '../docs/WHATSAPP_DASHBOARDS_ANALYSIS_REPORT.md');
    
    try {
      // التأكد من وجود مجلد docs
      const docsDir = path.dirname(reportPath);
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }
      
      fs.writeFileSync(reportPath, reportContent, 'utf8');
      console.log('\n✅ تم إنشاء تقرير التحليل بنجاح!');
      console.log(`📄 مسار التقرير: ${reportPath}`);
    } catch (writeError) {
      console.log('⚠️  تعذر كتابة التقرير:', writeError.message);
      console.log('📊 النتائج متوفرة في الكونسول أعلاه');
    }

    return results;

  } catch (error) {
    console.error('❌ خطأ في التحليل:', error);
    throw error;
  }
}

function analyzeDashboardFile(filename, content) {
  const lines = content.split('\n');
  
  // استخراج المعلومات الأساسية
  const analysis = {
    name: filename,
    size: lines.length,
    features: [],
    apis: [],
    components: [],
    status: 'unknown',
    complexity: 'unknown',
    lastModified: 'unknown'
  };

  // تحليل المميزات
  if (content.includes('useState')) analysis.features.push('State Management');
  if (content.includes('useEffect')) analysis.features.push('Lifecycle Management');
  if (content.includes('fetch(')) analysis.features.push('API Integration');
  if (content.includes('Tab')) analysis.features.push('Tabbed Interface');
  if (content.includes('chart') || content.includes('Chart')) analysis.features.push('Charts');
  if (content.includes('statistics') || content.includes('Statistics')) analysis.features.push('Statistics');
  if (content.includes('reminder') || content.includes('Reminder')) analysis.features.push('Reminders');
  if (content.includes('settings') || content.includes('Settings')) analysis.features.push('Settings');

  // تحليل APIs المستخدمة
  const apiMatches = content.match(/fetch\(['"`]([^'"`]+)['"`]\)/g);
  if (apiMatches) {
    analysis.apis = apiMatches.map(match => {
      const url = match.match(/['"`]([^'"`]+)['"`]/)[1];
      return url;
    });
  }

  // تحليل المكونات المستوردة
  const importMatches = content.match(/import.*from ['"`]([^'"`]+)['"`]/g);
  if (importMatches) {
    analysis.components = importMatches.map(match => {
      return match.match(/from ['"`]([^'"`]+)['"`]/)[1];
    });
  }

  // تقدير التعقيد
  if (lines.length < 200) analysis.complexity = 'بسيط';
  else if (lines.length < 500) analysis.complexity = 'متوسط';
  else analysis.complexity = 'معقد';

  // تحديد الحالة
  if (content.includes('@version') || content.includes('Enhanced')) {
    analysis.status = 'محدث';
  } else if (filename.includes('New')) {
    analysis.status = 'جديد';
  } else if (filename.includes('Simple')) {
    analysis.status = 'بسيط';
  } else {
    analysis.status = 'غير محدد';
  }

  return analysis;
}

async function analyzeActualUsage() {
  // فحص أي لوحة يتم استخدامها فعلياً في الصفحات
  const pageFile = path.join(__dirname, '../src/app/whatsapp-dashboard/page.jsx');
  
  if (fs.existsSync(pageFile)) {
    const pageContent = fs.readFileSync(pageFile, 'utf8');
    
    if (pageContent.includes('EnhancedWhatsAppDashboard')) {
      return {
        currentlyUsed: 'EnhancedWhatsAppDashboard.jsx',
        route: '/whatsapp-dashboard',
        status: 'نشط'
      };
    }
  }
  
  return {
    currentlyUsed: 'غير محدد',
    route: 'غير محدد',
    status: 'غير نشط'
  };
}

function determineRecommendedDashboard(dashboards) {
  // ترتيب اللوحات حسب الجودة والمميزات
  const scored = dashboards.map(dashboard => {
    let score = 0;
    
    // نقاط للمميزات
    score += dashboard.features.length * 2;
    
    // نقاط للحالة
    if (dashboard.status === 'محدث') score += 10;
    if (dashboard.status === 'جديد') score += 5;
    
    // نقاط للتعقيد المناسب
    if (dashboard.complexity === 'متوسط') score += 5;
    if (dashboard.complexity === 'معقد') score += 3;
    
    // نقاط إضافية للمميزات المهمة
    if (dashboard.features.includes('Tabbed Interface')) score += 5;
    if (dashboard.features.includes('API Integration')) score += 5;
    if (dashboard.features.includes('Settings')) score += 3;
    
    return { ...dashboard, score };
  });

  const best = scored.sort((a, b) => b.score - a.score)[0];
  
  return {
    name: best.name,
    score: best.score,
    reason: `أفضل توازن بين المميزات (${best.features.length}) والحداثة (${best.status})`
  };
}

function createUnificationPlan(dashboards, recommended) {
  const plan = {
    recommendedDashboard: recommended.name,
    safetyLevel: 'آمن - تحليل فقط',
    steps: [
      `✅ الاحتفاظ بـ ${recommended.name} كلوحة التحكم الرئيسية`,
      '� مراجعة المميزات في اللوحات الأخرى قبل أي تغيير',
      '� إنشاء نسخة احتياطية كاملة قبل أي تعديل',
      '🔄 نقل المميزات المفيدة تدريجياً وبحذر',
      '🧪 اختبار كل تغيير على حدة',
      '✋ طلب موافقة قبل حذف أي ملف'
    ],
    currentStatus: 'تحليل فقط - لم يتم تنفيذ أي تغييرات',
    filesToKeep: [recommended.name],
    filesToBackup: dashboards.filter(d => d.name !== recommended.name).map(d => d.name),
    filesToDelete: [],
    warningNote: 'يجب مراجعة كل خطوة بعناية قبل التنفيذ'
  };

  return plan;
}

function generateReport(results) {
  let report = `# خطة توحيد لوحات التحكم المتعددة للواتساب\n\n`;
  report += `**تاريخ التحليل:** ${new Date(results.generatedAt).toLocaleString('ar-AE')}\n\n`;
  
  report += `## 🔍 تحليل الوضع الحالي\n\n`;
  report += `تم العثور على **${results.dashboards.length} لوحات تحكم** مختلفة للواتساب:\n\n`;
  
  results.dashboards.forEach((dashboard, index) => {
    report += `### ${index + 1}. ${dashboard.name}\n`;
    report += `- **الحجم:** ${dashboard.size} سطر\n`;
    report += `- **التعقيد:** ${dashboard.complexity}\n`;
    report += `- **الحالة:** ${dashboard.status}\n`;
    report += `- **المميزات:** ${dashboard.features.join(', ')}\n`;
    report += `- **APIs المستخدمة:** ${dashboard.apis.length}\n\n`;
  });

  report += `## ✨ التوصية\n\n`;
  report += `**اللوحة المُوصى بها:** \`${results.unificationPlan.recommendedDashboard}\`\n\n`;
  
  report += `## 📋 خطة التنفيذ\n\n`;
  results.unificationPlan.steps.forEach((step, index) => {
    report += `${index + 1}. ${step}\n`;
  });
  
  report += `\n## 🗂️ إدارة الملفات\n\n`;
  report += `### ✅ ملفات للاحتفاظ بها:\n`;
  results.unificationPlan.filesToKeep.forEach(file => {
    report += `- \`${file}\`\n`;
  });
  
  report += `\n### 🔄 ملفات للنسخ الاحتياطي:\n`;
  results.unificationPlan.filesToBackup.forEach(file => {
    report += `- \`${file}\`\n`;
  });

  report += `\n## 🎯 الفوائد المتوقعة\n\n`;
  report += `- 🧹 **تبسيط الكود:** إزالة التكرار والتعقيد\n`;
  report += `- ⚡ **تحسين الأداء:** لوحة واحدة محسنة\n`;
  report += `- 🛠️ **سهولة الصيانة:** نقطة واحدة للتحديث\n`;
  report += `- 📚 **وضوح أكبر:** لا مزيد من الالتباس\n`;
  report += `- 🔄 **تحديثات أسرع:** تركيز الجهود على لوحة واحدة\n\n`;

  report += `---\n*تم إنشاء هذا التقرير تلقائياً بواسطة نظام Tar Real Estate*\n`;

  return report;
}

// تشغيل التحليل
if (require.main === module) {
  analyzeWhatsAppDashboards()
    .then(results => {
      console.log('\n🎉 انتهى التحليل بنجاح!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ فشل التحليل:', error);
      process.exit(1);
    });
}

module.exports = { analyzeWhatsAppDashboards };
