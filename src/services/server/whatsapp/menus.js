// menus.js
import { LANG } from "./services/constants";
import { t } from "./i18n";

// keep as-is
export function menuLanguage() {
  return {
    type: "button",
    header: { type: "text", text: t(LANG.EN, "choose_lang_header") },
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
  const L = (k) => t(ar ? LANG.AR : LANG.EN, k);
  return {
    type: "list",
    header: { type: "text", text: L("main_header") },
    body: { text: L("main_body") },
    footer: { text: L("main_footer") },
    action: {
      button: L("main_button"),
      sections: [
        {
          title: ar ? "الخدمات المتاحة" : "Available Services",
          rows: [
            {
              id: "maintenance_request",
              title: ar ? "🔧 طلب صيانة" : "🔧 Maintenance Request",
              description: L("main_maintenance_desc"),
            },
            {
              id: "submit_complaint",
              title: ar ? "📝 تقديم شكوى" : "📝 Submit Complaint",
              description: L("main_complaint_desc"),
            },
            {
              id: "check_status",
              title: ar ? "📊 حالة الطلبات" : "📊 Check Status",
              description: L("main_status_desc"),
            },
            {
              id: "contact_support",
              title: ar ? "☎️ الاتصال بالدعم" : "☎️ Contact Support",
              description: L("main_support_desc"),
            },
            {
              id: "payment_inquiry",
              title: ar ? "💳 استعلام عن الدفعات" : "💳 Payment Inquiry",
              description: L("main_payment_desc"),
            },
            {
              id: "contract_renewal",
              title: ar ? "📋 تجديد العقد" : "📋 Contract Renewal",
              description: L("main_renewal_desc"),
            },
          ],
        },
      ],
    },
  };
}

export function menuMaintenanceType(language) {
  const ar = language === LANG.AR;
  const L = (k) => t(ar ? LANG.AR : LANG.EN, k);
  return {
    type: "list",
    header: { type: "text", text: L("maint_type_header") },
    body: { text: L("maint_type_body") },
    footer: { text: L("maint_type_footer") },
    action: {
      button: L("maint_type_button"),
      sections: [
        {
          title: ar ? "أنواع الصيانة" : "Maintenance Types",
          rows: [
            {
              id: "plumbing",
              title: ar ? "🚿 سباكة" : "🚿 Plumbing",
              description: L("maint_plumbing_desc"),
            },
            {
              id: "electrical",
              title: ar ? "⚡ كهرباء" : "⚡ Electrical",
              description: L("maint_electrical_desc"),
            },
            {
              id: "ac_heating",
              title: ar ? "❄️ تكييف/تدفئة" : "❄️ AC & Heating",
              description: L("maint_ac_desc"),
            },
            {
              id: "appliances",
              title: ar ? "🏠 أجهزة" : "🏠 Appliances",
              description: L("maint_appliances_desc"),
            },
            {
              id: "structural",
              title: ar ? "🏗️ إنشائية" : "🏗️ Structural",
              description: L("maint_structural_desc"),
            },
            {
              id: "internet_cable",
              title: ar ? "📡 إنترنت وكابل" : "📡 Internet & Cable",
              description: L("maint_internet_desc"),
            },
            {
              id: "security_systems",
              title: ar ? "🔒 أنظمة الأمان" : "🔒 Security Systems",
              description: L("maint_security_desc"),
            },
            {
              id: "other_maintenance",
              title: ar ? "🔧 أخرى" : "🔧 Other",
              description: L("maint_other_desc"),
            },
          ],
        },
      ],
    },
  };
}

export function menuPriority(language) {
  const ar = language === LANG.AR;
  const L = (k) => t(ar ? LANG.AR : LANG.EN, k);
  return {
    type: "list",
    header: { type: "text", text: L("priority_header") },
    body: { text: L("priority_body") },
    footer: { text: L("priority_footer") },
    action: {
      button: L("priority_button"),
      sections: [
        {
          title: ar ? "مستويات الأولوية" : "Priority Levels",
          rows: [
            {
              id: "urgent",
              title: ar ? "🔴 عاجل" : "🔴 Urgent",
              description: L("priority_urgent_desc"),
            },
            {
              id: "high",
              title: ar ? "🟠 عالية" : "🟠 High",
              description: L("priority_high_desc"),
            },
            {
              id: "medium",
              title: ar ? "🟡 متوسطة" : "🟡 Medium",
              description: L("priority_medium_desc"),
            },
            {
              id: "low",
              title: ar ? "🟢 منخفضة" : "🟢 Low",
              description: L("priority_low_desc"),
            },
          ],
        },
      ],
    },
  };
}

export function menuComplaintCategory(language) {
  const ar = language === LANG.AR;
  const L = (k) => t(ar ? LANG.AR : LANG.EN, k);
  return {
    type: "list",
    header: { type: "text", text: L("complaint_header") },
    body: { text: L("complaint_body") },
    footer: { text: L("complaint_footer") },
    action: {
      button: L("complaint_button"),
      sections: [
        {
          title: ar ? "أنواع الشكاوى" : "Complaint Types",
          rows: [
            {
              id: "property_issue",
              title: ar ? "🏠 مشكلة في العقار" : "🏠 Property Issue",
              description: L("complaint_property_desc"),
            },
            {
              id: "rent_issue",
              title: ar ? "💰 مشكلة في الإيجار" : "💰 Rent Issue",
              description: L("complaint_rent_desc"),
            },
            {
              id: "neighbor_issue",
              title: ar ? "👥 مشكلة مع الجيران" : "👥 Neighbor Issue",
              description: L("complaint_neighbor_desc"),
            },
            {
              id: "maintenance_issue",
              title: ar ? "🔧 مشكلة في الصيانة" : "🔧 Maintenance Issue",
              description: L("complaint_maintenance_desc"),
            },
            {
              id: "noise_issue",
              title: ar ? "🔊 مشكلة ضوضاء" : "🔊 Noise Issue",
              description: L("complaint_noise_desc"),
            },
            {
              id: "security_issue",
              title: ar ? "🛡️ مشكلة أمنية" : "🛡️ Security Issue",
              description: L("complaint_security_desc"),
            },
            {
              id: "payment_issue",
              title: ar ? "💳 مشكلة في الدفع" : "💳 Payment Issue",
              description: L("complaint_payment_desc"),
            },
            {
              id: "other_complaint",
              title: ar ? "📝 أخرى" : "📝 Other",
              description: L("complaint_other_desc"),
            },
          ],
        },
      ],
    },
  };
}
