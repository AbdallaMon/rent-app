import { LANG } from "./services/constants";
import { t } from "./i18n";

export function menuLanguage() {
  return {
    type: "button",
    header: { type: "text", text: t(LANG.EN, "choose_lang_header") }, // header bilingual
    body: { text: t(LANG.EN, "choose_lang_body") },
    footer: { text: t(LANG.EN, "choose") },
    action: {
      buttons: [
        { type: "reply", reply: { id: "lang_en", title: "🇺🇸 English" } },
        { type: "reply", reply: { id: "lang_ar", title: "🇦🇪 العربية" } },
      ],
    },
  };
}

export function menuMain(language) {
  const ar = language === LANG.AR;
  return {
    type: "list",
    header: {
      type: "text",
      text: ar ? t(LANG.AR, "main_header") : t(LANG.EN, "main_header"),
    },
    body: { text: ar ? t(LANG.AR, "main_body") : t(LANG.EN, "main_body") },
    footer: {
      text: ar ? t(LANG.AR, "main_footer") : t(LANG.EN, "main_footer"),
    },
    action: {
      button: ar ? t(LANG.AR, "main_button") : t(LANG.EN, "main_button"),
      sections: [
        {
          title: ar ? "الخدمات المتاحة" : "Available Services",
          rows: [
            {
              id: "maintenance_request",
              title: ar ? "🔧 طلب صيانة" : "🔧 Maintenance Request",
            },
            {
              id: "submit_complaint",
              title: ar ? "📝 تقديم شكوى" : "📝 Submit Complaint",
            },
            {
              id: "check_status",
              title: ar ? "📊 حالة الطلبات" : "📊 Check Status",
            },
            {
              id: "contact_support",
              title: ar ? "☎️ الاتصال بالدعم" : "☎️ Contact Support",
            },
            {
              id: "payment_inquiry",
              title: ar ? "💳 استعلام عن الدفعات" : "💳 Payment Inquiry",
            },
            {
              id: "contract_renewal",
              title: ar ? "📋 تجديد العقد" : "📋 Contract Renewal",
            },
          ],
        },
      ],
    },
  };
}

export function menuMaintenanceType(language) {
  const ar = language === LANG.AR;
  return {
    type: "list",
    header: {
      type: "text",
      text: ar ? "نوع طلب الصيانة" : "Maintenance Request Type",
    },
    body: { text: ar ? "اختر نوع المشكلة:" : "Select the issue type:" },
    action: {
      button: ar ? "اختر النوع" : "Select Type",
      sections: [
        {
          title: ar ? "أنواع الصيانة" : "Types",
          rows: [
            { id: "plumbing", title: ar ? "🚿 سباكة" : "🚿 Plumbing" },
            { id: "electrical", title: ar ? "⚡ كهرباء" : "⚡ Electrical" },
            {
              id: "ac_heating",
              title: ar ? "❄️ تكييف/تدفئة" : "❄️ AC & Heating",
            },
            { id: "appliances", title: ar ? "🏠 أجهزة" : "🏠 Appliances" },
            { id: "structural", title: ar ? "🏗️ إنشائية" : "🏗️ Structural" },
            {
              id: "internet_cable",
              title: ar ? "📡 إنترنت وكابل" : "📡 Internet & Cable",
            },
            {
              id: "security_systems",
              title: ar ? "🔒 أنظمة الأمان" : "🔒 Security Systems",
            },
            { id: "other_maintenance", title: ar ? "🔧 أخرى" : "🔧 Other" },
          ],
        },
      ],
    },
  };
}

export function menuPriority(language) {
  const ar = language === LANG.AR;
  return {
    type: "list",
    header: { type: "text", text: ar ? "أولوية الطلب" : "Request Priority" },
    body: { text: ar ? "حدد أولوية الطلب:" : "Choose priority:" },
    action: {
      button: ar ? "اختر الأولوية" : "Select Priority",
      sections: [
        {
          title: ar ? "الأولوية" : "Priority",
          rows: [
            { id: "urgent", title: ar ? "🔴 عاجل" : "🔴 Urgent" },
            { id: "high", title: ar ? "🟠 عالية" : "🟠 High" },
            { id: "medium", title: ar ? "🟡 متوسطة" : "🟡 Medium" },
            { id: "low", title: ar ? "🟢 منخفضة" : "🟢 Low" },
          ],
        },
      ],
    },
  };
}

export function menuComplaintCategory(language) {
  const ar = language === LANG.AR;
  return {
    type: "list",
    header: { type: "text", text: ar ? "نوع الشكوى" : "Complaint Type" },
    body: { text: ar ? "اختر نوع الشكوى:" : "Select complaint type:" },
    action: {
      button: ar ? "اختر النوع" : "Select Type",
      sections: [
        {
          title: ar ? "الأنواع" : "Types",
          rows: [
            {
              id: "property_issue",
              title: ar ? "🏠 مشكلة في العقار" : "🏠 Property Issue",
            },
            {
              id: "rent_issue",
              title: ar ? "💰 مشكلة في الإيجار" : "💰 Rent Issue",
            },
            {
              id: "neighbor_issue",
              title: ar ? "👥 مشكلة مع الجيران" : "👥 Neighbor Issue",
            },
            {
              id: "maintenance_issue",
              title: ar ? "🔧 مشكلة في الصيانة" : "🔧 Maintenance Issue",
            },
            {
              id: "noise_issue",
              title: ar ? "🔊 مشكلة ضوضاء" : "🔊 Noise Issue",
            },
            {
              id: "security_issue",
              title: ar ? "🛡️ مشكلة أمنية" : "🛡️ Security Issue",
            },
            {
              id: "payment_issue",
              title: ar ? "💳 مشكلة في الدفع" : "💳 Payment Issue",
            },
            { id: "other_complaint", title: ar ? "📝 أخرى" : "📝 Other" },
          ],
        },
      ],
    },
  };
}
