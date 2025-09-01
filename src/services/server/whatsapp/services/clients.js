import { withReadOnlyConnection } from "@/lib/database-connection";
import { buildPhoneVariants, cleanDigits, splitCountryCode } from "@/lib/phone";

export async function findClinetData(id) {
  return await prisma.client.findUnique({
    where: {
      id: Number(id),
    },
  });
}
export async function findClientWithPropertyProduction(phoneNumber) {
  return withReadOnlyConnection(async (prisma) => {
    const variants = buildPhoneVariants(phoneNumber);
    let client = await prisma.client.findFirst({
      where: { phone: { in: variants } },
    });

    if (!client) {
      const cleaned = cleanDigits(phoneNumber);
      const { core } = splitCountryCode(cleaned);
      const probe = core || cleaned;
      const lastDigits = probe.slice(-8);
      client = await prisma.client.findFirst({
        where: {
          OR: [
            { phone: { endsWith: lastDigits } },
            { phone: { contains: lastDigits } },
            { phone: { contains: probe } },
          ],
        },
      });
    }

    if (!client) {
      return {
        success: false,
        message: "CLIENT_NOT_FOUND",
        client: null,
        property: null,
        unit: null,
      };
    }

    const rentAgreements = await prisma.rentAgreement.findMany({
      where: { renterId: client.id, status: "ACTIVE" },
      include: { unit: { include: { property: true } } },
      orderBy: { createdAt: "desc" },
    });

    let property = null,
      unit = null;
    if (rentAgreements.length) {
      const ag = rentAgreements[0];
      property = ag.unit?.property || null;
      unit = ag.unit || null;
    }

    return { success: true, client, property, unit, rentAgreements };
  });
}

// prefer saved language on client if exists
export function getPreferredLanguageFromClient(client) {
  // try typical fields you might have in your schema; fallback to ARABIC
  const raw = (client?.preferredLanguage || client?.language || "")
    .toString()
    .toUpperCase();
  if (raw.includes("EN")) return "ENGLISH";
  if (raw.includes("AR")) return "ARABIC";
  return "ARABIC";
}
