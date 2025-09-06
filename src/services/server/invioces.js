import prisma from "@/lib/prisma";
import { generateInvoiceDisplayId } from "@/helpers/functions/invoiceDisplayId";

export async function createInvoice(data) {
  const displayId = await generateInvoiceDisplayId(data.invoiceType);

  const invoice = await prisma.invoice.create({
    data: {
      amount: +data.paidAmount || 0,
      description: data.description || "",
      title: data.title || "",
      chequeNumber: data.chequeNumber || "",
      invoiceType: data.invoiceType || "",
      displayId: displayId, // إضافة الرقم التسلسلي الجديد
      createdAt: new Date(data.timeOfPayment || new Date()),
      paymentTypeMethod: data.paymentTypeMethod || "CASH",
      payment: data.paymentId ? { connect: { id: data.paymentId } } : undefined,
      renter: data.renterId ? { connect: { id: data.renterId } } : undefined,
      owner: data.ownerId ? { connect: { id: data.ownerId } } : undefined,
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
          clientId: invoice.ownerId,
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
            maintenance: true,
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
