#!/usr/bin/env node

/**
 * 🔍 تحليل شامل لتغطية جوانب الواتساب
 * يفحص جميع المكونات المطلوبة: البوت، الإعدادات، التذكيرات، المتابعات، الإحصائيات، التقارير
 */

const fs = require('fs');
const path = require('path');

// ألوان للطباعة
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description, isRequired = true) {
  const exists = fs.existsSync(path.join(process.cwd(), filePath));
  const status = exists ? '✅' : (isRequired ? '❌' : '⚠️');
  const color = exists ? 'green' : (isRequired ? 'red' : 'yellow');
  
  log(`${status} ${description}: ${exists ? 'موجود' : 'مفقود'}`, color);
  return { exists, required: isRequired, path: filePath, description };
}

function checkFileContent(filePath, searchTerms, description) {
  try {
    if (!fs.existsSync(path.join(process.cwd(), filePath))) {
      log(`❌ ${description}: ملف غير موجود`, 'red');
      return { exists: false, hasContent: false, matchedTerms: [] };
    }

    const content = fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
    const matchedTerms = searchTerms.filter(term => content.includes(term));
    const hasContent = matchedTerms.length > 0;

    log(`${hasContent ? '✅' : '⚠️'} ${description}: ${matchedTerms.length}/${searchTerms.length} مميزات`, hasContent ? 'green' : 'yellow');
    if (matchedTerms.length > 0) {
      log(`   - المميزات الموجودة: ${matchedTerms.join(', ')}`, 'cyan');
    }
    
    return { exists: true, hasContent, matchedTerms, totalTerms: searchTerms.length };
  } catch (error) {
    log(`❌ ${description}: خطأ في القراءة`, 'red');
    return { exists: false, hasContent: false, matchedTerms: [] };
  }
}

