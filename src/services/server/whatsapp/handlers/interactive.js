import { LANG } from "../services/constants";
import { setLanguage, getSession, setSession } from "../session";
import {
  sendMain,
  sendPriority,
  sendMaintenanceType,
  sendComplaintCategory,
  askMaintenanceDescription,
  askComplaintDescription,
} from "../responders";

export async function handleButtonReply(phone, buttonId) {
  if (buttonId === "lang_en") {
    setLanguage(phone, LANG.EN);
    return sendMain(phone, LANG.EN);
  }
  if (buttonId === "lang_ar") {
    setLanguage(phone, LANG.AR);
    return sendMain(phone, LANG.AR);
  }
  // unknown -> ignore
}

export async function handleListReply(phone, listId) {
  const sess = getSession(phone) || setSession(phone, {});
  const language = sess.language || LANG.AR;

  if (listId === "main_menu" || listId === "back_to_menu") {
    setSession(phone, { step: "awaiting_main_menu_selection", data: {} });
    return sendMain(phone, language);
  }

  switch (sess.step) {
    case "awaiting_main_menu_selection":
      return routeMainMenu(listId, phone, language);
    case "awaiting_maintenance_type":
      setSession(phone, {
        data: { ...(sess.data || {}), maintenanceType: listId },
      });
      return sendPriority(phone, language);
    case "awaiting_priority_selection":
      setSession(phone, { data: { ...(sess.data || {}), priority: listId } });
      return askMaintenanceDescription(phone, language);
    case "awaiting_complaint_category":
      setSession(phone, { data: { ...(sess.data || {}), category: listId } });
      return askComplaintDescription(phone, language);
    default:
      return sendMain(phone, language);
  }
}

async function routeMainMenu(choiceId, phone, language) {
  switch (choiceId) {
    case "maintenance_request":
      return sendMaintenanceType(phone, language);
    case "submit_complaint":
      return sendComplaintCategory(phone, language);
    case "check_status":
      return (await import("./mainMenu")).handleStatus(phone, language);
    case "contact_support":
      return (await import("./mainMenu")).handleSupport(phone, language);
    case "payment_inquiry":
      return (await import("./mainMenu")).handlePayments(phone, language);
    case "contract_renewal":
      return (await import("./mainMenu")).handleRenewal(phone, language);
    default:
      return sendMain(phone, language);
  }
}
