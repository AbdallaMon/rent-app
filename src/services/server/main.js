import prisma from "@/lib/prisma";
import {updateWhereClauseWithUserProperties} from "@/app/api/utlis/userProperties";

export async function getUnits(page, limit, searchParams, params) {
    const propertyId = searchParams.get("propertyId");

    let whereClause = {}
    if (propertyId && propertyId !== "all") {
        whereClause.propertyId = parseInt(propertyId, 10);
    }
    if (!propertyId || propertyId === "all") {
        whereClause = await updateWhereClauseWithUserProperties("propertyId", whereClause);
    }
    
    const units = await prisma.unit.findMany({
        where: whereClause,
        select: {
            id: true,
            rentAgreements: {
                select: {
                    status: true,
                }
            }
        }
    });

    let rentedCount = 0;
    let nonRentedCount = 0;
    
    units.forEach(unit => {
        // تحديد إذا كانت الوحدة مؤجرة حالياً
        const hasActiveAgreement = unit.rentAgreements && unit.rentAgreements.some(agreement =>
            agreement.status === "ACTIVE"
        );

        if (hasActiveAgreement) {
            rentedCount++;
        } else {
            nonRentedCount++;
        }
    });
    
    return {
        total: rentedCount + nonRentedCount,
        rented: rentedCount,
        nonRented: nonRentedCount,
    };
}

export async function getRentAgreements(page, limit, searchParams, params) {
    const propertyId = searchParams.get("propertyId");

    let whereClause = {}
    if (propertyId && propertyId !== "all") {
        whereClause.propertyId = parseInt(propertyId, 10);
    }
    if (!propertyId || propertyId === "all") {
        whereClause = await updateWhereClauseWithUserProperties("propertyId", whereClause);
    }

    // Fetch units with their rent agreements
    let units = await prisma.unit.findMany({
        where: whereClause,
        select: {
            id: true,
            rentAgreements: {
                select: {
                    status: true,
                    endDate: true
                }
            }
        }
    });
    units = units.map(unit => {
        if (!unit.rentAgreements || unit.rentAgreements.length === 0) {
            return {
                ...unit,
                active: 0,
                expired: 0
            };
        }
        const activeCount = unit.rentAgreements.filter(agreement =>
              agreement.status === "ACTIVE" && agreement.endDate > new Date()
        ).length;
        if (activeCount > 0) {
            return {
                ...unit,
                active: activeCount,
                expired: 0
            };
        }
        const expiredCount = unit.rentAgreements.filter(agreement => {

                  if (agreement.status === "CANCELED") {
                      return null
                  }
                  if (
                        agreement.status === "EXPIRED" || agreement.endDate < new Date()) {
                      return agreement
                  }
              }
        ).length;
        return {
            ...unit,
            active: 0,
            expired: expiredCount > 0 ? 1 : 0,
        };

    });

    const activeCount = units.reduce((sum, unit) => sum + unit.active, 0);
    const expiredCount = units.reduce((sum, unit) => sum + unit.expired, 0);
    const totalAgreementsCount = activeCount + expiredCount;
    return {
        total: totalAgreementsCount,
        active: activeCount,
        expired: expiredCount,
        unit: units,
    }
}


export async function getRentPayments(page, limit, searchParams, params) {
    const propertyId = searchParams.get("propertyId");

    let whereClause = {
        paymentType: "RENT"
    };
    whereClause.rentAgreement = {
        status: "ACTIVE"
    }

    if (propertyId && propertyId !== "all") {
        whereClause.propertyId = parseInt(propertyId, 10);
    }
    if (!propertyId || propertyId === "all") {
        whereClause = await updateWhereClauseWithUserProperties("propertyId", whereClause);
    }
    const payments = await prisma.payment.findMany({
        where: whereClause,
        select: {
            amount: true,
            paidAmount: true
        }
    });
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalPaidAmount = payments.reduce((sum, payment) => sum + payment.paidAmount, 0);
    const totalRemainingAmount = totalAmount - totalPaidAmount;

    return {
        totalAmount,
        totalPaidAmount,
        totalRemainingAmount
    };
}

export async function getCurrentMonthPayments(page, limit, searchParams, params) {
    const currentMonthStart = new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
    );
    const currentMonthEnd = new Date(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          0
    );

    const propertyId = searchParams.get("propertyId");
    let whereClause = {
        createdAt: {
            gte: currentMonthStart,
            lte: currentMonthEnd
        },
        rentAgreement: {
            status: "ACTIVE"

        },
        paymentType: "RENT"
    };

    if (propertyId && propertyId !== "all") {
        whereClause.propertyId = parseInt(propertyId, 10);
    }
    if (!propertyId || propertyId === "all") {
        whereClause = await updateWhereClauseWithUserProperties("propertyId", whereClause);
    }
    const payments = await prisma.payment.findMany({
        where: whereClause,
        select: {
            amount: true,
            paidAmount: true
        }
    });
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalPaidAmount = payments.reduce((sum, payment) => sum + payment.paidAmount, 0);
    const totalRemainingAmount = totalAmount - totalPaidAmount;

    return {
        totalAmount,
        totalPaidAmount,
        totalRemainingAmount
    };
}

