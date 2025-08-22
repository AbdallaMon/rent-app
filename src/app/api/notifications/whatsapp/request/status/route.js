// File: /src/app/api/notifications/whatsapp/request/status/route.js
// نظام إشعارات تحديث حالة الطلبات - محسن

import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// ترجمة حالات الطلبات
const getStatusName = (status, isArabic = true) => {
  const statusNames = {
    'PENDING': isArabic ? 'معلق' : 'Pending',
    'IN_PROGRESS': isArabic ? 'قيد الإنجاز' : 'In Progress', 
    'COMPLETED': isArabic ? 'مكتمل' : 'Completed',
    'CANCELLED': isArabic ? 'ملغي' : 'Cancelled',
    'ON_HOLD': isArabic ? 'متوقف مؤقتاً' : 'On Hold'
  };
  return statusNames[status] || status;
};

// ترجمة أنواع الصيانة
const getMaintenanceTypeName = (type, isArabic = true) => {
  const typeNames = {
    'ELECTRICAL': isArabic ? 'كهرباء' : 'Electrical',
    'PLUMBING': isArabic ? 'سباكة' : 'Plumbing',
    'AC_HEATING': isArabic ? 'تكييف وتدفئة' : 'AC & Heating',
    'APPLIANCES': isArabic ? 'أجهزة منزلية' : 'Appliances',
    'STRUCTURAL': isArabic ? 'إنشائية' : 'Structural',
    'CLEANING': isArabic ? 'تنظيف' : 'Cleaning',
    'PAINTING': isArabic ? 'دهان' : 'Painting',
    'CARPENTRY': isArabic ? 'نجارة' : 'Carpentry',
    'PEST_CONTROL': isArabic ? 'مكافحة حشرات' : 'Pest Control',
    'OTHER': isArabic ? 'أخرى' : 'Other'
  };
  return typeNames[type] || (isArabic ? 'أخرى' : 'Other');
};

// ترجمة أنواع الشكاوى
const getComplaintTypeName = (type, isArabic = true) => {
  const typeNames = {
    'PROPERTY_ISSUE': isArabic ? 'مشكلة في العقار' : 'Property Issue',
    'RENT_ISSUE': isArabic ? 'مشكلة في الإيجار' : 'Rent Issue',
    'NEIGHBOR_ISSUE': isArabic ? 'مشكلة مع الجيران' : 'Neighbor Issue',
    'MAINTENANCE_ISSUE': isArabic ? 'مشكلة في الصيانة' : 'Maintenance Issue',
    'NOISE_ISSUE': isArabic ? 'مشكلة ضوضاء' : 'Noise Issue',
    'SECURITY_ISSUE': isArabic ? 'مشكلة أمنية' : 'Security Issue',
    'PAYMENT_ISSUE': isArabic ? 'مشكلة في الدفع' : 'Payment Issue',
    'SERVICE_QUALITY': isArabic ? 'جودة الخدمة' : 'Service Quality',
    'OTHER': isArabic ? 'أخرى' : 'Other'
  };
  return typeNames[type] || (isArabic ? 'أخرى' : 'Other');
};

export async function POST(request) {
  try {
    const { requestId, newStatus, requestType = 'maintenance' } = await request.json();

    if (!requestId || !newStatus) {
      return NextResponse.json(
        { error: "Request ID and new status are required" },
        { status: 400 }
      );
    }

    console.log(`📢 إرسال إشعار تحديث حالة ${requestType} #${requestId} إلى: ${newStatus}`);

    let requestData = null;
    let client = null;

    // جلب البيانات حسب نوع الطلب
    if (requestType === 'maintenance') {
      requestData = await prisma.maintenanceRequest.findUnique({
        where: { id: requestId },
        include: {
          client: true,
          property: true,
          unit: true
        }
      });
    } else if (requestType === 'complaint') {
      requestData = await prisma.complaint.findUnique({
        where: { id: requestId },
        include: {
          client: true,
          property: true,
          unit: true
        }
      });
    }

    if (!requestData) {
      return NextResponse.json(
        { error: `${requestType} request not found` },
        { status: 404 }
      );
    }

    client = requestData.client;
    const phoneNumber = client?.phone;
    if (!phoneNumber) {
      return NextResponse.json(
        { error: "No phone number found for the client" },
        { status: 400 }
      );
    }

    // تحديث حالة الطلب في قاعدة البيانات
    if (requestType === 'maintenance') {
      await prisma.maintenanceRequest.update({
        where: { id: requestId },
        data: { status: newStatus }
      });
    } else if (requestType === 'complaint') {
      await prisma.complaint.update({
        where: { id: requestId },
        data: { status: newStatus }
      });
    }

    // إنشاء رسالة الإشعار
    const isArabic = true; // معظم عملائنا يفضلون العربية
    const statusNameAr = getStatusName(newStatus, true);
    
    // تنسيق رقم الطلب من اليسار لليمين
    const requestNumber = requestData.displayId || requestData.id;
    const formattedRequestNumber = `\u202D${requestNumber}\u202C`; // LTR override for the number only
    
    let message = `🔔 تحديث حالة ${requestType === 'maintenance' ? 'طلب الصيانة' : 'الشكوى'}\n\n`;
    message += `📋 رقم الطلب: ${formattedRequestNumber}\n`;
    message += `👤 العميل: ${requestData.client.name}\n`;
    
    if (requestType === 'maintenance') {
      message += `🔧 نوع الصيانة: ${getMaintenanceTypeName(requestData.type, true)}\n`;
    } else {
      message += `📝 نوع الشكوى: ${getComplaintTypeName(requestData.type, true)}\n`;
    }
    
    if (requestData.property) {
      message += `🏠 العقار: ${requestData.property.name}\n`;
    }
    
    if (requestData.unit) {
      message += `🏠 الوحدة: ${requestData.unit.unitNumber || requestData.unit.number || 'غير محدد'}\n`;
    }
    
    message += `📊 الحالة الجديدة: ${statusNameAr}\n`;
    message += `📱 شركة تار العقارية\n`;
    message += `☎️ للاستفسار: +971507935566\n`;
    message += `🇦🇪 دولة الإمارات العربية المتحدة`;

    // إرسال الرسالة
    const result = await sendWhatsAppMessage(phoneNumber, message);

    console.log(`✅ تم إرسال إشعار تحديث الحالة بنجاح إلى: ${phoneNumber}`);
    
    return NextResponse.json({
      success: true,
      message: "تم إرسال إشعار تحديث الحالة بنجاح",
      messageId: result.messages?.[0]?.id,
      clientName: client.name,
      newStatus: statusNameAr,
      requestType: requestType
    });
    
  } catch (error) {
    console.error("❌ خطأ في إرسال إشعار تحديث الحالة:", error);
    return NextResponse.json(
      {
        error: "Failed to send status update notification",
        details: error.message
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
