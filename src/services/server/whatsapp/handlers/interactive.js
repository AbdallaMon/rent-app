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
import {
  handlePayments,
  handleRenewal,
  handleStatus,
  handleSupport,
} from "./mainMenu";
export async function handleButtonReply(phone, buttonId, incomingMessage) {
  try {
    if (buttonId === "lang_en") {
      setLanguage(phone, LANG.EN);
      return sendMain(phone, LANG.EN, incomingMessage);
    }
    if (buttonId === "lang_ar") {
      setLanguage(phone, LANG.AR);
      return sendMain(phone, LANG.AR, incomingMessage);
    }
  } catch (e) {
    throw new Error(e);
  }
}

export async function handleListReply(phone, listId, incomingMessage) {
  try {
    const sess = getSession(phone) || setSession(phone, {});
    const language = sess.language || LANG.AR;

    if (listId === "main_menu" || listId === "back_to_menu") {
      setSession(phone, { step: "awaiting_main_menu_selection", data: {} });
      return sendMain(phone, language, incomingMessage);
    }

    switch (sess.step) {
      case "awaiting_main_menu_selection":
        return routeMainMenu(listId, phone, language, incomingMessage);
      case "awaiting_maintenance_type":
        setSession(phone, {
          data: { ...(sess.data || {}), maintenanceType: listId },
        });
        return sendPriority(phone, language, incomingMessage);
      case "awaiting_priority_selection":
        setSession(phone, { data: { ...(sess.data || {}), priority: listId } });
        return askMaintenanceDescription(phone, language, incomingMessage);
      case "awaiting_complaint_category":
        setSession(phone, { data: { ...(sess.data || {}), category: listId } });
        return askComplaintDescription(phone, language, incomingMessage);
      default:
        return sendMain(phone, language, incomingMessage);
    }
  } catch (e) {
    throw new Error(e);
  }
}

async function routeMainMenu(choiceId, phone, language, incomingMessage) {
  try {
    switch (choiceId) {
      case "maintenance_request":
        return sendMaintenanceType(phone, language, incomingMessage);
      case "submit_complaint":
        return sendComplaintCategory(phone, language, incomingMessage);
      case "check_status":
        return await handleStatus(phone, language, incomingMessage);
      case "contact_support":
        return await handleSupport(phone, language, incomingMessage);
      case "payment_inquiry":
        return await handlePayments(phone, language, incomingMessage);
      case "contract_renewal":
        return await handleRenewal(phone, language, incomingMessage);
      default:
        return sendMain(phone, language, incomingMessage);
    }
  } catch (e) {
    throw new Error(e);
  }
}
