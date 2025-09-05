export const Language = {
  ENGLISH: "ENGLISH",
  ARABIC: "ARABIC",
};

export const RequestStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  REJECTED: "REJECTED",
};

export const Priority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
};

export const MaintenanceType = {
  ELECTRICAL: "ELECTRICAL",
  PLUMBING: "PLUMBING",
  AC_HEATING: "AC_HEATING",
  APPLIANCES: "APPLIANCES",
  STRUCTURAL: "STRUCTURAL",
  CLEANING: "CLEANING",
  PAINTING: "PAINTING",
  CARPENTRY: "CARPENTRY",
  PEST_CONTROL: "PEST_CONTROL",
  OTHER: "OTHER",
};

export const ComplaintCategory = {
  PROPERTY_ISSUE: "PROPERTY_ISSUE",
  RENT_ISSUE: "RENT_ISSUE",
  NEIGHBOR_ISSUE: "NEIGHBOR_ISSUE",
  MAINTENANCE_ISSUE: "MAINTENANCE_ISSUE",
  NOISE_ISSUE: "NOISE_ISSUE",
  SECURITY_ISSUE: "SECURITY_ISSUE",
  PAYMENT_ISSUE: "PAYMENT_ISSUE",
  SERVICE_QUALITY: "SERVICE_QUALITY",
  OTHER: "OTHER",
};

// ========= Localization =========
export const L10N = {
  caseKind: {
    maintenanceRequest: { ar: "طلب صيانة", en: "Maintenance Request" },
    complaint: { ar: "شكوى", en: "Complaint" },
  },
  status: {
    PENDING: { ar: "قيد المراجعة", en: "Pending" },
    IN_PROGRESS: { ar: "قيد المعالجة", en: "In Progress" },
    COMPLETED: { ar: "مكتمل", en: "Completed" },
    REJECTED: { ar: "مرفوض", en: "Rejected" },
  },
  priority: {
    LOW: { ar: "منخفضة", en: "Low" },
    MEDIUM: { ar: "متوسطة", en: "Medium" },
    HIGH: { ar: "مرتفعة", en: "High" },
    URGENT: { ar: "عاجلة", en: "Urgent" },
  },
  maintenanceType: {
    ELECTRICAL: { ar: "كهرباء", en: "Electrical" },
    PLUMBING: { ar: "سباكة", en: "Plumbing" },
    AC_HEATING: { ar: "تكييف/تدفئة", en: "A/C & Heating" },
    APPLIANCES: { ar: "أجهزة", en: "Appliances" },
    STRUCTURAL: { ar: "إنشائي", en: "Structural" },
    CLEANING: { ar: "تنظيف", en: "Cleaning" },
    PAINTING: { ar: "دهان", en: "Painting" },
    CARPENTRY: { ar: "نجارة", en: "Carpentry" },
    PEST_CONTROL: { ar: "مكافحة آفات", en: "Pest Control" },
    OTHER: { ar: "أخرى", en: "Other" },
  },
  complaintCategory: {
    PROPERTY_ISSUE: { ar: "مشكلة العقار", en: "Property Issue" },
    RENT_ISSUE: { ar: "مشكلة إيجار", en: "Rent Issue" },
    NEIGHBOR_ISSUE: { ar: "مشاكل الجيران", en: "Neighbor Issue" },
    MAINTENANCE_ISSUE: { ar: "مشكلة صيانة", en: "Maintenance Issue" },
    NOISE_ISSUE: { ar: "ضوضاء", en: "Noise" },
    SECURITY_ISSUE: { ar: "أمن", en: "Security" },
    PAYMENT_ISSUE: { ar: "مدفوعات", en: "Payment" },
    SERVICE_QUALITY: { ar: "جودة خدمة", en: "Service Quality" },
    OTHER: { ar: "أخرى", en: "Other" },
  },
};

// ========= Helpers =========
export function isArabic(lang) {
  return (lang || Language.ARABIC) === Language.ARABIC;
}

export function pickLabel(map, key, isAr) {
  const k = String(key || "").toUpperCase();
  return map[k] ? (isAr ? map[k].ar : map[k].en) : String(key || "-");
}

export function trimText(s, max = 100) {
  if (!s) return "-";
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export function buildLocation(property, unit) {
  const a = property?.name || "-";
  const b = unit?.number || unit?.unitNumber || "-";
  return `${a} – ${b}`;
}

export function resolveTypeLabel(kind, type, isAr) {
  if (kind === "maintenanceRequest") {
    return pickLabel(L10N.maintenanceType, type, isAr);
  }
  return pickLabel(L10N.complaintCategory, type, isAr);
}

export function buildCaseComms({ entity, kind, client }) {
  const lang = client?.language || Language.ARABIC;
  const ar = isArabic(lang);

  const caseKind = ar ? L10N.caseKind[kind].ar : L10N.caseKind[kind].en;
  const reference = entity.displayId || entity.id;
  const statusLabel = pickLabel(L10N.status, entity.status, ar);
  const typeLabel = resolveTypeLabel(kind, entity.type, ar);
  const location = buildLocation(entity.property, entity.unit);
  const summary = trimText(entity.description);

  const bodyParams = [
    caseKind,
    String(reference),
    statusLabel,
    typeLabel,
    location,
    summary,
  ];

  const subject = ar
    ? `تحديث الحالة - ${caseKind} (${reference})`
    : `Case Update – ${caseKind} (${reference})`;

  const html = ar
    ? `
<div dir="rtl" style="text-align:right;font-family:Arial,sans-serif;">
  <h2>تحديث الحالة</h2>
  <p>${client?.name ? `مرحباً ${client.name}،` : "مرحباً،"}</p>
  <p>هناك تحديث على ${caseKind} الخاص بك.</p>
  <p><strong>رقم المتابعة:</strong> ${reference}</p>
  <p><strong>الحالة:</strong> ${statusLabel}</p>
  <p><strong>النوع:</strong> ${typeLabel}</p>
  <p><strong>الموقع:</strong> ${location}</p>
  <p><strong>الملخص:</strong> ${summary}</p>
  <p>لأي استفسارات إضافية، يُرجى الرد على هذه الرسالة.</p>
</div>`
    : `
<div style="font-family:Arial,sans-serif;">
  <h2>Case Update</h2>
  <p>${client?.name ? `Hello ${client.name},` : "Hello,"}</p>
  <p>We have an update on your ${caseKind}.</p>
  <p><strong>Reference:</strong> ${reference}</p>
  <p><strong>Status:</strong> ${statusLabel}</p>
  <p><strong>Type:</strong> ${typeLabel}</p>
  <p><strong>Location:</strong> ${location}</p>
  <p><strong>Summary:</strong> ${summary}</p>
  <p>If you need any help, just reply to this email.</p>
</div>`;

  const templateName = ar ? "case_update_tc_v1_ar" : "case_update_tc_v1_en";
  const langCode = ar ? "ar_AE" : "en_US";

  return { bodyParams, subject, html, templateName, langCode };
}
