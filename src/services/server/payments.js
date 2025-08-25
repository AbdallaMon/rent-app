import prisma from "@/lib/prisma"; // Adjust the path to your Prisma instance
import { addMonths, endOfMonth, isSameMonth, startOfMonth } from "date-fns";
import { updateWhereClauseWithUserProperties } from "@/app/api/utlis/userProperties";
import {
  checkForFullPaidByPaymentId,
  createJournalEntry,
  getCompanyBankIdByType,
  getDebitLineByPaymentId,
  getGLIdByCode,
  settleLines,
} from "./accounting/main";

export async function getRentPaymentsForCurrentMonth(
  page,
  limit,
  searchParams
) {
  const today = new Date();
  today.setDate(today.getDate() - 1);
  let providedDate;
  if (searchParams.get("date") !== "undefined") {
    providedDate = new Date(searchParams.get("date"));
  } else {
    providedDate = new Date();
  }

  const type = searchParams.get("type");
  let startDate, endDate;
  if (isSameMonth(today, providedDate)) {
    startDate = today; // Start from today
    endDate = addMonths(today, 1); // End one month from today
  } else {
    startDate = startOfMonth(providedDate); // Start of the provided month
    endDate = endOfMonth(providedDate); // End of the provided month
  }

  let actualType;
  let dateCondition;

  if (type === "RENTEXPENCES") {
    actualType = {
      in: ["TAX", "INSURANCE", "REGISTRATION", "MANAGEMENT_COMMISSION"],
    };
    dateCondition = {
      gte: startDate,
      lte: endDate,
    };
  } else if (type === "OVERRUDE") {
    actualType = {
      in: [
        "RENT",
        "TAX",
        "INSURANCE",
        "REGISTRATION",
        "MAINTENANCE",
        "CONTRACT_EXPENSE",
        "OTHER_EXPENSE",
        "MANAGEMENT_COMMISSION",
        "OTHER",
      ],
    };
    dateCondition = {
      lt: today,
    };
  } else {
    actualType = type;
    dateCondition = {
      gte: startDate,
      lte: endDate,
    };
  }
  let where = {
    paymentType: actualType,
    dueDate: dateCondition,
    status: {
      in: ["PENDING", "OVERDUE"],
    },
  };
  where = await updateWhereClauseWithUserProperties("propertyId", where);
  try {
    const payments = await prisma.payment.findMany({
      where,
      include: {
        installment: true,
        maintenance: {
          select: {
            description: true,
            type: true,
          },
        },
        property: {
          select: {
            name: true,
            bankId: true,
            bankAccount: {
              select: {
                accountNumber: true,
                id: true,
              },
            },
          },
        },
        unit: {
          select: {
            unitId: true,
            number: true,
          },
        },
        rentAgreement: {
          select: {
            rentAgreementNumber: true,
            unit: {
              select: {
                id: true,
                unitId: true,
                number: true,
                client: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        invoices: {
          include: {
            bankAccount: true,
          },
        },
      },
    });
    return {
      data: payments,
    };
  } catch (error) {
    console.error("Error fetching rent payments:", error);
    throw error;
  }
}

export async function createNewBankAccount(data, params, searchParams) {
  const clientId = data.clientId || searchParams.get("clientId");
  const bankAccount = await prisma.bankAccount.create({
    data: {
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      bankId: data.bankId,
      clientId: +clientId,
    },
  });
  return {
    id: bankAccount.id,
    name: bankAccount.accountNumber,
  };
}

export async function updatePaymentMethodType(data, params, searchParams) {
  const payment = await prisma.payment.update({
    where: { id: +params.id },
    data: {
      paymentTypeMethod: data.paymentTypeMethod,
      chequeNumber: data.chequeNumber ? data.chequeNumber : null,
    },
  });
  return payment;
}

export async function updatePayment(id, data) {
  let payment;

  const restPayment =
    +data.amount - (+data.currentPaidAmount + +data.paidAmount);
  if (restPayment > 1) {
    payment = await prisma.payment.update({
      where: { id: +id },
      data: {
        paidAmount: +data.paidAmount + +data.currentPaidAmount,
        status: "PENDING",
        timeOfPayment: new Date(data.timeOfPayment),
      },
      include: {
        installment: true,
        property: {
          select: {
            id: true,
            name: true,
            bankId: true,
            clientId: true,
            bankAccount: {
              select: {
                accountNumber: true,
                id: true,
              },
            },
          },
        },
        unit: {
          select: {
            unitId: true,
            number: true,
            propertyId: true,
            id: true,
          },
        },
        rentAgreement: {
          select: {
            rentAgreementNumber: true,
            renterId: true,
            id: true,
            unit: {
              select: {
                id: true,
                unitId: true,
                number: true,
                propertyId: true,
                client: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        invoices: {
          include: {
            bankAccount: true,
          },
        },
      },
    });
  } else {
    payment = await prisma.payment.update({
      where: { id: +id },
      data: {
        paidAmount: +data.paidAmount + +data.currentPaidAmount,
        status: "PAID",
        timeOfPayment: new Date(data.timeOfPayment),
      },
      include: {
        installment: true,
        property: {
          select: {
            name: true,
            clientId: true,
          },
        },
        unit: {
          select: {
            unitId: true,
            number: true,
            propertyId: true,
            id: true,
          },
        },
        rentAgreement: {
          select: {
            id: true,

            rentAgreementNumber: true,
            renterId: true,
            unit: {
              select: {
                id: true,
                unitId: true,
                number: true,

                client: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        invoices: {
          include: {
            bankAccount: true,
          },
        },
      },
    });
    if (data.paymentType === "RENT") {
      await prisma.installment.update({
        where: { id: +payment.installmentId },
        data: {
          status: true,
        },
      });
    }
  }
  console.log(data, "data");
  await handlePaymentAccounting({
    payment,
    amount: +data.paidAmount,
    timeOfPayment: data.timeOfPayment,
  });
  return payment;
}

async function handlePaymentAccounting({ payment, amount, timeOfPayment }) {
  const ownersGlId = await getGLIdByCode("1210");
  const rentersGlId = await getGLIdByCode("1220");
  const checkingId = await getCompanyBankIdByType("CHECKING");
  const ownerId = payment.property.clientId;
  const renterId = payment.rentAgreement.renterId;
  const debitLine = await getDebitLineByPaymentId({ paymentId: payment.id });

  const paymentStatus = await checkForFullPaidByPaymentId({
    paymentId: payment.id,
    targetAmount: payment.amount,
  });
  if (paymentStatus.fullyPaid) {
    return;
  }
  let credit;
  let debit;
  let note;
  let debitNote;
  let creditNote;
  // =========================
  // 1) MANAGEMENT_COMMISSION
  // =========================
  if (payment.paymentType === "MANAGEMENT_COMMISSION") {
    if (!debitLine) return;

    const { creditLine } = await createJournalEntry({
      description: "تحصيل عمولة إدارة من المالك",
      lines: [
        {
          side: "DEBIT",
          amount: amount,
          companyBankAccountId: checkingId,
          memo: "تحصيل عمولة إدارة - بنك",
          rentAgreementId: payment.rentAgreement.id,
          unitId: Number(payment.rentAgreement.unit.id),
          propertyId: payment.rentAgreement.unit.propertyId,
          paymentId: payment.id,
          createdAt: timeOfPayment ? new Date(timeOfPayment) : new Date(),
        },
        {
          side: "CREDIT",
          amount: amount,
          glAccountId: ownersGlId,
          partyType: "OWNER",
          partyClientId: ownerId,
          memo: "تسوية ذمم المالك - عمولة إدارة",
          rentAgreementId: payment.rentAgreement.id,
          unitId: Number(payment.rentAgreement.unit.id),
          propertyId: payment.rentAgreement.unit.propertyId,
          paymentId: payment.id,
          createdAt: timeOfPayment ? new Date(timeOfPayment) : new Date(),
        },
      ],
    });

    credit = creditLine;
    debit = debitLine;
    note = `تسوية عمولة إدارة - RA#${payment.rentAgreement.id}`;
    debitNote = "تسوية عمولة إدارة - استحقاق";
    creditNote = "تسوية عمولة إدارة - تحصيل";
  }

  // =========================
  // 2) REGISTRATION (on renter)
  // =========================
  if (payment.paymentType === "REGISTRATION") {
    if (!debitLine) return;

    const { creditLine } = await createJournalEntry({
      description: "تحصيل رسوم تسجيل عقد من المستأجر",
      lines: [
        {
          side: "DEBIT",
          amount: amount,
          companyBankAccountId: checkingId,
          memo: "تحصيل رسوم تسجيل - بنك",
          rentAgreementId: payment.rentAgreement.id,
          unitId: Number(payment.rentAgreement.unit.id),
          propertyId: payment.rentAgreement.unit.propertyId,
          paymentId: payment.id,
          createdAt: timeOfPayment ? new Date(timeOfPayment) : new Date(),
        },
        {
          side: "CREDIT",
          amount: amount,
          glAccountId: rentersGlId,
          partyType: "RENTER",
          partyClientId: renterId,
          memo: "تسوية ذمم المستأجر - رسوم تسجيل",
          rentAgreementId: payment.rentAgreement.id,
          unitId: Number(payment.rentAgreement.unit.id),
          propertyId: payment.rentAgreement.unit.propertyId,
          paymentId: payment.id,
          createdAt: timeOfPayment ? new Date(timeOfPayment) : new Date(),
        },
      ],
    });

    credit = creditLine;
    debit = debitLine;
    note = `تسوية رسوم تسجيل - RA#${payment.rentAgreement.id}`;
    debitNote = "تسوية رسوم تسجيل - استحقاق";
    creditNote = "تسوية رسوم تسجيل - تحصيل";
  }

  // =========================
  // 3) TAX (on renter)
  // =========================
  if (payment.paymentType === "TAX") {
    if (!debitLine) return;

    const { creditLine } = await createJournalEntry({
      description: "تحصيل ضريبة من المستأجر",
      lines: [
        {
          side: "DEBIT",
          amount: amount,
          companyBankAccountId: checkingId,
          memo: "تحصيل ضريبة - بنك",
          rentAgreementId: payment.rentAgreement.id,
          unitId: Number(payment.rentAgreement.unit.id),
          propertyId: payment.rentAgreement.unit.propertyId,
          paymentId: payment.id,
          createdAt: timeOfPayment ? new Date(timeOfPayment) : new Date(),
        },
        {
          side: "CREDIT",
          amount: amount,
          glAccountId: rentersGlId,
          partyType: "RENTER",
          partyClientId: renterId,
          memo: "تسوية ذمم المستأجر - ضريبة",
          rentAgreementId: payment.rentAgreement.id,
          unitId: Number(payment.rentAgreement.unit.id),
          propertyId: payment.rentAgreement.unit.propertyId,
          paymentId: payment.id,
          createdAt: timeOfPayment ? new Date(timeOfPayment) : new Date(),
        },
      ],
    });

    credit = creditLine;
    debit = debitLine;
    note = `تسوية ضريبة - RA#${payment.rentAgreement.id}`;
    debitNote = "تسوية ضريبة - استحقاق";
    creditNote = "تسوية ضريبة - تحصيل";
  }

  // =========================
  // 4) MAINTENANCE (owner reimburses)
  // =========================
  if (payment.paymentType === "MAINTENANCE") {
    if (!debitLine) return;

    const { creditLine } = await createJournalEntry({
      description: "تحصيل صيانة من المالك",
      lines: [
        {
          side: "DEBIT",
          amount: amount,
          companyBankAccountId: checkingId, // يرجع للحساب الجاري
          memo: "تحصيل صيانة - بنك",
          unitId: Number(payment.unit.id),
          propertyId: payment.unit.propertyId,
          maintenanceId: payment.maintenanceId,
          paymentId: payment.id,
          createdAt: timeOfPayment ? new Date(timeOfPayment) : new Date(),
        },
        {
          side: "CREDIT",
          amount: amount,
          glAccountId: ownersGlId,
          partyType: "OWNER",
          partyClientId: ownerId,
          memo: "تسوية ذمم المالك - صيانة",
          unitId: Number(payment.unit.id),
          propertyId: payment.unit.propertyId,
          maintenanceId: payment.maintenanceId,
          paymentId: payment.id,
          createdAt: timeOfPayment ? new Date(timeOfPayment) : new Date(),
        },
      ],
    });
    credit = creditLine;
    debit = debitLine;
    note = `تسوية صيانة - Property#${propertyId} - Unit#${payment.unit.unitId}`;
    debitNote = "تسوية صيانة - استحقاق";
    creditNote = "تسوية صيانة - تحصيل";
  }

  // =========================
  // 5) INSURANCE (security deposit from renter) — NO settlement
  // =========================
  if (payment.paymentType === "INSURANCE") {
    const savingsId = await getCompanyBankIdByType("SAVINGS"); // نودع التأمين في التوفير
    const depositsGlId = await getGLIdByCode("2100"); // أمانات المستأجرين (تأمينات)
    const renterId = payment.rentAgreement.renterId;

    await createJournalEntry({
      description: "استلام وديعة تأمين من المستأجر",
      lines: [
        {
          side: "DEBIT",
          amount: amount,
          companyBankAccountId: savingsId,
          memo: "وديعة تأمين - بنك توفير",
          rentAgreementId: payment.rentAgreement.id,
          unitId: Number(payment.rentAgreement.unit.id),
          propertyId: payment.rentAgreement.unit.propertyId,
          paymentId: payment.id,
          createdAt: timeOfPayment ? new Date(timeOfPayment) : new Date(),
        },
        {
          side: "CREDIT",
          amount: amount,
          glAccountId: depositsGlId,
          partyType: "RENTER",
          partyClientId: renterId,
          memo: "أمانات مستأجرين (تأمين)",
          rentAgreementId: payment.rentAgreement.id,
          unitId: Number(payment.rentAgreement.unit.id),
          propertyId: payment.rentAgreement.unit.propertyId,
          paymentId: payment.id,
          createdAt: timeOfPayment ? new Date(timeOfPayment) : new Date(),
        },
      ],
    });
    let sd = await prisma.securityDeposit.findFirst({
      where: {
        renterId: renterId,
        unitId: Number(payment.rentAgreement.unit.id),
        rentAgreementId: payment.rentAgreement.id,
        paymentId: payment.id,
      },
    });
    if (!sd) {
      sd = await prisma.securityDeposit.create({
        data: {
          amount: amount,
          renterId: renterId,
          unitId: Number(payment.rentAgreement.unit.id),
          rentAgreementId: payment.rentAgreement.id,
          paymentId: payment.id,
          createdAt: timeOfPayment ? new Date(timeOfPayment) : new Date(),
        },
      });
    } else {
      await prisma.securityDeposit.update({
        where: {
          renterId: renterId,
          unitId: Number(payment.rentAgreement.unit.id),
          rentAgreementId: payment.rentAgreement.id,
          paymentId: payment.id,
        },
        data: {
          amount: payment.paidAmount,
        },
      });
    }
    await prisma.journalLine.updateMany({
      where: { paymentId: payment.id },
      data: { securityDepositId: sd.id },
    });

    return;
  }
  // ================
  // SETTLEMENT CALL
  // ================

  if (credit && debit) {
    const matches = [
      {
        debitLineId: debit.id,
        creditLineId: credit.id,
        amount,
        paymentId: payment.id,
        targetAmount: payment.amount,
        debitNote: debitNote,
        creditNote: creditNote,
        createdAt: timeOfPayment ? new Date(timeOfPayment) : new Date(),
      },
    ];
    await settleLines({ matches, note });
  }
}
