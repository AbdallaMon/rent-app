import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getContactForms(searchParams) {
  try {
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const skip = (page - 1) * limit;

    const [contactForms, totalCount] = await Promise.all([
      prisma.contact.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.contact.count()
    ]);

    return {
      items: contactForms,
      totalCount
    };
  } catch (error) {
    console.error("Error in getContactForms:", error);
    throw error;
  }
}
