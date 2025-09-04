import prisma from "@/lib/prisma";
import { LANG } from "./services/constants";

const DEFAULT_CC = process.env.EG ? "+20" : "+971";

function onlyDigits(s = "") {
  return (s || "").replace(/\D+/g, "");
}

export function normalizePhone(raw, defaultCc = DEFAULT_CC) {
  if (!raw) return null;
  const s = String(raw).trim();

  // لو الرقم أصلاً دولي
  if (s.startsWith("+")) return s;

  // 00 -> +
  if (s.startsWith("00")) return "+" + onlyDigits(s.slice(2));

  const digits = onlyDigits(s);

  // نمط الإمارات الشائع: 05X...
  if (/^05\d{7,9}$/.test(digits)) {
    // 05XXXXXXXX -> +9715XXXXXXXX
    return defaultCc + digits.slice(1);
  }

  // رقم يبدأ بـ 0 ومفيش كود
  if (/^0\d{7,12}$/.test(digits)) {
    return defaultCc + digits.slice(1);
  }

  // رقم بدون كود وميبدأش بـ 0
  if (/^\d{7,12}$/.test(digits)) {
    return defaultCc + digits;
  }

  // آخر محاولة: لو فيه أي ديجيتس هنلزق الكود الافتراضي
  return defaultCc + digits;
}

export async function logWhatsApp(body) {
  try {
    return await prisma.whatsappMessageLog.create({
      data: {
        messageId: `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        ...body,
      },
    });
  } catch (e) {
    console.error("logWhatsApp error:", e.message);
  }
}

export async function updateWhatsAppLog({ logId, status, other }) {
  const log = await prisma.whatsappMessageLog.findFirst({
    where: { id: logId },
  });
  if (!log) return;
  await prisma.whatsappMessageLog.update({
    where: { id: log.id },
    data: { status, ...(other && { ...other }) },
  });
}

export async function checkIfThereIsALog({
  sendSchema,
  relationKey,
  relationId,
}) {
  return await prisma.whatsappMessageLog.findFirst({
    where: {
      sendSchema,
      relationKey,
      relationId,
      status: { not: messageStatus.FAILED },
    },
  });
}

export async function createAWhatsAppIncomingMessage({ msg, client }) {
  const otherData = extractInboundFields(msg);

  return await prisma.WhatsappIncomingMessage.create({
    data: {
      clientId: client.id,
      sender: client.name,
      status: messageStatus.RECEIVED,
      metadata: msg,
      ...otherData,
    },
  });
}
export async function updateAWhatsAppIncomingMessage({
  messageId,
  status,
  other,
}) {
  const message = await prisma.whatsappIncomingMessage.findFirst({
    where: { id: messageId },
  });
  if (!message) return;
  return await prisma.whatsappIncomingMessage.update({
    where: { id: message.id },
    data: { status, ...(other && { ...other }) },
  });
}

function extractInboundFields(msg) {
  const messageId = msg?.id || "";
  const messageType = msg?.type || ""; // "text", "interactive", "image", ...
  const language = msg?.language?.code || msg?.context?.language?.code || null;

  // content: prefer text, else summarize interactive
  let content = null;
  if (msg?.text?.body) content = String(msg.text.body);

  if (!content && msg?.interactive?.type === "button_reply") {
    content = `[button_reply] ${msg?.interactive?.button_reply?.title || msg?.interactive?.button_reply?.id || ""}`;
  } else if (!content && msg?.interactive?.type === "list_reply") {
    content = `[list_reply] ${msg?.interactive?.list_reply?.title || msg?.interactive?.list_reply?.id || ""}`;
  } else if (!content && msg?.image) {
    content = `[image] ${msg?.image?.caption || ""}`;
  } else if (!content && msg?.audio) {
    content = `[audio]`;
  } else if (!content && msg?.document) {
    content = `[document] ${msg?.document?.filename || ""}`;
  }

  return {
    messageId,
    messageType,
    language,
    content,
  };
}

export const messageStatus = {
  INCOMING: "INCOMING",
  RECEIVED: "RECEIVED",
  RESPONDED: "RESPONDED",
  DELIVERED: "DELIVERED",
  FAILED: "FAILED",
  SCHEDULED: "SCHEDULED",
};
export const messageTypes = {
  PAYMENT_REMINDER: "PAYMENT_REMINDER",
  CONTRACT_EXPIRY_REMINDER: "CONTRACT_EXPIRY_REMINDER",
  MAINTAINCE_FOLLOW_UP: "MAINTAINCE_FOLLOW_UP",
  CUSTOMER_SUPPORT_REQUEST: "CUSTOMER_SUPPORT_REQUEST",
  RENEW_RENTAGREEMENT_REQUEST: "RENEW_RENTAGREEMENT_REQUEST",
  MAINTAINCE_REQUEST_TO_TECH: "MAINTAINCE_REQUEST_TO_TECH",
  COMPLAINT_REQUEST_TO_CS: "COMPLAINT_REQUEST_TO_CS",
};

export function formatDate(d, lang) {
  const locale = lang === LANG.AR ? "ar-AE" : "en-US";
  return new Date(d).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}
