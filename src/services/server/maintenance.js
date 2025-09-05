// services/maintenanceService.js
import prisma from "@/lib/prisma";
import { convertToISO } from "@/helpers/functions/convertDateToIso";
import { updateWhereClauseWithUserProperties } from "@/app/api/utlis/userProperties";
import { createJournalEntry, getGLIdByCode } from "./accounting/main";
import { createInvoice } from "./invioces";
const PayEvery = {
  ONCE: 1,
  ONE_MONTH: 1,
  TWO_MONTHS: 2,
  FOUR_MONTHS: 4,
  SIX_MONTHS: 6,
  ONE_YEAR: 12,
};
export const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
export async function createMaintenance(data) {
  const extraData = data.extraData;
  const ownerId = data.payer === "OWNER" ? extraData.ownerId : null;
  const description = data.description;
  const submitData = {
    description: description,
    cost: +data.cost,
    date: convertToISO(data.date),
    isPaid: data.payer !== "OWNER",
    payer: data.payer,
    property: data.propertyId
      ? {
          connect: {
            id: +data.propertyId,
          },
        }
      : undefined,
    client: ownerId
      ? {
          connect: {
            id: +ownerId,
          },
        }
      : undefined,
    unit: data.unitId
      ? {
          connect: {
            id: +data.unitId,
          },
        }
      : undefined,
    type: {
      connect: {
        id: +data.typeId,
      },
    },
    totalPrice: +data.cost,
    payEvery: data.payEvery,
  };
  try {
    const newMaintenance = await prisma.maintenance.create({
      data: submitData,
      include: {
        payments: true,
        installments: true,
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        type: {
          select: {
            id: true,
            name: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitId: true,
            number: true,
          },
        },
      },
    });

    return {
      data: newMaintenance,
      message: "تمت إضافة الصيانة بنجاح",
      status: 200,
    };
  } catch (error) {
    console.error("Error creating maintenance:", error);
    throw error;
  }
}

