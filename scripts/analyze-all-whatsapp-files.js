const fs = require('fs');
const path = require('path');

/**
 * تحليل شامل لجميع ملفات الواتساب في المشروع
 * @version 1.0.0
 * @description فحص وتصنيف جميع الملفات المتعلقة بالواتساب
 */

async function analyzeAllWhatsAppFiles() {
  console.log('🔍 تحليل شامل لجميع ملفات الواتساب في المشروع...\n');
  console.log('⚠️  هذا السكريپت للتحليل فقط - آمن 100%\n');

  const projectRoot = path.join(__dirname, '..');
  
  const results = {
    title: 'تحليل شامل لملفات الواتساب في المشروع',
    generatedAt: new Date().toISOString(),
    summary: {
      totalFiles: 0,
      categories: {},
      duplicates: [],
      recommendations: []
    },
    categories: {
      components: [],
      apis: [],
      hooks: [],
      utils: [],
      pages: [],
      configs: [],
      docs: [],
      tests: [],
      assets: [],
      unknown: []
    },
    safetyNote: 'تحليل فقط - لن يتم حذف أو تعديل أي ملفات'
  };

  try {
    console.log('🔎 البحث عن جميع ملفات الواتساب...\n');
    
    // البحث في المشروع كاملاً
    const whatsappFiles = await findAllWhatsAppFiles(projectRoot);
    
    console.log(`📊 تم العثور على ${whatsappFiles.length} ملف متعلق بالواتساب\n`);
    
    // تصنيف الملفات
    for (const file of whatsappFiles) {
      const analysis = await analyzeWhatsAppFile(file, projectRoot);
      categorizeFile(analysis, results.categories);
      results.summary.totalFiles++;
    }

    // إحصائيات سريعة
    Object.keys(results.categories).forEach(category => {
      results.summary.categories[category] = results.categories[category].length;
    });

    // عرض النتائج
    displayResults(results);
    
    // البحث عن التكرارات والمشاكل
    const issues = await findIssuesAndDuplicates(results.categories);
    results.issues = issues;
    
    // التوصيات
    const recommendations = generateRecommendations(results);
    results.summary.recommendations = recommendations;
    
    // كتابة التقرير الشامل
    const reportContent = generateComprehensiveReport(results);
    const reportPath = path.join(__dirname, '../docs/ALL_WHATSAPP_FILES_ANALYSIS.md');
    
    try {
      const docsDir = path.dirname(reportPath);
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }
      
      fs.writeFileSync(reportPath, reportContent, 'utf8');
      console.log('\n✅ تم إنشاء التقرير الشامل بنجاح!');
      console.log(`📄 مسار التقرير: ${reportPath}`);
    } catch (writeError) {
      console.log('⚠️  تعذر كتابة التقرير:', writeError.message);
    }

    return results;

  } catch (error) {
    console.error('❌ خطأ في التحليل:', error);
    throw error;
  }
}

async function findAllWhatsAppFiles(rootDir) {
  const whatsappFiles = [];
  
  // أنماط البحث - كلمات مفتاحية للواتساب
  const whatsappPatterns = [
    /whatsapp/i,
    /WhatsApp/,
    /whats-app/i,
    /wa-/i,
    /message/i,
    /chat/i,
    /webhook/i,
    /bot/i,
    /reminder/i
  ];

  function scanDirectory(dir) {
    try {
      // تجاهل مجلدات معينة
      const ignoreDirs = [
        'node_modules', 
        '.git', 
        '.next', 
        'dist', 
        'build',
        '.vercel'
      ];
      
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!ignoreDirs.includes(item)) {
            scanDirectory(fullPath);
          }
        } else if (stat.isFile()) {
          // فحص اسم الملف أو محتواه
          const isWhatsAppRelated = whatsappPatterns.some(pattern => 
            pattern.test(item) || 
            pattern.test(fullPath)
          );
          
          if (isWhatsAppRelated) {
            whatsappFiles.push(fullPath);
          } else {
            // فحص المحتوى للملفات البرمجية
            const ext = path.extname(item).toLowerCase();
            if (['.js', '.jsx', '.ts', '.tsx', '.json', '.md'].includes(ext)) {
              try {
                const content = fs.readFileSync(fullPath, 'utf8');
                const hasWhatsAppContent = whatsappPatterns.some(pattern => 
                  pattern.test(content)
                );
                
                if (hasWhatsAppContent) {
                  whatsappFiles.push(fullPath);
                }
              } catch (readError) {
                // تجاهل أخطاء القراءة
              }
            }
          }
        }
      }
    } catch (scanError) {
      // تجاهل أخطاء المسح
    }
  }

  scanDirectory(rootDir);
  return whatsappFiles;
}

