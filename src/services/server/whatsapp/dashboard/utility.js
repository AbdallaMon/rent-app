// services/whatsappStats.js
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import tzPlugin from "dayjs/plugin/timezone.js";
import prisma from "@/lib/prisma";
dayjs.extend(utc);
dayjs.extend(tzPlugin);

const TZ = "Asia/Dubai";

export const LABEL_MAP = {
  maintenance: "[list_reply] 🔧 طلب صيانة",
  complaint: "[list_reply] 📝 تقديم شكوى",
  status: "[list_reply] 📊 حالة الطلبات",
  support: "[list_reply] ☎️ الاتصال بالدعم",
  payments: "[list_reply] 💳 استعلام عن الدفعات",
  renew: "[list_reply] 📋 تجديد العقد",
};
export function rangeToday() {
  const start = dayjs().tz(TZ).startOf("day").toDate();
  const end = dayjs().tz(TZ).endOf("day").toDate();
  return { start, end };
}

export function pct(ok, total) {
  const d = total > 0 ? (ok / total) * 100 : 0;
  return Math.round(d * 10) / 10;
}

export async function count(model, where) {
  console.log(model, "mode");

  return prisma[model].count({ where });
}

export async function countContains(model, needle, where = {}) {
  return prisma[model].count({
    where: {
      ...where,
      content: { contains: needle },
    },
  });
}
export function msToHMM(ms) {
  if (!ms || ms < 0) return "0:00";
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}
