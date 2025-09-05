// scripts/list-waba-templates.js
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

function loadEnv() {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(__dirname, ".env"),
    path.resolve(__dirname, "../../.env"),
    path.resolve(__dirname, "../../../.env"),
    path.resolve(__dirname, "../../../../.env"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      console.log(`[env] loaded: ${p}`);
      return;
    }
  }
  console.warn(
    "[env] no .env file found in common locations; relying on process env"
  );
}

loadEnv();

const fetch = (...args) =>
  import("node-fetch").then(({ default: f }) => f(...args));

const GRAPH = "https://graph.facebook.com/v22.0";
const WABA_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
const TOKEN = process.env.WHATSAPP_BUSINESS_API_TOKEN;
const APP_ID = process.env.WHATSAPP_BUSINESS_API_TOKEN;

function assertEnv() {
  const found = Object.keys(process.env).filter((k) =>
    k.startsWith("WHATSAPP_")
  );
  console.log("[env] whatsapp keys in process.env:", found);
  if (!WABA_ID || !TOKEN) {
    throw new Error(
      "Missing WABA_ID or TOKEN envs. " +
        "Expected WHATSAPP_BUSINESS_ACCOUNT_ID and WHATSAPP_BUSINESS_API_TOKEN."
    );
  }
}

// list of template names you want
const TARGET_NAMES = ["case_update_tc_v1_ar", "case_update_tc_v1_en"];

async function deleteTemplate() {
  const url = `${GRAPH}/${WABA_ID}/message_templates?name=case_update_tc_v1`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Delete template failed:", JSON.stringify(data, null, 2));
    process.exit(1);
  }
  console.log("Template deleted:", JSON.stringify(data, null, 2));
}

async function createTemplate() {
  const url = `${GRAPH}/${WABA_ID}/message_templates`;
  // case_update_tc_v1
  // case_update_en_tc_v2;
  const payload = {
    name: "case_update_tc_v1_ar",
    language: "ar_AE",
    category: "UTILITY",
    components: [
      // Static header (no placeholders)
      { type: "HEADER", format: "TEXT", text: "تحديث الحالة" },

      {
        type: "BODY",
        text:
          "مرحباً،\n" +
          "نود إبلاغك بتحديث على {{1}} الخاص بك.\n\n" + // caseKind (طلب صيانة / شكوى)
          "رقم المتابعة: {{2}}\n" + // reference
          "الحالة: {{3}}\n" + // status
          "النوع: {{4}}\n" + // type
          "الموقع: {{5}}\n\n" + // location (العقار – الوحدة)
          "الملخص: {{6}}\n\n" + // summary
          "للمزيد من المساعدة، يرجى الرد على هذه الرسالة.",
        example: {
          body_text: [
            [
              "طلب صيانة", // {{1}} caseKind
              "MR-0190", // {{2}} reference
              "قيد المعالجة", // {{3}} status
              "سباكة", // {{4}} type
              "برج الريان – A-1203", // {{5}} location
              "تسريب مياه في الحمام", // {{6}} summary
            ],
          ],
        },
      },
    ],
  };

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
    console.error("Create template failed:", JSON.stringify(data, null, 2));
    process.exit(1);
  }
  console.log("Template submitted:", JSON.stringify(data, null, 2));
}
async function getWebhookConfig() {
  assertEnv();
  const url = `${GRAPH}/${APP_ID}/subscriptions?access_token=${TOKEN}`;
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json, null, 2));
  return json;
}

/**
 * Update webhook config
 * @param {Object} fields
 * Example:
 *   updateWebhookConfig({
 *     callback_url: "https://your-domain/api/whatsapp/webhook",
 *     verify_token: "mytoken",
 *     fields: ["messages", "message_status"]
 *   })
 */
async function updateWebhookConfig(fields) {
  assertEnv();
  const url = `${GRAPH}/${APP_ID}/subscriptions?access_token=${TOKEN}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      object: "whatsapp_business_account",
      ...fields,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json, null, 2));
  return json;
}
async function getAllWhatsAppTemplates(limit = 100) {
  let url = `${GRAPH}/${WABA_ID}/message_templates?limit=${limit}`;
  const all = [];

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(json, null, 2));
    if (Array.isArray(json.data)) all.push(...json.data);
    url = json.paging?.next || null;
  }
  return all;
}

(async () => {
  // const configs = await getWebhookConfig();
  // console.log(configs, "configs");
  // await createTemplate();
  // await deleteTemplate();
  const templates = await getAllWhatsAppTemplates();
  for (const t of templates) {
    if (TARGET_NAMES.includes(t.name)) {
      console.log("==== TEMPLATE ====");
      console.log("Name:", t.name);
      console.log("Lang:", t.language);
      console.log("Status:", t.status);
      console.log("Category:", t.category);
      console.log("Components:", JSON.stringify(t.components, null, 2));
      console.log("\n");
    }
  }
})();
