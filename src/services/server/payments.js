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
  console.log(data, "data");
  const payment = await prisma.payment.update({
    where: { id: +params.id },
    data: {
      paymentTypeMethod: data.paymentTypeMethod,
      chequeNumber: data.chequeNumber ? data.chequeNumber : null,
      bankId: data.bankId ? data.bankId : null,
    },
    include: {
      installment: true,
      property: {
        select: {
          name: true,
          bankId: true,
          bank: {
            select: {
              id: true,
              name: true,
            },
          },
          bankAccount: {
            select: {
              accountNumber: true,
              id: true,
              bank: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      invoices: {
        include: {
          bankAccount: true,
        },
      },
    },
  });
  return payment;
}

export async function updatePayment(id, data) {
  let payment;

  const paymentData = await prisma.payment.findUnique({
    where: {
      id: Number(id),
    },
  });
  const restPayment =
    +paymentData.amount - (+paymentData.paidAmount + +data.paidAmount);
  try {
    if (paymentData.paymentType === "INSURANCE") {
      if (restPayment > 0) {
        throw new Error(
          "يجب ادخال المبلغ كاملا اذا كانت دفعة تامين حتي يتم انشاء وديعه بالمبلغ كاملا"
        );
      }
    }
    if (restPayment > 1) {
      payment = await prisma.payment.update({
        where: { id: +id },
        data: {
          paidAmount: +data.paidAmount + +paymentData.paidAmount,
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
                  property: {
                    select: {
                      name: true,
                      id: true,
                    },
                  },
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
          paidAmount: +data.paidAmount + +paymentData.paidAmount,
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
                  property: {
                    select: {
                      name: true,
                      id: true,
                    },
                  },
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
    await handlePaymentAccounting({
      payment,
      amount: +data.paidAmount,
      timeOfPayment: data.timeOfPayment,
    });
    return payment;
  } catch (e) {
    console.log(data, "data");
    throw new Error(e.message);
  }
}

async function handlePaymentAccounting({ payment, amount, timeOfPayment }) {
  const ownersGlId = await getGLIdByCode("1210");
  const rentersGlId = await getGLIdByCode("1220");
  const checkingGlId = await getGLIdByCode("1110");
  const ownerId = payment.property.clientId;
  const renterId = payment.rentAgreement?.renterId;
  const { debitLine, cred } = await getDebitLineByPaymentId({
    paymentId: payment.id,
  });
  const savingsGlId = await getGLIdByCode("1120");
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
      entryDate: timeOfPayment ? new Date(timeOfPayment) : new Date(),
      lines: [
        {
          side: "DEBIT",
          amount: amount,
          glAccountId: checkingGlId,
          memo: "تحصيل عمولة إدارة - بنك",
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
          propertyId: payment.rentAgreement.unit.property.id,
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
      entryDate: timeOfPayment ? new Date(timeOfPayment) : new Date(),

      description: "تحصيل رسوم تسجيل عقد من المستأجر",
      lines: [
        {
          side: "DEBIT",
          amount: amount,
          glAccountId: checkingGlId,
          memo: "تحصيل رسوم تسجيل - بنك",
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

  if (payment.paymentType === "MAINTENANCE") {
    if (!debitLine) return;

    const { creditLine } = await createJournalEntry({
      description: "تحصيل صيانة من المالك",
      entryDate: timeOfPayment ? new Date(timeOfPayment) : new Date(),

      lines: [
        {
          side: "DEBIT",
          amount: amount,
          glAccountId: cred.glAccountId || checkingGlId,
          memo: "تحصيل صيانة - بنك",
          createdAt: timeOfPayment ? new Date(timeOfPayment) : new Date(),
        },
        {
          side: "CREDIT",
          amount: amount,
          glAccountId: ownersGlId,
          partyType: "OWNER",
          partyClientId: ownerId,
          memo: "تسوية ذمم المالك - صيانة",
          unitId: Number(payment.unit?.id),
          propertyId: payment.propertyId,
          maintenanceId: payment.maintenanceId,
          paymentId: payment.id,
          createdAt: timeOfPayment ? new Date(timeOfPayment) : new Date(),
        },
      ],
    });
    credit = creditLine;
    debit = debitLine;
    note = `تسوية صيانة - Property#${payment.propertyId} - ${payment.unit ? "Unit #" + payment.unit.unitId : ""}`;
    debitNote = "تسوية صيانة - استحقاق";
    creditNote = "تسوية صيانة - تحصيل";
  }

  // =========================
  // 5) INSURANCE (security deposit from renter) — NO settlement
  // =========================
  if (payment.paymentType === "INSURANCE") {
    const depositsGlId = await getGLIdByCode("2100");
    const renterId = payment.rentAgreement.renterId;

    await createJournalEntry({
      description: "استلام وديعة تأمين من المستأجر",
      entryDate: timeOfPayment ? new Date(timeOfPayment) : new Date(),

      lines: [
        {
          side: "DEBIT",
          amount: amount,
          glAccountId: savingsGlId,
          memo: "وديعة تأمين - بنك توفير",
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
          receivedAt: timeOfPayment ? new Date(timeOfPayment) : new Date(),
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

export async function getSearchedPayments(page, limit, searchParams) {
  const filters = searchParams.get("filters")
    ? JSON.parse(searchParams.get("filters"))
    : {};
  const offset = (page - 1) * limit;

  let { bankId, mode, q } = filters;
  if (bankId === "undefined" || bankId === "all") bankId = null;
  if (bankId) {
    bankId = Number(bankId);
  }
  if (!q && !bankId) {
    const err = new Error("You must provide at least q or bankId.");
    err.status = 400;
    throw err;
  }
  // Build conditions
  const chequeCond = q ? { chequeNumber: { contains: q } } : null;
  const bankCond = bankId ? { bankId: bankId } : null;

  let where = {};
  if (mode === "AND" && chequeCond && bankCond) {
    where = { AND: [chequeCond, bankCond] };
  } else {
    // default OR: include only the provided ones
    const OR = [];
    if (chequeCond) OR.push(chequeCond);
    if (bankCond) OR.push(bankCond);
    where = OR.length === 1 ? OR[0] : { OR };
  }
  console.log(where, "where");
  const payments = await prisma.payment.findMany({
    where,
    skip: offset,
    take: limit,
    orderBy: { id: "desc" },
    include: {
      bank: true,
      property: true,
      unit: true,
      rentAgreement: {
        include: {
          renter: true,
          unit: true,
        },
      },
      maintenance: true,
    },
  });
  const total = await prisma.payment.count({ where });

  return { data: payments, page, total };
}
