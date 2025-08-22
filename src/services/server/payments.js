import prisma from "@/lib/prisma"; // Adjust the path to your Prisma instance
import { addMonths, endOfMonth, isSameMonth, startOfMonth } from "date-fns";
import { updateWhereClauseWithUserProperties } from "@/app/api/utlis/userProperties";

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
  const clientId = searchParams.get("clientId");
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
    if (data.paymentType === "RENT") {
      await prisma.installment.update({
        where: { id: +payment.installmentId },
        data: {
          status: true,
        },
      });
    }
  }
  return payment;
}
