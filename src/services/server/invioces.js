import prisma from "@/lib/prisma";
import { generateInvoiceDisplayId } from "@/helpers/functions/invoiceDisplayId";
import dayjs from "dayjs";
import { updatePayment } from "./payments";
export async function createInvoice(data) {
  const displayId = await generateInvoiceDisplayId(
    data.invoiceType || data.paymentType
  );

  const invoice = await prisma.invoice.create({
    data: {
      amount: +data.paidAmount || 0,
      description: data.description || "",
      title: data.title || "",
      chequeNumber: data.chequeNumber || "",
      invoiceType: data.invoiceType || data.paymentType || null,
      displayId: displayId, // إضافة الرقم التسلسلي الجديد
      createdAt: new Date(data.timeOfPayment || new Date()),
      paymentTypeMethod: data.paymentTypeMethod || "CASH",
      payment: data.paymentId ? { connect: { id: data.paymentId } } : undefined,
      renter: data.renterId ? { connect: { id: data.renterId } } : undefined,
      owner:
        data.ownerId || data.clientId
          ? { connect: { id: data.ownerId || data.clientId } }
          : undefined,
      bankAccount: data.bankAccount
        ? { connect: { id: +data.bankAccount } }
        : undefined,
      property: data.propertyId
        ? { connect: { id: data.propertyId } }
        : undefined,
      rentAgreement: data.rentAgreementId
        ? { connect: { id: data.rentAgreementId } }
        : undefined,
      installment: data.installmentId
        ? { connect: { id: data.installmentId } }
        : undefined,
      maintenance: data.maintenanceId
        ? { connect: { id: data.maintenanceId } }
        : undefined,
    },
    include: {
      bankAccount: true,
    },
  });
  console.log(invoice, "invoice");
  await createIncomeOrExpenseFromInvoice({
    ...invoice,
    invoiceId: invoice.id,
    createdAt: invoice.createdAt,
  });
  return invoice;
}

export async function createIncomeOrExpenseFromInvoice(invoice) {
  try {
    if (invoice.invoiceType === "RENT" || invoice.invoiceType === "TAX") {
      return {
        message: "فواتير الإيجار والضرائب لا تُسجل في النظام",
        status: 200,
      };
    }

    if (
      invoice.invoiceType === "INSURANCE" ||
      invoice.invoiceType === "REGISTRATION" ||
      invoice.invoiceType === "CONTRACT_EXPENSE" ||
      invoice.invoiceType === "OTHER_EXPENSE" ||
      invoice.invoiceType === "MANAGEMENT_COMMISSION"
    ) {
      await prisma.income.create({
        data: {
          amount: +invoice.amount,
          date: invoice.createdAt,
          description: `دخل من دفعة فاتورة #${invoice.id}`,
          clientId: +invoice.ownerId,
          propertyId: +invoice.propertyId,
          invoiceId: +invoice.invoiceId,
          createdAt: invoice.createdAt,
        },
      });
    } else {
      await prisma.expense.create({
        data: {
          amount: +invoice.amount,
          date: invoice.createdAt,
          description: `مصروف من دفعة فاتورة #${invoice.id}`,
          clientId: +invoice.ownerId,
          propertyId: invoice.propertyId,
          invoiceId: +invoice.invoiceId,
          createdAt: invoice.createdAt,
        },
      });
    }
    return { message: "", status: 200 };
  } catch (error) {
    console.error("Error paying invoice:", error);
    throw error;
  }
}

