import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - إرسال رسالة واتساب مخصصة
export async function POST(request) {
  try {
    const { phone, message, type } = await request.json();
    
    console.log('📤 إرسال رسالة واتساب:', { phone, type, messagePreview: message.substring(0, 50) });

    // تنظيف رقم الهاتف
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    
    // التحقق من صحة البيانات
    if (!cleanPhone || !message) {
      return NextResponse.json(
        { error: 'رقم الهاتف والرسالة مطلوبان' },
        { status: 400 }
      );
    }

    // إعداد API الواتساب
    const WHATSAPP_API_URL = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      console.log('⚠️ متغيرات الواتساب غير مكتملة، سيتم المحاكاة');
      
      // محاكاة الإرسال
      const messageLog = await prisma.whatsappMessageLog.create({
        data: {
          messageId: `sim_${Date.now()}`,
          recipientPhone: cleanPhone,
          messageContent: message,
          messageType: type || 'text',
          status: 'sent',
          timestamp: new Date(),
          clientId: null // يمكن ربطه بالعميل لاحقاً
        }
      });

      return NextResponse.json({
        success: true,
        messageId: messageLog.messageId,
        status: 'sent',
        message: 'تم إرسال الرسالة بنجاح (محاكاة)'
      });
    }

    // إرسال الرسالة الفعلية
    const whatsappPayload = {
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "text",
      text: {
        body: message
      }
    };

    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(whatsappPayload)
    });

    const result = await response.json();

    if (response.ok && result.messages) {
      // تسجيل الرسالة في قاعدة البيانات
      const messageLog = await prisma.whatsappMessageLog.create({
        data: {
          messageId: result.messages[0].id,
          recipientPhone: cleanPhone,
          messageContent: message,
          messageType: type || 'text',
          status: 'sent',
          timestamp: new Date(),
          clientId: null
        }
      });

      console.log('✅ تم إرسال الرسالة بنجاح:', result.messages[0].id);

      return NextResponse.json({
        success: true,
        messageId: result.messages[0].id,
        status: 'sent',
        message: 'تم إرسال الرسالة بنجاح'
      });
    } else {
      console.error('❌ فشل إرسال الرسالة:', result);
      
      // تسجيل الفشل
      await prisma.whatsappMessageLog.create({
        data: {
          messageId: `failed_${Date.now()}`,
          recipientPhone: cleanPhone,
          messageContent: message,
          messageType: type || 'text',
          status: 'failed',
          timestamp: new Date(),
          errorMessage: result.error?.message || 'فشل غير معروف',
          clientId: null
        }
      });

      return NextResponse.json(
        { 
          error: 'فشل في إرسال الرسالة',
          details: result.error?.message || 'خطأ غير معروف'
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ خطأ في API إرسال الرسائل:', error);
    
    return NextResponse.json(
      { 
        error: 'خطأ داخلي في الخادم',
        details: error.message
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET - جلب سجل الرسائل المرسلة
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 50;
    const page = parseInt(searchParams.get('page')) || 1;
    const skip = (page - 1) * limit;

    const messages = await prisma.whatsappMessageLog.findMany({
      skip,
      take: limit,
      orderBy: {
        timestamp: 'desc'
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    });

    const total = await prisma.whatsappMessageLog.count();

    return NextResponse.json({
      success: true,
      data: {
        messages,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب الرسائل:', error);
    
    return NextResponse.json(
      { error: 'فشل في جلب الرسائل' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
