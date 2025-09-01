import {
  sendInteractiveWhatsAppMessage,
  sendWhatsAppMessage,
} from "@/lib/whatsapp";
import { t } from "./i18n";
import { LANG } from "./services/constants";
import {
  menuLanguage,
  menuMain,
  menuMaintenanceType,
  menuPriority,
  menuComplaintCategory,
} from "./menus";
import { sanitizeForWA } from "./sanitize";
import { setSession } from "./session";

export async function sendLanguage(phone) {
  try {
    await sendInteractiveWhatsAppMessage(phone, menuLanguage());
    setSession(phone, { step: "awaiting_language_selection" });
  } catch {
    await sendWhatsAppMessage(
      phone,
      "Reply with:\n1 - English\n2 - العربية\n\nاكتب:\n1 - English\n2 - العربية"
    );
  }
}

export async function sendMain(phone, language) {
  try {
    await sendInteractiveWhatsAppMessage(phone, menuMain(language));
    setSession(phone, { language, step: "awaiting_main_menu_selection" });
  } catch {
    const ar = language === LANG.AR;
    await sendWhatsAppMessage(
      phone,
      ar
        ? "اختر:\n1️⃣ صيانة\n2️⃣ شكوى\n3️⃣ حالة الطلبات\n4️⃣ دعم\n5️⃣ دفعات\n6️⃣ تجديد عقد"
        : "Choose:\n1️⃣ Maintenance\n2️⃣ Complaint\n3️⃣ Status\n4️⃣ Support\n5️⃣ Payments\n6️⃣ Contract renewal"
    );
  }
}

export async function sendMaintenanceType(phone, language) {
  try {
    await sendInteractiveWhatsAppMessage(phone, menuMaintenanceType(language));
  } catch {
    await sendWhatsAppMessage(
      phone,
      language === LANG.AR
        ? t(LANG.AR, "ask_maint_type")
        : t(LANG.EN, "ask_maint_type")
    );
  }
  setSession(phone, { step: "awaiting_maintenance_type" });
}

export async function sendPriority(phone, language) {
  try {
    await sendInteractiveWhatsAppMessage(phone, menuPriority(language));
  } catch {
    await sendWhatsAppMessage(
      phone,
      language === LANG.AR
        ? t(LANG.AR, "ask_priority")
        : t(LANG.EN, "ask_priority")
    );
  }
  setSession(phone, { step: "awaiting_priority_selection" });
}

export async function askMaintenanceDescription(phone, language) {
  await sendWhatsAppMessage(
    phone,
    language === LANG.AR
      ? t(LANG.AR, "ask_maint_desc")
      : t(LANG.EN, "ask_maint_desc")
  );
  setSession(phone, { step: "awaiting_description" });
}

export async function sendComplaintCategory(phone, language) {
  try {
    await sendInteractiveWhatsAppMessage(
      phone,
      menuComplaintCategory(language)
    );
  } catch {
    await sendWhatsAppMessage(
      phone,
      language === LANG.AR
        ? t(LANG.AR, "ask_complaint_type")
        : t(LANG.EN, "ask_complaint_type")
    );
  }
  setSession(phone, { step: "awaiting_complaint_category" });
}

export async function askComplaintDescription(phone, language) {
  await sendWhatsAppMessage(
    phone,
    language === LANG.AR
      ? t(LANG.AR, "ask_complaint_desc")
      : t(LANG.EN, "ask_complaint_desc")
  );
  setSession(phone, { step: "awaiting_complaint_description" });
}

export async function sendMaintenanceConfirmation(phone, language, payload) {
  const msg =
    language === LANG.AR
      ? t(LANG.AR, "maint_ok", payload)
      : t(LANG.EN, "maint_ok", payload);
  await sendWhatsAppMessage(phone, sanitizeForWA(msg));
}

export async function sendComplaintConfirmation(phone, language, payload) {
  const msg =
    language === LANG.AR
      ? t(LANG.AR, "complaint_ok", payload)
      : t(LANG.EN, "complaint_ok", payload);
  await sendWhatsAppMessage(phone, sanitizeForWA(msg));
}
