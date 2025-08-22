const fs = require('fs');
const path = require('path');

// سكريبت التنظيف الشامل
class ProjectCleaner {
  constructor() {
    this.srcDir = path.join(__dirname, '..', 'src');
    this.projectRoot = path.join(__dirname, '..');
    this.deletedFiles = [];
    this.movedFiles = [];
    this.cleanedDirs = [];
  }

  // تنظيف الملفات المكررة
  cleanDuplicateFiles() {
    console.log('🧹 تنظيف الملفات المكررة...');
    
    const duplicatePatterns = [
      // ملفات النسخ الاحتياطية
      /\.bak$/,
      /\.backup$/,
      /\.old$/,
      /\.tmp$/,
      /~$/,
      
      // ملفات مؤقتة
      /\.DS_Store$/,
      /Thumbs\.db$/,
      /desktop\.ini$/,
      
      // ملفات IDE
      /\.vscode$/,
      /\.idea$/,
      /\.swp$/,
      /\.swo$/,
    ];
    
    this.findAllFiles(this.projectRoot).forEach(filePath => {
      const fileName = path.basename(filePath);
      
      if (duplicatePatterns.some(pattern => pattern.test(fileName))) {
        try {
          fs.unlinkSync(filePath);
          this.deletedFiles.push(path.relative(this.projectRoot, filePath));
        } catch (error) {
          console.log(`تعذر حذف ${filePath}: ${error.message}`);
        }
      }
    });
  }

