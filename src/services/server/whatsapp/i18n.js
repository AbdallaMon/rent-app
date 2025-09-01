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
  // ...existing keys
  main_maintenance_desc: "الإبلاغ عن مشكلة في العقار أو الوحدة",
  main_complaint_desc: "تقديم شكوى أو اقتراح للتحسين",
  main_status_desc: "متابعة حالة طلباتك السابقة",
  main_support_desc: "التحدث مع ممثل خدمة العملاء",
  main_payment_desc: "الاستعلام عن المستحقات والدفعات",
  main_renewal_desc: "طلب تجديد عقد الإيجار",

  /// ===== Maintenance type
  maint_type_header: "نوع طلب الصيانة",
  maint_type_body: "يرجى اختيار نوع المشكلة التي تحتاج إلى صيانة:",
  maint_type_footer: "اختر النوع المناسب",
  maint_type_button: "اختر النوع",
  maint_plumbing_desc: "مشاكل المياه والصرف الصحي",
  maint_electrical_desc: "مشاكل الكهرباء والإضاءة",
  maint_ac_desc: "مشاكل التكييف والتدفئة",
  maint_appliances_desc: "مشاكل الأجهزة المنزلية",
  maint_structural_desc: "مشاكل الأبواب والنوافذ والجدران",
  maint_internet_desc: "شبكة الإنترنت، الكابل والتوصيلات",
  maint_security_desc: "أقفال، كاميرات، إنذارات",
  maint_other_desc: "مشاكل أخرى غير مذكورة",

  /// ===== Priority
  priority_header: "أولوية الطلب",
  priority_body: "يرجى تحديد أولوية طلب الصيانة:",
  priority_footer: "اختر الأولوية المناسبة",
  priority_button: "اختر الأولوية",
  priority_urgent_desc: "مشكلة طارئة تحتاج حل فوري",
  priority_high_desc: "مشكلة مهمة تحتاج حل سريع",
  priority_medium_desc: "مشكلة عادية تُحل خلال أيام",
  priority_low_desc: "مشكلة بسيطة غير عاجلة",

  /// ===== Complaint types
  complaint_header: "نوع الشكوى",
  complaint_body: "يرجى اختيار نوع الشكوى التي تريد تقديمها:",
  complaint_footer: "اختر النوع المناسب",
  complaint_button: "اختر النوع",
  complaint_property_desc: "مشاكل متعلقة بالعقار أو الوحدة",
  complaint_rent_desc: "مشاكل متعلقة بالإيجار أو الدفع",
  complaint_neighbor_desc: "مشاكل مع الجيران أو السكان",
  complaint_maintenance_desc: "شكوى حول خدمة الصيانة",
  complaint_noise_desc: "شكوى من الضوضاء أو الإزعاج",
  complaint_security_desc: "مشاكل أمنية أو سلامة",
  complaint_payment_desc: "مشاكل في نظام الدفع",
  complaint_other_desc: "شكوى أخرى غير مذكورة",
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
  main_maintenance_desc: "Report a problem with the property or unit",
  main_complaint_desc: "File a complaint or improvement suggestion",
  main_status_desc: "Track the status of your previous requests",
  main_support_desc: "Speak with a customer service representative",
  main_payment_desc: "Inquire about dues and payments",
  main_renewal_desc: "Request rental contract renewal",

  maint_type_header: "Maintenance Request Type",
  maint_type_body: "Please select the type of issue that needs maintenance:",
  maint_type_footer: "Select the appropriate type",
  maint_type_button: "Select Type",
  maint_plumbing_desc: "Water supply and drainage issues",
  maint_electrical_desc: "Electrical and lighting problems",
  maint_ac_desc: "Air conditioning and heating issues",
  maint_appliances_desc: "Home appliance problems",
  maint_structural_desc: "Doors, windows, walls and fittings",
  maint_internet_desc: "Internet, cable and wiring issues",
  maint_security_desc: "Locks, cameras and alarms",
  maint_other_desc: "Other maintenance issues",

  priority_header: "Request Priority",
  priority_body: "Please specify the priority of your maintenance request:",
  priority_footer: "Select appropriate priority",
  priority_button: "Select Priority",
  priority_urgent_desc: "Emergency issue needing immediate attention",
  priority_high_desc: "Important issue needing quick resolution",
  priority_medium_desc: "Normal issue resolvable within days",
  priority_low_desc: "Simple issue that is not urgent",

  complaint_header: "Complaint Type",
  complaint_body: "Please select the type of complaint you want to submit:",
  complaint_footer: "Select the appropriate type",
  complaint_button: "Select Type",
  complaint_property_desc: "Issues related to the property or unit",
  complaint_rent_desc: "Issues related to rent or payment",
  complaint_neighbor_desc: "Issues with neighbors or residents",
  complaint_maintenance_desc: "Complaint about maintenance service",
  complaint_noise_desc: "Complaint about noise or disturbance",
  complaint_security_desc: "Security or safety issues",
  complaint_payment_desc: "Payment system issues",
  complaint_other_desc: "Other complaint not listed",
};
