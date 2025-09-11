"use client";
import React, { forwardRef } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ar";
import { formatCurrencyAED } from "@/helpers/functions/convertMoneyToArabic";
import { alpha, useTheme } from "@mui/material";
import { getFromName } from "./utility";

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

const CombinedInvoicePrint = forwardRef(({ invoices, summaryFnc }, ref) => {
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
  const filterSummary = summaryFnc();
  const totalAmount = invoices.reduce(
    (sum, invoice) => sum + (invoice.amount || 0),
    0
  );
  const currentDate = dayjs().format("DD/MM/YYYY");

  const groupedInvoices = invoices.reduce((groups, invoice) => {
    const type = invoice.invoiceType || "OTHER";
    if (!groups[type]) groups[type] = [];
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
          فاتورة مجمعة
        </h1>
        <div style={{ color: c.muted, fontSize: "18px", marginBottom: "5px" }}>
          شركة تار العقارية
        </div>

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
            margin: "15px 0",
          }}
        >
          رقم الفاتورة المجمعة: COMBINED-{new Date().getFullYear()}-
          {String(new Date().getMonth() + 1).padStart(2, "0")}-
          {String(new Date().getDate()).padStart(2, "0")}
        </div>

        <div style={{ color: c.muted, fontSize: "14px" }}>
          تاريخ الطباعة: {currentDate}
        </div>
      </div>

      {/* filters summary */}
      {filterSummary && (
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
            المعايير المطبقة:
          </h3>
          {filterSummary.period && (
            <div style={{ marginBottom: "5px" }}>
              • الفترة: {filterSummary.period}
            </div>
          )}
          {filterSummary.owner && (
            <div style={{ marginBottom: "5px" }}>
              • المالك: {filterSummary.owner.name}
            </div>
          )}
          {filterSummary.property && (
            <div style={{ marginBottom: "5px" }}>
              • العقار: {filterSummary.property.name}
            </div>
          )}
        </div>
      )}

      {/* totals */}
      <div
        style={{
          marginBottom: "25px",
          padding: "15px",
          backgroundColor: c.softPrimaryBg,
          borderRadius: "5px",
          border: `1px solid ${c.primary}`,
        }}
      >
        <h3
          style={{ margin: "0 0 10px 0", color: c.primary, fontSize: "16px" }}
        >
          الملخص الإجمالي
        </h3>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "14px" }}>
            عدد الفواتير: {invoices.length}
          </div>
          <div
            style={{ fontWeight: "bold", color: c.primary, fontSize: "18px" }}
          >
            الإجمالي: {formatCurrencyAED(totalAmount)}
          </div>
        </div>
      </div>

      {/* tables by type */}
      {Object.entries(groupedInvoices).map(([type, typeInvoices]) => {
        const typeTotal = typeInvoices.reduce(
          (sum, invoice) => sum + (invoice.amount || 0),
          0
        );

        return (
          <div key={type} style={{ marginBottom: "30px" }}>
            <h3
              style={{
                margin: "0 0 15px 0",
                color: c.primary,
                borderBottom: `1px solid ${c.divider}`,
                paddingBottom: "5px",
                fontSize: "18px",
              }}
            >
              {invoiceTypeMapping[type] || type} ({typeInvoices.length} فاتورة)
            </h3>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                border: `1px solid ${c.divider}`,
                marginBottom: "15px",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: c.primary,
                    color: c.primaryContrast,
                  }}
                >
                  {[
                    "رقم الفاتورة",
                    "التاريخ",
                    "نوع الفاتورة",
                    "العقار",
                    "مستلم من",
                    "المبلغ",
                  ].map((h) => (
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
                {typeInvoices.map((invoice, index) => (
                  <tr
                    key={invoice.id}
                    style={{
                      backgroundColor:
                        index % 2 === 0 ? c.veryLightBg : c.paper,
                    }}
                  >
                    <td
                      style={{
                        padding: "10px",
                        border: `1px solid ${c.divider}`,
                        textAlign: "center",
                      }}
                    >
                      {invoice.displayId || `#${invoice.id}`}
                    </td>
                    <td
                      style={{
                        padding: "10px",
                        border: `1px solid ${c.divider}`,
                        textAlign: "center",
                      }}
                    >
                      {dayjs(invoice.createdAt).format("DD/MM/YYYY")}
                    </td>
                    <td
                      style={{
                        padding: "10px",
                        border: `1px solid ${c.divider}`,
                        textAlign: "center",
                      }}
                    >
                      {invoiceTypeMapping[invoice.invoiceType] ||
                        invoice.invoiceType ||
                        "غير محدد"}
                    </td>
                    <td
                      style={{
                        padding: "10px",
                        border: `1px solid ${c.divider}`,
                      }}
                    >
                      {invoice.property?.name ||
                        invoice.rentAgreement?.unit?.property?.name ||
                        "-"}
                    </td>
                    <td
                      style={{
                        padding: "10px",
                        border: `1px solid ${c.divider}`,
                      }}
                    >
                      {getFromName(invoice)}
                    </td>
                    <td
                      style={{
                        padding: "10px",
                        border: `1px solid ${c.divider}`,
                        textAlign: "right",
                        fontWeight: "bold",
                        color: c.primary,
                      }}
                    >
                      {formatCurrencyAED(invoice.amount || 0)}
                    </td>
                  </tr>
                ))}

                {/* type total */}
                <tr style={{ backgroundColor: c.softPrimaryBg }}>
                  <td
                    colSpan={5}
                    style={{
                      padding: "12px",
                      border: `1px solid ${c.divider}`,
                      fontWeight: "bold",
                      textAlign: "right",
                      fontSize: "16px",
                    }}
                  >
                    إجمالي {invoiceTypeMapping[type] || type}:
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      border: `1px solid ${c.divider}`,
                      fontWeight: "bold",
                      textAlign: "right",
                      color: c.primary,
                      fontSize: "16px",
                    }}
                  >
                    {formatCurrencyAED(typeTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}

      {/* footer */}
      <div
        style={{
          marginTop: "30px",
          paddingTop: "20px",
          borderTop: `2px solid ${c.primary}`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontWeight: "bold",
            fontSize: "24px",
            color: c.primary,
            marginBottom: "10px",
          }}
        >
          الإجمالي النهائي: {formatCurrencyAED(totalAmount)}
        </div>
        <div style={{ color: c.muted, fontSize: "12px", marginBottom: "5px" }}>
          تم إنشاء هذه الفاتورة تلقائياً بواسطة نظام تار العقارية
        </div>
        <div style={{ color: c.muted, fontSize: "12px" }}>
          تاريخ الطباعة: {currentDate}
        </div>
      </div>
    </div>
  );
});

CombinedInvoicePrint.displayName = "CombinedInvoicePrint";
export default CombinedInvoicePrint;