async function analyzeWhatsAppCoverage() {
  log('🔍 تحليل شامل لتغطية جوانب الواتساب', 'magenta');
  log('═'.repeat(80), 'blue');
  
  let totalScore = 0;
  let maxScore = 0;
  const results = {};

  // 1. هيكل الواتساب الأساسي
  log('\n📁 1. الهيكل الأساسي للواتساب', 'yellow');
  log('─'.repeat(50), 'blue');
  
  const coreStructure = [
    { path: 'src/app/whatsapp/dashboard/page.jsx', desc: 'لوحة التحكم الرئيسية', required: true },
    { path: 'src/app/whatsapp/reminders/page.jsx', desc: 'واجهة التذكيرات', required: true },
    { path: 'src/app/whatsapp/settings/page.jsx', desc: 'واجهة الإعدادات', required: true },
    { path: 'src/app/api/whatsapp/route.js', desc: 'API الواتساب الرئيسي', required: true },
    { path: 'src/app/api/whatsapp/webhook/route.js', desc: 'API البوت والرسائل', required: true },
    { path: 'src/app/api/whatsapp/reminders/route.js', desc: 'API التذكيرات', required: true },
    { path: 'src/app/api/whatsapp/settings/route.js', desc: 'API الإعدادات', required: true }
  ];

  const structureResults = coreStructure.map(item => checkFile(item.path, item.desc, item.required));
  const structureScore = structureResults.filter(r => r.exists).length;
  totalScore += structureScore;
  maxScore += coreStructure.length;
  results.structure = { score: structureScore, max: coreStructure.length, percentage: Math.round((structureScore / coreStructure.length) * 100) };

  // 2. البوت والمحادثات التفاعلية
  log('\n🤖 2. البوت والمحادثات التفاعلية', 'yellow');
  log('─'.repeat(50), 'blue');
  
  const botFeatures = [
    'webhook', 'handleMessage', 'sendMessage', 'session', 'interactive',
    'menu', 'complaint', 'maintenance', 'payment', 'contract'
  ];
  
  const botAnalysis = checkFileContent(
    'src/app/api/whatsapp/webhook/route.js',
    botFeatures,
    'مميزات البوت'
  );
  
  const botScore = botAnalysis.hasContent ? Math.min(botAnalysis.matchedTerms.length, 8) : 0;
  totalScore += botScore;
  maxScore += 8;
  results.bot = { 
    score: botScore, max: 8, 
    percentage: Math.round((botScore / 8) * 100),
    features: botAnalysis.matchedTerms
  };

  // 3. نظام التذكيرات
  log('\n🔔 3. نظام التذكيرات والإشعارات', 'yellow');
  log('─'.repeat(50), 'blue');
  
  const reminderFeatures = [
    'payment_reminder', 'contract_expiry', 'maintenance_reminder',
    'reminder_settings', 'automated', 'schedule', 'priority'
  ];
  
  const reminderFiles = [
    { path: 'src/app/whatsapp/reminders/page.jsx', terms: ['reminder', 'إشعار', 'تذكير', 'مواعيد'] },
    { path: 'src/app/api/whatsapp/reminders/route.js', terms: reminderFeatures }
  ];
  
  let reminderScore = 0;
  reminderFiles.forEach(file => {
    const analysis = checkFileContent(file.path, file.terms, `تذكيرات - ${file.path.split('/').pop()}`);
    reminderScore += analysis.hasContent ? Math.min(analysis.matchedTerms.length, 4) : 0;
  });
  
  totalScore += reminderScore;
  maxScore += 8;
  results.reminders = { score: reminderScore, max: 8, percentage: Math.round((reminderScore / 8) * 100) };

  // 4. الإعدادات والتكوين
  log('\n⚙️ 4. الإعدادات والتكوين', 'yellow');
  log('─'.repeat(50), 'blue');
  
  const settingsFeatures = [
    'whatsapp_token', 'phone_number', 'webhook_url', 'message_templates',
    'working_hours', 'auto_reply', 'reminder_settings', 'notification_settings'
  ];
  
  const settingsFiles = [
    { path: 'src/app/whatsapp/settings/page.jsx', terms: ['إعدادات', 'settings', 'configuration', 'token'] },
    { path: 'src/app/api/whatsapp/settings/route.js', terms: settingsFeatures }
  ];
  
  let settingsScore = 0;
  settingsFiles.forEach(file => {
    const analysis = checkFileContent(file.path, file.terms, `إعدادات - ${file.path.split('/').pop()}`);
    settingsScore += analysis.hasContent ? Math.min(analysis.matchedTerms.length, 4) : 0;
  });
  
  totalScore += settingsScore;
  maxScore += 8;
  results.settings = { score: settingsScore, max: 8, percentage: Math.round((settingsScore / 8) * 100) };

  // 5. المتابعات والإحصائيات
  log('\n📊 5. المتابعات والإحصائيات', 'yellow');
  log('─'.repeat(50), 'blue');
  
  const analyticsFeatures = [
    'message_count', 'delivery_status', 'read_receipts', 'response_rate',
    'statistics', 'analytics', 'dashboard', 'metrics'
  ];
  
  const analyticsFiles = [
    { path: 'src/app/whatsapp/dashboard/page.jsx', terms: ['إحصائيات', 'dashboard', 'analytics', 'stats'] }
  ];
  
  // فحص إضافي لمكونات الإحصائيات
  const possibleAnalyticsFiles = [
    'src/components/whatsapp/dashboard/EnhancedWhatsAppDashboard.jsx',
    'src/components/whatsapp/dashboard/SimpleWhatsAppDashboard.jsx'
  ];
  
  let analyticsScore = 0;
  [...analyticsFiles, ...possibleAnalyticsFiles.map(path => ({ path, terms: analyticsFeatures }))].forEach(file => {
    if (fs.existsSync(path.join(process.cwd(), file.path))) {
      const analysis = checkFileContent(file.path, file.terms, `إحصائيات - ${file.path.split('/').pop()}`);
      analyticsScore += analysis.hasContent ? Math.min(analysis.matchedTerms.length, 3) : 0;
    }
  });
  
  totalScore += Math.min(analyticsScore, 8);
  maxScore += 8;
  results.analytics = { score: Math.min(analyticsScore, 8), max: 8, percentage: Math.round((Math.min(analyticsScore, 8) / 8) * 100) };

  // 6. التقارير والسجلات
  log('\n📋 6. التقارير والسجلات', 'yellow');
  log('─'.repeat(50), 'blue');
  
  const reportFeatures = [
    'message_log', 'audit_trail', 'export', 'report_generation',
    'conversation_history', 'performance_report'
  ];
  
  // فحص جداول قاعدة البيانات
  const dbSchema = checkFileContent(
    'prisma/schema.prisma',
    ['WhatsappMessageLog', 'WhatsappConversation', 'WhatsappTemplate', 'ReminderSettings'],
    'جداول قاعدة البيانات'
  );
  
  const reportScore = dbSchema.hasContent ? Math.min(dbSchema.matchedTerms.length * 2, 8) : 0;
  totalScore += reportScore;
  maxScore += 8;
  results.reports = { score: reportScore, max: 8, percentage: Math.round((reportScore / 8) * 100) };

  // 7. الأمان والصلاحيات
  log('\n🔒 7. الأمان والصلاحيات', 'yellow');
  log('─'.repeat(50), 'blue');
  
  const securityFeatures = [
    'WHATSAPP', 'permission', 'auth', 'middleware', 'validation'
  ];
  
  const securityFiles = [
    { path: 'src/app/context/AuthProvider/AuthProvider.js', terms: securityFeatures }
  ];
  
  let securityScore = 0;
  securityFiles.forEach(file => {
    const analysis = checkFileContent(file.path, file.terms, `أمان - ${file.path.split('/').pop()}`);
    securityScore += analysis.hasContent ? Math.min(analysis.matchedTerms.length, 4) : 0;
  });
  
  totalScore += Math.min(securityScore, 6);
  maxScore += 6;
  results.security = { score: Math.min(securityScore, 6), max: 6, percentage: Math.round((Math.min(securityScore, 6) / 6) * 100) };

  // النتيجة الإجمالية
  log('\n' + '═'.repeat(80), 'blue');
  log('📊 النتيجة الإجمالية لتغطية الواتساب', 'magenta');
  log('═'.repeat(80), 'blue');
  
  const overallPercentage = Math.round((totalScore / maxScore) * 100);
  const gradeColor = overallPercentage >= 90 ? 'green' : overallPercentage >= 70 ? 'yellow' : 'red';
  const grade = overallPercentage >= 90 ? '🏆 ممتاز' : overallPercentage >= 70 ? '✅ جيد' : '⚠️ يحتاج تحسين';
  
  log(`\n🎯 النتيجة الإجمالية: ${totalScore}/${maxScore} (${overallPercentage}%)`, 'cyan');
  log(`🏅 التقييم: ${grade}`, gradeColor);
  
  // تفاصيل النتائج
  log('\n📈 تفاصيل التغطية:', 'blue');
  Object.entries(results).forEach(([category, result]) => {
    const categoryNames = {
      structure: 'الهيكل الأساسي',
      bot: 'البوت والمحادثات',
      reminders: 'نظام التذكيرات',
      settings: 'الإعدادات والتكوين',
      analytics: 'المتابعات والإحصائيات',
      reports: 'التقارير والسجلات',
      security: 'الأمان والصلاحيات'
    };
    
    const color = result.percentage >= 80 ? 'green' : result.percentage >= 60 ? 'yellow' : 'red';
    log(`   📊 ${categoryNames[category]}: ${result.score}/${result.max} (${result.percentage}%)`, color);
  });

  // التوصيات
  log('\n💡 التوصيات والتحسينات المطلوبة:', 'blue');
  
  const recommendations = [];
  
  if (results.structure.percentage < 100) {
    recommendations.push('🔧 إكمال الهيكل الأساسي للواتساب');
  }
  
  if (results.bot.percentage < 80) {
    recommendations.push('🤖 تطوير المحادثات التفاعلية للبوت');
    recommendations.push('📝 إضافة المزيد من القوائم التفاعلية');
  }
  
  if (results.reminders.percentage < 80) {
    recommendations.push('⏰ تحسين نظام التذكيرات الآلية');
    recommendations.push('📅 إضافة جدولة متقدمة للتذكيرات');
  }
  
  if (results.analytics.percentage < 70) {
    recommendations.push('📊 إضافة لوحة إحصائيات شاملة');
    recommendations.push('📈 تطوير تقارير الأداء والمتابعة');
  }
  
  if (results.reports.percentage < 70) {
    recommendations.push('📋 إضافة نظام تقارير متكامل');
    recommendations.push('💾 تحسين تسجيل وأرشفة المحادثات');
  }

  // المميزات المفقودة المهمة
  log('\n❗ المميزات المفقودة المهمة:', 'red');
  const missingFeatures = [
    '📱 إدارة قوالب الرسائل (Templates)',
    '🎯 نظام الردود الآلية المتقدم',
    '📧 تكامل مع البريد الإلكتروني',
    '📞 نظام المكالمات والإشعارات الصوتية',
    '🔄 نظام المزامنة مع أنظمة CRM',
    '📊 تحليلات الذكاء الاصطناعي',
    '🌐 دعم متعدد اللغات المحسن',
    '📱 تطبيق موبايل مصاحب'
  ];
  
  missingFeatures.forEach(feature => {
    log(`   ${feature}`, 'red');
  });

  // الخطة المقترحة
  log('\n🎯 الخطة المقترحة للتطوير:', 'blue');
  log('1️⃣ المرحلة الأولى (أسبوع): إكمال المميزات الأساسية المفقودة', 'cyan');
  log('2️⃣ المرحلة الثانية (أسبوعين): تطوير الإحصائيات والتقارير', 'cyan');
  log('3️⃣ المرحلة الثالثة (شهر): إضافة المميزات المتقدمة', 'cyan');
  log('4️⃣ المرحلة الرابعة (شهر): التكامل مع أنظمة خارجية', 'cyan');

  // حفظ التقرير
  const report = {
    timestamp: new Date().toISOString(),
    overallScore: {
      total: totalScore,
      max: maxScore,
      percentage: overallPercentage,
      grade: grade.replace(/[🏆✅⚠️]/g, '').trim()
    },
    categories: results,
    recommendations,
    missingFeatures,
    conclusion: overallPercentage >= 80 ? 'النظام في حالة جيدة مع بعض التحسينات المطلوبة' : 'النظام يحتاج تطوير شامل'
  };
  
  fs.writeFileSync('docs/whatsapp-coverage-analysis.json', JSON.stringify(report, null, 2));
  log('\n💾 تم حفظ التقرير في: docs/whatsapp-coverage-analysis.json', 'blue');
  
  log('\n' + '═'.repeat(80), 'blue');
}

// تشغيل التحليل
analyzeWhatsAppCoverage().catch(console.error);
