import prisma from "@/lib/prisma";


export async function getRecentRentAgreements(page = 1, limit = 3, searchParams) {
  const propertyId = searchParams.get("propertyId");
  
  // Build filter based on propertyId if provided
  const filter = {};
  
  if (propertyId) {
    filter.unit = {
      propertyId: parseInt(propertyId)
    };
  }
  
  const recentRentAgreements = await prisma.rentAgreement.findMany({
    where: {
      ...filter
    },
    include: {
      renter: {
        select: {
          name: true,
          phone: true
        }
      },
      unit: {
        select: {
          number: true,
          property: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit
  });
  return recentRentAgreements;
}
