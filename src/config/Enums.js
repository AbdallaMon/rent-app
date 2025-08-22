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
    NEEDSACTION: "بحاجة الي اتخاذ اجراء"
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
    MAINTENANCE: "صيانة",
    CONTRACT_EXPENSE: "مصاريف عقد",
    OTHER_EXPENSE: "مصاريف أخرى",
    MANAGEMENT_COMMISSION: "عمولة إدارة",
    OTHER: "أخرى",
};
const translateInvoiceType = (type) => {
    return PaymentType[type] || type;
};
const translateRentType = (type) => {
    return StatusType[type] || type;
}
module.exports = {
    RentCollectionType,
    StatusType,
    PaymentStatus,
    PaymentType,
    translateInvoiceType, translateRentType
};
