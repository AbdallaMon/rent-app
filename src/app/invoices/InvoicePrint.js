import React, { forwardRef } from "react";
import { PaymentType } from "@/config/Enums";
import { formatCurrencyAED } from "@/helpers/functions/convertMoneyToArabic";
import dayjs from 'dayjs';
import 'dayjs/locale/ar';

const InvoicePrint = forwardRef(({ invoice }, ref) => {
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
          سند قبض
        </h1>
        <div style={{
          color: "#666",
          fontSize: "18px",
          marginBottom: "5px"
        }}>
          شركة تار العقارية
        </div>
        <div style={{
          color: "#666",
          fontSize: "14px"
        }}>
          تاريخ الطباعة: {dayjs().format('DD/MM/YYYY')}
        </div>
      </div>

      {/* معلومات الفاتورة الأساسية */}
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
          معلومات السند
        </h3>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "15px",
          marginBottom: "15px"
        }}>
          {/* رقم السند على السطر الكامل */}
          <div style={{
            backgroundColor: "#f8f9fa",
            padding: "12px",
            border: "2px solid #007bff",
            borderRadius: "8px",
            textAlign: "center",
            fontSize: "18px",
            fontWeight: "bold",
            color: "#007bff"
          }}>
            <strong>رقم السند:</strong> {invoice.displayId || `#${invoice.id}`}
          </div>
        </div>
        
        {/* باقي المعلومات في شبكة */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "15px"
        }}>
          <div>
            <strong>التاريخ:</strong> {dayjs(invoice.createdAt).format('DD/MM/YYYY')}
          </div>
          <div>
            <strong>نوع العملية:</strong> {PaymentType[invoice.invoiceType] || "دفعة"}
          </div>
          <div>
            <strong>طريقة الدفع:</strong> {
              invoice.paymentTypeMethod === "CASH" ? "نقداً" :
              invoice.paymentTypeMethod === "BANK" ? "تحويل بنكي" :
              invoice.paymentTypeMethod === "CHEQUE" ? "شيك" : "غير محدد"
            }
          </div>
        </div>
      </div>

      {/* تفاصيل الدفعة */}
      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        marginBottom: "25px",
        border: "1px solid #ddd"
      }}>
        <thead>
          <tr style={{ backgroundColor: "#1976d2", color: "white" }}>
            <th style={{ padding: "12px", textAlign: "center", border: "1px solid #ddd" }}>
              البيان
            </th>
            <th style={{ padding: "12px", textAlign: "center", border: "1px solid #ddd" }}>
              التفاصيل
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ 
              padding: "10px", 
              border: "1px solid #ddd", 
              fontWeight: "bold",
              backgroundColor: "#f9f9f9"
            }}>
              مستلم من
            </td>
            <td style={{ padding: "10px", border: "1px solid #ddd" }}>
              {(invoice.invoiceType === 'MAINTENANCE' || invoice.invoiceType === 'MANAGEMENT_COMMISSION') 
                ? (invoice.rentAgreement?.unit?.property?.owner?.name || 
                   invoice.property?.owner?.name || 
                   invoice.unit?.property?.owner?.name ||
                   "غير محدد")
                : `الوحدة رقم: ${invoice.rentAgreement?.unit?.number || invoice.unit?.number || "غير محدد"}`}
            </td>
          </tr>
          <tr>
            <td style={{ 
              padding: "10px", 
              border: "1px solid #ddd", 
              fontWeight: "bold",
              backgroundColor: "#f9f9f9"
            }}>
              المبلغ
            </td>
            <td style={{ 
              padding: "10px", 
              border: "1px solid #ddd",
              fontWeight: "bold",
              color: "#1976d2",
              fontSize: "16px"
            }}>
              {invoice.amount ? formatCurrencyAED(invoice.amount) : "غير محدد"}
            </td>
          </tr>
          <tr>
            <td style={{ 
              padding: "10px", 
              border: "1px solid #ddd", 
              fontWeight: "bold",
              backgroundColor: "#f9f9f9"
            }}>
              العقار
            </td>
            <td style={{ padding: "10px", border: "1px solid #ddd" }}>
              {invoice.property?.name || "غير محدد"}
            </td>
          </tr>
          <tr>
            <td style={{ 
              padding: "10px", 
              border: "1px solid #ddd", 
              fontWeight: "bold",
              backgroundColor: "#f9f9f9"
            }}>
              تاريخ الاستحقاق
            </td>
            <td style={{ padding: "10px", border: "1px solid #ddd" }}>
              {invoice.payment?.dueDate ? 
                dayjs(invoice.payment.dueDate).format('DD/MM/YYYY') : 
                "غير محدد"}
            </td>
          </tr>
          <tr>
            <td style={{ 
              padding: "10px", 
              border: "1px solid #ddd", 
              fontWeight: "bold",
              backgroundColor: "#f9f9f9"
            }}>
              المحصل
            </td>
            <td style={{ padding: "10px", border: "1px solid #ddd" }}>
              {invoice.property?.collector?.name || "غير محدد"}
            </td>
          </tr>
        </tbody>
      </table>

      {/* تفاصيل العملية */}
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
          تفاصيل العملية
        </h3>
        <div style={{ lineHeight: 1.8 }}>
          <strong>الوصف:</strong> {" "}
          {"دفعة " + (PaymentType[invoice.invoiceType] || "دفعة") + " " + (invoice.description || "")} {" "}
          
          {(invoice.invoiceType === "MAINTENANCE" || invoice.invoiceType === "MANAGEMENT_COMMISSION") ? (
            <>
              من المالك <strong>
                {invoice.rentAgreement?.unit?.property?.owner?.name || 
                 invoice.property?.owner?.name || 
                 invoice.unit?.property?.owner?.name ||
                 "غير محدد"}
              </strong> لعقار <strong>{invoice.property?.name || "غير محدد"}</strong>
            </>
          ) : (
            <>
              للوحدة رقم <strong>{invoice.rentAgreement?.unit?.number || invoice.unit?.number || "غير محدد"}</strong> التابعة لعقار{" "}
              <strong>{invoice.property?.name || "غير محدد"}</strong>
              {invoice.rentAgreement?.rentAgreementNumber && (
                <> عن عقد إيجار رقم <strong>{invoice.rentAgreement.rentAgreementNumber}</strong></>
              )}
            </>
          )}
        </div>
      </div>

      {/* قسم التوقيع */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "40px",
        marginTop: "40px",
        paddingTop: "20px"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ 
            fontSize: "14px", 
            marginBottom: "30px",
            fontWeight: "bold"
          }}>
            توقيع المستلم
          </div>
          <div style={{ 
            borderBottom: "2px solid #333", 
            width: "150px", 
            margin: "0 auto" 
          }}></div>
        </div>
        
        <div style={{ textAlign: "center" }}>
          <div style={{ 
            fontSize: "14px", 
            marginBottom: "30px",
            fontWeight: "bold"
          }}>
            توقيع المحصل
          </div>
          <div style={{ 
            borderBottom: "2px solid #333", 
            width: "150px", 
            margin: "0 auto" 
          }}></div>
        </div>
      </div>

      {/* الفوتر */}
      <div style={{
        marginTop: "40px",
        textAlign: "center",
        padding: "15px",
        borderTop: "2px solid #1976d2",
        fontSize: "12px",
        color: "#666"
      }}>
        <div style={{ marginBottom: "5px", fontWeight: "bold" }}>
          شركة تار العقارية - إدارة وتطوير العقارات
        </div>
        <div>
          تم إنشاء هذا السند بواسطة نظام إدارة العقارات - {dayjs().format('DD/MM/YYYY HH:mm')}
        </div>
      </div>
    </div>
  );
});

InvoicePrint.displayName = "InvoicePrint";

export default InvoicePrint;
