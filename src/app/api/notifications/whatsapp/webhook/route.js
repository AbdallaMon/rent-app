// app/api/whatsapp/webhook/route.js
import { NextResponse } from "next/server";
import { normalizePhone } from "@/lib/phone";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

import {
  handleButtonReply,
  handleListReply,
} from "@/services/server/whatsapp/handlers/interactive";
import {
  getOrCreateOpenConversation,
  touchConversation,
} from "@/services/server/whatsapp/conversations";

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
          let conversation; // <-- link

          try {
            // 1) Session (memory) gate for greeting
            const sess = getSession(from);
            if (!sess || !sess.step || sess.step === "greeting") {
              const next = setSession(from, {
                step: "awaiting_language_selection",
              });
              // Create/open DB conversation and store a snapshot of session
              conversation = await getOrCreateOpenConversation({
                phoneNumber: from,
                clientId: null, // will set after client lookup (below)
                snapshot: { step: next.step, language: next.language },
              });
              await sendLanguage(from);
              // Touch the conversation for this inbound message (count +1)
              await touchConversation(conversation.id, {
                metadata: {
                  ...conversation.metadata,
                  lastInboundType:
                    msg?.type || (msg?.interactive?.type ?? "text"),
                },
              });
              continue;
            }

            // 2) Identify client (your existing logic)
            const { e164, core } = normalizePhone(from);
            const e164Req = await findClientWithPropertyProduction(e164);
            const coreReq = await findClientWithPropertyProduction(core);
            let client;
            if (e164Req.success) client = e164Req.client;
            if (coreReq.success) client = coreReq.client;

            // 3) Ensure conversation exists (and update snapshot)
            const snapshot = { step: sess.step, language: sess.language };
            conversation = await getOrCreateOpenConversation({
              phoneNumber: from,
              clientId: client?.id ?? null,
              snapshot,
            });

            // 4) Persist incoming message (link it if your model supports relation)
            if (client) {
              incomingMessage = await createAWhatsAppIncomingMessage({
                msg,
                client,
                // If your Incoming model supports relationKey/Id, pass it here:
                relationKey: "conversation",
                relationId: conversation.id,
              });
            }

            // 5) Route by interactive first, then text
            if (msg?.interactive?.type === "button_reply") {
              await handleButtonReply(
                from,
                msg.interactive.button_reply?.id,
                incomingMessage,
                conversation
              );
              await touchConversation(conversation.id, {
                metadata: {
                  ...conversation.metadata,
                  lastInboundType: "button_reply",
                },
              });
              continue;
            }

            if (msg?.interactive?.type === "list_reply") {
              await handleListReply(
                from,
                msg.interactive.list_reply?.id,
                incomingMessage,
                conversation
              );
              await touchConversation(conversation.id, {
                metadata: {
                  ...conversation.metadata,
                  lastInboundType: "list_reply",
                },
              });
              continue;
            }

            const text = msg?.text?.body || "";
            await handleTextMessage(from, text, incomingMessage, conversation);

            // 6) Count + update lastMessageAt for any inbound
            await touchConversation(conversation.id, {
              metadata: {
                ...conversation.metadata,
                lastInboundType: text ? "text" : "unknown",
              },
            });
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

    return Response.json({ success: true });
  } catch (e) {
    console.error("Webhook POST error:", e);
    // keep 200 for Meta; include error in body to inspect
    return Response.json(
      { success: false, error: e?.message || "error" },
      { status: 200 }
    );
  }
}
