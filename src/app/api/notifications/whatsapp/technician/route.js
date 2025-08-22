import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();
    const { maintenanceId} = body;
    const  technicianPhone  = process.env.TECHNICIAN_PHONE;
    if (!maintenanceId || !technicianPhone) {
      return NextResponse.json(
        { error: "Missing maintenanceId or technicianPhone" },
        { status: 400 }
      );
    }
    
    // Get maintenance request details
    const maintenance = await prisma.maintenance.findUnique({
      where: { id: maintenanceId },
      include: {
        property: true,
        unit: true,
        client: true,
      },
    });
    
    if (!maintenance) {
      return NextResponse.json(
        { error: "Maintenance request not found" },
        { status: 404 }
      );
    }
    
    // Format date in a more readable format for Arabic users
    const createdAtDate = new Date(maintenance.date || maintenance.createdAt);
    const formattedDate = createdAtDate.toLocaleString('en', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Prepare template variables as an array (not an object)
    // The order must match the template's {{1}}, {{2}}, etc.
    const templateVariables = [
      maintenance.property?.name || "غير محدد",           // {{1}} - Property name
      maintenance.unit?.number || "غير محدد",             // {{2}} - Unit number
      maintenance.description,                            // {{3}} - Problem description
      maintenance.client?.phone || "غير متوفر",           // {{4}} - Client phone
      formattedDate                                       // {{5}} - Date
    ];
    
    // Send message to technician using a template
    const whatsappResponse = await sendWhatsAppMessage(
      technicianPhone,
      templateVariables,
      true,  // Use template
      "maintenance_request"  // Template name
    );
    
    return NextResponse.json(
      { success: true, whatsappResponse },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error notifying technician:", error);
    return NextResponse.json(
      { error: "Failed to notify technician", details: error.message },
      { status: 500 }
    );
  }
}

// Handle technician responses (simplified since no confirmation is needed)
async function handleTechnicianResponse(message, senderNumber) {
  try {
    // Find technician in the system (you'll need to add a technician model/table)
    const technician = await prisma.technician.findUnique({
      where: { phone: senderNumber }
    });
    
    if (!technician) {
      return { success: false, error: "Unauthorized technician" };
    }
    
    // No need for confirmation, just acknowledge the response
    return {
      success: true,
      message: "تم استلام ردك. شكراً."
    };
  } catch (error) {
    console.error("Error handling technician response:", error);
    return { success: false, error: "Failed to process response" };
  }
}
