// lib/whatsapp.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const fetch = (...args) =>
  import("node-fetch").then(({ default: f }) => f(...args));

const WA_BASE = "https://graph.facebook.com/v22.0";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN = process.env.WHATSAPP_BUSINESS_API_TOKEN;

// --------------------------
// Low-level senders
// --------------------------
async function sendWhatsAppText(to, body) {
  const url = `${WA_BASE}/${PHONE_NUMBER_ID}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(`WA send failed: ${res.status}`);
    err.response = data;
    throw err;
  }
  return data; // includes pricing + conversation if available
}
// lib/whatsapp.js (add near the top)
function sanitizeTemplateParam(val) {
  if (val == null) return "";
  return String(val)
    .replace(/[\r\n\t]+/g, " ") // no newlines/tabs
    .replace(/\s{5,}/g, " ") // collapse 5+ spaces
    .trim();
}

async function sendWhatsAppTemplate(to, templateName, lang, bodyParams = []) {
  const url = `${WA_BASE}/${PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: lang }, // e.g. "ar_AE" or "en"
    },
  };

  if (Array.isArray(bodyParams) && bodyParams.length) {
    payload.template.components = [
      {
        type: "body",
        parameters: bodyParams.map((t) => ({
          type: "text",
          text: sanitizeTemplateParam(
            typeof t === "string" ? t : (t?.text ?? "")
          ),
        })),
      },
    ];
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(`WA template failed: ${res.status}`);
    err.response = data;
    throw err;
  }
  return data;
}

async function sendSmart({ to, text, spec }) {
  const e164 = to; // assume normalized upstream

  const resTpl = await sendWhatsAppTemplate(
    e164,
    spec.templateName,
    spec.language,
    spec.bodyParams || []
  );
  return { ok: true, type: "template", meta: resTpl, language: spec.language };
}

module.exports = {
  sendWhatsAppText,
  sendWhatsAppTemplate,
  sendSmart,
};
