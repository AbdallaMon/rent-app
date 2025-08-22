const fs = require('fs');
const path = require('path');

// قائمة بالتحديثات المطلوبة
const replacements = [
  {
    from: '@/app/UiComponents',
    to: '@/components/ui'
  },
  {
    from: '@/app/components',
    to: '@/components'
  },
  {
    from: '@/app/constants',
    to: '@/config'
  },
  {
    from: '../../UiComponents',
    to: '@/components/ui'
  },
  {
    from: '../UiComponents',
    to: '@/components/ui'
  },
  {
    from: './UiComponents',
    to: '@/components/ui'
  }
];

// دالة للبحث عن جميع ملفات js/jsx/ts/tsx
function findFiles(dir, files = []) {
  const dirFiles = fs.readdirSync(dir);
  
  for (const file of dirFiles) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findFiles(filePath, files);
    } else if (file.match(/\.(js|jsx|ts|tsx)$/)) {
      files.push(filePath);
    }
  }
  
  return files;
}

// دالة لتحديث الملف
function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    for (const replacement of replacements) {
      const regex = new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (content.includes(replacement.from)) {
        content = content.replace(regex, replacement.to);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`تم تحديث: ${filePath}`);
    }
  } catch (error) {
    console.error(`خطأ في تحديث ${filePath}:`, error.message);
  }
}

// تنفيذ التحديث
const srcDir = path.join(__dirname, '..', 'src');
const files = findFiles(srcDir);

console.log(`جاري تحديث ${files.length} ملف...`);

files.forEach(updateFile);

console.log('تم الانتهاء من التحديث!');
