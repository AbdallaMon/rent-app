import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Helper function to verify authentication
async function verifyAuth() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return null;
    }
    
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        privileges: {
          where: { area: 'WHATSAPP' },
          include: { privilege: true }
        }
      }
    });
    
    if (!user || !user.privileges.some(p => p.privilege.canWrite)) {
      return null;
    }
    
    return user;
  } catch (error) {
    return null;
  }
}

// Helper function to send WhatsApp notification
async function sendWhatsAppNotification(phoneNumber, templateName, templateParams) {
  try {
    const response = await fetch(`https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'ar' },
          components: templateParams ? [
            {
              type: 'body',
              parameters: templateParams.map(param => ({ type: 'text', text: param }))
            }
          ] : []
        }
      })
    });

    const result = await response.json();
    return { success: response.ok, data: result };
  } catch (error) {
    console.error('WhatsApp notification error:', error);
    return { success: false, error: error.message };
  }
}

export async function POST(request) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول' },
        { status: 401 }
      );
    }

    const { id, type, status, notes, notifyClient = true } = await request.json();

    if (!id || !type || !status) {
      return NextResponse.json(
        { error: 'معطيات مطلوبة مفقودة' },
        { status: 400 }
      );
    }

    let updateResult;
    let clientPhone;
    let clientName;
    let templateName;
    let templateParams = [];

    // Update based on type
    if (type === 'maintenance') {
      updateResult = await prisma.maintenanceRequest.update({
        where: { id: parseInt(id) },
        data: { 
          status: status,
          updatedAt: new Date()
        },
        include: {
          client: true,
          property: true,
          unit: true
        }
      });

      clientPhone = updateResult.client.phone;
      clientName = updateResult.client.name;

      // Choose template based on status
      switch (status) {
        case 'IN_PROGRESS':
          templateName = 'maintenance_in_progress';
          templateParams = [clientName, updateResult.id.toString()];
          break;
        case 'COMPLETED':
          templateName = 'maintenance_completed';
          templateParams = [clientName, updateResult.id.toString()];
          break;
        case 'REJECTED':
          templateName = 'maintenance_rejected';
          templateParams = [clientName, updateResult.id.toString(), notes || 'لم يتم تقديم سبب'];
          break;
        default:
          templateName = 'general_update';
          templateParams = [clientName, 'طلب الصيانة', status];
      }

    } else if (type === 'complaint') {
      updateResult = await prisma.complaint.update({
        where: { id: parseInt(id) },
        data: { 
          status: status,
          responseText: notes,
          responseDate: new Date(),
          updatedAt: new Date()
        },
        include: {
          client: true,
          property: true,
          unit: true
        }
      });

      clientPhone = updateResult.client.phone;
      clientName = updateResult.client.name;

      // Choose template based on status
      switch (status) {
        case 'REVIEWING':
          templateName = 'complaint_reviewing';
          templateParams = [clientName, updateResult.id.toString()];
          break;
        case 'RESOLVED':
          templateName = 'complaint_resolved';
          templateParams = [clientName, updateResult.id.toString()];
          break;
        case 'REJECTED':
          templateName = 'complaint_rejected';
          templateParams = [clientName, updateResult.id.toString(), notes || 'لم يتم تقديم سبب'];
          break;
        default:
          templateName = 'general_update';
          templateParams = [clientName, 'الشكوى', status];
      }
    } else {
      return NextResponse.json(
        { error: 'نوع غير صالح' },
        { status: 400 }
      );
    }

    // Send WhatsApp notification if requested
    let notificationResult = null;
    if (notifyClient && clientPhone && templateName) {
      notificationResult = await sendWhatsAppNotification(
        clientPhone,
        templateName,
        templateParams
      );

      // Log the message
      if (notificationResult.success) {
        await prisma.whatsappMessageLog.create({
          data: {
            messageId: notificationResult.data.messages?.[0]?.id || 'unknown',
            recipient: clientPhone,
            messageType: 'template',
            templateName: templateName,
            content: `تحديث حالة ${type === 'maintenance' ? 'طلب الصيانة' : 'الشكوى'}: ${status}`,
            status: 'sent',
            sentAt: new Date(),
            templateParams: JSON.stringify(templateParams)
          }
        });
      }
    }

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'STATUS_UPDATE',
        target: `${type.toUpperCase()}_${id}`,
        details: `تحديث حالة ${type === 'maintenance' ? 'طلب الصيانة' : 'الشكوى'} #${id} إلى ${status}`,
        metadata: JSON.stringify({
          oldStatus: updateResult.status,
          newStatus: status,
          notes: notes,
          notificationSent: notificationResult?.success || false
        })
      }
    }).catch(error => {
      console.error('Failed to log activity:', error);
      // Don't fail the request if logging fails
    });

    return NextResponse.json({
      success: true,
      message: 'تم تحديث الحالة بنجاح',
      data: updateResult,
      notification: notificationResult ? {
        sent: notificationResult.success,
        details: notificationResult.data || notificationResult.error
      } : null
    });

  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم الداخلي' },
      { status: 500 }
    );
  }
}
