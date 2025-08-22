import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    console.log('📋 جلب طلبات الصيانة...');

    // جلب طلبات الصيانة مع ترتيب حسب التاريخ (الأحدث أولاً)
    const requests = await prisma.maintenanceRequest.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 20, // أول 20 طلب
      select: {
        id: true,
        clientId: true,
        propertyId: true,
        unitId: true,
        description: true,
        status: true,
        priority: true,
        type: true,
        createdAt: true,
        requestDate: true,
        assignedTo: true,
        completedAt: true,
        notes: true,
        displayId: true
      }
    });

    console.log(`✅ تم جلب ${requests.length} طلب صيانة`);

    // إحصائيات سريعة
    const stats = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'PENDING').length,
      inProgress: requests.filter(r => r.status === 'IN_PROGRESS').length,
      completed: requests.filter(r => r.status === 'COMPLETED').length,
      rejected: requests.filter(r => r.status === 'REJECTED').length,
      byPriority: {
        urgent: requests.filter(r => r.priority === 'URGENT').length,
        high: requests.filter(r => r.priority === 'HIGH').length,
        medium: requests.filter(r => r.priority === 'MEDIUM').length,
        low: requests.filter(r => r.priority === 'LOW').length
      },
      byType: {}
    };

    // إحصائيات حسب النوع
    const types = ['ELECTRICAL', 'PLUMBING', 'AC_HEATING', 'APPLIANCES', 'STRUCTURAL', 'CLEANING', 'PAINTING', 'CARPENTRY', 'PEST_CONTROL', 'OTHER'];
    types.forEach(type => {
      stats.byType[type.toLowerCase()] = requests.filter(r => r.type === type).length;
    });

    return NextResponse.json({
      success: true,
      requests: requests,
      stats: stats,
      message: `تم جلب ${requests.length} طلب صيانة بنجاح`
    });

  } catch (error) {
    console.error('❌ خطأ في جلب طلبات الصيانة:', error);
    return NextResponse.json({
      success: false,
      error: 'فشل في جلب طلبات الصيانة',
      details: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('📝 إنشاء طلب صيانة جديد:', body);

    const {
      clientId,
      propertyId,
      unitId,
      description,
      priority = 'MEDIUM',
      type = 'OTHER',
      assignedTo
    } = body;

    // التحقق من البيانات المطلوبة
    if (!clientId || !description) {
      return NextResponse.json({
        success: false,
        error: 'بيانات مطلوبة مفقودة: clientId و description مطلوبان'
      }, { status: 400 });
    }

    // إنشاء طلب الصيانة
    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: {
        clientId: parseInt(clientId),
        propertyId: propertyId ? parseInt(propertyId) : null,
        unitId: unitId ? parseInt(unitId) : null,
        description: description.trim(),
        status: 'PENDING',
        priority: priority,
        type: type,
        assignedTo: assignedTo || null,
        requestDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ تم إنشاء طلب الصيانة:', maintenanceRequest.id);

    return NextResponse.json({
      success: true,
      request: maintenanceRequest,
      message: 'تم إنشاء طلب الصيانة بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في إنشاء طلب الصيانة:', error);
    return NextResponse.json({
      success: false,
      error: 'فشل في إنشاء طلب الصيانة',
      details: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
