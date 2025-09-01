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
const TARGET_NAMES = [
  "contact_form_submission",
  "contact_form_reply",
  "contact_form_reply_en",
  "maintenance_status_update",
  "maintenance_request",
  "maintenance_status_update_en",
];
// async function createComplaintTemplate() {
//   const url = `https://graph.facebook.com/v19.0/${process.env.WABA_ID}/message_templates`;

//   const payload = {
//     name: "complaint_request_cs",
//     language: "ar_AE",
//     category: "UTILITY",
//     components: [
//       // Optional header (static text). Remove this whole block if you don't want a header.
//       {
//         type: "HEADER",
//         format: "TEXT",
//         text: "طلب شكوى جديد",
//       },
//       {
//         type: "BODY",
//         text:
//           "تم استلام شكوى جديدة من العميل:\n" +
//           "رقم الطلب: {{1}}\n" +
//           "المعرف الداخلي: {{2}}\n" +
//           "اسم العميل: {{3}}\n" +
//           "الأولوية: {{4}}\n" +
//           "نوع الشكوى: {{5}}\n" +
//           "رقم العميل: {{6}}\n" +
//           "العقار: {{7}}\n" +
//           "الوحدة: {{8}}\n" +
//           "تاريخ الطلب: {{9}}\n\n" +
//           "يرجى المراجعة والمتابعة من قبل خدمة العملاء.",
//         example: {
//           body_text: [
//             [
//               "CMP-00219", // {{1}} displayId
//               "clmpt_9x1a2b3c", // {{2}} requestId
//               "أحمد علي", // {{3}} clientName
//               "عاجلة", // {{4}} priority (label)
//               "مشكلة صيانة", // {{5}} complaintType (label)
//               "+971500000000", // {{6}} clientPhone
//               "برج الريان", // {{7}} propertyName
//               "A-1203", // {{8}} unitNumber
//               "15/03/2025", // {{9}} requestDate (date-only)
//             ],
//           ],
//         },
//       },
//     ],
//   };

//   const res = await fetch(url, {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${process.env.WHATSAPP_BUSINESS_API_TOKEN}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(payload),
//   });

//   const data = await res.json();
//   if (!res.ok) {
//     console.error("Create template failed:", JSON.stringify(data, null, 2));
//     throw new Error("Template submission failed");
//   }
//   console.log("Template submitted:", JSON.stringify(data, null, 2));
// }
async function deleteTemplate() {
  const url = `${GRAPH}/${WABA_ID}/message_templates?name=maintenance_request_tc`;

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

  const payload = {
    name: "maintenance_request_tc_v2",
    language: "ar_AE",
    category: "UTILITY",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "طلب صيانة جديد (تفاصيل)",
      },
      {
        type: "BODY",
        text:
          "تم استلام طلب صيانة جديد:\n" +
          "رقم الطلب: {{1}}\n" +
          "اسم العميل: {{2}}\n" +
          "الأولوية: {{3}}\n" +
          "نوع الصيانة: {{4}}\n" +
          "تفاصيل الشكوى: {{5}}\n" +
          "رقم العميل: {{6}}\n" +
          "العقار: {{7}}\n" +
          "الوحدة: {{8}}\n" +
          "تاريخ الطلب: {{9}}\n\n" +
          "يرجى المراجعة والمتابعة من قبل خدمة العملاء/الفريق الفني.",
        example: {
          body_text: [
            [
              "MR-00190", // {{1}} requestId
              "أحمد علي", // {{2}} clientName
              "عاجلة", // {{4}} priority
              "سباكة", // {{3}} maintenanceType
              "تسريب مياه في الحمام", // {{4}} issueDetails
              "+971500000000", // {{5}} clientPhone
              "برج الريان", // {{6}} propertyName
              "A-1203", // {{7}} unitNumber
              "15/03/2025", // {{8}} requestDate (date-only)
            ],
          ],
        },
      },
      // (اختياري) أزرار رد سريع:
      // ,{
      //   type: "BUTTONS",
      //   buttons: [{ type: "QUICK_REPLY", text: "تم" }]
      // }
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
    // if (TARGET_NAMES.includes(t.name)) {
    console.log("==== TEMPLATE ====");
    console.log("Name:", t.name);
    console.log("Lang:", t.language);
    console.log("Status:", t.status);
    console.log("Category:", t.category);
    console.log("Components:", JSON.stringify(t.components, null, 2));
    console.log("\n");
    // }
  }
})();