export async function getMaintenancePayments(page, limit, searchParams, params) {
    const propertyId = searchParams.get("propertyId");

    let whereClause = {
        paymentType: "MAINTENANCE"
    };

    if (propertyId && propertyId !== "all") {
        whereClause.propertyId = parseInt(propertyId, 10);
    }
    if (!propertyId || propertyId === "all") {
        whereClause = await updateWhereClauseWithUserProperties("propertyId", whereClause);
    }
    const payments = await prisma.payment.findMany({
        where: whereClause,
        select: {
            amount: true,
            paidAmount: true
        }
    });
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalPaidAmount = payments.reduce((sum, payment) => sum + payment.paidAmount, 0);
    const totalRemainingAmount = totalAmount - totalPaidAmount;

    return {
        totalAmount,
        totalPaidAmount,
        totalRemainingAmount
    };
}

export async function getCurrentMonthMaintenancePayments(page, limit, searchParams, params) {
    const currentMonthStart = new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
    );
    const currentMonthEnd = new Date(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          0
    );

    const propertyId = searchParams.get("propertyId");
    let whereClause = {
        createdAt: {
            gte: currentMonthStart,
            lte: currentMonthEnd
        },
        paymentType: "MAINTENANCE"
    };

    if (propertyId && propertyId !== "all") {
        whereClause.propertyId = parseInt(propertyId, 10);
    }
    if (!propertyId || propertyId === "all") {
        whereClause = await updateWhereClauseWithUserProperties("propertyId", whereClause);
    }

    const payments = await prisma.payment.findMany({
        where: whereClause,
        select: {
            amount: true,
            paidAmount: true
        }
    });
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalPaidAmount = payments.reduce((sum, payment) => sum + payment.paidAmount, 0);
    const totalRemainingAmount = totalAmount - totalPaidAmount;

    return {
        totalAmount,
        totalPaidAmount,
        totalRemainingAmount
    };
}

export async function getOtherPayments(page, limit, searchParams, params) {
    const propertyId = searchParams.get("propertyId");

    let whereClause = {
        NOT: {
            OR: [
                {paymentType: "RENT"},
                {paymentType: "MAINTENANCE"}
            ]
        }
    };

    if (propertyId && propertyId !== "all") {
        whereClause.propertyId = parseInt(propertyId, 10);
    }
    if (!propertyId || propertyId === "all") {
        whereClause = await updateWhereClauseWithUserProperties("propertyId", whereClause);
    }
    whereClause.rentAgreement = {
        status: "ACTIVE"
    }
    const payments = await prisma.payment.findMany({
        where: whereClause,
        select: {
            amount: true,
            paidAmount: true
        }
    });
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalPaidAmount = payments.reduce((sum, payment) => sum + payment.paidAmount, 0);
    const totalRemainingAmount = totalAmount - totalPaidAmount;

    return {
        totalAmount,
        totalPaidAmount,
        totalRemainingAmount
    };
}

export async function getCurrentMonthOtherPayments(page, limit, searchParams, params) {
    const currentMonthStart = new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
    );
    const currentMonthEnd = new Date(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          0
    );

    const propertyId = searchParams.get("propertyId");
    let whereClause = {
        createdAt: {
            gte: currentMonthStart,
            lte: currentMonthEnd
        },
        NOT: {
            OR: [
                {paymentType: "RENT"},
                {paymentType: "MAINTENANCE"}
            ]
        }
    };

    if (propertyId && propertyId !== "all") {
        whereClause.propertyId = parseInt(propertyId, 10);
    }
    if (!propertyId || propertyId === "all") {
        whereClause = await updateWhereClauseWithUserProperties("propertyId", whereClause);
    }
    whereClause.rentAgreement = {
        status: "ACTIVE"
    }
    const payments = await prisma.payment.findMany({
        where: whereClause,
        select: {
            amount: true,
            paidAmount: true
        }
    });
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalPaidAmount = payments.reduce((sum, payment) => sum + payment.paidAmount, 0);
    const totalRemainingAmount = totalAmount - totalPaidAmount;

    return {
        totalAmount,
        totalPaidAmount,
        totalRemainingAmount
    };
}
