// Script لتحديث نظام الفواتير
// - إزالة فواتير الإيجار والضرائب من النظام
// - حساب وتسجيل عمولة الإدارة للفواتير الموجودة

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateInvoiceSystem() {
    console.log('🚀 بدء تحديث نظام الفواتير...');
    
    try {
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

                    console.log(`✅ تم تحديث عمولة الإدارة للفاتورة #${invoice.id}: ${commissionAmount} ريال`);
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

                    console.log(`✅ تم إنشاء عمولة الإدارة للفاتورة #${invoice.id}: ${commissionAmount} ريال`);
                }

                processedCount++;
                commissionTotal += commissionAmount;

            } catch (error) {
                console.error(`❌ خطأ في معالجة الفاتورة #${invoice.id}:`, error.message);
            }
        }

        // 3. تقرير النتائج
        console.log('\n📈 تقرير التحديث:');
        console.log(`✅ تم معالجة ${processedCount} فاتورة`);
        console.log(`💰 إجمالي عمولات الإدارة: ${commissionTotal.toLocaleString()} ريال`);
        console.log(`📊 متوسط عمولة الإدارة: ${(commissionTotal / processedCount).toFixed(2)} ريال`);

        // 4. إحصائيات إضافية
        const totalInvoicesAfterUpdate = await prisma.invoice.count({
            where: {
                invoiceType: {
                    notIn: ['RENT', 'TAX']
                }
            }
        });

        console.log(`\n📊 إحصائيات النظام الجديد:`);
        console.log(`• الفواتير المعروضة في النظام: ${totalInvoicesAfterUpdate}`);
        console.log(`• فواتير الإيجار والضرائب محولة لعمولات إدارة: ${processedCount}`);

        console.log('\n🎉 تم تحديث نظام الفواتير بنجاح!');

    } catch (error) {
        console.error('❌ خطأ عام في تحديث النظام:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// تشغيل التحديث
updateInvoiceSystem();
