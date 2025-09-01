export const SESSION_TTL_MS = 30 * 60 * 1000;

export const LANG = {
  AR: "ARABIC",
  EN: "ENGLISH",
};

export const DEFAULT_LANG = LANG.AR;

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export const TYPE_MAP_MAINT = {
  electrical: "ELECTRICAL",
  plumbing: "PLUMBING",
  ac_heating: "AC_HEATING",
  appliances: "APPLIANCES",
  structural: "STRUCTURAL",
  cleaning: "CLEANING",
  painting: "PAINTING",
  carpentry: "CARPENTRY",
  pest_control: "PEST_CONTROL",
  other: "OTHER",
  other_maintenance: "OTHER",
};

export const TYPE_MAP_COMPLAINT = {
  property_issue: "PROPERTY_ISSUE",
  rent_issue: "RENT_ISSUE",
  neighbor_issue: "NEIGHBOR_ISSUE",
  maintenance_issue: "MAINTENANCE_ISSUE",
  noise_issue: "NOISE_ISSUE",
  security_issue: "SECURITY_ISSUE",
  payment_issue: "PAYMENT_ISSUE",
  service_quality: "SERVICE_QUALITY",
  other_complaint: "OTHER",
  other: "OTHER",
};

// ===== PaymentStatus =====
export const PaymentStatusLabels = {
  PENDING: { ar: "قيد الانتظار", en: "Pending" },
  PAID: { ar: "مدفوع", en: "Paid" },
  OVERDUE: { ar: "متأخر", en: "Overdue" },
};

// ===== PaymentType =====
export const PaymentTypeLabels = {
  RENT: { ar: "إيجار", en: "Rent" },
  TAX: { ar: "ضريبة", en: "Tax" },
  INSURANCE: { ar: "تأمين", en: "Insurance" },
  REGISTRATION: { ar: "رسوم تسجيل", en: "Registration" },
  MAINTENANCE: { ar: "صيانة", en: "Maintenance" },
  CONTRACT_EXPENSE: { ar: "مصروفات العقد", en: "Contract Expense" },
  OTHER_EXPENSE: { ar: "مصروفات أخرى", en: "Other Expense" },
  MANAGEMENT_COMMISSION: { ar: "عمولة إدارة", en: "Management Commission" },
  OTHER: { ar: "أخرى", en: "Other" },
};

export const RequestStatusLabels = {
  PENDING: { ar: "قيد الانتظار", en: "Pending" },
  IN_PROGRESS: { ar: "قيد المعالجة", en: "In Progress" },
  COMPLETED: { ar: "مكتمل", en: "Completed" },
  REJECTED: { ar: "مرفوض", en: "Rejected" },
};

export const PriorityLabels = {
  LOW: { ar: "منخفض", en: "Low" },
  MEDIUM: { ar: "متوسط", en: "Medium" },
  HIGH: { ar: "عالٍ", en: "High" },
  URGENT: { ar: "عاجل", en: "Urgent" },
};

export const ClientRole = {
  OWNER: "OWNER",
  RENTER: "RENTER",
};
// ===== MaintenanceType =====
export const MaintenanceTypeLabels = {
  ELECTRICAL: { ar: "كهرباء", en: "Electrical" },
  PLUMBING: { ar: "سباكة", en: "Plumbing" },
  AC_HEATING: { ar: "تكييف/تدفئة", en: "AC/Heating" },
  APPLIANCES: { ar: "أجهزة", en: "Appliances" },
  STRUCTURAL: { ar: "إنشائي", en: "Structural" },
  CLEANING: { ar: "نظافة", en: "Cleaning" },
  PAINTING: { ar: "دهان", en: "Painting" },
  CARPENTRY: { ar: "نجارة", en: "Carpentry" },
  PEST_CONTROL: { ar: "مكافحة حشرات", en: "Pest Control" },
  OTHER: { ar: "أخرى", en: "Other" },
};
export const ComplaintCategoryLabels = {
  PROPERTY_ISSUE: { ar: "مشكلة بالعقار", en: "Property Issue" },
  RENT_ISSUE: { ar: "مشكلة إيجار", en: "Rent Issue" },
  NEIGHBOR_ISSUE: { ar: "مشكلة جار", en: "Neighbor Issue" },
  MAINTENANCE_ISSUE: { ar: "مشكلة صيانة", en: "Maintenance Issue" },
  NOISE_ISSUE: { ar: "إزعاج", en: "Noise Issue" },
  SECURITY_ISSUE: { ar: "أمن وسلامة", en: "Security Issue" },
  PAYMENT_ISSUE: { ar: "مشكلة سداد", en: "Payment Issue" },
  SERVICE_QUALITY: { ar: "جودة الخدمة", en: "Service Quality" },
  OTHER: { ar: "أخرى", en: "Other" },
};
export const OWNER_PAYMENT_TYPES = ["MANAGEMENT_COMMISSION", "MAINTENANCE"];
export const RENTER_PAYMENT_TYPES = [
  "RENT",
  "TAX",
  "INSURANCE",
  "REGISTRATION",
  "CONTRACT_EXPENSE",
  "OTHER_EXPENSE",
  "OTHER",
];

// Helpers
export function label(enumMap, key, lang) {
  const rec = enumMap[key];
  if (!rec) return key || "";
  return lang === LANG.AR ? rec.ar : rec.en;
}