  // تنظيف المجلدات الفارغة
  cleanEmptyDirectories() {
    console.log('🧹 تنظيف المجلدات الفارغة...');
    
    const cleanEmptyDirs = (dir) => {
      try {
        const files = fs.readdirSync(dir);
        
        if (files.length === 0) {
          fs.rmdirSync(dir);
          this.cleanedDirs.push(path.relative(this.projectRoot, dir));
          return true;
        }
        
        let isEmpty = true;
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            if (!cleanEmptyDirs(filePath)) {
              isEmpty = false;
            }
          } else {
            isEmpty = false;
          }
        }
        
        if (isEmpty) {
          fs.rmdirSync(dir);
          this.cleanedDirs.push(path.relative(this.projectRoot, dir));
          return true;
        }
        
        return false;
      } catch (error) {
        return false;
      }
    };
    
    cleanEmptyDirs(this.srcDir);
  }

  // تنظيف imports غير المستخدمة
  cleanUnusedImports() {
    console.log('🧹 تنظيف imports غير المستخدمة...');
    
    const files = this.findAllFiles(this.srcDir, ['.js', '.jsx', '.ts', '.tsx']);
    
    files.forEach(filePath => {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        let hasChanges = false;
        
        // البحث عن imports غير مستخدمة
        const importLines = lines.filter(line => line.trim().startsWith('import'));
        const codeContent = lines.filter(line => !line.trim().startsWith('import')).join('\n');
        
        const usedImports = importLines.filter(importLine => {
          // استخراج أسماء المتغيرات المستوردة
          const match = importLine.match(/import\s+(?:\{([^}]+)\}|\s*(\w+))/);
          if (match) {
            const imports = match[1] ? 
              match[1].split(',').map(i => i.trim().split(' as ')[0]) : 
              [match[2]];
            
            // التحقق من استخدام أي من المتغيرات
            return imports.some(imp => {
              const importName = imp.trim();
              return codeContent.includes(importName) || 
                     codeContent.includes(`<${importName}`) ||
                     codeContent.includes(`${importName}(`);
            });
          }
          return true;
        });
        
        if (usedImports.length !== importLines.length) {
          const newContent = [
            ...usedImports,
            '',
            ...lines.filter(line => !line.trim().startsWith('import') || line.trim() === '')
          ].join('\n');
          
          fs.writeFileSync(filePath, newContent, 'utf8');
          hasChanges = true;
        }
        
        if (hasChanges) {
          console.log(`تم تنظيف imports في ${path.relative(this.srcDir, filePath)}`);
        }
        
      } catch (error) {
        console.log(`خطأ في تنظيف ${filePath}: ${error.message}`);
      }
    });
  }

  // تنظيف الكود المعلق عليه
  cleanCommentedCode() {
    console.log('🧹 تنظيف الكود المعلق عليه...');
    
    const files = this.findAllFiles(this.srcDir, ['.js', '.jsx', '.ts', '.tsx']);
    
    files.forEach(filePath => {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let hasChanges = false;
        
        // إزالة الأسطر المعلق عليها التي تحتوي على كود
        const lines = content.split('\n');
        const cleanedLines = lines.filter(line => {
          const trimmed = line.trim();
          
          // تجاهل التعليقات التوضيحية
          if (trimmed.startsWith('//') && 
              (trimmed.includes('TODO') || 
               trimmed.includes('FIXME') || 
               trimmed.includes('NOTE') ||
               trimmed.length < 50)) {
            return true;
          }
          
          // حذف الكود المعلق عليه
          if (trimmed.startsWith('//') && 
              (trimmed.includes('import') || 
               trimmed.includes('const') ||
               trimmed.includes('function') ||
               trimmed.includes('<') ||
               trimmed.includes('{'))) {
            hasChanges = true;
            return false;
          }
          
          return true;
        });
        
        if (hasChanges) {
          fs.writeFileSync(filePath, cleanedLines.join('\n'), 'utf8');
          console.log(`تم تنظيف الكود المعلق في ${path.relative(this.srcDir, filePath)}`);
        }
        
      } catch (error) {
        console.log(`خطأ في تنظيف ${filePath}: ${error.message}`);
      }
    });
  }

  // تنظيف console.log
  cleanConsoleLogs() {
    console.log('🧹 تنظيف console.log...');
    
    const files = this.findAllFiles(this.srcDir, ['.js', '.jsx', '.ts', '.tsx']);
    
    files.forEach(filePath => {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // إزالة console.log فقط، ليس console.error أو console.warn
        const originalLength = content.length;
        content = content.replace(/^\s*console\.log\(.*\);\s*$/gm, '');
        
        if (content.length !== originalLength) {
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`تم تنظيف console.log في ${path.relative(this.srcDir, filePath)}`);
        }
        
      } catch (error) {
        console.log(`خطأ في تنظيف ${filePath}: ${error.message}`);
      }
    });
  }

  // دالة مساعدة للبحث عن الملفات
  findAllFiles(dir, extensions = null, files = []) {
    try {
      const dirFiles = fs.readdirSync(dir);
      
      for (const file of dirFiles) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && 
            !file.startsWith('.') && 
            file !== 'node_modules' && 
            file !== 'backup') {
          this.findAllFiles(filePath, extensions, files);
        } else if (!extensions || extensions.some(ext => file.endsWith(ext))) {
          files.push(filePath);
        }
      }
    } catch (error) {
      // تجاهل الأخطاء
    }
    
    return files;
  }

  // تشغيل جميع عمليات التنظيف
  async runFullClean() {
    console.log('🧹 بدء التنظيف الشامل للمشروع...\n');
    
    this.cleanDuplicateFiles();
    this.cleanEmptyDirectories();
    this.cleanUnusedImports();
    this.cleanCommentedCode();
    this.cleanConsoleLogs();
    
    console.log('\n✅ تقرير التنظيف:');
    console.log(`🗑️ ملفات محذوفة: ${this.deletedFiles.length}`);
    console.log(`📁 مجلدات منظفة: ${this.cleanedDirs.length}`);
    
    if (this.deletedFiles.length > 0) {
      console.log('\n🗑️ الملفات المحذوفة:');
      this.deletedFiles.forEach(file => console.log(`  - ${file}`));
    }
    
    if (this.cleanedDirs.length > 0) {
      console.log('\n📁 المجلدات المنظفة:');
      this.cleanedDirs.forEach(dir => console.log(`  - ${dir}`));
    }
    
    console.log('\n✅ انتهت عملية التنظيف الشامل');
  }
}

// تشغيل السكريبت
if (require.main === module) {
  const cleaner = new ProjectCleaner();
  cleaner.runFullClean();
}

module.exports = ProjectCleaner;