export async function createMaintenenceInstallmentsAndPayments(data) {
  const { maintenance, payEvery, glAccountId } = data;
  const payer = maintenance.payer;
  let installmentsArr = [];
  let paymentsArr = [];
  console.log(data, "data");
  const maintenanceType = await prisma.maintenance.findUnique({
    where: {
      id: Number(maintenance.id),
    },
    select: {
      type: {
        select: {
          name: true,
        },
      },
    },
  });

  try {
    if (payEvery === "ONCE") {
      const createdInstallment = await prisma.maintenanceInstallment.create({
        data: {
          startDate: convertToISO(new Date(maintenance.date)),
          endDate: convertToISO(new Date(maintenance.date)),
          status: false,
          maintenanceId: maintenance.id,
          amount: maintenance.totalPrice,
          date: convertToISO(new Date(maintenance.date)),
        },
      });

      const payment = await prisma.payment.create({
        data: {
          amount: maintenance.totalPrice,
          paidAmount: payer === "OWNER" ? 0 : maintenance.totalPrice,
          dueDate: convertToISO(new Date(maintenance.date)),
          status: payer === "OWNER" ? "PENDING" : "PAID",
          paymentTypeMethod: data.paymentMethodType
            ? data.paymentMethodType
            : "CASH",
          client: maintenance.ownerId
            ? {
                connect: {
                  id: maintenance.ownerId,
                },
              }
            : undefined,
          property: maintenance.propertyId
            ? {
                connect: {
                  id: maintenance.propertyId,
                },
              }
            : undefined,

          unit: maintenance.unitId
            ? {
                connect: {
                  id: maintenance.unitId,
                },
              }
            : undefined,
          maintenance: {
            connect: {
              id: maintenance.id,
            },
          },
          maintenanceInstallment: {
            connect: {
              id: createdInstallment.id,
            },
          },
          paymentType: "MAINTENANCE",
        },
        select: {
          id: true,
          amount: true,
          maintenanceId: true,
          status: true,
          propertyId: true,
          dueDate: true,
          paidAmount: true,
          unit: {
            select: {
              id: true,
              unitId: true,
            },
          },

          property: {
            select: {
              id: true,
              name: true,
              clientId: true,
            },
          },
        },
      });
      if (payment.status === "PAID") {
        const invoiceData = {
          invoiceType: "MAINTENANCE",
          paymentId: payment.id,
          maintenanceId: payment.maintenanceId,
          paidAmount: payment.paidAmount,
          description: `فاتورة مصروف ${maintenanceType.type.name}`,
          timeOfPayment: payment.dueDate,
          title: `فاتورة مصروف ${maintenanceType.type.name}`,
        };
        await createInvoice(invoiceData);
      }
      await handleMaintenanceAccounting({
        payment,
        maintenanceType,
        maintenanceDate: convertToISO(new Date(maintenance.date)),
        payer: payer,
        glAccountId,
      });

      installmentsArr.push(createdInstallment);
      paymentsArr.push(payment);
      return {
        data: {
          installments: installmentsArr,
          payments: paymentsArr,
        },
        message: "تمت إضافة الدفعات بنجاح",
      };
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const monthDifference =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      endDate.getMonth() -
      startDate.getMonth();
    const totalInstallments = Math.ceil(monthDifference / PayEvery[payEvery]);
    const installmentBaseAmount = maintenance.totalPrice / totalInstallments;
    let remainingAmount = maintenance.totalPrice;
    const installments = Array(totalInstallments)
      .fill()
      .map((_, i) => {
        let dueDate = new Date(startDate);
        dueDate.setMonth(startDate.getMonth() + i * PayEvery[payEvery]);
        const endDate = new Date(dueDate);
        endDate.setMonth(dueDate.getMonth() + PayEvery[payEvery]);

        let installmentAmount;
        if (i === totalInstallments - 1) {
          // installmentAmount = remainingAmount;
          installmentAmount = maintenance.totalPrice;
        } else {
          installmentAmount = maintenance.totalPrice;

          // installmentAmount = Math.round(installmentBaseAmount / 50) * 50;
          // remainingAmount -= installmentAmount;
        }

        return {
          startDate: convertToISO(startDate),
          dueDate: convertToISO(dueDate),
          endDate: convertToISO(endDate),
          status: false,
          maintenanceId: maintenance.id,
          amount: installmentAmount,
          date: convertToISO(maintenance.date),
        };
      });

    for (let i = 0; i < installments.length; i++) {
      const installment = installments[i];
      const dueDate = new Date(installment.dueDate);
      delete installment.dueDate;
      const amount = installment.amount;
      const createdInstallment = await prisma.maintenanceInstallment.create({
        data: installment,
      });

      installmentsArr.push(createdInstallment);
      const payment = await prisma.payment.create({
        data: {
          amount: amount,
          dueDate: dueDate,
          status: "PENDING",
          paymentTypeMethod: data.paymentMethodType
            ? data.paymentMethodType
            : "CASH",
          client: {
            connect: {
              id: maintenance.ownerId,
            },
          },
          property: {
            connect: {
              id: maintenance.propertyId,
            },
          },
          maintenance: {
            connect: {
              id: maintenance.id,
            },
          },
          maintenanceInstallment: {
            connect: {
              id: createdInstallment.id,
            },
          },
          unit: maintenance.unitId
            ? {
                connect: {
                  id: maintenance.unitId,
                },
              }
            : undefined,
          paymentType: "MAINTENANCE",
        },
        select: {
          id: true,
          amount: true,
          maintenanceId: true,
          dueDate: true,
          unit: {
            select: {
              id: true,
              unitId: true,
            },
          },
          property: {
            select: {
              id: true,
              name: true,
              clientId: true,
            },
          },
        },
      });
      await handleMaintenanceAccounting({ payment, maintenanceType });
      paymentsArr.push(payment);
    }
    return {
      data: {
        installments: installmentsArr,
        payments: paymentsArr,
      },
      message: "تمت إضافة الدفعات بنجاح",
    };
  } catch (error) {
    console.error("Error creating installments and payments:", error);
    throw error;
  }
}
async function handleMaintenanceAccounting({
  payment,
  maintenanceType,
  maintenanceDate,
  payer,
  glAccountId,
}) {
  const bankType = "CHECKING";
  const amount = Number(payment.amount);

  const propertyId = payment.property?.id;
  const propertyName = payment.property?.name;

  const ownerId = payment.property?.clientId;
  const maintenanceId = payment.maintenanceId ?? null; // لو موجود
  const type = maintenanceType.type.name;
  const ownersGlId = await getGLIdByCode("1210");
  const checkingGlId = await getGLIdByCode("1110");
  const unitId = payment.unit?.unitId ?? null;
  // قيّد القيد

  const description =
    payer === "OWNER"
      ? `دفع ${type} نيابة عن المالك`
      : `مصروف علي الشركة - ${type}`;

  const debitMemo =
    payer === "OWNER"
      ? `استحقاق ${type} على المالك`
      : `${type} مستحق على الشركة`;
  if (propertyName) {
    description.concat(` - العقار اسم ${propertyName}`);
  }
  if (unitId) {
    description.concat(` - معرف الوحدة ${unitId}`);
  }

  const { debitLine, creditLine, entry } = await createJournalEntry({
    description: description,
    entryDate: maintenanceDate || payment.dueDate || new Date(),
    lines: [
      {
        side: "DEBIT",
        amount,
        glAccountId: payer === "OWNER" ? ownersGlId : glAccountId,
        partyType: payer === "OWNER" ? "OWNER" : null,
        partyClientId: payer === "OWNER" ? ownerId : null,
        memo: debitMemo,
        propertyId,
        maintenanceId,
        paymentId: payment.id,
        createdAt: maintenanceDate || payment.dueDate || new Date(),
      },
      {
        side: "CREDIT",
        amount,
        glAccountId: checkingGlId,
        memo: `دفع ${type} - ${bankType}`,
        propertyId,
        maintenanceId,
        paymentId: payment.id,
        createdAt: maintenanceDate || payment.dueDate || new Date(),
      },
    ],
  });

  return {
    entryId: entry.id,
    debitLineId: debitLine?.id,
    creditLineId: creditLine?.id,
  };
}
export async function getMaintenanceContracts(page, limit, searchParams) {
  const offset = (page - 1) * limit;
  const filters = searchParams.get("filters")
    ? JSON.parse(searchParams.get("filters"))
    : {};
  const { propertyId, startDate, endDate } = filters;
  let where = { payEvery: { not: "ONCE" } };
  if (propertyId && propertyId !== "all") {
    where.propertyId = parseInt(propertyId);
  } else {
    where = await updateWhereClauseWithUserProperties("propertyId", where);
  }

  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  } else if (startDate) {
    where.date = {
      gte: new Date(startDate),
    };
  } else if (endDate) {
    where.date = {
      lte: new Date(endDate),
    };
  }

  const maintenances = await prisma.maintenance.findMany({
    skip: offset,
    take: limit,
    where,
    include: {
      property: {
        select: {
          id: true,
          name: true,
        },
      },
      type: {
        select: {
          id: true,
          name: true,
        },
      },
      payments: {
        select: {
          amount: true,
          dueDate: true,
          status: true,
          paidAmount: true,
        },
      },
      installments: {
        select: {
          startDate: true,
          endDate: true,
          amount: true,
        },
      },
    },
  });

  const total = await prisma.maintenance.count({ where });

  return {
    data: maintenances,
    page,
    total,
  };
}

