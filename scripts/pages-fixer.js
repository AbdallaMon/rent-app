const fs = require('fs');
const path = require('path');

// سكريبت إصلاح المشاكل الشائعة
class PagesFixer {
  constructor() {
    this.srcDir = path.join(__dirname, '..', 'src');
    this.fixes = [];
    this.issues = [];
  }

  // إصلاح مراجع المكونات المفقودة
  fixMissingComponents() {
    console.log('🔧 إصلاح المكونات المفقودة...');
    
    const missingComponents = [
      {
        name: 'StatCard',
        path: '@/components/ui/Cards/StatCard',
        template: `import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

const StatCard = ({ title, value, icon, color = 'primary', subtitle }) => {
  return (
    <Card sx={{ minWidth: 200, height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box color={color === 'primary' ? 'primary.main' : color}>
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;`
      },
      {
        name: 'RefreshButton',
        path: '@/components/ui/Buttons/RefreshButton',
        template: `import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

const RefreshButton = ({ onClick, loading = false, disabled = false, ...props }) => {
  return (
    <Button
      variant="outlined"
      onClick={onClick}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
      {...props}
    >
      {loading ? 'جاري التحديث...' : 'تحديث'}
    </Button>
  );
};

export default RefreshButton;`
      },
      {
        name: 'ActivityCard',
        path: '@/components/ui/Cards/ActivityCard',
        template: `import React from 'react';
import { Card, CardContent, Typography, Chip, Box } from '@mui/material';

const ActivityCard = ({ title, description, timestamp, status, type }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="start">
          <Box flex={1}>
            <Typography variant="h6" gutterBottom>
              {title}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {description}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {timestamp}
            </Typography>
          </Box>
          <Box>
            {status && (
              <Chip 
                label={status} 
                color={getStatusColor(status)} 
                size="small" 
              />
            )}
            {type && (
              <Chip 
                label={type} 
                variant="outlined" 
                size="small" 
                sx={{ ml: 1 }}
              />
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ActivityCard;`
      }
    ];

    missingComponents.forEach(component => {
      const fullPath = component.path.replace('@/components/ui/', 
        path.join(this.srcDir, 'components', 'ui') + path.sep);
      const filePath = fullPath + '.jsx';
      const dir = path.dirname(filePath);

      if (!fs.existsSync(filePath)) {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, component.template, 'utf8');
        this.fixes.push(`تم إنشاء ${component.name} في ${component.path}`);
      }
    });
  }

  // إصلاح مشاكل الاستيراد
  fixImportIssues() {
    console.log('🔧 إصلاح مشاكل الاستيراد...');
    
    const files = this.findAllFiles(this.srcDir);
    
    files.forEach(filePath => {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let hasChanges = false;
        
        // إصلاح المراجع المكسورة
        const brokenImports = [
          { from: "from '@/app/UiComponents", to: "from '@/components/ui" },
          { from: "from '@/app/components", to: "from '@/components" },
          { from: "from '../../UiComponents", to: "from '@/components/ui" },
          { from: "from '../UiComponents", to: "from '@/components/ui" },
          { from: "from './UiComponents", to: "from '@/components/ui" },
        ];
        
        brokenImports.forEach(fix => {
          if (content.includes(fix.from)) {
            content = content.replace(new RegExp(fix.from, 'g'), fix.to);
            hasChanges = true;
          }
        });
        
        if (hasChanges) {
          fs.writeFileSync(filePath, content, 'utf8');
          this.fixes.push(`تم إصلاح المراجع في ${path.relative(this.srcDir, filePath)}`);
        }
        
      } catch (error) {
        this.issues.push(`خطأ في معالجة ${filePath}: ${error.message}`);
      }
    });
  }

  // إصلاح تكرار المكونات
  fixDuplicateComponents() {
    console.log('🔧 إصلاح المكونات المكررة...');
    
    const duplicatesMap = new Map();
    const files = this.findAllFiles(this.srcDir, ['.jsx', '.js']);
    
    files.forEach(filePath => {
      const fileName = path.basename(filePath, path.extname(filePath));
      if (!duplicatesMap.has(fileName)) {
        duplicatesMap.set(fileName, []);
      }
      duplicatesMap.get(fileName).push(filePath);
    });
    
    duplicatesMap.forEach((paths, componentName) => {
      if (paths.length > 1) {
        // البحث عن النسخة الصحيحة (في مجلد components)
        const correctPath = paths.find(p => p.includes(path.join('src', 'components')));
        if (correctPath) {
          paths.forEach(p => {
            if (p !== correctPath && !p.includes('node_modules')) {
              this.issues.push(`مكون مكرر: ${componentName} في ${path.relative(this.srcDir, p)}`);
            }
          });
        }
      }
    });
  }

  // إصلاح أخطاء TypeScript الشائعة
  fixTypeScriptIssues() {
    console.log('🔧 إصلاح مشاكل TypeScript...');
    
    const files = this.findAllFiles(this.srcDir, ['.ts', '.tsx']);
    
    files.forEach(filePath => {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let hasChanges = false;
        
        // إضافة أنواع مفقودة شائعة
        const typeFixes = [
          {
            search: /const\s+(\w+)\s*=\s*\(\s*\)\s*=>/g,
            replace: 'const $1: React.FC = () =>'
          },
          {
            search: /const\s+(\w+)\s*=\s*\(\{([^}]+)\}\s*:\s*any\)\s*=>/g,
            replace: 'const $1: React.FC<{$2}> = ({$2}) =>'
          }
        ];
        
        typeFixes.forEach(fix => {
          if (fix.search.test(content)) {
            content = content.replace(fix.search, fix.replace);
            hasChanges = true;
          }
        });
        
        if (hasChanges) {
          fs.writeFileSync(filePath, content, 'utf8');
          this.fixes.push(`تم إصلاح أنواع TypeScript في ${path.relative(this.srcDir, filePath)}`);
        }
        
      } catch (error) {
        this.issues.push(`خطأ في معالجة TypeScript ${filePath}: ${error.message}`);
      }
    });
  }

  // دالة مساعدة للبحث عن الملفات
  findAllFiles(dir, extensions = ['.js', '.jsx', '.ts', '.tsx'], files = []) {
    try {
      const dirFiles = fs.readdirSync(dir);
      
      for (const file of dirFiles) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          this.findAllFiles(filePath, extensions, files);
        } else if (extensions.some(ext => file.endsWith(ext))) {
          files.push(filePath);
        }
      }
    } catch (error) {
      this.issues.push(`خطأ في قراءة المجلد ${dir}: ${error.message}`);
    }
    
    return files;
  }

  // تشغيل جميع الإصلاحات
  async runAllFixes() {
    console.log('🔧 بدء إصلاح جميع المشاكل...\n');
    
    this.fixMissingComponents();
    this.fixImportIssues();
    this.fixDuplicateComponents();
    this.fixTypeScriptIssues();
    
    console.log('\n✅ تقرير الإصلاحات:');
    console.log(`📝 إصلاحات تمت: ${this.fixes.length}`);
    console.log(`⚠️ مشاكل مكتشفة: ${this.issues.length}`);
    
    if (this.fixes.length > 0) {
      console.log('\n🔧 الإصلاحات المطبقة:');
      this.fixes.forEach(fix => console.log(`  ✓ ${fix}`));
    }
    
    if (this.issues.length > 0) {
      console.log('\n⚠️ المشاكل المكتشفة:');
      this.issues.forEach(issue => console.log(`  ! ${issue}`));
    }
    
    console.log('\n✅ انتهت عملية الإصلاح');
  }
}

// تشغيل السكريبت
if (require.main === module) {
  const fixer = new PagesFixer();
  fixer.runAllFixes();
}

module.exports = PagesFixer;
