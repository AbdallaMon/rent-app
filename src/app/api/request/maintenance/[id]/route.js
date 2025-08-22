// /app/api/request/maintenance/[id]/route.js
import prisma from "@/lib/prisma";
import { sendMaintenanceStatusNotification } from "@/services/server/notifications/status";


export async function PATCH(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return Response.json({
        status: "error",
        message: "Maintenance request ID is required",
      }, { status: 400 });
    }

    // Parse the request body
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'].includes(status)) {
      return Response.json({
        status: "error",
        message: "Invalid status value",
      }, { status: 400 });
    }

    // Check if the maintenance request exists
    const existingRequest = await prisma.maintenanceRequest.findUnique({
      where: { id: id },
      include: {
        client: true, // Include client details to get the phone number
      },
    });

    if (!existingRequest) {
      return Response.json({
        status: "error",
        message: "Maintenance request not found",
      }, { status: 404 });
    }

    // Update the maintenance request status
    const updatedRequest = await prisma.maintenanceRequest.update({
      where: { id: id },
      data: { 
        status: status
        // updatedAt will be automatically updated by Prisma
      },
      include: {
        client: true,
        property: true,
        unit: true
      }
    });

    // Notify the user via WhatsApp if the status has changed
    if (existingRequest.status !== status && existingRequest.client?.phone) {
      try {
        // Send notifications with proper error handling
        const notificationResults = await sendMaintenanceStatusNotification({
          requestId: id,
          newStatus: status,
          phoneNumber: existingRequest.client.phone,
          email: existingRequest.client.email,
          name: existingRequest.client.name
        });

        console.log("Notification results:", notificationResults);
      } catch (notificationError) {
        // Log the error but don't fail the request
        console.error("Error sending notification:", notificationError);
      }
    }

    return Response.json(updatedRequest);
  } catch (error) {
    console.error("Error updating maintenance request:", error);
    return Response.json({
      status: "error",
      message: "An error occurred while updating the maintenance request",
    }, { status: 500 });
  }
}

// GET to fetch a single maintenance request by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return Response.json({
        status: "error",
        message: "Maintenance request ID is required",
      }, { status: 400 });
    }

    const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
      where: { id: id },
      include: {
        client: true,
        property: true,
        unit: true
      }
    });

    if (!maintenanceRequest) {
      return Response.json({
        status: "error",
        message: "Maintenance request not found",
      }, { status: 404 });
    }

    return Response.json(maintenanceRequest);
  } catch (error) {
    console.error("Error fetching maintenance request:", error);
    return Response.json({
      status: "error",
      message: "An error occurred while fetching the maintenance request",
    }, { status: 500 });
  }
}

// DELETE to remove a maintenance request
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return Response.json({
        status: "error",
        message: "Maintenance request ID is required",
      }, { status: 400 });
    }

    // Check if the maintenance request exists
    const existingRequest = await prisma.maintenanceRequest.findUnique({
      where: { id: id },
    });

    if (!existingRequest) {
      return Response.json({
        status: "error",
        message: "Maintenance request not found",
      }, { status: 404 });
    }

    // Delete the maintenance request
    await prisma.maintenanceRequest.delete({
      where: { id: id },
    });

    return Response.json({ 
      status: "success",
      message: "Maintenance request deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting maintenance request:", error);
    return Response.json({
      status: "error",
      message: "An error occurred while deleting the maintenance request",
    }, { status: 500 });
  }
}