export async function getMaintenances(page, limit, searchParams) {
  const offset = (page - 1) * limit;
  const filters = searchParams.get("filters")
    ? JSON.parse(searchParams.get("filters"))
    : {};
  const { propertyId, startDate, endDate } = filters;
  let where = { payEvery: "ONCE" };
  if (propertyId && propertyId !== "all") {
    where.propertyId = parseInt(propertyId);
  } else {
    where = await updateWhereClauseWithUserProperties("propertyId", where);
  }
  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  } else if (startDate) {
    where.date = {
      gte: new Date(startDate),
    };
  } else if (endDate) {
    where.date = {
      lte: new Date(endDate),
    };
  }

  const maintenances = await prisma.maintenance.findMany({
    skip: offset,
    take: limit,
    where,
    include: {
      property: {
        select: {
          id: true,
          name: true,
        },
      },
      unit: true,
      type: {
        select: {
          id: true,
          name: true,
        },
      },
      payments: {
        select: {
          amount: true,
          dueDate: true,
          status: true,
          paidAmount: true,
        },
      },
      installments: {
        select: {
          startDate: true,
          endDate: true,
          amount: true,
        },
      },
    },
  });

  const total = await prisma.maintenance.count({ where });

  return {
    data: maintenances,
    page,
    total,
  };
}

export async function getMaintenanceById(id) {
  try {
    const maintenance = await prisma.maintenance.findUnique({
      where: { id: +id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitId: true,
          },
        },
        type: {
          select: {
            id: true,
            name: true,
          },
        },
        payments: true,
        installments: true,
      },
    });

    return {
      data: maintenance,
    };
  } catch (error) {
    console.error("Error fetching maintenance:", error);
    throw error;
  }
}

export async function updateMaintenance(id, data) {
  const updatedMaintenance = await prisma.maintenance.update({
    where: { id: parseInt(id, 10) },
    data: {
      date: convertToISO(data.date),
      type: {
        connect: {
          id: +data.typeId,
        },
      },
    },
    include: {
      type: true,
    },
  });

  return updatedMaintenance;
}

export async function getMaintenanceInstallments(id) {
  try {
    const installments = await prisma.maintenanceInstallment.findMany({
      where: {
        maintenanceId: +id,
      },
      include: {
        maintenance: true,
        payments: true,
      },
    });
    return {
      data: installments,
    };
  } catch (error) {
    console.error("Error fetching maintenance installments:", error);
    throw error;
  }
}

export async function deleteMaintenance(id) {
  try {
    const payments = await prisma.payment.findMany({
      where: {
        maintenanceId: +id,
      },
      select: {
        id: true,
      },
    });
    const paymentIds = payments.map((p) => p.id);
    await prisma.journalEntry.deleteMany({
      where: {
        lines: {
          some: {
            paymentId: { in: paymentIds },
          },
        },
      },
    });
    await prisma.invoice.deleteMany({
      where: {
        paymentId: {
          in: paymentIds,
        },
      },
    });
    await prisma.payment.deleteMany({
      where: {
        maintenanceId: +id,
      },
    });
    await prisma.maintenance.delete({
      where: { id: +id },
    });

    return {
      message: "تم حذف الصيانة بنجاح",
    };
  } catch (error) {
    console.error("Error deleting maintenance:", error);
    throw error;
  }
}