async function analyzeWhatsAppFile(filePath, projectRoot) {
  const relativePath = path.relative(projectRoot, filePath);
  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);
  const dir = path.dirname(relativePath);
  
  let content = '';
  let size = 0;
  
  try {
    const stats = fs.statSync(filePath);
    size = stats.size;
    
    // قراءة المحتوى للملفات النصية
    if (['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt'].includes(ext)) {
      content = fs.readFileSync(filePath, 'utf8');
    }
  } catch (error) {
    // تجاهل أخطاء القراءة
  }

  return {
    fullPath: filePath,
    relativePath,
    fileName,
    directory: dir,
    extension: ext,
    size,
    content,
    lines: content ? content.split('\n').length : 0,
    lastModified: fs.statSync(filePath).mtime,
    whatsappReferences: extractWhatsAppReferences(content),
    type: determineFileType(relativePath, fileName, content),
    importance: assessFileImportance(relativePath, fileName, content),
    issues: []
  };
}

function extractWhatsAppReferences(content) {
  const references = [];
  
  // البحث عن مراجع الواتساب
  const patterns = [
    /whatsapp/gi,
    /WhatsApp/g,
    /wa[_-]?api/gi,
    /message.*log/gi,
    /webhook/gi,
    /bot.*status/gi,
    /reminder/gi
  ];

  patterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      references.push(...matches);
    }
  });

  return [...new Set(references)]; // إزالة التكرارات
}

function determineFileType(relativePath, fileName, content) {
  // تحديد نوع الملف
  if (relativePath.includes('/components/')) return 'component';
  if (relativePath.includes('/api/')) return 'api';
  if (relativePath.includes('/hooks/')) return 'hook';
  if (relativePath.includes('/utils/') || relativePath.includes('/lib/')) return 'utility';
  if (relativePath.includes('/pages/') || relativePath.includes('/app/')) return 'page';
  if (relativePath.includes('/docs/')) return 'documentation';
  if (relativePath.includes('/test/') || fileName.includes('.test.')) return 'test';
  if (relativePath.includes('/config/') || fileName.includes('config')) return 'config';
  if (relativePath.includes('/public/') || relativePath.includes('/assets/')) return 'asset';
  if (fileName.includes('.md')) return 'documentation';
  
  // تحليل المحتوى
  if (content.includes('export default function') || content.includes('const ') && content.includes('= () =>')) {
    return 'component';
  }
  if (content.includes('NextResponse') || content.includes('export async function')) {
    return 'api';
  }
  if (content.includes('useEffect') || content.includes('useState')) {
    return 'hook';
  }
  
  return 'unknown';
}

function assessFileImportance(relativePath, fileName, content) {
  let score = 0;
  
  // نقاط للموقع
  if (relativePath.includes('/api/')) score += 10;
  if (relativePath.includes('/components/')) score += 8;
  if (relativePath.includes('/pages/') || relativePath.includes('/app/')) score += 9;
  
  // نقاط للاستخدام
  if (content.includes('export default')) score += 5;
  if (content.includes('useState') || content.includes('useEffect')) score += 3;
  if (content.includes('fetch(') || content.includes('prisma')) score += 4;
  
  // نقاط للحجم والتعقيد
  const lines = content.split('\n').length;
  if (lines > 100) score += 2;
  if (lines > 300) score += 3;
  
  // تصنيف
  if (score >= 15) return 'عالية';
  if (score >= 8) return 'متوسطة';
  return 'منخفضة';
}

