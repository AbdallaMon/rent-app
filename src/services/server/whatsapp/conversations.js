import prisma from "@/lib/prisma";

// Get the currently "OPEN" conversation for a phone (or null)
export async function findOpenConversationByPhone(phoneNumber) {
  return prisma.whatsappConversation.findFirst({
    where: { phoneNumber, status: "OPEN" },
    orderBy: { startedAt: "desc" },
  });
}

// Start a new conversation (used when none is open, or you decide to rotate)
export async function startConversation({
  phoneNumber,
  clientId,
  topic,
  metadata,
}) {
  return prisma.whatsappConversation.create({
    data: {
      phoneNumber,
      clientId: clientId ?? null,
      status: "OPEN",
      topic: topic ?? null,
      metadata: metadata || {},
    },
  });
}

// Touch + increment the conversation on every message
export async function touchConversation(conversationId, patch = {}) {
  return prisma.whatsappConversation.update({
    where: { id: conversationId },
    data: {
      lastMessageAt: new Date(),
      messageCount: { increment: 1 },
      ...(patch.metadata ? { metadata: patch.metadata } : {}),
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.topic !== undefined ? { topic: patch.topic } : {}),
    },
  });
}

// Close conversation explicitly (e.g., when flow ends)
export async function closeConversation(conversationId, metadataPatch = {}) {
  return prisma.whatsappConversation.update({
    where: { id: conversationId },
    data: {
      status: "CLOSED",
      metadata: metadataPatch,
    },
  });
}

// Upsert-ish helper: find OPEN, else create
export async function getOrCreateOpenConversation({
  phoneNumber,
  clientId,
  snapshot,
}) {
  let convo = await findOpenConversationByPhone(phoneNumber);
  if (!convo) {
    convo = await startConversation({
      phoneNumber,
      clientId,
      metadata: { sessionSnapshot: snapshot || {} },
    });
  } else {
    // Optionally refresh snapshot on reuse
    await touchConversation(convo.id, {
      metadata: { ...convo.metadata, sessionSnapshot: snapshot || {} },
    });
    // refetch not needed; we just return existing
  }
  return convo;
}
