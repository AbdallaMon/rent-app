import prisma from "@/lib/prisma";
async function getRequests({ page, limit, searchParams, model }) {
  const where = {};
  const offset = (page - 1) * limit;
  const filters = searchParams.get("filters")
    ? JSON.parse(searchParams.get("filters"))
    : {};
  const { propertyId, startDate, endDate, priority, status } = filters;
  if (propertyId && propertyId !== "all") {
    where.propertyId = parseInt(propertyId);
  }
  if (status && status !== "all") {
    where.status = status;
  }
  if (priority && priority !== "all") {
    where.priority = priority;
  }
  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  } else if (startDate) {
    where.createdAt = {
      gte: new Date(startDate),
    };
  } else if (endDate) {
    where.createdAt = {
      lte: new Date(endDate),
    };
  }
  const data = await prisma[model].findMany({
    skip: offset,
    take: limit,
    where,
    include: {
      client: true,
      property: true,
      unit: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  const total = prisma[model].count({ where });
  return { data, total, page };
}
export async function getMaintenanceRequests(page, limit, searchParams) {
  const data = await getRequests({
    page,
    limit,
    searchParams,
    model: "maintenanceRequest",
  });
  return data;
}
export async function getCompliants(page, limit, searchParams) {
  return await getRequests({
    page,
    limit,
    searchParams,
    model: "complaint",
  });
}
export async function getRequestById({ id, model }) {
  const request = await prisma[model].findUnique({
    where: { id: id },
    include: {
      client: true,
      property: true,
      unit: true,
    },
  });
  return {
    data: request,
  };
}
export async function getMaintenenaceRequestById(id) {
  return await getRequestById({ id, model: "maintenanceRequest" });
}

export async function getComplaintById(id) {
  return await getRequestById({ id, model: "complaint" });
}
