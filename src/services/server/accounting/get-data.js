import prisma from "@/lib/prisma";
import { getGlAccountById, getGLIdByCode } from "./main";

export async function getJournalsEntries(page, limit, searchParams) {
  const offset = (page - 1) * limit;

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

    where.lines = {
      some: {
        glAccountId: Number(glAccount),
      },
    };
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
    skip: offset,
    take: limit,
    where,
    orderBy: [{ entryDate: "desc" }, { id: "desc" }],
    include: {
      lines: {
        include: {
          glAccount: true,
          partyClient: true,
          settlementLines: true,
        },
      },
    },
  });

  let totalAmount = 0;
  let totalSettled = 0;
  let totalLeft = 0;
  journals.map((journal) => {
    const debit = journal.lines.find((line) => line.side === "DEBIT");
    const credit = journal.lines.find((line) => line.side === "CREDIT");
    journal.debitAmount = debit ? debit.amount : 0;
    journal.creditAmount = credit ? credit.amount : 0;
    journal.debit = debit ? debit : null;
    journal.credit = credit ? credit : null;
    totalAmount += journal.debitAmount;
    const settled = (debit?.settlementLines ?? []).reduce((sum, s) => {
      const v = Number(s?.amountMatched ?? 0);
      return sum + (isNaN(v) ? 0 : v);
    }, 0);
    totalSettled += settled;
    totalLeft += journal.debitAmount - settled;
    return journal;
  });
  const total = await prisma.journalEntry.count({ where });

  return {
    data: journals,
    page,
    total,
    otherData: { totalAmount, totalSettled, totalLeft },
  };
}

export async function getPettyCashJournalEntries(page, limit, searchParams) {
  const offset = (page - 1) * limit;

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

  const pettyCashAccountId = await getGLIdByCode("1130");
  where.lines = {
    some: {
      ...where.lines?.some,
      glAccountId: Number(pettyCashAccountId),
    },
  };
  const journals = await prisma.journalEntry.findMany({
    skip: offset,
    take: limit,
    where,
    orderBy: [{ entryDate: "desc" }, { id: "desc" }],
    include: {
      lines: {
        include: {
          glAccount: true,
          partyClient: true,
          settlementLines: true,
        },
      },
    },
  });

  let totalAmount = 0;
  let totalSettled = 0;
  let totalLeft = 0;
  journals.map((journal) => {
    const debit = journal.lines.find((line) => line.side === "DEBIT");
    const credit = journal.lines.find((line) => line.side === "CREDIT");
    journal.debitAmount = debit ? debit.amount : 0;
    journal.creditAmount = credit ? credit.amount : 0;
    journal.debit = debit ? debit : null;
    journal.credit = credit ? credit : null;
    totalAmount += journal.debitAmount;
    const settled = (debit?.settlementLines ?? []).reduce((sum, s) => {
      const v = Number(s?.amountMatched ?? 0);
      return sum + (isNaN(v) ? 0 : v);
    }, 0);
    totalSettled += settled;
    totalLeft += journal.debitAmount - settled;
    return journal;
  });
  const total = await prisma.journalEntry.count({ where });

  return {
    data: journals,
    page,
    total,
    otherData: { totalAmount, totalSettled, totalLeft },
  };
}

export async function getJournals(page, limit, searchParams) {
  const offset = (page - 1) * limit;
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

    AND.push({ glAccountId: glId });
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
    skip: offset,
    take: limit,
    include: {
      entry: {
        include: {
          lines: {
            include: {
              glAccount: true,
              partyClient: true,
            },
          },
        },
      },
      glAccount: true,
      partyClient: true,
      settlementLines: true,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  let totalDebit = 0;
  let totalCredit = 0;
  let totalAmount = 0;
  let totalSettled = 0;
  let totalLeft = 0;
  journals.map((journal) => {
    const debit = { ...journal };
    const credit = journal.entry.lines.find((line) => line.side === "CREDIT");
    journal.debitAmount = debit ? debit.amount : 0;
    totalDebit += journal.debitAmount;
    journal.creditAmount = credit ? credit.amount : 0;
    totalCredit += journal.creditAmount;
    totalAmount += journal.amount;
    journal.debit = debit ? debit : null;
    journal.credit = credit ? credit : null;
    journal.lines = journal.entry.lines;
    const settled = (journal?.settlementLines ?? []).reduce((sum, s) => {
      const v = Number(s?.amountMatched ?? 0);
      return sum + (isNaN(v) ? 0 : v);
    }, 0);
    totalSettled += settled;
    totalLeft += journal.amount - settled;
    return journal;
  });

  const otherData = {
    totalDebit,
    totalCredit,
    totalAmount,
    totalSettled,
    totalLeft,
  };
  const total = await prisma.journalLine.count({ where });
  return { data: journals, page, total, otherData };
}

export async function getJournalLineById(page, limit, searchParams, params) {
  const id = +params.id;
  const line = await prisma.journalLine.findUnique({
    where: { id: Number(id) },
    include: {
      entry: true,
      glAccount: true,
      partyClient: true,
      property: true,
      unit: true,
      maintenance: true,
      rentAgreement: true,
      payment: true,
      securityDeposit: true,
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
        include: {
          line: {
            include: {
              glAccount: true,
              partyClient: true,
            },
          },
        },
      },
    },
  });
  line.settlements = settlements;

  return line;
}

