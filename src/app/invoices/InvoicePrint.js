"use client";
import React, { forwardRef } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ar";
import { useTheme, alpha } from "@mui/material";
import { PaymentType } from "@/config/Enums";
import { formatCurrencyAED } from "@/helpers/functions/convertMoneyToArabic";

const InvoicePrint = forwardRef(({ invoice }, ref) => {
  const theme = useTheme();
  const c = {
    primary: theme.palette.primary.main,
    primaryContrast: theme.palette.primary.contrastText,
    text: theme.palette.text.primary,
    muted: theme.palette.text.secondary,
    paper: theme.palette.background.paper,
    defaultBg: theme.palette.background.default,
    divider: theme.palette.divider,
    softPrimaryBg: alpha(theme.palette.primary.main, 0.08),
    veryLightBg: theme.palette.grey[50],
  };

  return (
    <div
      ref={ref}
      style={{
        padding: "30px",
        width: "210mm",
        maxWidth: "210mm",
        margin: "auto",
        direction: "rtl",
        backgroundColor: c.paper,
        fontFamily: "inherit",
        fontSize: "14px",
        lineHeight: 1.6,
        color: c.text,
        minHeight: "100vh",
      }}
    >
      {/* header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "30px",
          borderBottom: `2px solid ${c.primary}`,
          paddingBottom: "15px",
        }}
      >
        <h1
          style={{
            fontWeight: "bold",
            color: c.primary,
            margin: "0 0 10px 0",
            fontSize: "28px",
          }}
        >
          سند قبض
        </h1>
        <div style={{ color: c.muted, fontSize: "18px", marginBottom: "5px" }}>
          شركة تار العقارية
        </div>
        <div style={{ color: c.muted, fontSize: "14px" }}>
          تاريخ الطباعة: {dayjs().format("DD/MM/YYYY")}
        </div>
      </div>

      {/* basic info */}
      <div
        style={{
          marginBottom: "25px",
          padding: "15px",
          backgroundColor: c.defaultBg,
          borderRadius: "5px",
        }}
      >
        <h3
          style={{ margin: "0 0 15px 0", color: c.primary, fontSize: "16px" }}
        >
          معلومات السند
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "15px",
            marginBottom: "15px",
          }}
        >
          {/* full-width receipt number */}
          <div
            style={{
              backgroundColor: c.veryLightBg,
              padding: "12px",
              border: `2px solid ${c.primary}`,
              borderRadius: "8px",
              textAlign: "center",
              fontSize: "18px",
              fontWeight: "bold",
              color: c.primary,
            }}
          >
            <strong>رقم السند:</strong> {invoice.displayId || `#${invoice.id}`}
          </div>
        </div>

        {/* grid details */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "15px",
          }}
        >
          <div>
            <strong>التاريخ:</strong>{" "}
            {dayjs(invoice.createdAt).format("DD/MM/YYYY")}
          </div>
          <div>
            <strong>نوع العملية:</strong>{" "}
            {PaymentType[invoice.invoiceType] || "دفعة"}
          </div>
          <div>
            <strong>طريقة الدفع:</strong>{" "}
            {invoice.paymentTypeMethod === "CASH"
              ? "نقداً"
              : invoice.paymentTypeMethod === "BANK"
                ? "تحويل بنكي"
                : invoice.paymentTypeMethod === "CHEQUE"
                  ? "شيك"
                  : "غير محدد"}
          </div>
        </div>
      </div>

      {/* payment details table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "25px",
          border: `1px solid ${c.divider}`,
        }}
      >
        <thead>
          <tr style={{ backgroundColor: c.primary, color: c.primaryContrast }}>
            {["البيان", "التفاصيل"].map((h) => (
              <th
                key={h}
                style={{
                  padding: "12px",
                  textAlign: "center",
                  border: `1px solid ${c.divider}`,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              style={{
                padding: "10px",
                border: `1px solid ${c.divider}`,
                fontWeight: "bold",
                backgroundColor: c.veryLightBg,
              }}
            >
              مستلم من
            </td>
            <td style={{ padding: "10px", border: `1px solid ${c.divider}` }}>
              {invoice.invoiceType === "MAINTENANCE" ||
              invoice.invoiceType === "MANAGEMENT_COMMISSION"
                ? invoice.rentAgreement?.unit?.property?.owner?.name ||
                  invoice.property?.owner?.name ||
                  invoice.unit?.property?.owner?.name ||
                  "غير محدد"
                : `الوحدة رقم: ${
                    invoice.rentAgreement?.unit?.number ||
                    invoice.unit?.number ||
                    "غير محدد"
                  }`}
            </td>
          </tr>

          <tr>
            <td
              style={{
                padding: "10px",
                border: `1px solid ${c.divider}`,
                fontWeight: "bold",
                backgroundColor: c.veryLightBg,
              }}
            >
              المبلغ
            </td>
            <td
              style={{
                padding: "10px",
                border: `1px solid ${c.divider}`,
                fontWeight: "bold",
                color: c.primary,
                fontSize: "16px",
              }}
            >
              {invoice.amount ? formatCurrencyAED(invoice.amount) : "غير محدد"}
            </td>
          </tr>

          <tr>
            <td
              style={{
                padding: "10px",
                border: `1px solid ${c.divider}`,
                fontWeight: "bold",
                backgroundColor: c.veryLightBg,
              }}
            >
              العقار
            </td>
            <td style={{ padding: "10px", border: `1px solid ${c.divider}` }}>
              {invoice.property?.name || "غير محدد"}
            </td>
          </tr>

          <tr>
            <td
              style={{
                padding: "10px",
                border: `1px solid ${c.divider}`,
                fontWeight: "bold",
                backgroundColor: c.veryLightBg,
              }}
            >
              تاريخ الاستحقاق
            </td>
            <td style={{ padding: "10px", border: `1px solid ${c.divider}` }}>
              {invoice.payment?.dueDate
                ? dayjs(invoice.payment.dueDate).format("DD/MM/YYYY")
                : "غير محدد"}
            </td>
          </tr>

          <tr>
            <td
              style={{
                padding: "10px",
                border: `1px solid ${c.divider}`,
                fontWeight: "bold",
                backgroundColor: c.veryLightBg,
              }}
            >
              المحصل
            </td>
            <td style={{ padding: "10px", border: `1px solid ${c.divider}` }}>
              {invoice.property?.collector?.name || "غير محدد"}
            </td>
          </tr>
        </tbody>
      </table>

      {/* description */}
      <div
        style={{
          marginBottom: "12px",
          padding: "15px",
          backgroundColor: c.defaultBg,
          borderRadius: "5px",
        }}
      >
        <h3
          style={{ margin: "0 0 15px 0", color: c.primary, fontSize: "16px" }}
        >
          تفاصيل العملية
        </h3>
        <div style={{ lineHeight: 1.8 }}>
          <strong>الوصف:</strong>{" "}
          {"دفعة " +
            (PaymentType[invoice.invoiceType] || "دفعة") +
            " " +
            (invoice.description || "")}{" "}
          {invoice.invoiceType === "MAINTENANCE" ||
          invoice.invoiceType === "MANAGEMENT_COMMISSION" ? (
            <>
              من المالك{" "}
              <strong>
                {invoice.rentAgreement?.unit?.property?.owner?.name ||
                  invoice.property?.owner?.name ||
                  invoice.unit?.property?.owner?.name ||
                  "غير محدد"}
              </strong>{" "}
              لعقار <strong>{invoice.property?.name || "غير محدد"}</strong>
            </>
          ) : (
            <>
              للوحدة رقم{" "}
              <strong>
                {invoice.rentAgreement?.unit?.number ||
                  invoice.unit?.number ||
                  "غير محدد"}
              </strong>{" "}
              التابعة لعقار{" "}
              <strong>{invoice.property?.name || "غير محدد"}</strong>
              {invoice.rentAgreement?.rentAgreementNumber && (
                <>
                  {" "}
                  عن عقد إيجار رقم{" "}
                  <strong>{invoice.rentAgreement.rentAgreementNumber}</strong>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* signatures */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "40px",
          marginTop: "20px",
          paddingTop: "20px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "14px",
              marginBottom: "30px",
              fontWeight: "bold",
            }}
          >
            توقيع المستلم
          </div>
          <div
            style={{
              borderBottom: `2px solid ${theme.palette.text.primary}`,
              width: "150px",
              margin: "0 auto",
            }}
          />
        </div>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "14px",
              marginBottom: "30px",
              fontWeight: "bold",
            }}
          >
            توقيع المحصل
          </div>
          <div
            style={{
              borderBottom: `2px solid ${theme.palette.text.primary}`,
              width: "150px",
              margin: "0 auto",
            }}
          />
        </div>
      </div>

      {/* footer */}
      <div
        style={{
          marginTop: "40px",
          textAlign: "center",
          padding: "8px",
          borderTop: `2px solid ${c.primary}`,
          fontSize: "12px",
          color: c.muted,
        }}
      >
        <div style={{ marginBottom: "5px", fontWeight: "bold", color: c.text }}>
          شركة تار العقارية - إدارة وتطوير العقارات
        </div>
        <div>
          تم إنشاء هذا السند بواسطة نظام إدارة العقارات -{" "}
          {dayjs().format("DD/MM/YYYY HH:mm")}
        </div>
      </div>
    </div>
  );
});

InvoicePrint.displayName = "InvoicePrint";
export default InvoicePrint;
