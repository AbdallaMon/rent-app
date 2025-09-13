import prisma from "@/lib/prisma";
import { getGlAccountById, getGLIdByCode } from "./main";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);
const DEBIT_NATURE = new Set(["ASSET", "EXPENSE"]);
const CREDIT_NATURE = new Set(["LIABILITY", "EQUITY", "REVENUE"]);
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

function getAccountNature(type) {
  const t = String(type || "").toUpperCase();
  if (DEBIT_NATURE.has(t)) return "DEBIT";
  if (CREDIT_NATURE.has(t)) return "CREDIT";
  return "DEBIT";
}

function getNaturalBalance({ debits = 0, credits = 0, accountType }) {
  const nature = getAccountNature(accountType);
  const d = Number(debits) || 0;
  const c = Number(credits) || 0;
  return nature === "DEBIT" ? d - c : c - d;
}

function getNaturalTrend({ debits = 0, credits = 0, accountType }) {
  const nb = getNaturalBalance({ debits, credits, accountType });
  if (nb > 0) return "up";
  if (nb < 0) return "down";
  return "flat";
}
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
          property: true,
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
          property: true,
          partyClient: true,
          settlementLines: true,
        },
      },
    },
  });

  let totalAmount = 0;
  let totalSettled = 0;
  let totalLeft = 0;
  let rows = [];
  for (const journal of journals) {
    const debit = journal.lines.find((line) => line.side === "DEBIT");
    const credit = journal.lines.find((line) => line.side === "CREDIT");
    const currentPart = getSearchPart({
      credit,
      debit,
      linesWhere: { accountCode: "1130" },
    });
    const accountType = currentPart.glAccount?.type || "EXPENSE";

    const signedChange = getNaturalBalance({
      accountType,
      debits: currentPart.side === "DEBIT" ? currentPart.amount : 0,
      credits: currentPart.side === "CREDIT" ? currentPart.amount : 0,
    });

    const counterPart = currentPart?.id === credit?.id ? debit : credit;

    journal.debitAmount = debit ? debit.amount : 0;
    journal.creditAmount = credit ? credit.amount : 0;
    journal.signedChange = signedChange;
    journal.debit = counterPart.side === "DEBIT" ? counterPart : null;
    journal.credit = counterPart.side === "CREDIT" ? counterPart : null;
    if (debit.maintenanceId) {
    } else {
      totalAmount += journal.debitAmount;
    }
    const isCredit = credit.glAccount?.code === "1130";
    if (isCredit) {
      totalSettled += journal.creditAmount;
    }

    rows.push(journal);
  }

  totalLeft = totalAmount < 0 ? 0 : totalAmount - totalSettled;
  totalLeft = totalLeft < 0 ? 0 : totalLeft;
  const total = await prisma.journalEntry.count({ where });

  return {
    data: rows,
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
      property: true,
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
    const naturalBalance = getNaturalBalance({
      debits: totalDebit,
      credits: totalCredit,
      accountType: acc.type,
    });
    const naturalTrend = getNaturalTrend({
      debits: totalDebit,
      credits: totalCredit,
      accountType: acc.type,
    });

    return {
      ...acc,
      totalDebit,
      totalCredit,
      balance: (Number(totalDebit) || 0) - (Number(totalCredit) || 0),
      naturalBalance,
      naturalTrend,
      accountNature: getAccountNature(acc.type),
    };
  });

  return { data };
}
export async function getTrialBalance(page, limit, searchParams) {
  // ===== فلترة التاريخ =====
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

  // ===== تجميعة الميزان =====
  const accountsBalance = [];
  let totalDebits = 0;
  let totalCredits = 0;

  const glAccounts = await prisma.GLAccount.findMany({});

  for (const acc of glAccounts) {
    const { debits, credits } = await getDebitAndCreditForAGlAccount({
      extraWhere: where,
      code: acc.code,
    });

    const rawBalance = calcBalance(debits, credits); // عادة: debits - credits
    const rawTrend = calcBalanceAndReturnTrend(debits, credits);

    const accountNature = getAccountNature(acc.type);
    const naturalBalance = getNaturalBalance({
      debits,
      credits,
      accountType: acc.type,
    });
    const naturalTrend = getNaturalTrend({
      debits,
      credits,
      accountType: acc.type,
    });

    accountsBalance.push({
      accountType: acc.type,
      accountNature,
      debits,
      credits,
      name: acc.name,
      type: acc.type,
      code: acc.code,

      balance: rawBalance,
      balanceTrend: rawTrend,

      naturalBalance,
      naturalTrend,
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

export function getPrevMonthRangeFromStart(startDate) {
  const s = dayjs.tz(startDate, "Asia/Dubai");
  const isLastDay = s.date() === s.daysInMonth();
  const base = (isLastDay ? s.add(1, "day") : s).startOf("day");

  const prev = base.subtract(1, "month");
  const prevMonthStart = prev.startOf("month");
  const prevMonthEnd = prev.endOf("month");

  return {
    gte: prevMonthStart.toDate(),
    lte: prevMonthEnd.toDate(),
  };
}
export async function getLedgar(page, limit, searchParams) {
  const filters = searchParams.get("filters")
    ? JSON.parse(searchParams.get("filters"))
    : {};

  const emptyData = {
    data: [],
    otherData: {
      openingBalance: 0,
      totalDebits: 0,
      totalCredits: 0,
      totalBalance: 0,
    },
  };

  let { startDate, endDate, mode, ownerId, propertyId, glAccountId } = filters;

  if (!startDate) return emptyData;

  const where = {};
  const dateWhere = {};
  let linesWhere = {};
  const openingBalanceDate = {};

  if (startDate && endDate) {
    dateWhere.entryDate = { gte: new Date(startDate), lte: new Date(endDate) };
  } else if (startDate) {
    dateWhere.entryDate = { gte: new Date(startDate) };
  }

  {
    // usage:
    const range = getPrevMonthRangeFromStart(startDate);
    openingBalanceDate.entryDate = range;
  }

  // Filters by mode
  if (mode === "accounts") {
    if (!glAccountId || glAccountId === "undefined" || glAccountId === "all")
      return emptyData;
    const gid = Number(glAccountId);
    where.lines = { some: { glAccountId: gid } };
    linesWhere = { glAccountId: gid };
  }

  if (mode === "owner") {
    if (!ownerId || ownerId === "undefined" || ownerId === "all")
      return emptyData;
    const oid = Number(ownerId);
    where.lines = { some: { partyClientId: oid, partyType: "OWNER" } };
    linesWhere.partyClientId = oid;

    if (!propertyId || propertyId === "undefined" || propertyId === "all") {
      where.lines.some = { ...where.lines.some, partyType: "OWNER" };
      linesWhere.partyType = "OWNER";
    } else {
      const pid = Number(propertyId);
      where.lines.some = { ...where.lines.some, propertyId: pid };
      linesWhere.propertyId = pid;
      linesWhere.partyType = "OWNER";
    }
  }

  // Opening balance first
  const {
    otherData: { totalBalance: prevMonthEndingBalance },
  } = await getAmountAndTrendAndBalance({
    dateWhere: openingBalanceDate,
    where,
    linesWhere,
    mode,
  });

  // Then current period
  return await getAmountAndTrendAndBalance({
    dateWhere,
    where,
    linesWhere,
    openingBalance: prevMonthEndingBalance,
    mode,
    page,
    limit,
  });
}

function getSearchPart({ linesWhere, credit, debit }) {
  // Be defensive
  const c = credit || null;
  const d = debit || null;

  if (
    c &&
    linesWhere.propertyId != null &&
    c.propertyId === linesWhere.propertyId
  )
    return c;

  if (
    c &&
    linesWhere.glAccountId != null &&
    c.glAccountId === linesWhere.glAccountId
  )
    return c;
  if (
    c &&
    linesWhere.accountCode != null &&
    c.glAccount?.code === linesWhere.accountCode
  )
    return c;

  if (
    c &&
    linesWhere.partyClientId != null &&
    c.partyClientId === linesWhere.partyClientId
  )
    return c;

  return d || c;
}

async function getAmountAndTrendAndBalance({
  openingBalance = 0,
  where,
  linesWhere,
  dateWhere,
  mode,
  page,
  limit,
}) {
  let runningBalance = Number(openingBalance) || 0;
  let totalDebits = 0;
  let totalCredits = 0;

  const skip = page && limit ? (Number(page) - 1) * Number(limit) : undefined;
  const take = limit ? Number(limit) : undefined;

  const entries = await prisma.journalEntry.findMany({
    where: { ...where, ...dateWhere },
    include: {
      lines: {
        include: {
          glAccount: true,
          partyClient: true,
          property: true,
          unit: true,
          maintenance: true,
          rentAgreement: {
            include: {
              unit: true,
            },
          },
        },
      },
    },
    orderBy: [{ entryDate: "asc" }, { id: "asc" }],
    skip,
    take,
  });

  const rows = [];

  for (const entry of entries) {
    const credit = entry.lines.find((l) => l.side === "CREDIT");
    const debit = entry.lines.find((l) => l.side === "DEBIT");
    if (!credit || !debit) continue; // keep it safe for malformed entries

    const currentPart = getSearchPart({ credit, debit, linesWhere });
    const counterPart = currentPart?.id === credit?.id ? debit : credit;

    const accountType = currentPart.glAccount.type;
    const signedChange = getNaturalBalance({
      accountType,
      debits: currentPart.side === "DEBIT" ? currentPart.amount : 0,
      credits: currentPart.side === "CREDIT" ? currentPart.amount : 0,
    });

    runningBalance += signedChange;

    // For display totals, we total the *visible* side (counterpart)
    if (counterPart.side === "DEBIT") totalDebits += counterPart.amount;
    else totalCredits += counterPart.amount;

    rows.push({
      id: entry.id,
      entryDate: entry.entryDate,
      description: entry.description,
      debit: counterPart.side === "DEBIT" ? counterPart : null,
      credit: counterPart.side === "CREDIT" ? counterPart : null,
      relation:
        currentPart.propertyId || currentPart.partyClientId || currentPart.unit
          ? currentPart
          : counterPart,
      amount: currentPart.amount, // display amount (positive)
      signedChange, // +/− impact on the running balance
      currentBalance: runningBalance,
    });
  }

  return {
    data: rows,
    otherData: {
      openingBalance,
      totalDebits,
      totalCredits,
      totalBalance: runningBalance,
    },
  };
}
