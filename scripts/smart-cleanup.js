#!/usr/bin/env node

/**
 * Smart Project Cleanup Script
 * سكريبت تنظيف ذكي للمشروع
 * 
 * This script safely removes unnecessary files and directories from the project
 * يقوم بحذف الملفات والمجلدات غير الضرورية بأمان
 * 
 * Features:
 * - Calculates space saved
 * - Generates cleanup reports
 * - Safe deletion with error handling
 * - Categorized cleanup targets
 */

const fs = require('fs');
const path = require('path');

// Get the project root directory (parent of scripts folder)
// الحصول على مجلد الجذر للمشروع (المجلد الأب لمجلد scripts)
const projectRoot = path.resolve(__dirname, '..');

// Configuration object that defines all cleanup targets
// كائن التكوين الذي يحدد جميع أهداف التنظيف
const cleanupTargets = {
  // Test files that are no longer needed
  // ملفات الاختبار التي لم تعد مطلوبة
  testFiles: [
    'integration-test-report.js',    // Integration test report file
    'final-check.js',                // Final system check file
    'settings-summary.js',           // Settings summary file
    'whatsapp-analysis.html',        // WhatsApp analysis HTML report
    'build-log.txt',                 // Build process log file
    'pages-analysis-report.json',    // Pages analysis JSON report
    'pages-update.log'               // Pages update log file
  ],
  
  // Test directories that should be removed
  // مجلدات الاختبار التي يجب حذفها
  testDirs: [
    'src/app/test-ending-agreements',    // Test page for ending agreements
    'src/app/test-maintenance-request',  // Test page for maintenance requests
    'backup',                            // Old backup directory
    'scripts/archive'                    // Archived test scripts
  ],
  
  // Temporary files and cache directories
  // الملفات المؤقتة ومجلدات التخزين المؤقت
  tempFiles: [
    '.next/cache',           // Next.js build cache
    'node_modules/.cache'    // Node modules cache
  ],
  
  // Large SQL backup files that take up space
  // ملفات SQL الاحتياطية الكبيرة التي تشغل مساحة
  sqlBackups: [
    'sql/backup_data.sql',     // Large database backup file
    'sql/backup_restore.sql'   // Database restore script
  ]
};

/**
 * Safely delete a file or directory
 * حذف ملف أو مجلد بأمان
 * 
 * @param {string} filePath - Relative path from project root
 * @returns {void}
 */
