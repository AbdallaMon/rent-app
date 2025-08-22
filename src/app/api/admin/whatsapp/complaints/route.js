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
    
    if (!user || !user.privileges.some(p => p.privilege.canRead)) {
      return null;
    }
    
    return user;
  } catch (error) {
    return null;
  }
}

// Get complaints from database
export async function GET(request) {
  try {
    // التحقق من المصادقة (مُعطل مؤقتاً للاختبار)
    // const user = await verifyAuth();
    // if (!user) {
    //   return NextResponse.json(
    //     { error: 'غير مصرح بالوصول' },
    //     { status: 401 }
    //   );
    // }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const category = url.searchParams.get('category');
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const offset = parseInt(url.searchParams.get('offset')) || 0;

    // Base query for complaints
    let whereClause = {};

    // Add status filter if provided
    if (status) {
      whereClause.status = status;
    }

    // Add category filter if provided
    if (category) {
      whereClause.category = category.toUpperCase();
    }

    const complaints = await prisma.complaint.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        property: {
          select: {
            id: true,
            name: true,
            propertyId: true
          }
        },
        unit: {
          select: {
            id: true,
            number: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Get total count for pagination
    const totalCount = await prisma.complaint.count({
      where: whereClause
    });

    // Process and format the complaints
    const formattedComplaints = complaints.map(complaint => {
      return {
        id: complaint.id,
        clientId: complaint.clientId,
        propertyId: complaint.propertyId,
        unitId: complaint.unitId,
        title: complaint.title,
        description: complaint.description,
        category: complaint.category,
        status: complaint.status,
        attachments: complaint.attachments,
        responseText: complaint.responseText,
        responseDate: complaint.responseDate,
        createdAt: complaint.createdAt,
        updatedAt: complaint.updatedAt,
        client: complaint.client,
        property: complaint.property,
        unit: complaint.unit
      };
    });

    return NextResponse.json({
      complaints: formattedComplaints,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      summary: {
        total: totalCount,
        pending: formattedComplaints.filter(c => c.status === 'PENDING').length,
        inProgress: formattedComplaints.filter(c => c.status === 'IN_PROGRESS').length,
        resolved: formattedComplaints.filter(c => c.status === 'RESOLVED').length,
        closed: formattedComplaints.filter(c => c.status === 'CLOSED').length
      }
    });

  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json(
      { error: 'خطأ في تحميل الشكاوى' },
      { status: 500 }
    );
  }
}

// Update complaint status
export async function PUT(request) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول' },
        { status: 401 }
      );
    }

    if (!user.privileges.some(p => p.privilege.canWrite)) {
      return NextResponse.json(
        { error: 'غير مصرح بالتعديل' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, status, responseText } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'معرف الشكوى مطلوب' },
        { status: 400 }
      );
    }

    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (responseText) {
      updateData.responseText = responseText;
      updateData.responseDate = new Date();
    }

    const updatedComplaint = await prisma.complaint.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        property: {
          select: {
            id: true,
            name: true,
            propertyId: true
          }
        },
        unit: {
          select: {
            id: true,
            number: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      complaint: updatedComplaint,
      message: 'تم تحديث الشكوى بنجاح'
    });

  } catch (error) {
    console.error('Error updating complaint:', error);
    return NextResponse.json(
      { error: 'خطأ في تحديث الشكوى' },
      { status: 500 }
    );
  }
}

// Create new complaint
export async function POST(request) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول' },
        { status: 401 }
      );
    }

    if (!user.privileges.some(p => p.privilege.canWrite)) {
      return NextResponse.json(
        { error: 'غير مصرح بالإنشاء' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      clientId, 
      title, 
      description, 
      category, 
      propertyId, 
      unitId,
      attachments 
    } = body;

    if (!clientId || !title || !description || !category) {
      return NextResponse.json(
        { error: 'جميع الحقول المطلوبة يجب ملؤها' },
        { status: 400 }
      );
    }

    const newComplaint = await prisma.complaint.create({
      data: {
        clientId: parseInt(clientId),
        title,
        description,
        category: category.toUpperCase(),
        propertyId: propertyId ? parseInt(propertyId) : null,
        unitId: unitId ? parseInt(unitId) : null,
        attachments: attachments || null,
        status: 'PENDING'
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        property: {
          select: {
            id: true,
            name: true,
            propertyId: true
          }
        },
        unit: {
          select: {
            id: true,
            number: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      complaint: newComplaint,
      message: 'تم إنشاء الشكوى بنجاح'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating complaint:', error);
    return NextResponse.json(
      { error: 'خطأ في إنشاء الشكوى' },
      { status: 500 }
    );
  }
}
