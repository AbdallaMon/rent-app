import prisma from "@/lib/prisma";
import {updateWhereClauseWithUserProperties} from "@/app/api/utlis/userProperties";

// export async function getTotalExpenses(page, limit, searchParams) {
//     const propertyId = searchParams.get("propertyId");
//
//     const whereClause = {};
//     if (propertyId && propertyId !== "all") {
//         whereClause.propertyId = parseInt(propertyId, 10);
//     }
//
//     const expenses = await prisma.expense.findMany({where: whereClause});
//
//     const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
//
//     return {
//         data: total,
//     };
// }

export async function getTotalIncome(page, limit, searchParams) {
    const propertyId = searchParams.get("propertyId");
    console.log(propertyId, "propertyId")
    let whereClause = {
        invoice: {
            rentAgreement: {
                status: "ACTIVE",
            },
        },
    };
    if (propertyId && propertyId !== "all") {
        whereClause.propertyId = parseInt(propertyId, 10);
    }
    if (!propertyId || propertyId === "all") {
        whereClause = await updateWhereClauseWithUserProperties("propertyId", whereClause);
    }
    console.log(whereClause, "whereClause")
    const income = await prisma.income.findMany({where: whereClause});
    const total = income.reduce((sum, inc) => sum + inc.amount, 0);

    return {
        data: total,
    };
}

// export async function getIncome(page, limit, searchParams, params) {
//     const currentMonthStart = new Date(
//           new Date().getFullYear(),
//           new Date().getMonth(),
//           1,
//     );
//     const propertyId = searchParams.get("propertyId");
//     const currentMonthEnd = new Date(
//           new Date().getFullYear(),
//           new Date().getMonth() + 1,
//           0,
//     );
//     const whereClause = {
//         invoice: {
//             rentAgreement: {
//                 status: "ACTIVE",
//             },
//         },
//         createdAt: {
//             gte: currentMonthStart,
//             lte: currentMonthEnd,
//         },
//     };
//
//     if (propertyId && propertyId !== "all") {
//         whereClause.propertyId = parseInt(propertyId, 10);
//     }
//     console.log(whereClause, "whereCaluse")
//     const income = await prisma.income.findMany({where: whereClause});
//     return {
//         data: income,
//
//     };
// }

// export async function getExpenses(page, limit, searchParams, params) {
//     const propertyId = searchParams.get("propertyId");
//     const currentMonthStart = new Date(
//           new Date().getFullYear(),
//           new Date().getMonth(),
//           1, // First day of the current month
//     );
//     const currentMonthEnd = new Date(
//           new Date().getFullYear(),
//           new Date().getMonth() + 1,
//           0, // Last day of the current month
//     );
//
//     const whereClause = {
//         createdAt: {
//             gte: currentMonthStart,
//             lte: currentMonthEnd,
//         },
//     };
//     if (propertyId && propertyId !== "all") {
//         whereClause.propertyId = parseInt(propertyId, 10);
//     }
//
//     const expenses = await prisma.expense.findMany({where: whereClause});
//     return {
//         data: expenses,
//     };
// }

export async function getRentedUnits(page, limit, searchParams, params) {
    const propertyId = searchParams.get("propertyId");
    const whereClause = {rentAgreements: {some: {status: "ACTIVE"}}};

    if (propertyId && propertyId !== "all") {
        whereClause.propertyId = parseInt(propertyId, 10);
    }

    const units = await prisma.unit.findMany({where: whereClause});
    return {
        data: units,
    };
}

export async function getNonRentedUnits(page, limit, searchParams, params) {
    const propertyId = searchParams.get("propertyId");
    const whereClause = {rentAgreements: {none: {status: "ACTIVE"}}};

    if (propertyId && propertyId !== "all") {
        whereClause.propertyId = parseInt(propertyId, 10);
    }

    const units = await prisma.unit.findMany({where: whereClause});

    return {
        data: units,
    };
}

export async function getPayments(page, limit, searchParams, params) {
    const currentMonthStart = new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1,
    );
    const currentMonthEnd = new Date(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          0,
    );

    const propertyId = searchParams.get("propertyId");
    const invoiceWhereClause = {
        createdAt: {
            gte: currentMonthStart,
            lte: currentMonthEnd,
        },
    };

    if (propertyId && propertyId !== "all") {
        invoiceWhereClause.propertyId = parseInt(propertyId, 10);
    }

    const invoices = await prisma.invoice.findMany({
        where: invoiceWhereClause,
        select: {
            paymentId: true,
            createdAt: true,
        },
    });

    const paymentIds = invoices.map((invoice) => invoice.paymentId);
    const payments = await prisma.payment.findMany({
        where: {
            id: {in: paymentIds},
        },
        select: {
            id: true,
            amount: true,
            paidAmount: true,
            dueDate: true,
            paymentType: true,
            property: {
                select: {
                    name: true,
                },
            },
            unit: {
                select: {
                    number: true,
                },
            },
            rentAgreement: {
                select: {
                    rentAgreementNumber: true,
                },
            },
        },
    });

    const categorizedPayments = payments.map((payment) => {
        const invoice = invoices.find((inv) => inv.paymentId === payment.id);

        const paymentDueDate = new Date(payment.dueDate);
        const invoiceCreatedDate = new Date(invoice.createdAt);

        const isSameDay =
              paymentDueDate.getDate() === invoiceCreatedDate.getDate() &&
              paymentDueDate.getMonth() === invoiceCreatedDate.getMonth() &&
              paymentDueDate.getFullYear() === invoiceCreatedDate.getFullYear();

        const paymentStatus = isSameDay ? "PAID_ON_TIME" : "PAID_LATE";

        return {
            ...payment,
            status: paymentStatus,
        };
    });

    return {
        data: categorizedPayments,
    };
}

export async function getRentPayments(searchParams) {
    const propertyId = searchParams.get("propertyId");

    const whereClause = {
        paymentType: "RENT"
    };

    if (propertyId && propertyId !== "all") {
        whereClause.propertyId = parseInt(propertyId, 10);
    }

    const payments = await prisma.payment.findMany({where: whereClause});

    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalPaidAmount = payments.reduce((sum, payment) => sum + payment.paidAmount, 0);
    const totalRemainingAmount = totalAmount - totalPaidAmount;

    return {
        totalAmount,
        totalPaidAmount,
        totalRemainingAmount
    };
}
