// utils/managementCommission.js
// دوال مساعدة لحساب عمولة الإدارة

import prisma from "@/lib/prisma";

/**
 * حساب عمولة الإدارة من مبلغ معين
 * @param {number} amount - المبلغ الأساسي
 * @param {number} commissionRate - نسبة عمولة الإدارة
 * @returns {number} مبلغ عمولة الإدارة
 */
export function calculateManagementCommission(amount, commissionRate) {
    return (amount * commissionRate) / 100;
}

/**
 * حساب عمولة الإدارة لعقد إيجار من قيمة العقد
 * @param {object} rentAgreement - عقد الإيجار
 * @param {object} property - العقار
 * @returns {number} مبلغ عمولة الإدارة
 */
export function calculateRentCommission(rentAgreement, property) {
    return calculateManagementCommission(
        rentAgreement.totalPrice, 
        property.managementCommission
    );
}

/**
 * حساب عمولة الإدارة لفاتورة مع الأولوية لقيمة العقد
 * @param {object} invoice - الفاتورة
 * @param {object} rentAgreement - عقد الإيجار (اختياري)
 * @param {object} property - العقار
 * @returns {object} تفاصيل حساب عمولة الإدارة
 */
export function calculateCommissionFromContract(invoice, rentAgreement, property) {
    // إعطاء الأولوية لقيمة العقد إذا كانت متوفرة
    let baseAmount = invoice.amount;
    let source = "الفاتورة";
    
    if (rentAgreement && rentAgreement.totalPrice) {
        baseAmount = rentAgreement.totalPrice;
        source = "العقد";
    }

    const commissionAmount = calculateManagementCommission(baseAmount, property.managementCommission);

    return {
        commissionAmount,
        baseAmount,
        source,
        commissionRate: property.managementCommission
    };
}

/**
 * حساب إجمالي عمولات الإدارة لعقار معين خلال فترة
 * @param {number} propertyId - معرف العقار
 * @param {Date} startDate - تاريخ البداية
 * @param {Date} endDate - تاريخ النهاية
 * @returns {Promise<number>} إجمالي عمولات الإدارة
 */
export async function getTotalManagementCommission(propertyId, startDate, endDate) {
    const commissions = await prisma.income.findMany({
        where: {
            propertyId: propertyId,
            date: {
                gte: startDate,
                lte: endDate
            },
            description: {
                contains: "عمولة إدارة"
            }
        },
        select: {
            amount: true
        }
    });

    return commissions.reduce((total, commission) => total + commission.amount, 0);
}

/**
 * حساب عمولات الإدارة لجميع العقارات
 * @param {Date} startDate - تاريخ البداية
 * @param {Date} endDate - تاريخ النهاية
 * @returns {Promise<Array>} قائمة بعمولات الإدارة لكل عقار
 */
export async function getAllPropertiesCommissions(startDate, endDate) {
    const commissions = await prisma.income.groupBy({
        by: ['propertyId'],
        where: {
            date: {
                gte: startDate,
                lte: endDate
            },
            description: {
                contains: "عمولة إدارة"
            }
        },
        _sum: {
            amount: true
        },
        _count: {
            amount: true
        }
    });

    // إضافة معلومات العقار
    const enrichedCommissions = await Promise.all(
        commissions.map(async (commission) => {
            const property = await prisma.property.findUnique({
                where: { id: commission.propertyId },
                select: {
                    name: true,
                    managementCommission: true
                }
            });

            return {
                propertyId: commission.propertyId,
                propertyName: property?.name || 'غير محدد',
                commissionRate: property?.managementCommission || 0,
                totalCommission: commission._sum.amount || 0,
                transactionCount: commission._count.amount || 0
            };
        })
    );

    return enrichedCommissions;
}

/**
 * حساب عمولة الإدارة المتوقعة لعقد إيجار جديد
 * @param {number} totalAmount - إجمالي مبلغ العقد
 * @param {number} propertyId - معرف العقار
 * @returns {Promise<number>} عمولة الإدارة المتوقعة
 */
export async function getExpectedCommission(totalAmount, propertyId) {
    const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { managementCommission: true }
    });

    if (!property) {
        throw new Error("العقار غير موجود");
    }

    return calculateManagementCommission(totalAmount, property.managementCommission);
}

/**
 * تحديث عمولة الإدارة عند تغيير نسبة العمولة في العقار
 * @param {number} propertyId - معرف العقار
 * @param {number} newCommissionRate - النسبة الجديدة
 * @returns {Promise<void>}
 */
export async function updatePropertyCommissionRate(propertyId, newCommissionRate) {
    // هذه الدالة لتحديث العمولة في المستقبل
    // يمكن استخدامها عند تغيير نسبة العمولة في العقار
    console.log(`تحديث نسبة عمولة العقار ${propertyId} إلى ${newCommissionRate}%`);
    
    // يمكن إضافة منطق إضافي هنا إذا لزم الأمر
    // مثل إعادة حساب العمولات للعقود النشطة
}

/**
 * معالجة عمولة الإدارة مع الأولوية لقيمة العقد
 * @param {object} invoice - الفاتورة
 * @returns {Promise<object>} تفاصيل معالجة عمولة الإدارة
 */
export async function processManagementCommissionFromContract(invoice) {
    try {
        // جلب معلومات العقار
        const property = await prisma.property.findUnique({
            where: { id: invoice.propertyId },
            select: { managementCommission: true }
        });

        if (!property) {
            throw new Error("العقار غير موجود");
        }

        // جلب عقد الإيجار إذا كان متوفراً
        let rentAgreement = null;
        if (invoice.rentAgreementId) {
            rentAgreement = await prisma.rentAgreement.findUnique({
                where: { id: invoice.rentAgreementId },
                select: { totalPrice: true }
            });
        }

        // حساب عمولة الإدارة باستخدام الدالة المحدثة
        const commissionDetails = calculateCommissionFromContract(invoice, rentAgreement, property);

        // تسجيل عمولة الإدارة كدخل
        await prisma.income.create({
            data: {
                amount: commissionDetails.commissionAmount,
                date: invoice.createdAt,
                description: `عمولة إدارة ${commissionDetails.commissionRate}% من ${commissionDetails.source} (${commissionDetails.baseAmount} ريال) - ${invoice.invoiceType === "RENT" ? "إيجار" : "ضريبة"} - فاتورة #${invoice.id}`,
                clientId: +invoice.ownerId,
                propertyId: +invoice.propertyId,
                invoiceId: +invoice.invoiceId,
                createdAt: invoice.createdAt,
            },
        });

        return {
            success: true,
            commissionDetails,
            message: `تم تسجيل عمولة إدارة بقيمة ${commissionDetails.commissionAmount} ريال من ${commissionDetails.source}`
        };

    } catch (error) {
        console.error("خطأ في معالجة عمولة الإدارة:", error);
        throw error;
    }
}

export default {
    calculateManagementCommission,
    calculateRentCommission,
    getTotalManagementCommission,
    getAllPropertiesCommissions,
    getExpectedCommission,
    updatePropertyCommissionRate,
    processManagementCommissionFromContract
};