function deleteFileOrDir(filePath) {
  // Create full absolute path
  // إنشاء المسار المطلق الكامل
  const fullPath = path.join(projectRoot, filePath);
  
  // Check if file/directory exists before attempting deletion
  // فحص وجود الملف/المجلد قبل محاولة الحذف
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  الملف غير موجود: ${filePath}`);
    return;
  }
  
  try {
    // Get file/directory statistics
    // الحصول على إحصائيات الملف/المجلد
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      // Remove directory recursively with force option
      // حذف المجلد بشكل تكراري مع خيار القوة
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`🗂️  تم حذف المجلد: ${filePath}`);
    } else {
      // Remove single file
      // حذف ملف واحد
      fs.unlinkSync(fullPath);
      console.log(`📄 تم حذف الملف: ${filePath}`);
    }
  } catch (error) {
    // Log error if deletion fails
    // تسجيل الخطأ إذا فشل الحذف
    console.error(`❌ فشل في حذف ${filePath}: ${error.message}`);
  }
}

/**
 * Calculate the total size of a directory recursively
 * حساب الحجم الإجمالي لمجلد بشكل تكراري
 * 
 * @param {string} dirPath - Absolute path to directory
 * @returns {number} Total size in bytes
 */
function calculateDirectorySize(dirPath) {
  // Return 0 if directory doesn't exist
  // إرجاع 0 إذا كان المجلد غير موجود
  if (!fs.existsSync(dirPath)) return 0;
  
  let totalSize = 0;
  
  try {
    // Get all items in the directory
    // الحصول على جميع العناصر في المجلد
    const items = fs.readdirSync(dirPath);
    
    // Iterate through each item
    // التكرار عبر كل عنصر
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        // Recursively calculate subdirectory size
        // حساب حجم المجلد الفرعي بشكل تكراري
        totalSize += calculateDirectorySize(itemPath);
      } else {
        // Add file size to total
        // إضافة حجم الملف إلى المجموع
        totalSize += stats.size;
      }
    }
  } catch (error) {
    // Skip directories that can't be read
    // تخطي المجلدات التي لا يمكن قراءتها
    console.warn(`⚠️  تعذر قراءة المجلد: ${dirPath}`);
  }
  
  return totalSize;
}

/**
 * Format bytes into human-readable format
 * تنسيق البايتات إلى تنسيق قابل للقراءة
 * 
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted string (e.g., "1.5 MB")
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;                                    // Conversion factor
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];        // Size units
  const i = Math.floor(Math.log(bytes) / Math.log(k)); // Calculate unit index
  
  // Calculate and format the size
  // حساب وتنسيق الحجم
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Main cleanup function that orchestrates the entire cleanup process
 * الوظيفة الرئيسية للتنظيف التي تنظم عملية التنظيف بالكامل
 * 
 * Process:
 * 1. Calculate space before cleanup
 * 2. Remove test files
 * 3. Remove test directories
 * 4. Remove SQL backups
 * 5. Remove temporary files
 * 6. Generate cleanup report
 * 
 * @returns {Promise<void>}
 */
async function smartCleanup() {
  console.log('🧹 بدء عملية التنظيف الذكي...\n');
  
  // Initialize counters for tracking cleanup progress
  // تهيئة العدادات لتتبع تقدم التنظيف
  let totalCleaned = 0;  // Number of items deleted
  let totalSize = 0;     // Total space saved in bytes
  
  console.log('📊 حساب الحجم قبل التنظيف...');
  
  // PHASE 1: Remove test files
  // المرحلة 1: حذف ملفات الاختبار
  console.log('\n🧪 حذف ملفات الاختبار...');
  for (const file of cleanupTargets.testFiles) {
    const fullPath = path.join(projectRoot, file);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      totalSize += stats.size;        // Add file size to total
      deleteFileOrDir(file);          // Delete the file
      totalCleaned++;                 // Increment counter
    }
  }
  
  // PHASE 2: Remove test directories
  // المرحلة 2: حذف مجلدات الاختبار
  console.log('\n📁 حذف مجلدات الاختبار...');
  for (const dir of cleanupTargets.testDirs) {
    const fullPath = path.join(projectRoot, dir);
    if (fs.existsSync(fullPath)) {
      totalSize += calculateDirectorySize(fullPath);  // Calculate directory size
      deleteFileOrDir(dir);                           // Delete the directory
      totalCleaned++;                                 // Increment counter
    }
  }
  
  // PHASE 3: Remove SQL backup files
  // المرحلة 3: حذف ملفات SQL الاحتياطية
  console.log('\n💾 حذف ملفات SQL الاحتياطية الكبيرة...');
  for (const file of cleanupTargets.sqlBackups) {
    const fullPath = path.join(projectRoot, file);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      totalSize += stats.size;        // Add file size to total
      deleteFileOrDir(file);          // Delete the file
      totalCleaned++;                 // Increment counter
    }
  }
  
  // PHASE 4: Remove temporary files and cache
  // المرحلة 4: حذف الملفات المؤقتة والتخزين المؤقت
  console.log('\n🗑️  حذف الملفات المؤقتة...');
  for (const file of cleanupTargets.tempFiles) {
    const fullPath = path.join(projectRoot, file);
    if (fs.existsSync(fullPath)) {
      totalSize += calculateDirectorySize(fullPath);  // Calculate size
      deleteFileOrDir(file);                          // Delete the cache
      totalCleaned++;                                 // Increment counter
    }
  }
  
  // PHASE 5: Display cleanup summary
  // المرحلة 5: عرض ملخص التنظيف
  console.log('\n✅ تم الانتهاء من عملية التنظيف!');
  console.log(`📈 تم حذف ${totalCleaned} عنصر`);
  console.log(`💾 تم توفير ${formatBytes(totalSize)} من المساحة`);
  
  // PHASE 6: Generate cleanup report
  // المرحلة 6: إنشاء تقرير التنظيف
  const report = {
    timestamp: new Date().toISOString(),               // Cleanup timestamp
    itemsCleaned: totalCleaned,                       // Number of items deleted
    spaceSaved: formatBytes(totalSize),               // Human-readable space saved
    spaceSavedBytes: totalSize,                       // Raw bytes saved
    cleanupTargets: Object.values(cleanupTargets).flat(), // All cleanup targets
    categories: {                                     // Breakdown by category
      testFiles: cleanupTargets.testFiles.length,
      testDirs: cleanupTargets.testDirs.length,
      tempFiles: cleanupTargets.tempFiles.length,
      sqlBackups: cleanupTargets.sqlBackups.length
    }
  };
  
  // Write report to JSON file
  // كتابة التقرير إلى ملف JSON
  const reportPath = path.join(projectRoot, 'cleanup-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📋 تم إنشاء تقرير التنظيف: cleanup-report.json`);
}

// Execute the cleanup process
// تنفيذ عملية التنظيف
// 
// This is the entry point that starts the cleanup process
// هذه هي نقطة الدخول التي تبدأ عملية التنظيف
//
// Usage: node scripts/smart-cleanup.js
// الاستخدام: node scripts/smart-cleanup.js
smartCleanup().catch(console.error);
