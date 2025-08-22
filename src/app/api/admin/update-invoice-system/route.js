// API endpoint لتحديث نظام الفواتير
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
    try {
        console.log('🚀 بدء تحديث نظام الفواتير...');
        
        // 1. البحث عن فواتير الإيجار والضرائب الموجودة
        const rentAndTaxInvoices = await prisma.invoice.findMany({
            where: {
                invoiceType: {
                    in: ['RENT', 'TAX']
                }
            },
            include: {
                property: {
                    select: {
                        managementCommission: true,
                        name: true
                    }
                }
            }
        });

        console.log(`📊 تم العثور على ${rentAndTaxInvoices.length} فاتورة إيجار/ضريبة`);

        let processedCount = 0;
        let commissionTotal = 0;
        const results = [];

        // 2. معالجة كل فاتورة
        for (const invoice of rentAndTaxInvoices) {
            try {
                // حساب عمولة الإدارة
                const commissionAmount = (invoice.amount * invoice.property.managementCommission) / 100;
                
                // البحث عن record الدخل المرتبط بهذه الفاتورة
                const existingIncome = await prisma.income.findFirst({
                    where: {
                        invoiceId: invoice.id
                    }
                });

                if (existingIncome) {
                    // تحديث record الدخل الموجود ليصبح عمولة إدارة
                    await prisma.income.update({
                        where: {
                            id: existingIncome.id
                        },
                        data: {
                            amount: commissionAmount,
                            description: `عمولة إدارة ${invoice.property.managementCommission}% من ${invoice.invoiceType === "RENT" ? "الإيجار" : "الضريبة"} - فاتورة #${invoice.id}`,
                        }
                    });

                    results.push({
                        invoiceId: invoice.id,
                        action: 'updated',
                        commissionAmount: commissionAmount,
                        originalAmount: invoice.amount
                    });
                } else {
                    // إنشاء record جديد لعمولة الإدارة
                    await prisma.income.create({
                        data: {
                            amount: commissionAmount,
                            date: invoice.createdAt,
                            description: `عمولة إدارة ${invoice.property.managementCommission}% من ${invoice.invoiceType === "RENT" ? "الإيجار" : "الضريبة"} - فاتورة #${invoice.id}`,
                            clientId: invoice.ownerId,
                            propertyId: invoice.propertyId,
                            invoiceId: invoice.id,
                            createdAt: invoice.createdAt,
                        }
                    });

                    results.push({
                        invoiceId: invoice.id,
                        action: 'created',
                        commissionAmount: commissionAmount,
                        originalAmount: invoice.amount
                    });
                }

                processedCount++;
                commissionTotal += commissionAmount;

            } catch (error) {
                console.error(`❌ خطأ في معالجة الفاتورة #${invoice.id}:`, error.message);
                results.push({
                    invoiceId: invoice.id,
                    action: 'error',
                    error: error.message
                });
            }
        }

        // 3. إحصائيات النظام الجديد
        const totalInvoicesAfterUpdate = await prisma.invoice.count({
            where: {
                invoiceType: {
                    notIn: ['RENT', 'TAX']
                }
            }
        });

        const report = {
            success: true,
            message: 'تم تحديث نظام الفواتير بنجاح',
            statistics: {
                processedInvoices: processedCount,
                totalCommission: commissionTotal,
                averageCommission: processedCount > 0 ? (commissionTotal / processedCount) : 0,
                remainingInvoices: totalInvoicesAfterUpdate
            },
            details: results
        };

        console.log('🎉 تم تحديث نظام الفواتير بنجاح!');
        return NextResponse.json(report);

    } catch (error) {
        console.error('❌ خطأ عام في تحديث النظام:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'فشل في تحديث نظام الفواتير', 
                details: error.message 
            }, 
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        // إحصائيات سريعة لفهم الوضع الحالي
        const stats = await Promise.all([
            prisma.invoice.count({
                where: { invoiceType: 'RENT' }
            }),
            prisma.invoice.count({
                where: { invoiceType: 'TAX' }
            }),
            prisma.invoice.count({
                where: { 
                    invoiceType: { 
                        notIn: ['RENT', 'TAX'] 
                    } 
                }
            }),
            prisma.income.count({
                where: {
                    description: {
                        contains: 'عمولة إدارة'
                    }
                }
            })
        ]);

        return NextResponse.json({
            currentStats: {
                rentInvoices: stats[0],
                taxInvoices: stats[1], 
                otherInvoices: stats[2],
                commissionRecords: stats[3]
            }
        });

    } catch (error) {
        return NextResponse.json(
            { error: 'فشل في جلب الإحصائيات' }, 
            { status: 500 }
        );
    }
}
