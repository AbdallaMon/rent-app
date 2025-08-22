#!/usr/bin/env node

/**
 * 🎯 Pre-commit Hook - فحص تنظيم المشروع قبل الكوميت
 * يمنع الكوميت إذا كان هناك ملفات غير منظمة في المجلد الرئيسي
 */

const { checkRootDirectory } = require('./check-root-directory');

function preCommitCheck() {
  console.log('🔍 فحص تنظيم المشروع قبل الكوميت...\n');
  
  const violations = checkRootDirectory();
  
  if (violations.length === 0) {
    console.log('✅ المشروع منظم - يمكن المواصلة');
    process.exit(0);
  }
  
  console.log('❌ تم العثور على ملفات غير منظمة في المجلد الرئيسي:\n');
  
  violations.forEach(violation => {
    console.log(`⚠️  ${violation.name} (${violation.type})`);
    console.log(`   💡 يجب نقله إلى: ${violation.suggested}/\n`);
  });
  
  console.log('🚫 تم إيقاف الكوميت!');
  console.log('📋 لتنظيم الملفات تلقائياً:');
  console.log('   node scripts/auto-organize.js\n');
  console.log('🔧 أو لمعاينة التغييرات:');
  console.log('   node scripts/auto-organize.js --dry-run\n');
  
  process.exit(1);
}

if (require.main === module) {
  preCommitCheck();
}

module.exports = { preCommitCheck };
