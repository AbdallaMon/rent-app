import prisma from "@/lib/prisma";
import {
  createJournalEntry,
  getCompanyBankIdByType,
  getGLIdByCode,
} from "./main";

export async function createDeposit({ amount, rentAgreementId }) {
  const rentAgreement = await prisma.rentAgreement.findUnique({
    where: { id: rentAgreementId },
    include: { unit: { include: { property: true } } },
  });
  const payment = {
    amount,
    paymentTypeMethod: "CASH",
    status: "PAID",
    paymentType: "INSURANCE",
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
  const savingsId = await getCompanyBankIdByType("SAVINGS");
  const depositsGlId = await getGLIdByCode("2100");
  const renterId = rentAgreement.renterId;

  await createJournalEntry({
    description: "استلام وديعة تأمين من المستأجر",
    lines: [
      {
        side: "DEBIT",
        amount: amount,
        companyBankAccountId: savingsId,
        memo: "وديعة تأمين - بنك توفير",
        rentAgreementId: rentAgreement.id,
        unitId: Number(rentAgreement.unit.id),
        propertyId: rentAgreement.unit.propertyId,
        paymentId: paymentRequest.id,
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
    },
  });
  await prisma.journalLine.updateMany({
    where: { paymentId: paymentRequest.id },
    data: { securityDepositId: sd.id },
  });
}
export async function refundDeposit({
  securityDepositId,
  refund = 0,
  deduct = 0,
  reason = null,
  paymentId = null,
}) {
  refund = Number(refund || 0);
  deduct = Number(deduct || 0);
  if (refund < 0 || deduct < 0) throw new Error("refund/deduct must be >= 0");

  const sd = await prisma.securityDeposit.findUnique({
    where: { id: Number(securityDepositId) },
    include: { rentAgreement: { include: { unit: true } } },
  });
  if (!sd) throw new Error(`SecurityDeposit ${securityDepositId} not found`);

  const unitId = Number(sd.unitId);
  const propertyId = sd.rentAgreement.unit.propertyId;
  const rentAgreementId = sd.rentAgreementId;
  const renterId = sd.renterId;

  // 2) الأكواد والحسابات
  const gl2100 = await getGLIdByCode("2100"); // أمانات المستأجرين
  const gl4900 = await getGLIdByCode("4900"); // إيرادات خصومات التأمين
  const savings = await getCompanyBankIdByType("SAVINGS");
  const checking = await getCompanyBankIdByType("CHECKING");

  const total = refund + deduct;

  await createJournalEntry({
    description: `تصفية وديعة تأمين #${sd.id} (رد: ${refund} / خصم: ${deduct})`,
    lines: [
      {
        side: "DEBIT",
        amount: total,
        glAccountId: gl2100,
        partyType: "RENTER",
        partyClientId: renterId,
        memo: "تخفيض التزام وديعة التأمين",
        unitId,
        propertyId,
        rentAgreementId,
        paymentId,
        securityDepositId: sd.id,
      },
      ...(refund > 0
        ? [
            {
              side: "CREDIT",
              amount: refund,
              companyBankAccountId: savings,
              memo: "رد وديعة للمستأجر",
              unitId,
              propertyId,
              rentAgreementId,
              paymentId,
              securityDepositId: sd.id,
            },
          ]
        : []),
      ...(deduct > 0
        ? [
            {
              side: "CREDIT",
              amount: deduct,
              glAccountId: gl4900,
              memo: reason
                ? `خصم من الوديعة: ${reason}`
                : "خصم من وديعة التأمين",
              unitId,
              propertyId,
              rentAgreementId,
              paymentId,
              securityDepositId: sd.id,
            },
          ]
        : []),
    ],
  });

  if (deduct > 0) {
    await createJournalEntry({
      description: `تحويل خصم الوديعة إلى الحساب الجاري - SD#${sd.id}`,
      lines: [
        {
          side: "DEBIT",
          amount: deduct,
          companyBankAccountId: checking,
          memo: "تحويل داخلي - خصم وديعة",
        },
        {
          side: "CREDIT",
          amount: deduct,
          companyBankAccountId: savings,
          memo: "تحويل داخلي - خصم وديعة",
        },
      ],
    });
  }

  await prisma.securityDeposit.update({
    where: { id: sd.id },
    data: {
      deductedAmount: (sd.deductedAmount || 0) + deduct,
      deductionReason: reason ?? sd.deductionReason,
      status:
        refund > 0 && deduct > 0
          ? "PARTIALLY_REFUNDED"
          : refund > 0 && deduct === 0
            ? "REFUNDED"
            : refund === 0 && deduct > 0
              ? "FORFEITED"
              : sd.status,
      refundedAt:
        refund > 0 &&
        sd.amount - ((sd.deductedAmount || 0) + deduct) - refund <= 0
          ? new Date()
          : sd.refundedAt,
    },
  });

  return { ok: true };
}
