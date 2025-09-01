import { LANG } from "./services/constants";

export function t(lang, key, vars = {}) {
  const l = lang === LANG.EN ? en : ar;
  const raw = l[key] || key;
  return Object.keys(vars).reduce(
    (s, k) => s.replaceAll(`{{${k}}}`, vars[k] ?? ""),
    raw
  );
}

const ar = {
  choose_lang_header: "🌍 Language Selection / اختيار اللغة",
  choose_lang_body:
    "Welcome! Please choose your language.\n\nمرحباً! اختر لغتك.",
  choose: "اختر / Choose",
  main_header: "خدمات العملاء",
  main_body: "مرحباً! يرجى اختيار الخدمة:",
  main_footer: "نحن هنا لخدمتك",
  main_button: "اختر الخدمة",
  // confirmations
  maint_ok:
    "✅ تم تقديم طلب الصيانة.\n" +
    "📋 رقم الطلب: {{id}}\n" +
    "🏠 العقار: {{property}}\n" +
    "🔢 الوحدة: {{unit}}\n" +
    "🧰 النوع: {{type}}\n" +
    "⚡ الأولوية: {{priority}}\n" +
    "📝 الوصف: {{desc}}",
  complaint_ok:
    "✅ تم تقديم الشكوى.\n" +
    "📋 رقم الشكوى: {{id}}\n" +
    "🏠 العقار: {{property}}\n" +
    "🔢 الوحدة: {{unit}}\n" +
    "🗂️ النوع: {{type}}\n" +
    "⚡ الأولوية: {{priority}}\n" +
    "📝 التفاصيل: {{desc}}",
  no_account: "❌ لم نجد حسابك. يرجى الاتصال: +971507935566",
  ask_maint_type: "اختر نوع المشكلة:",
  ask_priority: "اختر الأولوية (عاجل/عالية/متوسطة/منخفضة)",
  ask_maint_desc: "من فضلك اكتب وصف المشكلة بالتفصيل.",
  ask_complaint_type: "اختر نوع الشكوى:",
  ask_complaint_desc: "من فضلك اكتب تفاصيل الشكوى.",
  support_ok: "✅ تم تسجيل طلب الدعم. سيتواصل معك فريقنا قريباً.",
  renewal_ok:
    "✅ تم تسجيل طلب التجديد. سيتواصل معك فريق المبيعات خلال 24 ساعة.",
  no_requests: "📊 لا توجد طلبات سابقة، {{name}}",
  status_header: "📊 حالة طلبات {{name}}\n\n",
  pending_payments_header: "💳 الدفعات المستحقة:\n\n",
  pending_none: "لا توجد دفعات معلقة.",
};

const en = {
  choose_lang_header: "🌍 Language Selection / اختيار اللغة",
  choose_lang_body:
    "Welcome! Please choose your language.\n\nمرحباً! اختر لغتك.",
  choose: "Choose / اختر",
  main_header: "Customer Services",
  main_body: "Welcome! Please select a service:",
  main_footer: "We’re here to help",
  main_button: "Select Service",
  maint_ok:
    "✅ Maintenance request submitted.\n" +
    "📋 Request #: {{id}}\n" +
    "🏠 Property: {{property}}\n" +
    "🔢 Unit: {{unit}}\n" +
    "🧰 Type: {{type}}\n" +
    "⚡ Priority: {{priority}}\n" +
    "📝 Description: {{desc}}",
  complaint_ok:
    "✅ Complaint submitted.\n" +
    "📋 Complaint #: {{id}}\n" +
    "🏠 Property: {{property}}\n" +
    "🔢 Unit: {{unit}}\n" +
    "🗂️ Type: {{type}}\n" +
    "⚡ Priority: {{priority}}\n" +
    "📝 Details: {{desc}}",
  no_account: "❌ We couldn't find your account. Please call: +971507935566",
  ask_maint_type: "Select the issue type:",
  ask_priority: "Choose priority (Urgent/High/Medium/Low)",
  ask_maint_desc: "Please describe the issue in detail.",
  ask_complaint_type: "Select complaint type:",
  ask_complaint_desc: "Please write the complaint details.",
  support_ok: "✅ Support request recorded. Our team will contact you shortly.",
  renewal_ok:
    "✅ Renewal request recorded. Sales team will contact you within 24 hours.",
  no_requests: "📊 No previous requests, {{name}}",
  status_header: "📊 {{name}}'s Requests\n\n",
  pending_payments_header: "💳 Pending payments:\n\n",
  pending_none: "No pending payments.",
};
