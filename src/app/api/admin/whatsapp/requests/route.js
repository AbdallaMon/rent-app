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

// Get maintenance requests from WhatsApp
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
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const offset = parseInt(url.searchParams.get('offset')) || 0;    // Base query for maintenance requests
    let whereClause = {};

    // Add status filter if provided
    if (status) {
      whereClause.status = status;
    }

    const requests = await prisma.maintenanceRequest.findMany({
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
      skip: offset    });

    // Get total count for pagination
    const totalCount = await prisma.maintenanceRequest.count({
      where: whereClause
    });

    // Process and format the requests
    const formattedRequests = requests.map(request => {
      return {
        id: request.id,
        clientId: request.clientId,
        propertyId: request.propertyId,
        unitId: request.unitId,
        description: request.description,
        status: request.status,
        priority: request.priority,
        isExpired: request.isExpired,
        technicianNotified: request.technicianNotified,
        lastRequestTime: request.lastRequestTime,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        client: request.client,
        property: request.property,
        unit: request.unit
      };
    });

    return NextResponse.json({
      requests: formattedRequests,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      summary: {
        total: totalCount,
        pending: formattedRequests.filter(r => r.status === 'PENDING').length,
        inProgress: formattedRequests.filter(r => r.status === 'IN_PROGRESS').length,
        completed: formattedRequests.filter(r => r.status === 'COMPLETED').length,
        urgent: formattedRequests.filter(r => r.priority === 'HIGH').length
      }
    });

  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    return NextResponse.json(
      { error: 'خطأ في تحميل طلبات الصيانة' },
      { status: 500 }
    );
  }
}

// Update maintenance request status
export async function PUT(request) {
  try {
    const user = await verifyAuth();
    if (!user || !user.privileges.some(p => p.privilege.canWrite)) {
      return NextResponse.json(
        { error: 'غير مصرح بالتعديل' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { requestId, status, priority, assignedTo, notes } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: 'معرف الطلب مطلوب' },
        { status: 400 }
      );
    }    // Update the request in the database
    const updatedRequest = await prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        status,
        priority,
        updatedAt: new Date()
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

    // TODO: Send notification to client about status update
    // This can be implemented later with the existing WhatsApp notification system

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      message: 'تم تحديث حالة الطلب بنجاح'
    });

  } catch (error) {
    console.error('Error updating maintenance request:', error);
    return NextResponse.json(
      { error: 'خطأ في تحديث الطلب' },
      { status: 500 }
    );
  }
}

// Helper functions
function determineRequestStatus(request) {
  if (request.metadata && request.metadata.status) {
    return request.metadata.status;
  }
  return 'pending'; // Default status
}

function determinePriority(request) {
  const content = request.content?.toLowerCase() || '';
  const metadata = request.metadata || {};
  
  // Check for urgent keywords
  const urgentKeywords = ['عاجل', 'urgent', 'emergency', 'طارئ'];
  if (urgentKeywords.some(keyword => content.includes(keyword))) {
    return 'high';
  }
  
  if (metadata.priority) {
    return metadata.priority;
  }
  
  return 'medium'; // Default priority
}

function determineCategory(request) {
  const content = request.content?.toLowerCase() || '';
  
  // Categorize based on content
  if (content.includes('كهرباء') || content.includes('electric')) return 'electrical';
  if (content.includes('سباكة') || content.includes('plumbing')) return 'plumbing';
  if (content.includes('تكييف') || content.includes('ac')) return 'hvac';
  if (content.includes('نظافة') || content.includes('cleaning')) return 'cleaning';
  
  return 'general';
}

function isUrgentRequest(request) {
  const priority = determinePriority(request);
  return priority === 'high';
}
