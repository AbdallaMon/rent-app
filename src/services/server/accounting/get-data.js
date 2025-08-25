import prisma from "@/lib/prisma";
import { getCompanyBankIdByType } from "./main";

export async function getJournalsEntries(page, limit, searchParams) {
  const filters = searchParams.get("filters")
    ? JSON.parse(searchParams.get("filters"))
    : {};
  const where = {};
  const type = searchParams.get("type");
  let { startDate, endDate, glAccount, ownerId, renterId, propertyId, unitId } =
    filters;
  if (startDate && endDate) {
    where.entryDate = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  } else if (startDate) {
    where.entryDate = {
      gte: new Date(startDate),
    };
  } else if (endDate) {
    where.entryDate = {
      lte: new Date(endDate),
    };
  }
  if (glAccount && glAccount !== "undefined" && glAccount !== "all") {
    glAccount = Number(glAccount);
    const account = await prisma.gLAccount.findUnique({
      where: { id: glAccount },
    });
    let bankAccountId;
    if (account.code === "1110") {
      bankAccountId = await getCompanyBankIdByType("CHECKING");
    }
    if (account.code === "1120") {
      bankAccountId = await getCompanyBankIdByType("SAVINGS");
    }
    if (account.code === "1130") {
      bankAccountId = await getCompanyBankIdByType("PETTY_CASH");
    }
    if (bankAccountId) {
      where.lines = {
        OR: [
          { companyBankAccountId: Number(bankAccountId) },
          { glAccountId: Number(glAccount) },
        ],
      };
    } else {
      where.lines = {
        some: {
          glAccountId: Number(glAccount),
        },
      };
    }
  }
  if (ownerId && ownerId !== "undefined" && ownerId !== "all") {
    where.lines = {
      ...where.lines,
      some: {
        ...where.lines?.some,
        partyClientId: Number(ownerId),
        partyType: "OWNER",
      },
    };
  }
  if (renterId && renterId !== "undefined" && renterId !== "all") {
    where.lines = {
      ...where.lines,
      some: {
        ...where.lines?.some,
        partyClientId: Number(renterId),
        partyType: "RENTER",
      },
    };
  }

  if (propertyId && propertyId !== "undefined" && propertyId !== "all") {
    where.lines = {
      ...where.lines,
      some: {
        ...where.lines?.some,
        property: {
          is: {
            id: Number(propertyId),
          },
        },
      },
    };
  }
  if (unitId && unitId !== "undefined" && unitId !== "all") {
    where.lines = {
      ...where.lines,
      some: {
        ...where.lines?.some,
        unit: {
          is: {
            id: Number(unitId),
          },
        },
      },
    };
  }
  if (type === "statement") {
    where.lines = {
      ...where.lines,
      some: {
        ...where.lines?.some,
        side: "DEBIT",
      },
    };
  }
  const journals = await prisma.journalEntry.findMany({
    where,
    orderBy: {
      entryDate: "desc",
    },
    include: {
      lines: {
        include: {
          glAccount: true,
          companyBankAccount: true,
          partyClient: true,
        },
      },
    },
  });
  return { data: journals };
}

export async function getJournals(page, limit, searchParams) {
  const filters = searchParams.get("filters")
    ? JSON.parse(searchParams.get("filters"))
    : {};

  const type = searchParams.get("type");
  let {
    startDate,
    endDate,
    glAccount,
    ownerId,
    renterId,
    propertyId,
    unitId,
    isSettled,
    mode,
  } = filters;

  const AND = [];

  if (startDate && endDate) {
    AND.push({
      createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
    });
  } else if (startDate) {
    AND.push({ createdAt: { gte: new Date(startDate) } });
  } else if (endDate) {
    AND.push({ createdAt: { lte: new Date(endDate) } });
  }

  if (glAccount && glAccount !== "undefined" && glAccount !== "all") {
    const glId = Number(glAccount);
    const account = await prisma.gLAccount.findUnique({ where: { id: glId } });

    let bankAccountId;
    if (account?.code === "1110") {
      bankAccountId = await getCompanyBankIdByType("CHECKING");
    }
    if (account?.code === "1120") {
      bankAccountId = await getCompanyBankIdByType("SAVINGS");
    }
    if (account?.code === "1130") {
      bankAccountId = await getCompanyBankIdByType("PETTY_CASH");
    }

    if (bankAccountId) {
      AND.push({
        OR: [
          { companyBankAccountId: Number(bankAccountId) },
          { glAccountId: glId },
        ],
      });
    } else {
      AND.push({ glAccountId: glId });
    }
  }

  // Party filters (OWNER / RENTER)
  if (ownerId && ownerId !== "undefined" && ownerId !== "all") {
    AND.push({ partyClientId: Number(ownerId), partyType: "OWNER" });
  }
  if (renterId && renterId !== "undefined" && renterId !== "all") {
    AND.push({ partyClientId: Number(renterId), partyType: "RENTER" });
  }

  if (propertyId && propertyId !== "undefined" && propertyId !== "all") {
    AND.push({ propertyId: Number(propertyId) });
  }
  if (unitId && unitId !== "undefined" && unitId !== "all") {
    AND.push({ unitId: Number(unitId) });
  }
  if (type === "statement") {
    AND.push({ side: "DEBIT" });
    if (mode && mode !== "undefined") {
      AND.push({ partyType: mode.toUpperCase() });
    } else if (!renterId || renterId === "undefined" || renterId === "all") {
      AND.push({ partyType: "OWNER" });
    }
  }
  if (!isSettled || isSettled === "undefined") {
    AND.push({ isSettled: false });
  } else if (isSettled && isSettled === "SETTLED") {
    AND.push({ isSettled: true });
  } else if (isSettled && isSettled === "NOTSETTLED") {
    AND.push({ isSettled: false });
  }

  const where = AND.length ? { AND } : {};

  // Pagination

  const journals = await prisma.journalLine.findMany({
    where,
    include: {
      entry: true,
      glAccount: true,
      companyBankAccount: true,
      partyClient: true,
      settlementLines: true,
    },
    orderBy: {
      createdAt: "desc", // or entryDate if you prefer
    },
  });

  return { data: journals };
}

export async function getJournalLineById(page, limit, searchParams, params) {
  const id = +params.id;
  const line = await prisma.journalLine.findUnique({
    where: { id: Number(id) },
    include: {
      entry: true,
      glAccount: true,
      companyBankAccount: true,
      partyClient: true,
      property: true,
      unit: true,
      maintenance: true,
      rentAgreement: true,
      payment: true,
      securityDeposit: true, // لو عندك في السكيمة
    },
  });

  if (!line) throw new Error("Journal line not found");

  const settlements = await prisma.JournalSettlement.findMany({
    where: {
      lines: {
        some: {
          lineId: line.id,
        },
      },
    },
    include: {
      lines: {
        where: {
          lineId: { not: line.id },
        },
        include: {
          line: true,
        },
      },
    },
  });
  line.settlements = settlements;
  return line;
}
