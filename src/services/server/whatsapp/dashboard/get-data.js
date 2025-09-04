import prisma from "@/lib/prisma";
import { DEFAULT_REMINDER, DEFAULT_TEAM } from "./defaults";
import {
  pct,
  count,
  countContains,
  LABEL_MAP,
  rangeToday,
  msToHMM,
} from "./utility";
import { messageStatus, messageTypes } from "../utility";
export async function getWhatsAppSettings() {
  const [reminder, team] = await Promise.all([
    prisma.reminderSettings.findFirst({
      where: { id: "default_reminder_settings" },
    }),
    prisma.whatsAppTeamSettings.findFirst({
      where: { id: "default_team_settings" },
    }),
  ]);

  return {
    reminderSettings: reminder || DEFAULT_REMINDER,
    teamSettings: team || DEFAULT_TEAM,
  };
}

export async function getIncomingStats() {
  const model = "whatsappIncomingMessage"; // <- adapt to your exact model name
  const { start, end } = rangeToday();

  const totalAll = await count(model, {});
  const respondedAll = await count(model, {
    status: messageStatus.RESPONDED,
  });
  const failedAll = await count(model, {
    status: messageStatus.FAILED,
  });

  const totalToday = await count(model, {
    receivedAt: { gte: start, lte: end },
  });
  const respondedToday = await count(model, {
    status: messageStatus.RESPONDED,
    receivedAt: { gte: start, lte: end },
  });
  const failedToday = await count(model, {
    status: messageStatus.FAILED,
    receivedAt: { gte: start, lte: end },
  });

  // By intent (from content markers)
  const keys = Object.keys(LABEL_MAP);
  const allByIntent = {};
  const todayByIntent = {};

  await Promise.all(
    keys.map(async (k) => {
      const label = LABEL_MAP[k];
      allByIntent[k] = await countContains(model, label);
      todayByIntent[k] = await countContains(model, label, {
        receivedAt: { gte: start, lte: end },
      });
    })
  );

  // Sort intents by ALL count desc (array of {key, all, today})
  const intentsSorted = keys
    .map((k) => ({
      key: k,
      all: allByIntent[k] || 0,
      today: todayByIntent[k] || 0,
    }))
    .sort((a, b) => b.all - a.all);

  return {
    overview: {
      all: {
        total: totalAll,
        responded: respondedAll,
        failed: failedAll,
        successPct: pct(respondedAll, respondedAll + failedAll),
      },
      today: {
        total: totalToday,
        responded: respondedToday,
        failed: failedToday,
        successPct: pct(respondedToday, respondedToday + failedToday),
      },
    },
    byIntent: {
      labels: LABEL_MAP, // for display
      ranked: intentsSorted, // already sorted by "all"
      totals: {
        all: Object.values(allByIntent).reduce((a, b) => a + b, 0),
        today: Object.values(todayByIntent).reduce((a, b) => a + b, 0),
      },
    },
  };
}

export async function getOutgoingStats() {
  const model = "whatsappMessageLog";
  const { start, end } = rangeToday();

  const deliveredAll = await count(model, { status: messageStatus.DELIVERED });
  const failedAll = await count(model, { status: messageStatus.FAILED });
  const totalAll = deliveredAll + failedAll;

  const deliveredToday = await count(model, {
    status: messageStatus.DELIVERED,
    sentAt: { gte: start, lte: end },
  });
  const failedToday = await count(model, {
    status: messageStatus.FAILED,
    sentAt: { gte: start, lte: end },
  });
  const totalToday = deliveredToday + failedToday;

  // Sub-sections: reminders vs team alerts
  const reminderKeys = [
    messageTypes.PAYMENT_REMINDER,
    messageTypes.CONTRACT_EXPIRY_REMINDER,
    messageTypes.MAINTAINCE_FOLLOW_UP,
  ];
  const teamAlertKeys = [
    messageTypes.CUSTOMER_SUPPORT_REQUEST,
    messageTypes.RENEW_RENTAGREEMENT_REQUEST,
    messageTypes.MAINTAINCE_REQUEST_TO_TECH,
    messageTypes.COMPLAINT_REQUEST_TO_CS,
  ];

  async function block(keys) {
    const baseWhere = { relationKey: { in: keys } };
    const deliveredAll = await count(model, {
      ...baseWhere,
      status: messageStatus.DELIVERED,
    });
    const failedAll = await count(model, {
      ...baseWhere,
      status: messageStatus.FAILED,
    });
    const deliveredToday = await count(model, {
      ...baseWhere,
      status: messageStatus.DELIVERED,
      sentAt: { gte: start, lte: end },
    });
    const failedToday = await count(model, {
      ...baseWhere,
      status: messageStatus.FAILED,
      sentAt: { gte: start, lte: end },
    });

    return {
      all: {
        total: deliveredAll + failedAll,
        delivered: deliveredAll,
        failed: failedAll,
        successPct: pct(deliveredAll, deliveredAll + failedAll),
      },
      today: {
        total: deliveredToday + failedToday,
        delivered: deliveredToday,
        failed: failedToday,
        successPct: pct(deliveredToday, deliveredToday + failedToday),
      },
    };
  }

  const reminders = await block(reminderKeys);
  const teamAlerts = await block(teamAlertKeys);

  return {
    overview: {
      all: {
        total: totalAll,
        delivered: deliveredAll,
        failed: failedAll,
        successPct: pct(deliveredAll, totalAll),
      },
      today: {
        total: totalToday,
        delivered: deliveredToday,
        failed: failedToday,
        successPct: pct(deliveredToday, totalToday),
      },
    },
    reminders,
    teamAlerts,
  };
}