function categorizeFile(analysis, categories) {
  switch (analysis.type) {
    case 'component':
      categories.components.push(analysis);
      break;
    case 'api':
      categories.apis.push(analysis);
      break;
    case 'hook':
      categories.hooks.push(analysis);
      break;
    case 'utility':
      categories.utils.push(analysis);
      break;
    case 'page':
      categories.pages.push(analysis);
      break;
    case 'config':
      categories.configs.push(analysis);
      break;
    case 'documentation':
      categories.docs.push(analysis);
      break;
    case 'test':
      categories.tests.push(analysis);
      break;
    case 'asset':
      categories.assets.push(analysis);
      break;
    default:
      categories.unknown.push(analysis);
  }
}

function displayResults(results) {
  console.log('📊 نتائج التحليل:\n');
  console.log('='.repeat(60));
  
  Object.keys(results.categories).forEach(category => {
    const count = results.categories[category].length;
    if (count > 0) {
      console.log(`📂 ${getCategoryName(category)}: ${count} ملف`);
      
      // عرض أهم الملفات في كل فئة
      const important = results.categories[category]
        .filter(f => f.importance === 'عالية')
        .slice(0, 3);
      
      important.forEach(file => {
        console.log(`   ⭐ ${file.relativePath} (${file.lines} سطر)`);
      });
      
      if (results.categories[category].length > 3) {
        console.log(`   ... و ${results.categories[category].length - important.length} ملف آخر`);
      }
      console.log('');
    }
  });
}

function getCategoryName(category) {
  const names = {
    components: 'مكونات',
    apis: 'واجهات برمجية',
    hooks: 'hooks',
    utils: 'أدوات مساعدة',
    pages: 'صفحات',
    configs: 'إعدادات',
    docs: 'توثيق',
    tests: 'اختبارات',
    assets: 'ملفات ثابتة',
    unknown: 'غير مصنف'
  };
  return names[category] || category;
}

