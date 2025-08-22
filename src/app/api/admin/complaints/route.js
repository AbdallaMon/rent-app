import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// API لجلب الشكاوى
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
    const category = url.searchParams.get('category');
    
    // إنشاء معلمات الاستعلام
    const where = {};
    if (status) {
      where.status = status;
    }
    if (category) {
      where.category = category;
    }    // جلب الشكاوى مباشرة
    const complaints = await prisma.$queryRaw`
      SELECT 
        id, clientId, description, status, priority, type, assignedTo,
        resolution, resolvedAt, propertyId, unitId, displayId,
        createdAt, updatedAt, submittedAt
      FROM Complaint 
      ORDER BY createdAt DESC 
      LIMIT ${limit}
    `;
    
    return NextResponse.json({
      success: true,
      complaints: complaints,
      total: complaints.length
    });
    
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في جلب الشكاوى' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// تحديث شكوى
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, responseText, responseDate } = body;
    
    const updatedComplaint = await prisma.complaint.update({
      where: { id: parseInt(id) },
      data: {
        status,
        responseText,
        responseDate,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      data: updatedComplaint
    });
    
  } catch (error) {
    console.error('Error updating complaint:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في تحديث الشكوى' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
