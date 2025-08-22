import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    
    const where = {};
    if (status && status !== 'ALL') where.status = status;
    if (priority && priority !== 'ALL') where.priority = priority;
    
    const [items, totalCount] = await Promise.all([
      prisma.complaint.findMany({
        where,
        include: {
          client: true,
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
              number: true,
              property: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.complaint.count({ where }),
    ]);
    
    return NextResponse.json({
      success: true,
      items,
      totalCount,
    });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch complaints' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { clientId, propertyId, unitId, description, priority, title, category } = await request.json();
    
    if (!clientId || !description) {
      return NextResponse.json(
        { success: false, error: 'Client ID and description are required' },
        { status: 400 }
      );
    }
    
    console.log("📝 إنشاء شكوى جديدة للعميل:", clientId);
    
    // Enhanced data preparation with auto property/unit detection
    const complaintData = {
      clientId: parseInt(clientId),
      title: title || (description.length > 50 ? description.substring(0, 50) + "..." : description),
      description,
      category: category || 'OTHER',
      status: 'PENDING',
    };

    // Auto-detect property and unit if not provided
    if (!propertyId || !unitId) {
      console.log("🔍 البحث عن معلومات العقار والوحدة للعميل...");
      
      try {
        // البحث عن عقود الإيجار النشطة أولاً
        const activeAgreement = await prisma.rentAgreement.findFirst({
          where: {
            renterId: parseInt(clientId),
            isActive: true
          },
          include: {
            property: { select: { id: true, name: true } },
            unit: { select: { id: true, number: true } }
          }
        });

        if (activeAgreement) {
          complaintData.propertyId = activeAgreement.propertyId;
          complaintData.unitId = activeAgreement.unitId;
          console.log(`✅ تم العثور على عقد إيجار نشط - العقار: ${activeAgreement.property.name}, الوحدة: ${activeAgreement.unit.number}`);
        } else {
          // البحث عن الوحدات المرتبطة بالعميل مباشرة
          const clientUnit = await prisma.unit.findFirst({
            where: { clientId: parseInt(clientId) },
            include: {
              property: { select: { id: true, name: true } }
            }
          });

          if (clientUnit) {
            complaintData.propertyId = clientUnit.propertyId;
            complaintData.unitId = clientUnit.id;
            console.log(`✅ تم العثور على وحدة مرتبطة - العقار: ${clientUnit.property.name}, الوحدة: ${clientUnit.number}`);
          } else {
            // البحث عن العقارات المملوكة للعميل
            const clientProperty = await prisma.property.findFirst({
              where: { clientId: parseInt(clientId) }
            });

            if (clientProperty) {
              complaintData.propertyId = clientProperty.id;
              console.log(`✅ تم العثور على عقار مملوك - العقار: ${clientProperty.name}`);
            }
          }
        }
      } catch (searchError) {
        console.log("⚠️ تحذير: لم يتم العثور على معلومات العقار/الوحدة:", searchError.message);
      }
    } else {
      // استخدام المعلومات المرسلة
      if (propertyId) complaintData.propertyId = parseInt(propertyId);
      if (unitId) complaintData.unitId = parseInt(unitId);
    }
    
    const complaint = await prisma.complaint.create({
      data: complaintData,
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
            name: true,
            propertyId: true
          }
        },
        unit: {
          select: {
            id: true,
            number: true,
            unitId: true
          }
        }
      },
    });
    
    console.log("✅ تم إنشاء الشكوى بنجاح:", complaint.id);
    
    // تحديث آخر إجراء للعميل
    await prisma.client.update({
      where: { id: parseInt(clientId) },
      data: { 
        lastAction: 'COMPLAINT_SUBMISSION'
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      data: complaint,
      message: "تم إنشاء الشكوى بنجاح مع ربطها بالعقار والوحدة"
    }, { status: 201 });
    
  } catch (error) {
    console.error('❌ Error creating complaint:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create complaint' },
      { status: 500 }
    );
  }
}
