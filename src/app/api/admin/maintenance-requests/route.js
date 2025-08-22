import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// API لجلب طلبات الصيانة
export async function GET(request) {
  try {
    // التحقق من المصادقة في بيئة الإنتاج
    // الآن نتجاوزها للتطوير
    /*
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول' },
        { status: 401 }
      );
    }
    */
    
    // استخراج معلمات البحث والتصفية
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    
    // إنشاء معلمات الاستعلام
    const where = {};
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }
    
    // جلب طلبات الصيانة
    const maintenanceRequests = await prisma.maintenanceRequest.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        property: {
          select: {
            id: true,
            name: true
          }
        },
        unit: {
          select: {
            id: true,
            unitNumber: true
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: maintenanceRequests
    });
    
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في جلب طلبات الصيانة' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// تحديث طلب صيانة
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, priority, technicianNotified } = body;
    
    const updatedRequest = await prisma.maintenanceRequest.update({
      where: { id: parseInt(id) },
      data: {
        status,
        priority,
        technicianNotified,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      data: updatedRequest
    });
    
  } catch (error) {
    console.error('Error updating maintenance request:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في تحديث طلب الصيانة' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
