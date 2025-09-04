import prisma from "@/lib/prisma";

export async function getSecurityDeposits(page, limit, searchParams) {
  const filters = searchParams.get("filters")
    ? JSON.parse(searchParams.get("filters"))
    : {};
  let { startDate, endDate, dateField, renterId, rentId, unitId, refunded } =
    filters;
  const where = {};
  const offset = (page - 1) * limit;
  if (dateField) {
    if (startDate && endDate) {
      where[dateField] = { gte: new Date(startDate), lte: new Date(endDate) };
    } else if (startDate) {
      where[dateField] = { gte: new Date(startDate) };
    } else if (endDate) {
      where[dateField] = { lte: new Date(endDate) };
    }
  }
  if (renterId && renterId !== "undefined" && renterId !== "all") {
    where.renterId = Number(renterId);
  }
  if (rentId && rentId !== "undefined" && rentId !== "all") {
    where.rentAgreementId = Number(rentId);
  }
  if (unitId && unitId !== "undefined" && unitId !== "all") {
    where.unitId = Number(unitId);
  }
  if (refunded === "true") {
    where.status = {
      not: "HELD",
    };
  } else {
    where.status = {
      equals: "HELD",
    };
  }
  const deposits = await prisma.securityDeposit.findMany({
    where,
    skip: offset,
    take: limit,
    select: {
      amount: true,
      deductedAmount: true,
      deductionReason: true,
      status: true,
      receivedAt: true,
      refundedAt: true,
      id: true,
      renter: {
        select: {
          id: true,
          name: true,
        },
      },
      unit: {
        select: {
          id: true,
          unitId: true,
          property: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      rentAgreement: {
        select: {
          id: true,
          rentAgreementNumber: true,
        },
      },
    },
  });
  const total = await prisma.securityDeposit.count({ where });
  return { data: deposits, page, total };
}
