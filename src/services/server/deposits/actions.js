import prisma from "@/lib/prisma";
import {
  createJournalEntry,
  getGLIdByCode,
  settleLines,
} from "../accounting/main";

export async function createDeposit({ amount, rentAgreementId, receivedAt }) {
  amount = Number(amount);
  console.log(receivedAt, "receivedAt");
  const date = receivedAt ? new Date(receivedAt) : new Date();
  const rentAgreement = await prisma.rentAgreement.findUnique({
    where: { id: rentAgreementId },
    include: {
      unit: {
        include: {
          property: {
            include: {
              client: true,
            },
          },
        },
      },
    },
  });
  const payment = {
    amount,
    paymentTypeMethod: "CASH",
    status: "PAID",
    paymentType: "INSURANCE",
    dueDate: date,
  };

  const paymentRequest = await prisma.payment.create({
    data: {
      ...payment,
      client: {
        connect: {
          id: rentAgreement.unit.property.client.id,
        },
      },
      property: {
        connect: {
          id: rentAgreement.unit.property.id,
        },
      },
      unit: {
        connect: {
          id: rentAgreement.unit.id,
        },
      },
      rentAgreement: {
        connect: {
          id: rentAgreement.id,
        },
      },
    },
  });

  const savingsGlId = await getGLIdByCode("1120");
  const depositsGlId = await getGLIdByCode("2100");
  const renterId = rentAgreement.renterId;

  await createJournalEntry({
    description: "استلام وديعة تأمين من المستأجر",
    entryDate: date,
    lines: [
      {
        side: "DEBIT",
        amount: amount,
        glAccountId: savingsGlId,
        memo: "وديعة تأمين - بنك توفير",
        rentAgreementId: rentAgreement.id,
        unitId: Number(rentAgreement.unit.id),
        propertyId: rentAgreement.unit.propertyId,
        paymentId: paymentRequest.id,
        createdAt: date,
      },
      {
        side: "CREDIT",
        amount: amount,
        glAccountId: depositsGlId,
        partyType: "RENTER",
        partyClientId: renterId,
        memo: "أمانات مستأجرين (تأمين)",
        rentAgreementId: rentAgreement.id,
        unitId: Number(rentAgreement.unit.id),
        propertyId: rentAgreement.unit.propertyId,
        paymentId: paymentRequest.id,
        createdAt: date,
      },
    ],
  });

  const sd = await prisma.securityDeposit.create({
    data: {
      amount: amount,
      renterId: renterId,
      unitId: Number(rentAgreement.unit.id),
      rentAgreementId: rentAgreement.id,
      paymentId: paymentRequest.id,
      receivedAt: date,
    },
  });
  await prisma.journalLine.updateMany({
    where: { paymentId: paymentRequest.id },
    data: { securityDepositId: sd.id },
  });
  const sdData = await prisma.securityDeposit.findUnique({
    where: {
      id: Number(sd.id),
    },
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
  return {
    data: sdData,
    message: "تمت إضافة وديعة بنجاح",
    status: 200,
  };
}

async function getOriginalSDCreditLine({ sdId, gl2100 }) {
  return prisma.journalLine.findFirst({
    where: {
      glAccountId: gl2100,
      side: "CREDIT",
      securityDepositId: sdId,
      paymentId: { not: null },
    },
    orderBy: { id: "asc" },
  });
}

export async function refundDeposit({
  depositId,
  refund = 0,
  deduct = 0,
  reason = null,
  paymentId = null,
  moveDeductCash = true,
  refundedAt,
}) {
  refund = Number(refund || 0);
  deduct = Number(deduct || 0);
  console.log(refundedAt, "refundedAt");
  if (refund < 0 || deduct < 0) throw new Error("refund/deduct must be >= 0");
  const date = refundedAt ? new Date(refundedAt) : new Date();
  const sd = await prisma.securityDeposit.findUnique({
    where: { id: Number(depositId) },
    include: { rentAgreement: { include: { unit: true } }, renter: true },
  });
  if (!sd) throw new Error(`SecurityDeposit ${depositId} not found`);

  const unitId = Number(sd.unitId);
  const propertyId = sd.rentAgreement.unit.propertyId;
  const rentAgreementId = sd.rentAgreementId;
  const renterId = sd.renterId;

  // GLs
  const gl2100 = await getGLIdByCode("2100");
  const gl4900 = await getGLIdByCode("4900");
  const savingsGlId = await getGLIdByCode("1120");
  const checkingGlId = await getGLIdByCode("1110");
  const gl2100Line = await getOriginalSDCreditLine({ sdId: sd.id, gl2100 });

  await prisma.JournalSettlement.deleteMany({
    where: {
      lines: {
        some: {
          lineId: gl2100Line.id,
        },
      },
    },
  });
  await prisma.journalEntry.deleteMany({
    where: {
      AND: [
        { lines: { some: { securityDepositId: sd.id } } }, // must have SD link
        { lines: { none: { paymentId: { not: null } } } }, // must NOT have any paymentId
      ],
    },
  });
  let matches = [];
  if (refund > 0) {
    const { debitLine } = await createJournalEntry({
      description: `رد وديعة تأمين للمستأجر - SD#${sd.id}`,
      entryDate: date,
      lines: [
        {
          side: "DEBIT",
          amount: refund,
          glAccountId: gl2100,
          partyType: "RENTER",
          partyClientId: renterId,
          memo: "تخفيض التزام الوديعة بسبب الرد",
          unitId,
          propertyId,
          rentAgreementId,
          paymentId,
          securityDepositId: sd.id,
          createdAt: date,
        },
        {
          side: "CREDIT",
          amount: refund,
          glAccountId: savingsGlId,
          memo: "رد جزء من وديعة التأمين للمستأجر",
          unitId,
          propertyId,
          rentAgreementId,
          paymentId,
          securityDepositId: sd.id,
          createdAt: date,
        },
      ],
    });
    const note = `تسوية رد وديعة - SD#${sd.id}`;

    matches.push({
      note,
      matches: [
        {
          debitLineId: debitLine.id,
          creditLineId: gl2100Line.id,
          amount: refund,
          targetAmount: sd.amount,
          debitNote: "تسوية وديعة - رد (مدين 2100)",
          creditNote: "تسوية وديعة - أصل الالتزام (دائن 2100)",
          createdAt: date,
        },
      ],
    });
  }

  if (deduct > 0) {
    const { debitLine } = await createJournalEntry({
      description: `مصادرة/خصم من وديعة التأمين - SD#${sd.id}`,
      entryDate: date,

      lines: [
        {
          side: "DEBIT",
          amount: deduct,
          glAccountId: gl2100,
          partyType: "RENTER",
          partyClientId: renterId,
          memo: reason
            ? `تخفيض الالتزام: ${reason}`
            : "تخفيض الالتزام بسبب المصادرة",
          unitId,
          propertyId,
          rentAgreementId,
          securityDepositId: sd.id,
          createdAt: date,
        },
        {
          side: "CREDIT",
          amount: deduct,
          glAccountId: gl4900,
          memo: reason
            ? `إيراد مصادرة وديعة: ${reason}`
            : "إيرادات خصم الوديعة",
          unitId,
          propertyId,
          rentAgreementId,
          securityDepositId: sd.id,
          createdAt: date,
        },
      ],
    });
    const note = `تسوية خصم/مصادرة وديعة - SD#${sd.id}`;

    matches.push({
      note,

      matches: [
        {
          debitLineId: debitLine.id,
          creditLineId: gl2100Line.id,
          amount: deduct,
          targetAmount: sd.amount,
          debitNote: `تسوية وديعة - خصم${reason ? ` (${reason})` : ""}`,
          creditNote: "تسوية وديعة - أصل الالتزام (دائن 2100)",
          createdAt: date,
        },
      ],
    });
    if (moveDeductCash) {
      await createJournalEntry({
        description: `تحويل المبلغ المصادَر من حساب الوديعة إلى الجاري - SD#${sd.id}`,
        entryDate: date,
        lines: [
          {
            side: "DEBIT",
            amount: deduct,
            glAccountId: checkingGlId,
            securityDepositId: sd.id,
            createdAt: date,

            memo: reason
              ? `تحويل خصم وديعة (${reason}) - مستأجر: ${sd.renter.name}`
              : `تحويل خصم وديعة - مستأجر: ${sd.renter.name}`,
          },
          {
            side: "CREDIT",
            amount: deduct,
            glAccountId: savingsGlId,
            securityDepositId: sd.id,
            createdAt: date,

            memo: reason
              ? `خصم من وديعة SD#${sd.id}: ${reason}`
              : `خصم من وديعة SD#${sd.id}`,
          },
        ],
      });
    }
  }

  const newDeductedTotal = deduct || 0;

  await prisma.securityDeposit.update({
    where: { id: sd.id },
    data: {
      deductedAmount: newDeductedTotal,
      deductionReason: reason ?? sd.deductionReason,
      status:
        refund > 0 && deduct > 0
          ? "PARTIALLY_REFUNDED"
          : refund > 0 && deduct === 0
            ? "REFUNDED"
            : refund === 0 && deduct > 0
              ? "FORFEITED"
              : sd.status,
      refundedAt: date,
    },
  });
  if (matches && matches.length > 0) {
    for (const match of matches) {
      await settleLines({ ...match });
    }
    await prisma.journalLine.updateMany({
      where: {
        OR: [
          { id: gl2100Line.id },
          {
            settlementLines: {
              some: {
                settlement: {
                  lines: {
                    some: { lineId: gl2100Line.id },
                  },
                },
              },
            },
          },
        ],
      },
      data: {
        isSettled: true,
        settledAt: date,
      },
    });
  }
  return { ok: true, message: "تمت العملية بنجاح" };
}

export async function deleteADeposit(id) {
  await prisma.journalSettlement.deleteMany({
    where: {
      lines: {
        some: {
          line: { securityDepositId: Number(id) },
        },
      },
    },
  });
  await prisma.journalEntry.deleteMany({
    where: {
      lines: { some: { securityDepositId: Number(id) } },
    },
  });
  await prisma.securityDeposit.delete({
    where: {
      id: Number(id),
    },
  });
  return { message: "تم الحذف" };
}
