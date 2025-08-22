import React, { forwardRef } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import { formatCurrencyAED } from '@/helpers/functions/convertMoneyToArabic';

const invoiceTypeMapping = {
    RENT: "إيجار",
    TAX: "ضرائب", 
    INSURANCE: "تأمين",
    REGISTRATION: "تسجيل",
    MAINTENANCE: "صيانة",
    CONTRACT_EXPENSE: "مصاريف عقد",
    OTHER_EXPENSE: "مصاريف أخرى",
    MANAGEMENT_COMMISSION: "عمولة إدارة",
    OTHER: "أخرى",
};

const CombinedInvoicePrint = forwardRef(({ invoices, filterSummary }, ref) => {
    const totalAmount = invoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0);
    const currentDate = dayjs().format('DD/MM/YYYY');
    
    // تجميع الفواتير حسب النوع
    const groupedInvoices = invoices.reduce((groups, invoice) => {
        const type = invoice.invoiceType || 'OTHER';
        if (!groups[type]) {
            groups[type] = [];
        }
        groups[type].push(invoice);
        return groups;
    }, {});

    return (
        <div
            ref={ref}
            style={{
                padding: "30px",
                width: "210mm",
                maxWidth: "210mm",
                margin: "auto",
                direction: "rtl",
                backgroundColor: "#fff",
                fontFamily: "inherit",
                fontSize: "14px",
                lineHeight: 1.6,
                color: "#333",
                minHeight: "100vh"
            }}
        >
            {/* رأس الفاتورة */}
            <div style={{
                textAlign: "center",
                marginBottom: "30px",
                borderBottom: "2px solid #1976d2",
                paddingBottom: "15px"
            }}>
                <h1 style={{
                    fontWeight: "bold",
                    color: "#1976d2",
                    margin: "0 0 10px 0",
                    fontSize: "28px"
                }}>
                    فاتورة مجمعة
                </h1>
                <div style={{
                    color: "#666",
                    fontSize: "18px",
                    marginBottom: "5px"
                }}>
                    شركة تار العقارية
                </div>
                
                {/* رقم الفاتورة المجمعة على السطر الكامل */}
                <div style={{
                    backgroundColor: "#f8f9fa",
                    padding: "12px",
                    border: "2px solid #1976d2",
                    borderRadius: "8px",
                    textAlign: "center",
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#1976d2",
                    margin: "15px 0"
                }}>
                    رقم الفاتورة المجمعة: COMBINED-{new Date().getFullYear()}-{String(new Date().getMonth() + 1).padStart(2, '0')}-{String(new Date().getDate()).padStart(2, '0')}
                </div>
                
                <div style={{
                    color: "#666",
                    fontSize: "14px"
                }}>
                    تاريخ الطباعة: {currentDate}
                </div>
            </div>

            {/* ملخص الفلاتر المطبقة */}
            {filterSummary && (
                <div style={{
                    marginBottom: "25px",
                    padding: "15px",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "5px"
                }}>
                    <h3 style={{
                        margin: "0 0 15px 0",
                        color: "#1976d2",
                        fontSize: "16px"
                    }}>
                        المعايير المطبقة:
                    </h3>
                    {filterSummary.period && (
                        <div style={{ marginBottom: "5px" }}>• الفترة: {filterSummary.period}</div>
                    )}
                    {filterSummary.owner && (
                        <div style={{ marginBottom: "5px" }}>• المالك: {filterSummary.owner}</div>
                    )}
                    {filterSummary.property && (
                        <div style={{ marginBottom: "5px" }}>• العقار: {filterSummary.property}</div>
                    )}
                    {filterSummary.invoiceType && (
                        <div style={{ marginBottom: "5px" }}>• نوع الفاتورة: {filterSummary.invoiceType}</div>
                    )}
                    {filterSummary.paymentStatus && (
                        <div style={{ marginBottom: "5px" }}>• حالة الدفع: {filterSummary.paymentStatus}</div>
                    )}
                </div>
            )}

            {/* الملخص الإجمالي */}
            <div style={{
                marginBottom: "25px",
                padding: "15px",
                backgroundColor: "#e3f2fd",
                borderRadius: "5px",
                border: "1px solid #1976d2"
            }}>
                <h3 style={{
                    margin: "0 0 10px 0",
                    color: "#1976d2",
                    fontSize: "16px"
                }}>
                    الملخص الإجمالي
                </h3>
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <div style={{ fontSize: "14px" }}>عدد الفواتير: {invoices.length}</div>
                    <div style={{
                        fontWeight: "bold",
                        color: "#1976d2",
                        fontSize: "18px"
                    }}>
                        الإجمالي: {formatCurrencyAED(totalAmount)}
                    </div>
                </div>
            </div>

            {/* تفاصيل الفواتير مجمعة حسب النوع */}
            {Object.entries(groupedInvoices).map(([type, typeInvoices]) => {
                const typeTotal = typeInvoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0);
                
                return (
                    <div key={type} style={{ marginBottom: "30px" }}>
                        <h3 style={{ 
                            margin: "0 0 15px 0", 
                            color: "#1976d2",
                            borderBottom: "1px solid #ddd",
                            paddingBottom: "5px",
                            fontSize: "18px"
                        }}>
                            {invoiceTypeMapping[type] || type} ({typeInvoices.length} فاتورة)
                        </h3>
                        
                        <table style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            border: "1px solid #ddd",
                            marginBottom: "15px"
                        }}>
                            <thead>
                                <tr style={{ backgroundColor: "#1976d2", color: "white" }}>
                                    <th style={{ padding: "12px", textAlign: "center", border: "1px solid #ddd" }}>
                                        رقم الفاتورة
                                    </th>
                                    <th style={{ padding: "12px", textAlign: "center", border: "1px solid #ddd" }}>
                                        التاريخ
                                    </th>
                                    <th style={{ padding: "12px", textAlign: "center", border: "1px solid #ddd" }}>
                                        نوع الفاتورة
                                    </th>
                                    <th style={{ padding: "12px", textAlign: "center", border: "1px solid #ddd" }}>
                                        العقار
                                    </th>
                                    <th style={{ padding: "12px", textAlign: "center", border: "1px solid #ddd" }}>
                                        مستلم من
                                    </th>
                                    <th style={{ padding: "12px", textAlign: "center", border: "1px solid #ddd" }}>
                                        المبلغ
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {typeInvoices.map((invoice, index) => (
                                    <tr key={invoice.id} style={{ 
                                        backgroundColor: index % 2 === 0 ? "#fafafa" : "white"
                                    }}>
                                        <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>
                                            {invoice.displayId || `#${invoice.id}`}
                                        </td>
                                        <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>
                                            {dayjs(invoice.createdAt).format('DD/MM/YYYY')}
                                        </td>
                                        <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>
                                            {invoiceTypeMapping[invoice.invoiceType] || invoice.invoiceType || 'غير محدد'}
                                        </td>
                                        <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                                            {invoice.property?.name || 
                                             invoice.rentAgreement?.unit?.property?.name || '-'}
                                        </td>
                                        <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                                            {(invoice.invoiceType === 'MAINTENANCE' || invoice.invoiceType === 'MANAGEMENT_COMMISSION') 
                                                ? (invoice.rentAgreement?.unit?.property?.owner?.name || 
                                                   invoice.property?.owner?.name || 
                                                   invoice.unit?.property?.owner?.name ||
                                                   "غير محدد")
                                                : (invoice.rentAgreement?.unit?.number || invoice.unit?.number
                                                    ? `الوحدة رقم: ${invoice.rentAgreement?.unit?.number || invoice.unit?.number}`
                                                    : 'غير محدد')}
                                        </td>
                                        <td style={{ 
                                            padding: "10px", 
                                            border: "1px solid #ddd", 
                                            textAlign: "right",
                                            fontWeight: "bold",
                                            color: "#1976d2"
                                        }}>
                                            {formatCurrencyAED(invoice.amount || 0)}
                                        </td>
                                    </tr>
                                ))}
                                {/* مجموع النوع */}
                                <tr style={{ backgroundColor: "#e3f2fd" }}>
                                    <td 
                                        colSpan={5} 
                                        style={{ 
                                            padding: "12px", 
                                            border: "1px solid #ddd", 
                                            fontWeight: "bold", 
                                            textAlign: "right",
                                            fontSize: "16px"
                                        }}
                                    >
                                        إجمالي {invoiceTypeMapping[type] || type}:
                                    </td>
                                    <td style={{ 
                                        padding: "12px", 
                                        border: "1px solid #ddd", 
                                        fontWeight: "bold", 
                                        textAlign: "right",
                                        color: "#1976d2",
                                        fontSize: "16px"
                                    }}>
                                        {formatCurrencyAED(typeTotal)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                );
            })}

            {/* الختام */}
            <div style={{
                marginTop: "30px",
                paddingTop: "20px",
                borderTop: "2px solid #1976d2",
                textAlign: "center"
            }}>
                <div style={{
                    fontWeight: "bold",
                    fontSize: "24px",
                    color: "#1976d2",
                    marginBottom: "10px"
                }}>
                    الإجمالي النهائي: {formatCurrencyAED(totalAmount)}
                </div>
                <div style={{
                    color: "#666",
                    fontSize: "12px",
                    marginBottom: "5px"
                }}>
                    تم إنشاء هذه الفاتورة تلقائياً بواسطة نظام تار العقارية
                </div>
                <div style={{
                    color: "#666",
                    fontSize: "12px"
                }}>
                    تاريخ الطباعة: {currentDate}
                </div>
            </div>
        </div>
    );
});

CombinedInvoicePrint.displayName = 'CombinedInvoicePrint';

export default CombinedInvoicePrint;
