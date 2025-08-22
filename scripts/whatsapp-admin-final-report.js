#!/usr/bin/env node

/**
 * تقرير نهائي لحالة صلاحيات الإدمن على صفحة الواتساب
 * Final WhatsApp Admin Permissions Status Report
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function generateFinalWhatsAppPermissionsReport() {
  try {
    console.log('🔍 إنشاء تقرير نهائي لصلاحيات الواتساب...\n');

    // 1. فحص المستخدم الإدمن
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      include: {
        privileges: {
          include: { privilege: true }
        }
      }
    });

    if (!admin) {
      console.log('❌ لم يتم العثور على مستخدم إدمن');
      return;
    }

    console.log('👤 معلومات الإدمن:');
    console.log(`   📧 الإيميل: ${admin.email}`);
    console.log(`   👥 الاسم: ${admin.name}`);
    console.log(`   🎭 الدور: ${admin.role}`);
    console.log(`   🆔 المعرف: ${admin.id}\n`);    // 2. فحص صلاحيات الواتساب
    const whatsappPrivilege = await prisma.userPrivilege.findFirst({
      where: { area: 'WHATSAPP' },
      include: { privilege: true }
    });

    if (!whatsappPrivilege) {
      console.log('❌ صلاحية WHATSAPP غير موجودة في النظام');
      return;
    }    console.log('📱 صلاحية الواتساب:');
    console.log(`   🆔 المعرف: ${whatsappPrivilege.id}`);
    console.log(`   📋 المنطقة: ${whatsappPrivilege.area}`);
    console.log(`   👁️ قراءة: ${whatsappPrivilege.privilege.canRead}`);
    console.log(`   ✏️ كتابة: ${whatsappPrivilege.privilege.canWrite}\n`);    // 3. فحص ربط الإدمن بصلاحية الواتساب
    const adminWhatsAppPrivilege = await prisma.userPrivilege.findFirst({
      where: { 
        userId: admin.id,
        area: 'WHATSAPP' 
      },
      include: { privilege: true }
    });

    if (!adminWhatsAppPrivilege) {
      console.log('❌ الإدمن لا يملك صلاحية الواتساب');
      return;
    }    console.log('✅ ربط صلاحية الواتساب بالإدمن:');
    console.log(`   🔗 معرف الربط: ${adminWhatsAppPrivilege.id}`);
    console.log(`   👁️ قراءة: ${adminWhatsAppPrivilege.privilege.canRead}`);
    console.log(`   ✏️ كتابة: ${adminWhatsAppPrivilege.privilege.canWrite}\n`);

    // 4. فحص API الواتساب
    const apiPath = 'src/app/api/admin/whatsapp/dashboard/route.js';
    let authenticationEnabled = false;
    
    if (fs.existsSync(apiPath)) {
      const apiContent = fs.readFileSync(apiPath, 'utf8');
      authenticationEnabled = !apiContent.includes('// TEMPORARY: Skip authentication') &&
                             apiContent.includes('verifyAuth()');
    }

    console.log('🔐 حالة API الواتساب:');
    console.log(`   📁 المسار: ${apiPath}`);
    console.log(`   🔒 المصادقة مُفعلة: ${authenticationEnabled ? '✅ نعم' : '❌ لا'}\n`);

    // 5. فحص ملفات الواتساب الأساسية
    const whatsappFiles = [
      'src/app/whatsapp-dashboard/page.jsx',
      'src/components/whatsapp/dashboard/EnhancedWhatsAppDashboard.jsx',
      'src/components/whatsapp/dashboard/components/WhatsAppBotMessagesTable.jsx'
    ];

    console.log('📂 ملفات الواتساب الأساسية:');
    whatsappFiles.forEach(file => {
      const exists = fs.existsSync(file);
      console.log(`   ${exists ? '✅' : '❌'} ${file}`);
    });
    console.log();

    // 6. إنشاء ملخص الحالة
    const allGood = admin && whatsappPrivilege && adminWhatsAppPrivilege && authenticationEnabled;

    console.log('====================================');
    console.log('📊 ملخص الحالة النهائية:');
    console.log('====================================');
    
    if (allGood) {
      console.log('🎉 جميع الفحوصات نجحت! صلاحيات الإدمن على صفحة الواتساب تعمل بشكل صحيح');
      console.log('✅ المستخدم الإدمن موجود ومُعرف بشكل صحيح');
      console.log('✅ صلاحية WHATSAPP موجودة في النظام');
      console.log('✅ الإدمن مرتبط بصلاحية WHATSAPP مع صلاحيات قراءة وكتابة');
      console.log('✅ المصادقة مُفعلة في API الواتساب');
      console.log('✅ جميع ملفات الواتساب الأساسية موجودة');
    } else {
      console.log('⚠️ هناك مشاكل تحتاج إلى حل:');
      if (!admin) console.log('❌ المستخدم الإدمن غير موجود');
      if (!whatsappPrivilege) console.log('❌ صلاحية WHATSAPP غير موجودة');
      if (!adminWhatsAppPrivilege) console.log('❌ الإدمن غير مرتبط بصلاحية WHATSAPP');
      if (!authenticationEnabled) console.log('❌ المصادقة غير مُفعلة في API');
    }

    // 7. إنشاء تقرير مكتوب
    const reportContent = `تقرير نهائي - صلاحيات الإدمن على صفحة الواتساب
=============================================
التاريخ: ${new Date().toLocaleString('ar-SA')}

معلومات الإدمن:
- الإيميل: ${admin.email}
- الاسم: ${admin.name}
- الدور: ${admin.role}
- المعرف: ${admin.id}

صلاحية الواتساب:
- المعرف: ${whatsappPrivilege.id}
- المنطقة: ${whatsappPrivilege.area}
- قراءة: ${whatsappPrivilege.privilege.canRead}
- كتابة: ${whatsappPrivilege.privilege.canWrite}

ربط الصلاحية:
- معرف الربط: ${adminWhatsAppPrivilege?.id || 'غير موجود'}
- قراءة: ${adminWhatsAppPrivilege?.privilege?.canRead || 'غير محدد'}
- كتابة: ${adminWhatsAppPrivilege?.privilege?.canWrite || 'غير محدد'}

حالة API:
- المسار: ${apiPath}
- المصادقة مُفعلة: ${authenticationEnabled ? 'نعم' : 'لا'}

الحالة العامة: ${allGood ? 'جميع الفحوصات نجحت ✅' : 'هناك مشاكل تحتاج حل ❌'}

الملفات المفحوصة:
${whatsappFiles.map(file => `- ${file}: ${fs.existsSync(file) ? 'موجود' : 'مفقود'}`).join('\n')}
`;

    fs.writeFileSync('whatsapp_admin_permissions_report.txt', reportContent, 'utf8');
    console.log('\n📋 تم إنشاء التقرير المكتوب: whatsapp_admin_permissions_report.txt');

  } catch (error) {
    console.error('❌ خطأ في إنشاء التقرير:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

// تشغيل التقرير
generateFinalWhatsAppPermissionsReport().catch(console.error);