export async function getJournalEntryById(page, limit, searchParams, params) {
  const id = +params.id;
  const entry = await prisma.journalEntry.findUnique({
    where: { id: Number(id) },
    include: {
      lines: {
        include: {
          glAccount: true,
          partyClient: true,
          property: true,
          unit: true,
          maintenance: true,
          rentAgreement: true,
          payment: true,
          securityDeposit: true,
        },
      },
    },
  });

  if (!entry) throw new Error("Journal entry not found");

  let settlements = await prisma.journalSettlement.findMany({
    where: {
      lines: {
        some: {
          line: {
            is: { entryId: entry.id },
          },
        },
      },
    },
    include: {
      lines: {
        // where: {
        //   line: {
        //     is: { entryId: { not: entry.id } },
        //   },
        // },
        include: {
          line: {
            include: {
              glAccount: true,
              partyClient: true,
              entry: {
                include: {
                  lines: {
                    include: {
                      glAccount: true,
                      partyClient: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  entry.settlements = settlements;
  // entry.settlements = settlements.map((sett) => {
  //   return {
  //     ...sett,
  //     lines: [
  //       sett.lines[0],
  //       {
  //         ...sett.lines[0],
  //         line: sett.lines[0].line.entry.lines.find(
  //           (l) => l.id !== sett.lines[0].line.id
  //         ),
  //       },
  //     ],
  //   };
  // });

  return entry;
}

export async function getAccountsBalance() {
  const debitGroups = await prisma.journalLine.groupBy({
    by: ["glAccountId"],
    where: { glAccountId: { not: null }, side: "DEBIT" },
    _sum: { amount: true },
  });

  const creditGroups = await prisma.journalLine.groupBy({
    by: ["glAccountId"],
    where: { glAccountId: { not: null }, side: "CREDIT" },
    _sum: { amount: true },
  });

  const debMap = new Map(
    debitGroups.map((g) => [g.glAccountId, Number(g._sum.amount || 0)])
  );
  const credMap = new Map(
    creditGroups.map((g) => [g.glAccountId, Number(g._sum.amount || 0)])
  );

  const accounts = await prisma.GLAccount.findMany({});

  const data = accounts.map((acc) => {
    const totalDebit = debMap.get(acc.id) || 0;
    const totalCredit = credMap.get(acc.id) || 0;
    const balance = calcBalance(totalDebit, totalCredit);
    return {
      ...acc,
      totalDebit,
      totalCredit,
      balance,
    };
  });

  return { data };
}

export async function getTrialBalance(page, limit, searchParams) {
  const filters = searchParams.get("filters")
    ? JSON.parse(searchParams.get("filters"))
    : {};

  let { startDate, endDate } = filters;
  const where = {};

  if (startDate && endDate) {
    where.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
  } else if (startDate) {
    where.createdAt = { gte: new Date(startDate) };
  } else if (endDate) {
    where.createdAt = { lte: new Date(endDate) };
  }

  const accountsBalance = [];
  let totalDebits = 0;
  let totalCredits = 0;

  const glAccounts = await prisma.GLAccount.findMany({});
  for (const acc of glAccounts) {
    const { debits, credits } = await getDebitAndCreditForAGlAccount({
      extraWhere: where,
      code: acc.code,
    });
    accountsBalance.push({
      accountType: acc.type,
      debits,
      credits,
      name: acc.name,
      type: acc.type,
      code: acc.code,
      balanceTrend: calcBalanceAndReturnTrend(debits, credits),
      balance: calcBalance(debits, credits),
    });
    totalDebits += debits;
    totalCredits += credits;
  }
  const totalBalance = totalDebits - totalCredits;
  const balanceTrend = calcBalanceAndReturnTrend(totalDebits, totalCredits);
  return {
    data: accountsBalance,
    otherData: {
      totalDebits,
      totalCredits,
      totalBalance,
      balanceTrend,
    },
  };
}
function calcBalanceAndReturnTrend(totalDebits, totalCredits) {
  const totalBalance = calcBalance(totalDebits, totalCredits);

  return totalBalance === 0 ? "flat" : totalBalance > 0 ? "up" : "down";
}
function calcBalance(totalDebits, totalCredits) {
  return totalDebits - totalCredits;
}
async function getDebitAndCreditForAGlAccount({ code, extraWhere }) {
  const where = {
    ...extraWhere,
    glAccount: {
      code,
    },
  };

  const debits = await prisma.journalLine.aggregate({
    where: {
      side: "DEBIT",
      ...where,
    },
    _sum: {
      amount: true,
    },
  });

  const credits = await prisma.journalLine.aggregate({
    where: {
      side: "CREDIT",
      ...where,
    },
    _sum: {
      amount: true,
    },
  });

  return {
    debits: debits._sum.amount || 0,
    credits: credits._sum.amount || 0,
  };
}
