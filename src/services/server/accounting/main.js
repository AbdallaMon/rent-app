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
export async function createJournalEntry({ description, entryDate, lines }) {
  if (!lines || lines.length < 2)
    throw new Error("At least two lines are required.");

  return await prisma.$transaction(async (tx) => {
    const entry = await tx.journalEntry.create({
      data: {
        description: description || null,
        entryDate: entryDate || new Date(),
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
          },
        })
      )
    );

    return { entry, lines: createdLines };
  });
}

// by GL code (e.g., "4000", "4100", "5200")
async function getGLIdByCode(code) {
  const gl = await prisma.gLAccount.findUnique({ where: { code } });
  if (!gl) throw new Error(`GL account with code ${code} not found`);
  return gl.id;
}

// by company bank account type or name
// type: 'CHECKING' | 'SAVINGS' | 'PETTY_CASH'
async function getCompanyBankIdByType(accountType) {
  const acc = await prisma.companyBankAccount.findFirst({
    where: { accountType, isActive: true },
    orderBy: { id: "asc" },
  });
  if (!acc) throw new Error(`CompanyBankAccount (${accountType}) not found`);
  return acc.id;
}

export async function settleLines({ matches, note }) {
  if (!Array.isArray(matches) || matches.length === 0) {
    throw new Error("Provide settlement matches");
  }

  const settlement = await prisma.journalSettlement.create({
    data: { note: note || null },
  });

  for (const m of matches) {
    const debit = await prisma.journalLine.findUnique({
      where: { id: m.debitLineId },
    });
    const credit = await prisma.journalLine.findUnique({
      where: { id: m.creditLineId },
    });
    if (!debit || !credit) throw new Error("Line not found for settlement");

    // write both sides
    await prisma.journalSettlementLine.create({
      data: {
        settlementId: settlement.id,
        lineId: debit.id,
        side: "DEBIT",
        amountMatched: m.amount,
        note: m.note || null,
      },
    });
    await prisma.journalSettlementLine.create({
      data: {
        settlementId: settlement.id,
        lineId: credit.id,
        side: "CREDIT",
        amountMatched: m.amount,
        note: m.note || null,
      },
    });
  }

  return prisma.journalSettlement.findUnique({
    where: { id: settlement.id },
    include: { lines: true },
  });
}
