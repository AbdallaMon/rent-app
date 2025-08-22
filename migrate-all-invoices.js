/**
 * سكريبت ترقيم جميع الفواتير القديمة
 * ⚠️ استخدم بحذر - سيقوم بتحديث جميع الفواتير الموجودة
 */

import { addDisplayIdToAllInvoices } from './src/helpers/functions/invoiceDisplayId.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateAllInvoices() {
  console.log('🚀 بدء عملية ترقيم جميع الفواتير القديمة...\n');
  
  try {
    // التحقق من العدد الإجمالي أولاً
    const totalInvoices = await prisma.invoice.count();
    const invoicesWithoutDisplayId = await prisma.invoice.count({
      where: { displayId: null }
    });
    const invoicesWithDisplayId = await prisma.invoice.count({
      where: { displayId: { not: null } }
    });
    
    console.log(`📊 إحصائيات قبل البدء:`);
    console.log(`   إجمالي الفواتير: ${totalInvoices}`);
    console.log(`   فواتير بحاجة لترقيم: ${invoicesWithoutDisplayId}`);
    console.log(`   فواتير مرقمة بالفعل: ${invoicesWithDisplayId}\n`);
    
    if (invoicesWithoutDisplayId === 0) {
      console.log('✅ جميع الفواتير مرقمة بالفعل!');
      return;
    }
    
    // تأكيد من المستخدم
    console.log('⚠️  تحذير: ستقوم هذه العملية بترقيم جميع الفواتير القديمة');
    console.log('   هذا قد يستغرق بعض الوقت...\n');
    
    // بدء عملية الترقيم
    console.log('🔄 بدء عملية الترقيم...\n');
    
    const result = await addDisplayIdToAllInvoices();
    
    if (result.errorCount === -1) {
      console.error('❌ حدث خطأ كبير في العملية!');
      return;
    }
    
    // عرض النتائج النهائية
    console.log('\n📊 النتائج النهائية:');
    console.log(`   ✅ تم ترقيم بنجاح: ${result.successCount} فاتورة`);
    console.log(`   ❌ فشل في الترقيم: ${result.errorCount} فاتورة`);
    
    // إحصائيات ما بعد العملية
    const finalInvoicesWithDisplayId = await prisma.invoice.count({
      where: { displayId: { not: null } }
    });
    const finalInvoicesWithoutDisplayId = await prisma.invoice.count({
      where: { displayId: null }
    });
    
    console.log(`\n📊 إحصائيات ما بعد العملية:`);
    console.log(`   فواتير مرقمة: ${finalInvoicesWithDisplayId}`);
    console.log(`   فواتير غير مرقمة: ${finalInvoicesWithoutDisplayId}`);
    
    if (finalInvoicesWithoutDisplayId === 0) {
      console.log('\n🎉 تمت العملية بنجاح! جميع الفواتير مرقمة الآن!');
    } else {
      console.log(`\n⚠️  تبقى ${finalInvoicesWithoutDisplayId} فاتورة غير مرقمة`);
    }
    
    // عرض عينة من الفواتير المرقمة
    console.log('\n📋 عينة من الفواتير المرقمة:');
    const sampleInvoices = await prisma.invoice.findMany({
      where: { displayId: { not: null } },
      select: {
        id: true,
        displayId: true,
        invoiceType: true,
        createdAt: true
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    sampleInvoices.forEach(invoice => {
      console.log(`   ID: ${invoice.id} → ${invoice.displayId} (${invoice.invoiceType})`);
    });
    
  } catch (error) {
    console.error('❌ خطأ في عملية الترقيم:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل العملية
migrateAllInvoices();
