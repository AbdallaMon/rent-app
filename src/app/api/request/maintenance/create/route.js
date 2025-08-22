// Enhanced API endpoint for creating maintenance requests
// Now supports auto-linking with property and unit information

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const data = await request.json();
    
    // سجل بيانات الطلب المستلمة
    console.log("🔧 بيانات طلب الصيانة المستلمة:", data);
    
    // Validate required fields
    if (!data.clientId || !data.description) {
      console.log("❌ خطأ: معرف العميل أو الوصف مفقود");
      return NextResponse.json(
        { error: "Client ID and description are required" },
        { status: 400 }
      );
    }

    // Enhanced data preparation with auto property/unit detection
    const now = new Date();
    const requestData = {
      clientId: parseInt(data.clientId),
      description: data.description,
      status: data.status || "PENDING",
      priority: data.priority || "MEDIUM",
      type: data.type || "OTHER",
      lastRequestTime: data.lastRequestTime || now,
      updatedAt: now,
      isExpired: false,
      technicianNotified: false
    };

    console.log("📋 بيانات الطلب المجهزة للحفظ:", requestData);

    // Auto-detect property and unit if not provided
    if (!data.propertyId || !data.unitId) {
      console.log("🔍 البحث عن معلومات العقار والوحدة للعميل...");
      
      try {
        // البحث عن عقود الإيجار النشطة أولاً
        const activeAgreement = await prisma.rentAgreement.findFirst({
          where: {
            renterId: parseInt(data.clientId),
            isActive: true
          },
          include: {
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
          }
        });

        if (activeAgreement) {
          requestData.propertyId = activeAgreement.propertyId;
          requestData.unitId = activeAgreement.unitId;
          console.log(`✅ تم العثور على عقد إيجار نشط - العقار: ${activeAgreement.property.name}, الوحدة: ${activeAgreement.unit.number}`);
        } else {
          // البحث عن الوحدات المرتبطة بالعميل مباشرة
          const clientUnit = await prisma.unit.findFirst({
            where: { clientId: parseInt(data.clientId) },
            include: {
              property: {
                select: {
                  id: true,
                  name: true,
                  propertyId: true
                }
              }
            }
          });

          if (clientUnit) {
            requestData.propertyId = clientUnit.propertyId;
            requestData.unitId = clientUnit.id;
            console.log(`✅ تم العثور على وحدة مرتبطة - العقار: ${clientUnit.property.name}, الوحدة: ${clientUnit.number}`);
          } else {
            // البحث عن العقارات المملوكة للعميل
            const clientProperty = await prisma.property.findFirst({
              where: { clientId: parseInt(data.clientId) }
            });

            if (clientProperty) {
              requestData.propertyId = clientProperty.id;
              console.log(`✅ تم العثور على عقار مملوك - العقار: ${clientProperty.name}`);
            }
          }
        }
      } catch (searchError) {
        console.log("⚠️ تحذير: لم يتم العثور على معلومات العقار/الوحدة:", searchError.message);
      }
    } else {
      // استخدام المعلومات المرسلة
      if (data.propertyId) {
        requestData.propertyId = parseInt(data.propertyId);
      }
      if (data.unitId) {
        requestData.unitId = parseInt(data.unitId);
      }
    }

    console.log("🔧 جاري إنشاء طلب الصيانة في قاعدة البيانات...");
    
    // Create the maintenance request
    let newRequest;
    try {
      // تحقق أولاً مما إذا كان العميل موجوداً
      const clientExists = await prisma.client.findUnique({
        where: { id: requestData.clientId }
      });
      
      if (!clientExists) {
        console.error(`❌ العميل برقم المعرف ${requestData.clientId} غير موجود`);
        return NextResponse.json(
          { 
            error: "Client not found",
            details: `Client with ID ${requestData.clientId} does not exist`,
          },
          { status: 400 }
        );
      }
      
      // تحقق من صحة بيانات الطلب
      console.log("📋 بيانات الطلب قبل الإنشاء:", JSON.stringify(requestData, null, 2));
      
      // تحقق من العلاقات الأخرى
      if (requestData.propertyId) {
        const propertyExists = await prisma.property.findUnique({
          where: { id: requestData.propertyId }
        });
        if (!propertyExists) {
          console.error(`❌ العقار برقم المعرف ${requestData.propertyId} غير موجود`);
          return NextResponse.json(
            { 
              error: "Property not found",
              details: `Property with ID ${requestData.propertyId} does not exist`,
            },
            { status: 400 }
          );
        }
      }
      
      if (requestData.unitId) {
        const unitExists = await prisma.unit.findUnique({
          where: { id: requestData.unitId }
        });
        if (!unitExists) {
          console.error(`❌ الوحدة برقم المعرف ${requestData.unitId} غير موجودة`);
          return NextResponse.json(
            { 
              error: "Unit not found",
              details: `Unit with ID ${requestData.unitId} does not exist`,
            },
            { status: 400 }
          );
        }
      }
      
      // محاولة إنشاء الطلب
      newRequest = await prisma.maintenanceRequest.create({
        data: requestData,
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
        }
      });
      
      console.log("✅ تم إنشاء طلب الصيانة بنجاح:", newRequest.id);
      
      // تحديث آخر إجراء للعميل
      await prisma.client.update({
        where: { id: requestData.clientId },
        data: { 
          lastAction: 'MAINTENANCE_REQUEST'
        }
      });
      
    } catch (createError) {
      console.error("❌ خطأ محدد في إنشاء طلب الصيانة:", createError);
      return NextResponse.json(
        { 
          error: "Failed to create maintenance request",
          details: createError.message,
          code: createError.code,
          stack: createError.stack
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: newRequest,
      message: "تم إنشاء طلب الصيانة بنجاح مع ربطه بالعقار والوحدة"
    });
    
  } catch (error) {
    console.error("❌ Error creating maintenance request:", error);
    return NextResponse.json(
      { error: "Failed to create maintenance request" },
      { status: 500 }
    );
  }
}
