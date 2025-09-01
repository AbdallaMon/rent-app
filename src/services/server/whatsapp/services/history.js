import { withReadOnlyConnection } from "@/lib/database-connection";
import { findClientWithPropertyProduction } from "./clients";

export async function getClientRequestHistory(phoneNumber, limit = 10) {
  return withReadOnlyConnection(async (prisma) => {
    const clientData = await findClientWithPropertyProduction(phoneNumber);
    if (!clientData?.success || !clientData?.client) {
      return { success: false, message: "CLIENT_NOT_FOUND", data: null };
    }

    const client = clientData.client;

    const maintenanceRequests = await prisma.maintenanceRequest.findMany({
      where: { clientId: client.id },
      select: {
        id: true,
        displayId: true,
        status: true,
        priority: true,
        type: true,
        requestDate: true,
        completedAt: true,
        property: { select: { name: true } },
        unit: { select: { number: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const complaints = await prisma.complaint.findMany({
      where: { clientId: client.id },
      select: {
        id: true,
        displayId: true,
        status: true,
        priority: true,
        type: true,
        submittedAt: true,
        resolvedAt: true,
        property: { select: { name: true } },
        unit: { select: { number: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return {
      success: true,
      data: {
        client,
        maintenanceRequests,
        complaints,
        totalMaintenanceRequests: maintenanceRequests.length,
        totalComplaints: complaints.length,
        totalRequests: maintenanceRequests.length + complaints.length,
      },
    };
  });
}
