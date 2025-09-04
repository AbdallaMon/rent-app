import prisma from "@/lib/prisma";

/* 
EX
await createJournalEntry({
  description: 'Maintenance paid by company',
  lines: [
    { side: 'DEBIT', amount: 500, glAccountId: 6100, propertyId: 33 },
    { side: 'CREDIT', amount: 500, companyBankAccountId: 1 },
  ],
});

*/
export async function createJournalEntry({
  manull,
  description,
  entryDate,
  lines,
}) {
  if (!lines || lines.length < 2)
    throw new Error("At least two lines are required.");

  return await prisma.$transaction(async (tx) => {
    const entry = await tx.journalEntry.create({
      data: {
        description: description || null,
        entryDate: entryDate || new Date(),
        manull: manull || false,
      },
    });

    const createdLines = await Promise.all(
      lines.map((l) =>
        tx.journalLine.create({
          data: {
            entryId: entry.id,
            side: l.side,
            amount: Number(l.amount),
            memo: l.memo || null,
            companyBankAccountId: l.companyBankAccountId || null,
            glAccountId: l.glAccountId || null,
            partyType: l.partyType || null,
            counterpartyLabel: l.counterpartyLabel || null,
            partyClientId: l.partyClientId || null,
            propertyId: l.propertyId || null,
            unitId: l.unitId || null,
            maintenanceId: l.maintenanceId || null,
            rentAgreementId: l.rentAgreementId || null,
            paymentId: l.paymentId || null,
            maintenanceId: l.maintenanceId || null,
            createdAt: l.createdAt || new Date(),
            securityDepositId: l.securityDepositId,
          },
          select: { id: true, side: true, entryId: true },
        })
      )
    );

    const debitLine = createdLines.find((l) => l.side === "DEBIT");
    const creditLine = createdLines.find((l) => l.side === "CREDIT");
    return {
      entry: entry,
      debitLine: debitLine,
      creditLine: creditLine,
    };
  });
}

export async function getGLIdByCode(code, returnAccount = false) {
  const gl = await prisma.gLAccount.findUnique({ where: { code } });
  if (!gl) throw new Error(`GL account with code ${code} not found`);
  return returnAccount ? gl : gl.id;
}

// by company bank account type or name
// type: 'CHECKING' | 'SAVINGS' | 'PETTY_CASH'
export async function getCompanyBankIdByType(accountType) {
  const acc = await prisma.companyBankAccount.findFirst({
    where: { accountType, isActive: true },
    orderBy: { id: "asc" },
  });
  if (!acc) throw new Error(`CompanyBankAccount (${accountType}) not found`);
  return acc.id;
}
export async function getDebitLineByPaymentId({ paymentId }) {
  const debitLine = await prisma.journalLine.findFirst({
    where: {
      side: "DEBIT",
      paymentId: Number(paymentId),
    },
  });

  return debitLine;
}
export async function settleLines({ matches, note, forceSettle }) {
  if (!Array.isArray(matches) || matches.length === 0) {
    throw new Error("Provide settlement matches");
  }

  const settlement = await prisma.journalSettlement.create({
    data: { note: note || null, matchedAt: matches[0].createdAt },
  });

  for (const m of matches) {
    await prisma.journalSettlementLine.create({
      data: {
        settlementId: settlement.id,
        lineId: Number(m.debitLineId),
        side: "DEBIT",
        amountMatched: m.amount,
        note: m.debitNote || null,
        matchedAt: m.createdAt,
      },
    });
    await prisma.journalSettlementLine.create({
      data: {
        settlementId: settlement.id,
        lineId: Number(m.creditLineId),
        side: "CREDIT",
        amountMatched: m.amount,
        note: m.creditNote || null,
        matchedAt: m.createdAt,
      },
    });
    if (m.paymentId && m.targetAmount) {
      await checkForFullPaidByPaymentId({
        paymentId: m.paymentId,
        targetAmount: m.targetAmount,
        settledAt: m.createdAt,
      });
    }
  }

  return true;
}

export async function checkForFullPaidByPaymentId({
  paymentId,
  targetAmount,
  settledAt,
}) {
  const creditPaymentLines = await prisma.journalLine.findMany({
    where: { paymentId, side: "CREDIT" },
    select: { id: true, amount: true },
  });
  const creditLineIds = creditPaymentLines.map((l) => l.id);
  const creditMatchedAgg = await prisma.journalSettlementLine.aggregate({
    where: { side: "CREDIT", lineId: { in: creditLineIds } },
    _sum: { amountMatched: true },
  });
  const totalCreditMatched = Number(creditMatchedAgg._sum.amountMatched || 0);
  const isFullyPaid = totalCreditMatched >= targetAmount;
  if (!isFullyPaid) {
    return {
      ok: true,
      fullyPaid: false,
      matched: totalCreditMatched,
      target: targetAmount,
    };
  }
  await prisma.journalLine.updateMany({
    where: { paymentId },
    data: {
      isSettled: true,
      settledAt: settledAt ? new Date(settledAt) : new Date(),
    },
  });
  return {
    ok: true,
    fullyPaid: true,
    matched: totalCreditMatched,
    target: targetAmount,
  };
}

export async function getGlAccountById(id) {
  const glAccount = await prisma.gLAccount.findUnique({
    where: { id: id },
  });
  return glAccount;
}
