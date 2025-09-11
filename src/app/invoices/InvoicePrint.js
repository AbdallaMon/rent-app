"use client";
import React, { forwardRef } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ar";
import { useTheme, alpha } from "@mui/material";
import { PaymentType } from "@/config/Enums";
import { formatCurrencyAED } from "@/helpers/functions/convertMoneyToArabic";
import { getFromName } from "./utility";

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

  const from = getFromName(invoice);

  const hasProperty = Boolean(invoice?.property?.name);
  const unitNumber =
    invoice?.rentAgreement?.unit?.number || invoice?.unit?.number || null;
  const hasUnit = Boolean(unitNumber);
  const collectorName = invoice?.property?.collector?.name || null;

  // تنسيقات مساعدة للطباعة
  const fmtDate = (d) => (d ? dayjs(d).format("DD/MM/YYYY") : "—");
  const safe = (v) => (v == null || v === "" ? "—" : v);

  // جدول الدفعات (من الفاتورة)
  const lines = Array.isArray(invoice?.invoicePayments)
    ? invoice.invoicePayments
    : [];

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

        {/* عرض رقم السند + رقم الفاتورة */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          <div
            style={{
              backgroundColor: c.veryLightBg,
              padding: "12px",
              border: `2px solid ${c.primary}`,
              borderRadius: "8px",
              textAlign: "center",
              fontSize: "16px",
              fontWeight: "bold",
              color: c.primary,
            }}
          >
            <strong>رقم السند:</strong>{" "}
            {invoice.invoiceNumber || `#${invoice.id}`}
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
            <strong>تاريخ الاصدار:</strong> {fmtDate(invoice?.createdAt)}
          </div>
          <div>
            <strong>نوع العملية:</strong>{" "}
            {PaymentType[invoice?.category] || "عام"}
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <strong>الوصف:</strong> {safe(invoice?.description)}
          </div>
        </div>
      </div>

      {/* payment summary */}
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
              {safe(from)}
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
              المبلغ الكلي للفاتورة
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
              {formatCurrencyAED(invoice?.amount || 0)}
            </td>
          </tr>

          {hasProperty && (
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
                {invoice.property.name}
              </td>
            </tr>
          )}

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
              {fmtDate(invoice?.dueDate)}
            </td>
          </tr>

          {collectorName && (
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
                {collectorName}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ===== جديد: جدول تفاصيل الدفعات المرتبطة ===== */}
      {lines.length > 0 && (
        <>
          <h3
            style={{
              margin: "0 0 10px 0",
              color: c.primary,
              fontSize: "16px",
            }}
          >
            تفاصيل الدفعات المرتبطة
          </h3>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "25px",
              border: `1px solid ${c.divider}`,
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: alpha(c.primary, 0.08),
                  color: c.text,
                }}
              >
                {[
                  "#",
                  "نوع الدفعة",
                  "تاريخ الاستحقاق",
                  "التفاصيل",
                  "إجمالي",
                  "مدفوع",
                  "محمّل على الفاتورة",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px",
                      textAlign: "right",
                      borderBottom: `2px solid ${alpha(c.divider, 0.6)}`,
                      fontWeight: 700,
                      fontSize: "12px",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((ln) => {
                // حاول نجيب الدفعة سواء موجودة داخل ln.payment أو الحقل نفسه
                const p = ln?.payment ?? ln;
                const remain = Math.max(
                  0,
                  (p?.amount || 0) - (p?.paidAmount || 0)
                );

                const details = [
                  p?.rentAgreement?.rentAgreementNumber
                    ? `عقد: ${p.rentAgreement.rentAgreementNumber}`
                    : null,
                  p?.property?.name ? `عقار: ${p.property.name}` : null,
                  p?.unit?.number ? `وحدة: ${p.unit.number}` : null,
                  p?.maintenance?.description
                    ? `صيانة: ${p.maintenance.description}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" | ");

                return (
                  <tr key={ln.id || p?.id}>
                    <td
                      style={{
                        padding: "8px",
                        borderBottom: `1px solid ${alpha(c.divider, 0.4)}`,
                      }}
                    >
                      {p?.id ?? "—"}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        borderBottom: `1px solid ${alpha(c.divider, 0.4)}`,
                      }}
                    >
                      {PaymentType[p?.paymentType] || p?.paymentType || "—"}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        borderBottom: `1px solid ${alpha(c.divider, 0.4)}`,
                      }}
                    >
                      {fmtDate(p?.dueDate)}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        borderBottom: `1px solid ${alpha(c.divider, 0.4)}`,
                        maxWidth: 260,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: theme.palette.text.secondary,
                      }}
                      title={details}
                    >
                      {details || "—"}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        borderBottom: `1px solid ${alpha(c.divider, 0.4)}`,
                        fontWeight: 700,
                      }}
                    >
                      {formatCurrencyAED(p?.amount || 0)}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        borderBottom: `1px solid ${alpha(c.divider, 0.4)}`,
                        fontWeight: 700,
                        color: theme.palette.success.main,
                      }}
                    >
                      {formatCurrencyAED(p?.paidAmount || 0)}
                    </td>

                    <td
                      style={{
                        padding: "8px",
                        borderBottom: `1px solid ${alpha(c.divider, 0.4)}`,
                        fontWeight: 800,
                        color: theme.palette.primary.main,
                      }}
                    >
                      {formatCurrencyAED(ln?.amountApplied || 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

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
            (PaymentType[invoice?.invoiceType] || "دفعة") +
            (invoice?.description ? " " + invoice.description : "")}{" "}
          {invoice?.invoiceType === "MAINTENANCE" ||
          invoice?.invoiceType === "MANAGEMENT_COMMISSION" ? (
            <>
              {" "}
              من المالك <strong>{from}</strong>
              {hasProperty && (
                <>
                  {" "}
                  لعقار <strong>{invoice.property.name}</strong>
                </>
              )}
            </>
          ) : (
            <>
              {hasUnit && (
                <>
                  {" "}
                  للوحدة رقم <strong>{unitNumber}</strong>
                </>
              )}
              {hasProperty && (
                <>
                  {" "}
                  التابعة لعقار <strong>{invoice.property.name}</strong>
                </>
              )}
              {invoice?.rentAgreement?.rentAgreementNumber && (
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