export async function getInvioces(page, limit, searchParams) {
  const filters = searchParams.get("filters")
    ? JSON.parse(searchParams.get("filters"))
    : {};
  const { startDate, endDate, propertyId, ownerId, invoiceType, clientType } =
    filters;
  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : new Date();

  try {
    // بناء شروط البحث الأساسية
    const conditions = [
      {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    ];

    if (clientType === "OWNERS") {
      conditions.push({
        invoiceType: {
          in: ["MANAGEMENT_COMMISSION", "MAINTENANCE"],
        },
      });
    } else if (clientType === "RENTERS") {
      conditions.push({
        invoiceType: {
          in: ["RENT", "TAX", "INSURANCE", "CONTRACT_EXPENSE"],
        },
      });
    } else if (invoiceType !== "ALL" && invoiceType) {
      console.log(
        "DEBUG: invoiceType received:",
        invoiceType,
        "Type:",
        typeof invoiceType,
        "IsArray:",
        Array.isArray(invoiceType)
      );

      if (Array.isArray(invoiceType) && invoiceType.length > 0) {
        conditions.push({
          invoiceType: {
            in: invoiceType,
          },
        });
      } else if (typeof invoiceType === "string" && invoiceType !== "ALL") {
        console.log("DEBUG: Adding string filter:", invoiceType);
        conditions.push({
          invoiceType: invoiceType,
        });
      }
    } else {
      console.log("DEBUG: No invoiceType filter applied");
    }

    // إضافة فلتر العقار
    if (propertyId) {
      conditions.push({
        OR: [
          {
            propertyId: parseInt(propertyId),
          },
          {
            rentAgreement: {
              unit: {
                propertyId: parseInt(propertyId),
              },
            },
          },
        ],
      });
    }

    // إضافة فلتر المالك
    if (ownerId) {
      conditions.push({
        OR: [
          {
            ownerId: parseInt(ownerId),
          },
          {
            property: {
              clientId: parseInt(ownerId),
            },
          },
          {
            rentAgreement: {
              unit: {
                property: {
                  clientId: parseInt(ownerId),
                },
              },
            },
          },
        ],
      });
    }

    // جلب الفواتير العادية
    const invoices = await prisma.invoice.findMany({
      where: {
        AND: [
          ...conditions,
          // استبعاد الفواتير المرتبطة بعقود ملغية أو منتهية
          {
            OR: [
              {
                // الفواتير غير مرتبطة بعقد إيجار
                rentAgreementId: null,
              },
              {
                // الفواتير مرتبطة بعقود نشطة فقط
                rentAgreement: {
                  status: "ACTIVE",
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        displayId: true, // إضافة حقل الرقم التسلسلي الجديد
        amount: true,
        description: true,
        title: true,
        chequeNumber: true,
        invoiceType: true,
        createdAt: true,
        paymentTypeMethod: true,
        rentAgreementId: true,
        propertyId: true,
        renterId: true,
        ownerId: true,
        paymentId: true,
        maintenanceId: true,
        installmentId: true,
        bankAccountId: true,
        rentAgreement: {
          select: {
            rentAgreementNumber: true,
            status: true,
            renter: {
              select: {
                name: true,
                id: true,
              },
            },
            unit: {
              select: {
                number: true,
                property: {
                  select: {
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
        },
        property: {
          select: {
            name: true,
            client: {
              select: {
                id: true,
                name: true,
              },
            },
            collector: {
              select: {
                name: true,
              },
            },
          },
        },
        renter: {
          select: {
            name: true,
          },
        },
        owner: {
          select: {
            name: true,
          },
        },
        payment: {
          select: {
            amount: true,
            dueDate: true,
            maintenance: {
              select: {
                description: true,
              },
            },
          },
        },
      },
    });

    // جلب فواتير الصيانة إذا كانت مطلوبة
    let maintenanceInvoices = [];
    if (invoiceType === "ALL" || invoiceType === "MAINTENANCE") {
      const maintenanceConditions = [
        {
          propertyId: propertyId ? parseInt(propertyId) : undefined,
          invoiceType: "MAINTENANCE",
          payment: {
            isNot: null,
          },
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      ].filter((condition) =>
        Object.values(condition).some((val) => val !== undefined)
      );

      if (ownerId) {
        maintenanceConditions.push({
          OR: [
            {
              ownerId: parseInt(ownerId),
            },
            {
              property: {
                clientId: parseInt(ownerId),
              },
            },
          ],
        });
      }

      maintenanceInvoices = await prisma.invoice.findMany({
        where: {
          AND: maintenanceConditions,
        },
        select: {
          id: true,
          displayId: true, // إضافة حقل الرقم التسلسلي الجديد
          amount: true,
          description: true,
          title: true,
          chequeNumber: true,
          invoiceType: true,
          createdAt: true,
          paymentTypeMethod: true,
          rentAgreementId: true,
          propertyId: true,
          renterId: true,
          ownerId: true,
          paymentId: true,
          maintenanceId: true,
          installmentId: true,
          bankAccountId: true,
          property: {
            select: {
              name: true,
              client: {
                select: {
                  id: true,
                  name: true,
                },
              },
              collector: {
                select: {
                  name: true,
                },
              },
            },
          },
          renter: {
            select: {
              name: true,
            },
          },
          owner: {
            select: {
              name: true,
            },
          },
          payment: {
            select: {
              amount: true,
              dueDate: true,
              maintenance: true,
            },
          },
        },
      });
    }

    // دمج النتائج
    const allInvoices = [...invoices, ...maintenanceInvoices];

    return {
      data: allInvoices,
      status: 200,
    };
  } catch (error) {
    console.error("Error fetching invoices:", error);
    throw error;
  }
}

export async function updateInvoice(id, data) {
  const { title, description } = data;
  try {
    const invoice = await prisma.invoice.update({
      where: {
        id: +id,
      },
      data: {
        title,
        description,
      },
    });
    return invoice;
  } catch (error) {
    console.error("Error updating invoice:", error);
    throw error;
  }
}

async function generateBillingInvocieNumber(periodStart, periodEnd) {
  const prefix = "INV";
  const startMonth = dayjs(periodStart).format("DD-MM-YYYY");
  const endMonth = dayjs(periodEnd).format("DD-MM-YYYY");
  const count = await prisma.BillingInvoice.count({});

  const seq = String(count + 1).padStart(3, "0");

  return `${prefix}_${startMonth}_${endMonth}_${seq}`;
}
// biling
export async function createBillingInvoice(data) {
  const submitData = {
    billedClientId: Number(data.billedClientId),
    dueDate: new Date(data.dueDate),
    paymentTerms: data.paymentTerms || null,
    periodStart: new Date(data.periodStart),
    periodEnd: new Date(data.periodEnd),
    description: data.description || null,
    category: data.category,
    propertyId: Number(data.property?.id) || null,
    unitId: Number(data.unit?.id) || null,
    status: "DRAFT",
    amount: data.amount,
  };
  const invoiceNumber = await generateBillingInvocieNumber(
    submitData.periodStart,
    submitData.periodEnd
  );
  submitData.invoiceNumber = invoiceNumber;

  const billingInvoice = await prisma.BillingInvoice.create({
    data: submitData,
  });

  const lines = data.lines;
  console.log(lines, "lines");

  for (const paymentBilling of lines) {
    await prisma.InvoicePaymentBilling.create({
      data: {
        amountApplied: paymentBilling.amountApplied,
        paymentId: Number(paymentBilling.paymentId),
        billingInvoiceId: billingInvoice.id,
      },
    });
  }
  return { status: 200, message: "تم انشاء الفاتورة بنجاح" };
}

export async function updateBillingInvoice(id, data) {
  try {
    const currentBillingInvoice = await prisma.BillingInvoice.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        invoicePayments: true,
      },
    });
    if (currentBillingInvoice.status === "PAID") {
      throw new Error("لا يمكن تعديل الحالة من مدفوع الا اي حالة اخري");
    }
    const invoicePayments = currentBillingInvoice.invoicePayments;
    console.log(invoicePayments, "invoicePayments");

    for (const invoicePayment of invoicePayments) {
      console.log(invoicePayment, "invoicePayment");
      await updatePaymentAndInvoice(invoicePayment);
    }
    await prisma.BillingInvoice.update({
      where: {
        id: currentBillingInvoice.id,
      },
      data: {
        status: "PAID",
        paidAmount: currentBillingInvoice.amount,
      },
    });
    return { status: 200, message: "تم تحديث الحالة بنجاح" };
  } catch (error) {
    console.error("Error updating invoice:", error);
    throw error;
  }
}
async function updatePaymentAndInvoice(data) {
  try {
    console.log(data.amountApplied, "data");
    await updatePayment(data.paymentId, {
      paidAmount: data.amountApplied,
      timeOfPayment: new Date(),
    });

    const payment = await prisma.payment.findUnique({
      where: {
        id: Number(data.paymentId),
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

    const invoiceRes = await createInvoice({
      ...payment,
      paymentId: payment.id,
    });

    const invoice = invoiceRes?.data ?? invoiceRes;

    return { payment, invoice };
  } catch (e) {
    console.log(e.message, "e");
    throw new Error(e.message);
  }
}

export async function getBillingInvoiceById(id) {
  const billingInvoices = await prisma.BillingInvoice.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      property: {
        include: {
          collector: true,
        },
      },
      billedClient: true,
      invoicePayments: {
        include: {
          billingInvoice: true,
          payment: {
            include: {
              client: true,
              maintenance: true,
              property: true,

              rentAgreement: {
                include: {
                  unit: {
                    select: {
                      property: {
                        select: {
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
              unit: true,
            },
          },
        },
      },
      unit: true,
      maintenance: true,
    },
  });
  return { data: billingInvoices };
}
export async function getBillingInvoice(page, limit, searchParams) {
  const filters = searchParams.get("filters")
    ? JSON.parse(searchParams.get("filters"))
    : {};
  const isArchived = searchParams.get("isArchived");
  const offset = (page - 1) * limit;

  const {
    startDate,
    endDate,
    propertyId,
    ownerId,
    renterId,
    invoiceType,
    rentAgreementId,
    clientType,
  } = filters;
  const where = {};
  if (isArchived) {
    where.status = "PAID";
  } else {
    where.status = {
      not: "PAID",
    };
  }
  if (clientType && clientType === "OWNERS") {
    where.billedClient = {
      role: "OWNER",
    };
  }
  if (clientType && clientType === "RENTERS") {
    where.billedClient = {
      role: "RENTER",
    };
  }
  console.log(where, "where");
  if (startDate && endDate) {
    where.dueDate = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  } else if (startDate) {
    where.dueDate = {
      gte: new Date(startDate),
    };
  } else if (endDate) {
    where.dueDate = {
      lte: new Date(endDate),
    };
  }
  buildFilterWhere({
    where,
    key: "propertyId",
    value: propertyId ? Number(propertyId) : null,
  });
  buildFilterWhere({
    where,
    key: "billedClientId",
    value: ownerId ? Number(ownerId) : null,
  });
  buildFilterWhere({
    where,
    key: "billedClientId",
    value: renterId ? Number(renterId) : null,
  });
  buildFilterWhere({ where, key: "category", value: invoiceType });
  if (
    rentAgreementId &&
    rentAgreementId !== "undefined" &&
    rentAgreementId !== "all"
  ) {
    where.invoicePayments = {
      some: {
        payment: {
          rentAgreementId: Number(rentAgreementId),
        },
      },
    };
  }
  const billingInvoices = await prisma.BillingInvoice.findMany({
    where,
    skip: offset,
    take: limit,
    include: {
      property: {
        include: {
          collector: true,
        },
      },
      billedClient: true,
      invoicePayments: {
        include: {
          payment: {
            include: {
              client: true,
              maintenance: true,
              property: true,
              rentAgreement: {
                include: {
                  unit: {
                    select: {
                      property: {
                        select: {
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
              unit: true,
            },
          },
        },
      },
      unit: true,
      maintenance: true,
    },
  });
  const total = await prisma.BillingInvoice.count({ where });
  return { data: billingInvoices, total, limit };
}
export async function deleteBillingInvoice(id) {
  const invoice = await prisma.BillingInvoice.findUnique({
    where: {
      id: Number(id),
    },
  });
  if (invoice.status === "PAID") {
    throw new Error("Can't delete a paid invoice");
  }
  await prisma.BillingInvoice.delete({
    where: {
      id: Number(id),
    },
  });
}
function buildFilterWhere({ where, key, value }) {
  if (
    value &&
    value !== "all" &&
    value !== "undefined" &&
    value !== undefined
  ) {
    where[key] = value;
  }
  return where;
}