export async function getConversationStats() {
  const { start, end } = rangeToday();

  // Totals / status
  const [totalAll, openAll, closedAll, todayActive] = await Promise.all([
    prisma.whatsappConversation.count(),
    prisma.whatsappConversation.count({ where: { status: "OPEN" } }),
    prisma.whatsappConversation.count({ where: { status: "CLOSED" } }),
    prisma.whatsappConversation.count({
      where: { lastMessageAt: { gte: start, lte: end } },
    }),
  ]);

  // Average duration for CLOSED (recent sample to keep it fast)
  const recentClosed = await prisma.whatsappConversation.findMany({
    where: { status: "CLOSED" },
    select: { startedAt: true, lastMessageAt: true },
    orderBy: { lastMessageAt: "desc" },
    take: 200,
  });
  const avgCloseMs =
    recentClosed.reduce((acc, c) => {
      const a = new Date(c.startedAt).getTime();
      const b = new Date(c.lastMessageAt || c.startedAt).getTime();
      return acc + Math.max(0, b - a);
    }, 0) / (recentClosed.length || 1);

  // Top topics
  const topics = await prisma.whatsappConversation.groupBy({
    by: ["topic"],
    _count: { topic: true },
    orderBy: { _count: { topic: "desc" } },
    where: { topic: { not: null } },
    take: 10,
  });

  // Top clients by messageCount (linked)
  const topClientsAgg = await prisma.whatsappConversation.groupBy({
    by: ["clientId"],
    _sum: { messageCount: true },
    _count: { clientId: true },
    where: { clientId: { not: null } },
    orderBy: { _sum: { messageCount: "desc" } },
    take: 10,
  });

  const clientIds = topClientsAgg.map((x) => x.clientId).filter(Boolean);
  const clients = clientIds.length
    ? await prisma.client.findMany({
        where: { id: { in: clientIds } },
        select: { id: true, name: true, phone: true },
      })
    : [];
  const clientsById = new Map(clients.map((c) => [c.id, c]));

  const topClients = topClientsAgg.map((row) => {
    const c = clientsById.get(row.clientId) || {};
    return {
      clientId: row.clientId,
      name: c.name || "(بدون اسم)",
      phone: c.phone || "",
      totalMessages: row._sum.messageCount || 0,
      conversations: row._count.clientId || 0,
    };
  });

  // Top phone numbers without a linked client
  const topPhones = await prisma.whatsappConversation.groupBy({
    by: ["phoneNumber"],
    _sum: { messageCount: true },
    where: { clientId: null },
    orderBy: { _sum: { messageCount: "desc" } },
    take: 10,
  });

  return {
    overview: {
      total: totalAll,
      open: openAll,
      closed: closedAll,
      activeToday: todayActive,
      avgCloseDuration: {
        ms: Math.round(avgCloseMs) || 0,
        hmm: msToHMM(avgCloseMs),
      },
    },
    topics: topics.map((t) => ({
      topic: t.topic || "—",
      count: t._count.topic,
    })),
    topClients,
    topPhones: topPhones.map((p) => ({
      phoneNumber: p.phoneNumber,
      totalMessages: p._sum.messageCount || 0,
    })),
  };
}
export async function getWhatsappStats() {
  const [incoming, outgoing, conversations] = await Promise.all([
    getIncomingStats(),
    getOutgoingStats(),
    getConversationStats(), // <— NEW
  ]);
  return { incoming, outgoing, conversations };
}
