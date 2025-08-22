import prisma from "@/lib/prisma";


export async function getRecentMaintenances(page = 1, limit = 3, searchParams) {
  const propertyId = searchParams.get("propertyId");
  
  // Build filter based on propertyId if provided
  const filter = propertyId ? { propertyId: parseInt(propertyId) } : {};
  
  const recentMaintenances = await prisma.maintenance.findMany({
    where: {
      ...filter,
    },
    include: {
      property: {
        select: {
          name: true
        }
      },
      unit: {
        select: {
          number: true
        }
      }
    },
    orderBy: {
      date: 'desc'
    },
    take: limit
  });
  return recentMaintenances;
}
