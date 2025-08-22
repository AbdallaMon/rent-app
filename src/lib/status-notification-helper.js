// مساعد إرسال إشعارات تحديث الحالة
// يمكن استخدامه من لوحة التحكم أو النظام الإداري

import { NextResponse } from 'next/server';

/**
 * إرسال إشعار تحديث حالة لطلب معين
 * @param {number} requestId - رقم الطلب
 * @param {string} newStatus - الحالة الجديدة (PENDING, IN_PROGRESS, COMPLETED, CANCELLED, ON_HOLD)
 * @param {string} requestType - نوع الطلب (maintenance أو complaint)
 * @returns {Promise<Object>} نتيجة الإرسال
 */
export async function sendStatusUpdateNotification(requestId, newStatus, requestType = 'maintenance') {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/notifications/whatsapp/request/status`;
    
    console.log(`📢 إرسال إشعار تحديث حالة ${requestType} #${requestId} إلى: ${newStatus}`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestId: requestId,
        newStatus: newStatus,
        requestType: requestType
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ تم إرسال إشعار تحديث الحالة بنجاح');
      return {
        success: true,
        data: result
      };
    } else {
      console.error('❌ ف شل إرسال إشعار تحديث الحالة:', result.error);
      return {
        success: false,
        error: result.error
      };
    }
    
  } catch (error) {
    console.error('❌ خطأ في إرسال إشعار تحديث الحالة:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * إرسال إشعار تحديث حالة لطلب صيانة
 * @param {number} maintenanceRequestId - رقم طلب الصيانة
 * @param {string} newStatus - الحالة الجديدة
 */
export async function notifyMaintenanceStatusUpdate(maintenanceRequestId, newStatus) {
  return await sendStatusUpdateNotification(maintenanceRequestId, newStatus, 'maintenance');
}

/**
 * إرسال إشعار تحديث حالة لشكوى
 * @param {number} complaintId - رقم الشكوى
 * @param {string} newStatus - الحالة الجديدة
 */
export async function notifyComplaintStatusUpdate(complaintId, newStatus) {
  return await sendStatusUpdateNotification(complaintId, newStatus, 'complaint');
}

/**
 * API Route Handler لاستخدامه من لوحة التحكم
 */
export async function POST(request) {
  try {
    const { requestId, newStatus, requestType = 'maintenance' } = await request.json();
    
    if (!requestId || !newStatus) {
      return NextResponse.json(
        { error: "Request ID and new status are required" },
        { status: 400 }
      );
    }
    
    const result = await sendStatusUpdateNotification(requestId, newStatus, requestType);
    
    if (result.success) {
      return NextResponse.json(result.data);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// أمثلة للاستخدام:
/*

// من لوحة التحكم - تحديث حالة طلب صيانة
await notifyMaintenanceStatusUpdate(123, 'IN_PROGRESS');

// من لوحة التحكم - تحديث حالة شكوى
await notifyComplaintStatusUpdate(456, 'COMPLETED');

// باستخدام fetch من الفرونت إند
fetch('/api/notifications/whatsapp/request/status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    requestId: 123,
    newStatus: 'COMPLETED',
    requestType: 'maintenance'
  })
});

*/
