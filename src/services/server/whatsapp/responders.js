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
import { sendWhatsAppInteractive, sendWhatsAppText } from "./whatsapp";

export async function sendLanguage(phone) {
  try {
    await sendWhatsAppInteractive(phone, menuLanguage());
    setSession(phone, { step: "awaiting_language_selection" });
  } catch (e) {
    throw new Error(e.message);
  }
}

export async function sendMain(phone, language, incomingMessage) {
  try {
    await sendWhatsAppInteractive(phone, menuMain(language), incomingMessage);
    setSession(phone, { language, step: "awaiting_main_menu_selection" });
  } catch (e) {
    throw new Error(e.message);
  }
}

export async function sendMaintenanceType(phone, language, incomingMessage) {
  try {
    await sendWhatsAppInteractive(
      phone,
      menuMaintenanceType(language),
      incomingMessage
    );
  } catch (e) {
    throw new Error(e.message);
  }
  setSession(phone, { step: "awaiting_maintenance_type" });
}

export async function sendPriority(phone, language, incomingMessage) {
  try {
    await sendWhatsAppInteractive(
      phone,
      menuPriority(language),
      incomingMessage
    );
  } catch (e) {
    throw new Error(e.message);
  }
  setSession(phone, { step: "awaiting_priority_selection" });
}

export async function askMaintenanceDescription(
  phone,
  language,
  incomingMessage
) {
  await sendWhatsAppText(
    phone,
    language === LANG.AR
      ? t(LANG.AR, "ask_maint_desc")
      : t(LANG.EN, "ask_maint_desc"),
    incomingMessage
  );
  setSession(phone, { step: "awaiting_description" });
}

export async function sendComplaintCategory(phone, language, incomingMessage) {
  try {
    await sendWhatsAppInteractive(
      phone,
      menuComplaintCategory(language),
      incomingMessage
    );
  } catch (e) {
    throw new Error(e.message);
  }
  setSession(phone, { step: "awaiting_complaint_category" });
}

export async function askComplaintDescription(
  phone,
  language,
  incomingMessage
) {
  await sendWhatsAppText(
    phone,
    language === LANG.AR
      ? t(LANG.AR, "ask_complaint_desc")
      : t(LANG.EN, "ask_complaint_desc"),
    incomingMessage
  );
  setSession(phone, { step: "awaiting_complaint_description" });
}

export async function sendMaintenanceConfirmation(
  phone,
  language,
  payload,
  incomingMessage
) {
  const msg =
    language === LANG.AR
      ? t(LANG.AR, "maint_ok", payload)
      : t(LANG.EN, "maint_ok", payload);
  await sendWhatsAppText(phone, sanitizeForWA(msg), incomingMessage);
}

export async function sendComplaintConfirmation(
  phone,
  language,
  payload,
  incomingMessage
) {
  const msg =
    language === LANG.AR
      ? t(LANG.AR, "complaint_ok", payload)
      : t(LANG.EN, "complaint_ok", payload);
  await sendWhatsAppText(phone, sanitizeForWA(msg), incomingMessage);
}
