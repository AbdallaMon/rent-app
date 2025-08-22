import prisma from "@/lib/prisma";

export async function getExpiredContracts(page = 1, limit = 3, searchParams) {
  const propertyId = searchParams.get("propertyId");
  
  // Build filter based on propertyId if provided
  const filter = {
    status: 'EXPIRED'
  };
  
  if (propertyId) {
    filter.unit = {
      propertyId: parseInt(propertyId)
    };
  }
  
  const currentDate = new Date();
  
  const expiredContracts = await prisma.rentAgreement.findMany({
    where: {
      ...filter,
      endDate: {
        lt: currentDate
      }
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
      endDate: 'desc'
    },
    take: limit
  });
  return expiredContracts;
}
