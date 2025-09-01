// app/api/whatsapp/webhook/route.js
import { NextResponse } from "next/server";
import { normalizePhone } from "@/lib/phone";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

import {
  handleButtonReply,
  handleListReply,
} from "@/services/server/whatsapp/handlers/interactive";
import { handleTextMessage } from "@/services/server/whatsapp/handlers/text";
import { getSession, setSession } from "@/services/server/whatsapp/session";
import { findClientWithPropertyProduction } from "@/services/server/whatsapp/services/clients";
import { sendLanguage } from "@/services/server/whatsapp/responders";
import {
  createAWhatsAppIncomingMessage,
  messageStatus,
  updateAWhatsAppIncomingMessage,
} from "@/services/server/whatsapp/utility";

const processedMsgIds = new Set();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
    return NextResponse.json({ error: "Verification failed" }, { status: 403 });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const entries = body?.entry || [];

    for (const entry of entries) {
      for (const change of entry?.changes || []) {
        const messages = change?.value?.messages || [];
        for (const msg of messages) {
          const msgId = msg?.id;
          if (!msgId) continue;
          if (processedMsgIds.has(msgId)) continue;
          processedMsgIds.add(msgId);

          const from = msg?.from;
          if (!from) continue;
          let incomingMessage;
          try {
            const sess = getSession(from);
            if (!sess || !sess.step || sess.step === "greeting") {
              setSession(from, { step: "awaiting_language_selection" });
              await sendLanguage(from);
              continue;
            }

            const { e164, core } = normalizePhone(from);
            const e164Req = await findClientWithPropertyProduction(e164);
            const coreReq = await findClientWithPropertyProduction(core);
            let client;
            if (e164Req.success) {
              client = e164Req.client;
            }
            if (coreReq.success) {
              client = coreReq.client;
            }
            if (client) {
              incomingMessage = await createAWhatsAppIncomingMessage({
                msg,
                client,
              });
            }

            if (msg?.interactive?.type === "button_reply") {
              await handleButtonReply(
                from,
                msg.interactive.button_reply?.id,
                incomingMessage
              );
              continue;
            }
            if (msg?.interactive?.type === "list_reply") {
              await handleListReply(
                from,
                msg.interactive.list_reply?.id,
                incomingMessage
              );
              continue;
            }

            const text = msg?.text?.body;
            await handleTextMessage(
              from,
              typeof text === "string" ? text : "",
              incomingMessage
            );
          } catch (err) {
            console.error("Per-message error:", err);
            if (incomingMessage) {
              await updateAWhatsAppIncomingMessage({
                messageId: incomingMessage.id,
                status: messageStatus.FAILED,
              });
            }
            try {
              await sendWhatsAppMessage(
                from,
                "❌ حدث خطأ مفاجئ أثناء معالجة رسالتك.\nيرجى إعادة المحاولة لاحقًا أو التواصل: +971507935566\n\n" +
                  "❌ An unexpected error occurred while processing your message.\nPlease try again later or contact: +971507935566"
              );
            } catch {}
          }
        }
      }
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Webhook POST error:", e);
    return NextResponse.json(
      { success: false, error: e?.message || "error" },
      { status: 200 }
    );
  }
}