async function findIssuesAndDuplicates(categories) {
  const issues = {
    duplicates: [],
    largFiles: [],
    oldFiles: [],
    unusedFiles: [],
    conflictingApis: []
  };

  // البحث عن ملفات مكررة (أسماء متشابهة)
  const allFiles = Object.values(categories).flat();
  
  allFiles.forEach((file, index) => {
    const similarFiles = allFiles.filter((other, otherIndex) => 
      index !== otherIndex && 
      file.fileName.toLowerCase().includes('whatsapp') &&
      other.fileName.toLowerCase().includes('whatsapp') &&
      levenshteinDistance(file.fileName, other.fileName) < 5
    );
    
    if (similarFiles.length > 0) {
      issues.duplicates.push({
        file: file.relativePath,
        similarTo: similarFiles.map(f => f.relativePath)
      });
    }
  });

  // البحث عن ملفات كبيرة
  allFiles.forEach(file => {
    if (file.lines > 500) {
      issues.largFiles.push({
        file: file.relativePath,
        lines: file.lines,
        suggestion: 'قد يحتاج تقسيم لملفات أصغر'
      });
    }
  });

  // البحث عن APIs متضاربة
  const apis = categories.apis || [];
  const apiPaths = apis.map(api => api.relativePath);
  
  // البحث عن APIs مشابهة
  apis.forEach(api => {
    const conflicting = apis.filter(other => 
      api !== other &&
      api.relativePath.includes('whatsapp') &&
      other.relativePath.includes('whatsapp') &&
      path.dirname(api.relativePath) === path.dirname(other.relativePath)
    );
    
    if (conflicting.length > 0) {
      issues.conflictingApis.push({
        api: api.relativePath,
        conflictsWith: conflicting.map(c => c.relativePath)
      });
    }
  });

  return issues;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

function generateRecommendations(results) {
  const recommendations = [];
  
  // توصيات بناءً على التحليل
  if (results.categories.components.length > 5) {
    recommendations.push('🧹 لديك عدد كبير من مكونات الواتساب - فكر في التوحيد');
  }
  
  if (results.categories.apis.length > 3) {
    recommendations.push('🔗 عدة APIs للواتساب - قد تحتاج دمج أو تنظيم');
  }
  
  if (results.issues.duplicates.length > 0) {
    recommendations.push('❌ ملفات مكررة - يجب حذف النسخ غير المستخدمة');
  }
  
  if (results.issues.largFiles.length > 0) {
    recommendations.push('📏 ملفات كبيرة جداً - فكر في التقسيم');
  }
  
  // توصيات عامة
  recommendations.push('📁 إنشاء مجلد موحد لجميع ملفات الواتساب');
  recommendations.push('📚 توثيق استخدام كل ملف وغرضه');
  recommendations.push('🧪 إضافة اختبارات للملفات المهمة');
  
  return recommendations;
}

function generateComprehensiveReport(results) {
  let report = `# تحليل شامل لملفات الواتساب في المشروع\n\n`;
  report += `**تاريخ التحليل:** ${new Date(results.generatedAt).toLocaleString('ar-AE')}\n\n`;
  
  report += `## 📊 ملخص سريع\n\n`;
  report += `- **إجمالي الملفات:** ${results.summary.totalFiles}\n`;
  
  Object.keys(results.summary.categories).forEach(category => {
    const count = results.summary.categories[category];
    if (count > 0) {
      report += `- **${getCategoryName(category)}:** ${count}\n`;
    }
  });
  
  report += `\n## 📂 تفصيل حسب الفئات\n\n`;
  
  Object.keys(results.categories).forEach(category => {
    const files = results.categories[category];
    if (files.length > 0) {
      report += `### ${getCategoryName(category)} (${files.length})\n\n`;
      
      files.forEach(file => {
        report += `- **${file.relativePath}**\n`;
        report += `  - الحجم: ${file.lines} سطر\n`;
        report += `  - الأهمية: ${file.importance}\n`;
        if (file.whatsappReferences.length > 0) {
          report += `  - المراجع: ${file.whatsappReferences.slice(0, 3).join(', ')}\n`;
        }
        report += `\n`;
      });
    }
  });
  
  if (results.issues.duplicates.length > 0) {
    report += `## ⚠️ ملفات مكررة محتملة\n\n`;
    results.issues.duplicates.forEach(duplicate => {
      report += `- **${duplicate.file}**\n`;
      report += `  مشابه لـ: ${duplicate.similarTo.join(', ')}\n\n`;
    });
  }
  
  if (results.issues.largFiles.length > 0) {
    report += `## 📏 ملفات كبيرة الحجم\n\n`;
    results.issues.largFiles.forEach(file => {
      report += `- **${file.file}** (${file.lines} سطر)\n`;
      report += `  ${file.suggestion}\n\n`;
    });
  }
  
  report += `## 💡 التوصيات\n\n`;
  results.summary.recommendations.forEach(rec => {
    report += `${rec}\n`;
  });
  
  report += `\n## 🎯 خطة التنظيف المقترحة\n\n`;
  report += `1. **مراجعة الملفات المكررة** وحذف غير المستخدم\n`;
  report += `2. **توحيد APIs** في مجلد واحد\n`;
  report += `3. **تجميع المكونات** في هيكل منظم\n`;
  report += `4. **إنشاء نسخ احتياطية** قبل أي تغيير\n`;
  report += `5. **اختبار شامل** بعد التنظيف\n\n`;
  
  report += `---\n*تم إنشاء هذا التقرير تلقائياً - آمن 100%*\n`;
  
  return report;
}

// تشغيل التحليل
if (require.main === module) {
  analyzeAllWhatsAppFiles()
    .then(results => {
      console.log('\n🎉 انتهى التحليل الشامل بنجاح!');
      console.log(`📊 تم تحليل ${results.summary.totalFiles} ملف`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ فشل التحليل:', error);
      process.exit(1);
    });
}

module.exports = { analyzeAllWhatsAppFiles };
