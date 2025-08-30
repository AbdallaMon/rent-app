import prisma from "@/lib/prisma"; // Adjust the path to your Prisma instance
import { convertToISO } from "@/helpers/functions/convertDateToIso";
import { generateUniqueId } from "@/helpers/functions/generateUniqueId";
import { updateWhereClauseWithUserProperties } from "@/app/api/utlis/userProperties";
import { sendNotifications } from "@/lib/notifications";
import { createJournalEntry, getGLIdByCode } from "./accounting/main.js";
const RentCollectionType = {
  TWO_MONTHS: 2,
  THREE_MONTHS: 3,
  FOUR_MONTHS: 4,
  SIX_MONTHS: 6,
  ONE_YEAR: 12,
};

export async function getRentAgreements(_, limit, searchParams, params) {
  const page = searchParams.get("?page") || 1;
  const offset = (page - 1) * limit;
  const whereClause = {};
  const propertyId = searchParams.get("propertyId");
  const sort = searchParams.get("sort") || "createdAt";
  const order = searchParams.get("order") || "desc";

  const rented = searchParams.get("rented");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (propertyId && propertyId !== "all") {
    whereClause.unit = {
      propertyId: +propertyId,
    };
  } else {
    let unitWhere = {};
    unitWhere = await updateWhereClauseWithUserProperties(
      "propertyId",
      unitWhere
    );
    whereClause.unit = unitWhere;
  }

  if (rented !== undefined) {
    if (rented === "true") {
      whereClause.status = "ACTIVE";
      whereClause.endDate = {
        gt: today,
      };
    } else if (rented === "false") {
      whereClause.status = { not: "ACTIVE" };
    } else {
      whereClause.status = "ACTIVE";
      whereClause.endDate = {
        lte: today,
      };
    }
  }

  // Create orderBy object based on sort and order parameters
  const orderBy = {};
  // Check if sort is a valid string and not an object
  if (sort && typeof sort === "string" && sort !== "{}") {
    orderBy[sort] = order.toLowerCase();
  } else {
    // Default to ordering by createdAt if sort is invalid
    orderBy["createdAt"] = "desc";
  }

  const rentAgreements = await prisma.rentAgreement.findMany({
    skip: offset,
    take: limit,
    where: whereClause,
    orderBy: orderBy,
    include: {
      renter: {
        select: {
          id: true,
          name: true,
          language: true,
        },
      },
      unit: {
        select: {
          id: true,
          unitId: true,
          number: true,
          property: {
            select: {
              id: true,
              name: true,
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
    },
  });

  const total = await prisma.rentAgreement.count({
    where: whereClause,
  });

  return {
    data: rentAgreements,
    page,
    total,
  };
}

export async function updateRentAgreement(id, data, params, searchParams) {
  const installments = searchParams.get("installments");
  const otherExpenses = searchParams.get("otherExpenses");
  const feeInvoices = searchParams.get("feeInvoices");
  const renew = searchParams.get("renew");
  const cancel = searchParams.get("cancel");
  if (installments) {
    const noPaidPayments = await prisma.payment.findMany({
      where: {
        rentAgreementId: +id,
        OR: [{ status: "PENDING" }, { status: "OVERDUE" }],
      },
      include: {
        installment: true, // Include related installment
      },
    });
    await processPayments(noPaidPayments);
    return {
      data: {},
      message: "تم تحديث الدفعات القديمة بنجاح",
    };
  }
  if (feeInvoices) {
    const noPaidPayments = await prisma.payment.findMany({
      where: {
        rentAgreementId: +id,
        paymentType: {
          in: ["TAX", "INSURANCE", "REGISTRATION", "MANAGEMENT_COMMISSION"],
        },
        OR: [{ status: "PENDING" }, { status: "OVERDUE" }],
      },
    });
    await processPayments(noPaidPayments, false);
    return {
      data: {},
      message: "تم تحديث رسوم العقد بنجاح",
    };
  }
  if (otherExpenses) {
    const noPaidPayments = await prisma.payment.findMany({
      where: {
        rentAgreementId: +id,
        paymentType: "OTHER_EXPENSE",
        OR: [{ status: "PENDING" }, { status: "OVERDUE" }],
      },
    });
    await processPayments(noPaidPayments, false);
    return {
      data: {},
      message: "تم تحديث مصروفات اخري بنجاح",
    };
  }
  await prisma.journalEntry.deleteMany({
    where: {
      lines: {
        some: {
          rentAgreementId: +id,
          isSettled: false,
          settlementLines: { none: {} },
        },
      },
    },
  });
  if (renew) {
    await prisma.rentAgreement.update({
      where: {
        id: +id,
      },
      data: {
        status: "EXPIRED",
      },
    });
  }
  if (cancel) {
    await prisma.rentAgreement.update({
      where: {
        id: +id,
      },
      data: {
        status: "CANCELED",
      },
    });
  }
}

async function processPayments(payments) {
  for (const payment of payments) {
    if (payment.paidAmount > 1) {
      let updateData = {
        status: "PAID",
        amount: payment.paidAmount,
      };

      if (payment.installment) {
        updateData.installment = {
          update: {
            status: true,
          },
        };
      }

      await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: updateData,
      });
    } else {
      if (payment.installment) {
        // If there's a related installment
        await prisma.installment.delete({
          where: {
            id: payment.installment.id,
          },
        });
      } else {
        await prisma.payment.delete({
          where: {
            id: payment.id,
          },
        });
      }
    }
  }
}

export async function deleteRentAgreement(id) {
  try {
    // Delete related invoices
    await prisma.invoice.deleteMany({
      where: {
        rentAgreementId: id,
      },
    });

    // Delete related installments
    await prisma.installment.deleteMany({
      where: {
        rentAgreementId: id,
      },
    });
    await prisma.payment.deleteMany({
      where: {
        rentAgreementId: id,
      },
    });
    await prisma.journalEntry.deleteMany({
      where: {
        lines: {
          some: {
            rentAgreementId: id,
          },
        },
      },
    });
    await prisma.contractExpenseToRentAgreement.deleteMany({
      where: {
        rentAgreementId: +id,
      },
    });
    await prisma.rentAgreement.delete({
      where: { id },
    });
  } catch (error) {
    console.error(`Error deleting rent agreement with id ${id}:`, error);
    throw error;
  }
}

export async function getRentAgreementById(page, limit, serachParams, params) {
  const { id } = params;
  let where = { id: +id };
  let unitWhere = {};
  unitWhere = await updateWhereClauseWithUserProperties(
    "propertyId",
    unitWhere
  );
  where.unit = unitWhere;
  try {
    const rentAgreement = await prisma.rentAgreement.findUnique({
      where,
      include: {
        renter: {
          select: {
            id: true,
            name: true,
            language: true,
          },
        },
        contractExpenses: {
          select: {
            contractExpense: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitId: true,
            number: true,
            property: {
              select: {
                id: true,
                name: true,
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
      },
    });
    if (!rentAgreement) {
      return {
        data: {},
        status: 401,
      };
    }
    return {
      data: rentAgreement,
    };
  } catch (error) {
    console.error("Error fetching rent agreement:", error);
    throw error;
  }
}

// rent creation with invoices
export async function createRentAgreement(data) {
  try {
    const newRentAgreement = await prisma.rentAgreement.create({
      data: {
        rentAgreementNumber: generateUniqueId(),
        startDate: convertToISO(data.startDate),
        endDate: convertToISO(data.endDate),
        tax: +data.tax,
        registrationFees: +data.registrationFees,
        insuranceFees: +data.insuranceFees,
        totalPrice: +data.totalPrice - data.discount,
        totalContractPrice: +data.totalPrice,
        rentCollectionType: data.rentCollectionType,
        renter: {
          connect: {
            id: +data.renterId,
          },
        },
        unit: {
          connect: {
            id: +data.unitId,
          },
        },
      },
      include: {
        contractExpenses: true,
        renter: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            language: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitId: true,
            number: true,
            propertyId: true,
            property: {
              select: {
                id: true,
                name: true,
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
      },
    });

    await prisma.unit.update({
      where: {
        id: +data.unitId,
      },
      data: {
        clientId: +data.renterId,
      },
    });

    // Send notifications asynchronously
    await sendNotifications(newRentAgreement);

    return {
      data: newRentAgreement,
      message: "تمت اضافه عقد الايجار بنجاح",
      status: 200,
    };
  } catch (error) {
    console.error("Error creating rent agreement:", error);
    throw error;
  }
}

export async function createInstallmentsAndPayments(rentAgreement) {
  try {
    const { rentCollectionType, startDate, endDate, installments } =
      rentAgreement;

    const start = new Date(startDate);
    // const end = new Date(endDate);
    // const monthDifference =
    //       (end.getFullYear() - start.getFullYear()) * 12 +
    //       end.getMonth() -
    //       start.getMonth();
    //
    // const totalInstallments = Math.ceil(
    //       monthDifference / RentCollectionType[rentCollectionType],
    // );
    // const installmentBaseAmount = rentAgreement.totalPrice / totalInstallments;
    // let remainingAmount = rentAgreement.totalPrice;
    //
    const installmentsData = installments.map((_, i) => {
      let dueDate = new Date(installments[i].dueDate);
      const endDate = new Date(dueDate);
      endDate.setMonth(
        dueDate.getMonth() + RentCollectionType[rentCollectionType]
      );

      // let installmentAmount
      // if (i === totalInstallments - 1) {
      //     installmentAmount = remainingAmount;
      // } else {
      //     installmentAmount = Math.round(installmentBaseAmount / 50) * 50;
      //     remainingAmount -= installmentAmount;
      // }

      return {
        startDate: convertToISO(start),
        dueDate: convertToISO(dueDate),
        endDate: convertToISO(endDate),
        status: false,
        rentAgreementId: rentAgreement.id,
        amount: installments[i].amount,
      };
    });

    for (let i = 0; i < installmentsData.length; i++) {
      const installment = installmentsData[i];
      const dueDate = new Date(installment.dueDate);
      const amount = +installment.amount;
      delete installment.dueDate;
      delete installment.amount;

      const createdInstallment = await prisma.installment.create({
        data: installment,
      });

      await prisma.payment.create({
        data: {
          amount: amount,
          dueDate: dueDate,
          status: "PENDING",
          clientId: rentAgreement.unit.property.client.id,
          propertyId: rentAgreement.unit.property.id,
          rentAgreementId: rentAgreement.id,
          installmentId: createdInstallment.id,
          paymentType: "RENT",
        },
      });
    }

    return {
      data: {},
      message: "تمت إضافة الدفعات بنجاح",
    };
  } catch (error) {
    console.error("Error creating installments and payments:", error);
    throw error;
  }
}

export async function createFeePayments(rentAgreement) {
  const unitId = rentAgreement.unitId;
  try {
    // جلب معلومات العقار لحساب عمولة الإدارة
    const property = await prisma.property.findUnique({
      where: { id: rentAgreement.unit.property.id },
      select: { managementCommission: true },
    });

    const managementCommission = property?.managementCommission || 3;
    const managementCommissionAmount =
      (+rentAgreement.totalPrice * managementCommission) / 100;

    const feeInvoices = [
      {
        amount: (rentAgreement.tax * rentAgreement.totalPrice) / 100,
        dueDate: rentAgreement.startDate,
        status: "PENDING",
        paymentType: "TAX",
      },
      {
        amount: rentAgreement.insuranceFees,
        dueDate: rentAgreement.startDate,
        status: "PENDING",
        paymentType: "INSURANCE",
      },
      {
        amount: rentAgreement.registrationFees,
        dueDate: rentAgreement.startDate,
        status: "PENDING",
        paymentType: "REGISTRATION",
      },
      {
        amount: managementCommissionAmount,
        dueDate: rentAgreement.startDate,
        status: "PENDING",
        paymentType: "MANAGEMENT_COMMISSION",
        title: `عمولة إدارة ${managementCommission}% من إجمالي العقد`,
      },
    ];

    for (let i = 0; i < feeInvoices.length; i++) {
      let payment = feeInvoices[i];
      payment.amount = Math.round(payment.amount / 50) * 50;
      console.log(payment, "payment");
      if (payment.amount > 1) {
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
                id: +unitId,
              },
            },
            rentAgreement: {
              connect: {
                id: rentAgreement.id,
              },
            },
          },
        });
        await handleRentagreementAccounting({
          paymentId: paymentRequest.id,
          rentAgreement,
          payment,
          unitId,
          managementCommission,
        });
      }
    }
    return {
      data: {},
      message: "تمت اضافه رسوم العقد بنجاح",
    };
  } catch (error) {
    console.error("Error creating fee invoices:", error);
    throw error;
  }
}
async function handleRentagreementAccounting({
  rentAgreement,
  payment,
  unitId,
  paymentId,
  managementCommission,
}) {
  try {
    const ownersGlId = await getGLIdByCode("1210");
    const commissionRevenueGlId = await getGLIdByCode("4000");
    const ownerId = rentAgreement.unit.property.client.id;
    const renterId = rentAgreement.renterId;
    const rentersGlId = await getGLIdByCode("1220");
    const regRevenueGlId = await getGLIdByCode("4100");
    if (payment.paymentType === "MANAGEMENT_COMMISSION") {
      await createJournalEntry({
        description: `عمولة إدارة ${managementCommission}% من إجمالي العقد`,
        lines: [
          {
            side: "DEBIT",
            amount: payment.amount,
            partyType: "OWNER",
            partyClientId: ownerId,
            glAccountId: ownersGlId,
            memo: "استحقاق عمولة إدارة",
            rentAgreementId: rentAgreement.id,
            unitId: Number(unitId),
            propertyId: rentAgreement.unit.property.id,
            paymentId,
          },
          {
            side: "CREDIT",
            amount: payment.amount,
            glAccountId: commissionRevenueGlId,
            memo: "عمولة إدارة",
            rentAgreementId: rentAgreement.id,
            unitId: Number(unitId),
            propertyId: rentAgreement.unit.property.id,
            paymentId,
          },
        ],
      });
    }

    if (payment.paymentType === "REGISTRATION") {
      await createJournalEntry({
        description: `رسوم تسجيل عقد على المستأجر`,
        lines: [
          {
            side: "DEBIT",
            amount: payment.amount,
            partyType: "RENTER",
            partyClientId: renterId,
            glAccountId: rentersGlId,
            memo: "استحقاق رسوم تسجيل",
            rentAgreementId: rentAgreement.id,
            unitId: Number(unitId),
            propertyId: rentAgreement.unit.property.id,
            paymentId,
          },
          {
            side: "CREDIT",
            amount: payment.amount,
            glAccountId: regRevenueGlId,
            memo: "إيرادات تسجيل عقد",
            rentAgreementId: rentAgreement.id,
            unitId: Number(unitId),
            propertyId: rentAgreement.unit.property.id,
            paymentId,
          },
        ],
      });
    }
    // if (payment.paymentType === "TAX") {
    //   await createJournalEntry({
    //     description: "استحقاق ضريبة على عقد الإيجار",
    //     lines: [
    //       {
    //         side: "DEBIT",
    //         amount: payment.amount,
    //         partyType: "RENTER",
    //         partyClientId: renterId,
    //         glAccountId: rentersGlId,
    //         memo: "ذمم مستأجرين - ضريبة",
    //         rentAgreementId: rentAgreement.id,
    //         unitId: Number(unitId),
    //         propertyId: rentAgreement.unit.property.id,
    //         paymentId,
    //       },
    //       {
    //         side: "CREDIT",
    //         amount: payment.amount,
    //         glAccountId: taxesPayableId,
    //         memo: "ضرائب مستحقة الدفع",
    //         rentAgreementId: rentAgreement.id,
    //         unitId: Number(unitId),
    //         propertyId: rentAgreement.unit.property.id,
    //         paymentId,
    //       },
    //     ],
    //   });
    // }
  } catch (error) {
    console.log(error.message, "error in rent agreement accounting");
  }
}
export async function createOtherExpensePayments({
  rentAgreement,
  otherExpenses,
}) {
  try {
    for (const otherExpense of otherExpenses) {
      let amount = Math.round(+otherExpense.value / 50) * 50;

      await prisma.payment.create({
        data: {
          title: otherExpense.name,
          amount: amount,
          dueDate: rentAgreement.startDate,
          clientId: rentAgreement.unit.property.client.id,
          propertyId: rentAgreement.unit.property.id,
          status: "PENDING",
          rentAgreementId: rentAgreement.id,
          paymentType: "OTHER_EXPENSE",
        },
      });
    }
    return {
      data: {},
      message: "تمت اضافه  مصروفات اخري بنجاح",
    };
  } catch (error) {
    console.error("Error creating other expenses invoices:", error);
    throw error;
  }
}

export async function createContractExpensePayments({
  rentAgreement,
  contractExpenses,
}) {
  try {
    for (const contractExpense of contractExpenses) {
      const contractExpenceToRent =
        await prisma.ContractExpenseToRentAgreement.create({
          data: {
            rentAgreementId: rentAgreement.id,
            contractExpenseId: +contractExpense.id,
          },
        });

      let amount = Math.round(contractExpense.value / 50) * 50;

      await prisma.payment.create({
        data: {
          amount: amount,
          dueDate: rentAgreement.startDate,
          clientId: rentAgreement.unit.property.client.id,
          propertyId: rentAgreement.unit.property.id,
          status: "PENDING",
          rentAgreementId: rentAgreement.id,
          paymentType: "CONTRACT_EXPENSE",
          contractExpenseId: contractExpenceToRent.id,
        },
      });
    }
    return {
      data: {},
      message: "تمت اضافه  مصروفات العقود بنجاح",
    };
  } catch (error) {
    console.error("Error creating contract expense invoices:", error);
    throw error;
  }
}

export async function getRentAgreementPaymentsForInstallments(
  page,
  limit,
  searchParams,
  params
) {
  const { id: rentAgreementId } = params;
  try {
    const payments = await prisma.payment.findMany({
      where: {
        rentAgreementId: +rentAgreementId,
        installmentId: {
          not: null,
        },
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
    console.error("Error fetching installments:", error);
    throw error;
  }
}

export async function gentRentAgreementPaymentsForFees(
  page,
  limit,
  searchParams,
  params
) {
  const { id: rentAgreementId } = params;
  try {
    const payments = await prisma.payment.findMany({
      where: {
        rentAgreementId: +rentAgreementId,
        paymentType: {
          in: ["TAX", "INSURANCE", "REGISTRATION", "MANAGEMENT_COMMISSION"],
        },
      },
      include: {
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
    console.error("Error fetching fees payments:", error);
    throw error;
  }
}

export async function getRentAgreementPaymentForContractExpences(
  page,
  limit,
  searchParams,
  params
) {
  const { id: rentAgreementId } = params;
  try {
    const payments = await prisma.payment.findMany({
      where: {
        rentAgreementId: +rentAgreementId,
        paymentType: "CONTRACT_EXPENSE",
      },
      include: {
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
    console.error("Error fetching contract expenses payments:", error);
    throw error;
  }
}

export async function getRentAgreementPaymentForOthersExpences(
  page,
  limit,
  searchParams,
  params
) {
  const { id: rentAgreementId } = params;
  try {
    const payments = await prisma.payment.findMany({
      where: {
        rentAgreementId: +rentAgreementId,
        paymentType: "OTHER_EXPENSE",
      },
      include: {
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
    console.error("Error fetching contract expenses payments:", error);
    throw error;
  }
}

export async function updateRentAgreementDescription(data, params) {
  const id = params.id;
  try {
    const updatedRentAgreement = await prisma.rentAgreement.update({
      where: {
        id: +id,
      },
      data: {
        customDescription: data.customDescription,
      },
    });

    return {
      data: updatedRentAgreement,
      message: "تم تحديث الوصف بنجاح",
    };
  } catch (error) {
    console.error("Error updating rent agreement description:", error);
    throw error;
  }
}

export async function getEndingRentAgreements() {
  const today = new Date();
  const twoMonthsFromToday = new Date();
  twoMonthsFromToday.setMonth(today.getMonth() + 2);
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(today.getMonth() - 3);

  // جلب العقود النشطة التي تنتهي خلال شهرين أو العقود المنتهية خلال 3 أشهر مضت
  const where = {
    OR: [
      {
        // العقود النشطة التي تنتهي قريباً
        status: "ACTIVE",
        endDate: {
          lte: twoMonthsFromToday,
        },
      },
      {
        // العقود المنتهية خلال 3 أشهر مضت (للمراجعة)
        status: "ACTIVE",
        endDate: {
          gte: threeMonthsAgo,
          lt: today,
        },
      },
    ],
  };

  let unitWhere = {};
  unitWhere = await updateWhereClauseWithUserProperties(
    "propertyId",
    unitWhere
  );
  where.unit = unitWhere;

  try {
    const rentAgreements = await prisma.rentAgreement.findMany({
      where,
      orderBy: {
        endDate: "asc", // ترتيب حسب تاريخ الانتهاء (الأقرب أولاً)
      },
      include: {
        renter: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            language: true,
          },
        },
        contractExpenses: {
          select: {
            contractExpense: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitId: true,
            number: true,
            floor: true,
            property: {
              select: {
                id: true,
                name: true,
                propertyId: true,
                client: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return {
      data: rentAgreements,
    };
  } catch (error) {
    console.error("Error fetching rent agreements:", error);
    throw error;
  }
}

export async function updateRentAgreementInstallmentsPaymentsData(data) {
  const payments = data;
  const updatedPayments = [];

  for (const payment of payments) {
    // Ensure dueDate is a Date object
    const dueDate = new Date(payment.dueDate);

    // Update the payment
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        amount: payment.amount,
        dueDate: dueDate.toISOString(),
      },
    });

    // Update the installment end date if necessary
    if (payment.installment) {
      const installmentEndDate = new Date(payment.installment.endDate);

      await prisma.installment.update({
        where: { id: payment.installment.id },
        data: {
          endDate: installmentEndDate.toISOString(),
        },
      });
    }

    updatedPayments.push(updatedPayment);
  }

  return {
    data: updatedPayments,
    message: "تم تحديث الدفعات بنجاح",
    status: 200,
  };
}
