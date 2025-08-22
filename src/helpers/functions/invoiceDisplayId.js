/**
 * مولد الأرقام التسلسلية للفواتير
 * نظام: النوع-السنة-الشهر-الرقم
 * مثال: RENT-2025-07-001
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// خريطة أنواع الفواتير
const INVOICE_TYPE_CODES = {
  RENT: 'RENT',
  MAINTENANCE: 'MAIN',
  MANAGEMENT_COMMISSION: 'COMM',
  TAX: 'TAXS',
  INSURANCE: 'INSU',
  REGISTRATION: 'REGN',
  CONTRACT_EXPENSE: 'EXPR',
  OTHER_EXPENSE: 'OTHR',
  OTHER: 'MISC'
};

/**
 * توليد رقم تسلسلي جديد للفاتورة
 * @param {string} invoiceType - نوع الفاتورة
 * @param {Date} date - التاريخ (افتراضي: اليوم)
 * @returns {Promise<string>} الرقم التسلسلي الجديد
 */
export async function generateInvoiceDisplayId(invoiceType, date = new Date()) {
  try {
    // تحديد رمز النوع
    const typeCode = INVOICE_TYPE_CODES[invoiceType] || 'MISC';
    
    // تحديد السنة والشهر
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // إنشاء prefix للبحث
    const prefix = `${typeCode}-${year}-${month}-`;
    
    // العثور على آخر رقم لهذا النوع في هذا الشهر
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        displayId: {
          startsWith: prefix
        }
      },
      orderBy: {
        displayId: 'desc'
      }
    });
    
    // تحديد الرقم التسلسلي التالي
    let nextNumber = 1;
    if (lastInvoice && lastInvoice.displayId) {
      const lastNumberPart = lastInvoice.displayId.split('-').pop();
      nextNumber = parseInt(lastNumberPart) + 1;
    }
    
    // تنسيق الرقم بثلاث خانات
    const formattedNumber = nextNumber.toString().padStart(3, '0');
    
    // إنشاء الرقم التسلسلي الكامل
    const displayId = `${prefix}${formattedNumber}`;
    
    return displayId;
    
  } catch (error) {
    console.error('خطأ في توليد الرقم التسلسلي:', error);
    // في حالة الخطأ، نعيد null ونستخدم النظام القديم
    return null;
  }
}

/**
 * إضافة رقم تسلسلي لفاتورة موجودة
 * @param {number} invoiceId - رقم الفاتورة
 * @returns {Promise<string|null>} الرقم التسلسلي المُضاف أو null في حالة الخطأ
 */
export async function addDisplayIdToExistingInvoice(invoiceId) {
  try {
    // جلب بيانات الفاتورة
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    });
    
    if (!invoice) {
      throw new Error('الفاتورة غير موجودة');
    }
    
    // توليد رقم تسلسلي جديد
    const displayId = await generateInvoiceDisplayId(
      invoice.invoiceType, 
      invoice.createdAt
    );
    
    if (!displayId) {
      throw new Error('فشل في توليد الرقم التسلسلي');
    }
    
    // تحديث الفاتورة
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { displayId }
    });
    
    return displayId;
    
  } catch (error) {
    console.error('خطأ في إضافة رقم تسلسلي للفاتورة:', error);
    return null;
  }
}

/**
 * تحديث جميع الفواتير الموجودة لإضافة أرقام تسلسلية
 * ⚠️ استخدم بحذر - للاختبار فقط!
 */
export async function addDisplayIdToAllInvoices() {
  try {
    console.log('🚀 بدء عملية إضافة الأرقام التسلسلية...');
    
    // جلب جميع الفواتير التي لا تملك displayId
    const invoices = await prisma.invoice.findMany({
      where: {
        displayId: null
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log(`📋 تم العثور على ${invoices.length} فاتورة بحاجة لترقيم`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const invoice of invoices) {
      const displayId = await addDisplayIdToExistingInvoice(invoice.id);
      if (displayId) {
        successCount++;
        console.log(`✅ تم ترقيم الفاتورة ${invoice.id} بالرقم ${displayId}`);
      } else {
        errorCount++;
        console.log(`❌ فشل في ترقيم الفاتورة ${invoice.id}`);
      }
    }
    
    console.log(`🎉 انتهت العملية: ${successCount} نجح، ${errorCount} فشل`);
    
    return { successCount, errorCount };
    
  } catch (error) {
    console.error('خطأ كبير في عملية الترقيم:', error);
    return { successCount: 0, errorCount: -1 };
  }
}
