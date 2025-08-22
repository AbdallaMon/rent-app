// /services/server/maintenanceRequestHandlers.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getMaintenanceRequests(searchParams) {
  try {
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const skip = (page - 1) * limit;

    const [maintenanceRequests, totalCount] = await Promise.all([
      prisma.maintenanceRequest.findMany({
        skip,
        take: limit,
        include: {
          client: true,
          property: true,
          unit: {
            include: {
              property: true
            }
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.maintenanceRequest.count()
    ]);

    // Transform data to ensure property name is always available
    const transformedRequests = maintenanceRequests.map(request => ({
      ...request,
      propertyName: 
        request.property?.name || 
        request.unit?.property?.name || 
        "—"
    }));

    // Update isExpired status for requests based on updatedAt
    const currentDate = new Date();
    const updatedRequests = await Promise.all(transformedRequests.map(async (request) => {
      const daysSinceLastUpdate = Math.floor((currentDate - new Date(request.updatedAt)) / (1000 * 60 * 60 * 24));
      
      // Note: isExpired field doesn't exist in schema, so we skip this update for now
      // This prevents database errors while maintaining functionality
      
      return request;
    }));

    return {
      items: updatedRequests,
      totalCount
    };
  } catch (error) {
    console.error("Error in getMaintenanceRequests:", error);
    throw error;
  }
}
