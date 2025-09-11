const RentCollectionType = {
  TWO_MONTHS: "شهرين",
  THREE_MONTHS: "ثلاثة أشهر",
  FOUR_MONTHS: "أربعة أشهر",
  SIX_MONTHS: "ستة أشهر",
  ONE_YEAR: "سنة واحدة",
};

const StatusType = {
  ACTIVE: "نشط",
  CANCELED: "ملغى",
  EXPIRED: "منتهي",
  NEEDSACTION: "بحاجة الي اتخاذ اجراء",
};

const PaymentStatus = {
  PAID: "مدفوع",
  PENDING: "قيد الانتظار",
  OVERDUE: "متأخر",
};

const PaymentType = {
  RENT: "إيجار",
  TAX: "ضرائب",
  INSURANCE: "تأمين",
  REGISTRATION: "تسجيل",
  MAINTENANCE: "مصروف",
  CONTRACT_EXPENSE: "مصاريف عقد",
  OTHER_EXPENSE: "مصاريف أخرى",
  MANAGEMENT_COMMISSION: "عمولة إدارة",
  OTHER: "أخرى",
};
const InvoiceBillingStatus = {
  DRAFT: "مسودة",
  SENT: "مرسلة",
  PARTIALLY_PAID: "مدفوعة جزئيًا",
  PAID: "مدفوعة",
  OVERDUE: "متأخرة",
  CANCELED: "ملغاة",
};
const PaymentMethodType = {
  CASH: "كاش",
  BANK: "تحويل بنكي",
  CHEQUE: "شيك",
};

const accountType = {
  ASSET: "أصل",
  LIABILITY: "التزام",
  EQUITY: "حقوق الملكية",
  REVENUE: "إيرادات",
  EXPENSE: "مصاريف",
};
const SecurityDepositStatus = {
  HELD: "محتجزة",
  PARTIALLY_REFUNDED: "مسترجعة جزئياً",
  REFUNDED: "مسترجعة بالكامل",
  FORFEITED: "مصادرة",
};

const MaintaincePayer = {
  COMPANY: "الشركة",
  OWNER: "المالك",
};
const PriorityTypes = {
  LOW: "منخفضة",
  MEDIUM: "متوسطة",
  HIGH: "مرتفعة",
  URGENT: "عاجلة",
};
const MaintenanceType = {
  ELECTRICAL: "كهرباء",
  PLUMBING: "سباكة",
  AC_HEATING: "تكييف/تدفئة",
  APPLIANCES: "أجهزة",
  STRUCTURAL: "إنشائي",
  CLEANING: "تنظيف",
  PAINTING: "دهان",
  CARPENTRY: "نجارة",
  PEST_CONTROL: "مكافحة آفات",
  OTHER: "أخرى",
};

const ComplaintCategory = {
  PROPERTY_ISSUE: "مشكلة العقار",
  RENT_ISSUE: "مشكلة إيجار",
  NEIGHBOR_ISSUE: "مشاكل الجيران",
  MAINTENANCE_ISSUE: "مشكلة صيانة",
  NOISE_ISSUE: "ضوضاء",
  SECURITY_ISSUE: "أمن",
  PAYMENT_ISSUE: "مدفوعات",
  SERVICE_QUALITY: "جودة خدمة",
  OTHER: "أخرى",
};

const RequestStatusTypes = {
  PENDING: "قيد المراجعة",
  IN_PROGRESS: "قيد التنفيذ",
  COMPLETED: "مكتمل",
  REJECTED: "مرفوض",
};

const translateInvoiceType = (type) => {
  return PaymentType[type] || type;
};
const translateRentType = (type) => {
  return StatusType[type] || type;
};

module.exports = {
  RentCollectionType,
  StatusType,
  PaymentStatus,
  PaymentType,
  translateInvoiceType,
  translateRentType,
  accountType,
  MaintaincePayer,
  SecurityDepositStatus,
  PriorityTypes,
  MaintenanceType,
  ComplaintCategory,
  RequestStatusTypes,
  PaymentMethodType,
  InvoiceBillingStatus,
};
