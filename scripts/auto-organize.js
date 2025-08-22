#!/usr/bin/env node

/**
 * 🧹 تنظيف المجلد الرئيسي تلقائياً
 * تشغيل: node scripts/auto-organize.js
 */

const fs = require('fs');
const path = require('path');
const { checkRootDirectory } = require('./check-root-directory');

// خريطة أنواع الملفات والمجلدات المقترحة
const FILE_TYPE_MAPPING = {
  '.md': 'docs',
  '.js': 'scripts',
  '.bat': 'scripts',
  '.ps1': 'scripts',
  '.sh': 'scripts',
  '.sql': 'sql',
  '.json': (filename) => {
    if (filename.includes('config') || filename.includes('template')) {
      return 'docs';
    }
    if (filename.includes('test') || filename.includes('result') || filename.includes('debug')) {
      return 'archive';
    }
    return 'archive';
  }
};

function getSuggestedFolder(filename) {
  const ext = path.extname(filename);
  const mapping = FILE_TYPE_MAPPING[ext];
  
  if (typeof mapping === 'function') {
    return mapping(filename);
  }
  
  if (mapping) {
    return mapping;
  }
  
  // فحص اسم الملف للحالات الخاصة
  if (filename.includes('test') || filename.includes('debug') || filename.includes('result')) {
    return 'archive';
  }
  
  if (filename.includes('config') || filename.includes('template')) {
    return 'docs';
  }
  
  return 'archive';
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 تم إنشاء المجلد: ${dirPath}`);
  }
}

function moveFile(source, destination) {
  try {
    ensureDirectoryExists(path.dirname(destination));
    fs.renameSync(source, destination);
    console.log(`✅ تم نقل: ${path.basename(source)} → ${path.dirname(destination)}/`);
    return true;
  } catch (error) {
    console.error(`❌ خطأ في نقل ${source}: ${error.message}`);
    return false;
  }
}

function autoOrganize(dryRun = false) {
  console.log(dryRun ? '🔍 معاينة التنظيم...' : '🧹 بدء التنظيف التلقائي...');
  console.log('');
  
  const violations = checkRootDirectory();
  
  if (violations.length === 0) {
    console.log('✅ المجلد الرئيسي منظم بالفعل!');
    return;
  }
  
  let moved = 0;
  let skipped = 0;
  
  violations.forEach(violation => {
    if (violation.type === 'file') {
      const sourceFile = violation.name;
      const suggestedFolder = getSuggestedFolder(sourceFile);
      const destinationPath = path.join(suggestedFolder, sourceFile);
      
      console.log(`📄 ${sourceFile} → ${suggestedFolder}/`);
      
      if (!dryRun) {
        if (moveFile(sourceFile, destinationPath)) {
          moved++;
        } else {
          skipped++;
        }
      }
    } else {
      console.log(`📁 ${violation.name} (مجلد) - يحتاج مراجعة يدوية`);
      skipped++;
    }
  });
  
  if (!dryRun) {
    console.log('\n📊 ملخص النتائج:');
    console.log(`✅ تم نقل: ${moved} ملف`);
    if (skipped > 0) {
      console.log(`⏭️  تم تجاهل: ${skipped} عنصر`);
    }
    console.log('\n🎉 تم الانتهاء من التنظيف!');
  } else {
    console.log(`\n💡 معاينة: ${violations.length} عنصر سيتم تنظيمه`);
    console.log('تشغيل بدون --dry-run للتطبيق الفعلي');
  }
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🧹 أداة التنظيف التلقائي للمجلد الرئيسي

الاستخدام:
  node scripts/auto-organize.js [options]

الخيارات:
  --dry-run, -d    معاينة التغييرات بدون تطبيق
  --help, -h       عرض هذه المساعدة

أمثلة:
  node scripts/auto-organize.js --dry-run    # معاينة
  node scripts/auto-organize.js             # تطبيق فعلي
    `);
    return;
  }
  
  autoOrganize(dryRun);
}

if (require.main === module) {
  main();
}

module.exports = { autoOrganize };
