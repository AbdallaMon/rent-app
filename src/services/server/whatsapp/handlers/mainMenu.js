import {
  withReadOnlyConnection,
  withWriteConnection,
} from "@/lib/database-connection";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import {
  findClientWithPropertyProduction,
  findClinetData,
} from "../services/clients";
import { getClientRequestHistory } from "../services/history";
import { sendMain } from "../responders";
import {
  LANG,
  ClientRole,
  OWNER_PAYMENT_TYPES,
  RENTER_PAYMENT_TYPES,
  PaymentStatusLabels,
  PaymentTypeLabels,
  label,
  PriorityLabels,
  RequestStatusLabels,
  MaintenanceTypeLabels,
  ComplaintCategoryLabels,
} from "../services/constants";
import { sendContactFormSubmissionToCS } from "../staff-notifications/services";
import { formatDate } from "../utility";

function safeID(x) {
  if (!x) return "";
  return typeof x === "string" ? x : String(x);
}

// حساب المتبقي بأمان
function computeAmountLeft(p) {
  const amount = Number(p.amount || 0);
  const paid = Number(p.paidAmount || 0);
  const left = amount - paid;
  return left < 0 ? 0 : left;
}

function pickPropertyUnit(payment) {
  if (payment.paymentType === "MAINTENANCE") {
    return {
      propertyName: payment.property?.name || "",
      unitNo: payment.unit?.number || "",
    };
  }
  return {
    propertyName:
      payment.rentAgreement?.unit?.property?.name ||
      payment.rentAgreement?.unit?.propertyName ||
      payment.property?.name ||
      "",
    unitNo: payment.rentAgreement?.unit?.number || payment.unit?.number || "",
  };
}

function renderMaintenanceBlock(items, lang) {
  const ar = lang === LANG.AR;
  if (!items?.length) return "";

  const H = ar ? "🔧 طلبات الصيانة" : "🔧 Maintenance Requests";
  const LTRS = "\u202D"; // start
  const LTRE = "\u202C"; // end

  const lines = [];
  lines.push(`${H} (${items.length}):`);

  items.forEach((r, i) => {
    const id = safeID(r.displayId || r.id);
    const st = label(RequestStatusLabels, r.status, lang);
    const pr = label(PriorityLabels, r.priority, lang);
    const tp = label(MaintenanceTypeLabels, r.type, lang);
    const prop = r.property?.name || "—";
    const unit = r.unit?.number || "—";
    const date = formatDate(r.requestDate, lang);
    const closed = r.completedAt
      ? ar
        ? ` • الإغلاق: ${formatDate(r.completedAt, lang)}`
        : ` • Closed: ${formatDate(r.completedAt, lang)}`
      : "";

    // سطر العنوان
    lines.push(`${i + 1}. #${LTRS}${id}${LTRE}`);
    lines.push(`   ${prop || "—"} • ${unit || "—"}`);
    // سطر التفاصيل
    if (ar) {
      lines.push(`   الحالة: ${st} • الأولوية: ${pr} • النوع: ${tp}`);
      lines.push(`   التاريخ: ${date}${closed}`);
    } else {
      lines.push(`   Status: ${st} • Priority: ${pr} • Type: ${tp}`);
      lines.push(`   Date: ${date}${closed}`);
    }

    // مسافة فاصلة بين العناصر
    lines.push("");
  });

  lines.push(""); // سطر فارغ ختامي
  return lines.join("\n");
}

function renderComplaintsBlock(items, lang) {
  const ar = lang === LANG.AR;
  if (!items?.length) return "";

  const H = ar ? "📝 الشكاوى" : "📝 Complaints";
  const LTRS = "\u202D";
  const LTRE = "\u202C";

  const lines = [];
  lines.push(`${H} (${items.length}):`);

  items.forEach((c, i) => {
    const id = safeID(c.displayId || c.id);
    const st = label(RequestStatusLabels, c.status, lang);
    const pr = label(PriorityLabels, c.priority, lang);
    const tp = label(ComplaintCategoryLabels, c.type, lang);
    const prop = c.property?.name || "—";
    const unit = c.unit?.number || "—";
    const date = formatDate(c.submittedAt, lang);
    const closed = c.resolvedAt
      ? ar
        ? ` • الإغلاق: ${formatDate(c.resolvedAt, lang)}`
        : ` • Closed: ${formatDate(c.resolvedAt, lang)}`
      : "";

    lines.push(`${i + 1}. #${LTRS}${id}${LTRE}`);
    lines.push(`   ${prop || "—"} • ${unit || "—"}`);
    if (ar) {
      lines.push(`   الحالة: ${st} • الأولوية: ${pr} • النوع: ${tp}`);
      lines.push(`   التاريخ: ${date}${closed}`);
    } else {
      lines.push(`   Status: ${st} • Priority: ${pr} • Category: ${tp}`);
      lines.push(`   Date: ${date}${closed}`);
    }

    lines.push("");
  });

  lines.push("");
  return lines.join("\n");
}

export async function handleStatus(phone, language, incomingMessage) {
  const lang = language === LANG.AR ? LANG.AR : LANG.EN;
  const ar = lang === LANG.AR;

  const res = await getClientRequestHistory(phone, 5);
  if (!res?.success) {
    await sendWhatsAppMessage(
      phone,
      ar
        ? "❌ لم نعثر على حسابك. يرجى الاتصال: +971507935566"
        : "❌ We couldn't find your account. Please call: +971507935566"
    );
    return sendMain(phone, lang);
  }

  const {
    client,
    maintenanceRequests = [],
    complaints = [],
    totalRequests = 0,
  } = res.data || {};

  if (!totalRequests) {
    await sendWhatsAppMessage(
      phone,
      ar
        ? `📊 لا توجد طلبات سابقة، ${client?.name || ""}`
        : `📊 No previous requests, ${client?.name || ""}`,
      incomingMessage
    );
    return sendMain(phone, lang);
    return;
  }

  let msg = ar
    ? `📊 حالة طلبات ${client?.name || ""}\n` + `────────────────────────\n\n`
    : `📊 ${client?.name || ""}'s Requests\n` + `────────────────────────\n\n`;

  msg += renderMaintenanceBlock(maintenanceRequests, lang);
  msg += renderComplaintsBlock(complaints, lang);

  if (msg.length > 3500) msg = msg.slice(0, 3490) + (ar ? "\n…\n" : "\n…\n");

  await sendWhatsAppMessage(phone, msg.trim(), incomingMessage);
  // return sendMain(phone, lang);
}
export async function handleSupport(phone, language, incomingMessage) {
  const ar = language === LANG.AR;
  let contact;
  const found = await findClientWithPropertyProduction(phone);
  if (!found?.success || !found?.client) {
    await sendWhatsAppMessage(
      phone,
      ar
        ? "❌ لم نجد حسابك. يرجى الاتصال: +971507935566"
        : "❌ We couldn't find your account. Please call: +971507935566"
    );
    return sendMain(phone, language);
  }
  await withWriteConnection(async (prisma) => {
    contact = await prisma.contact.create({
      data: {
        name: found.client.name,
        phone,
        description: `طلب دعم عبر البوت - ${new Date().toISOString()}`,
      },
    });
  });
  await sendContactFormSubmissionToCS({
    type: "SUPPORT",
    clientName: found.client.name,
    clientEmail: found.client.email,
    clientPhone: phone,
    preferedLng: found.client.language,
    id: contact.id,
  });

  return await sendWhatsAppMessage(
    phone,
    ar
      ? "✅ تم تسجيل طلب الدعم. سيتواصل معك فريقنا قريباً."
      : "✅ Support request recorded. Our team will contact you shortly.",
    incomingMessage
  );
  // return sendMain(phone, language);
}

export async function handlePayments(phone, language, incomingMessage) {
  const lang = language === LANG.AR ? LANG.AR : LANG.EN;
  const ar = lang === LANG.AR;

  const found = await findClientWithPropertyProduction(phone);
  if (!found?.success || !found?.client) {
    await sendWhatsAppMessage(
      phone,
      ar
        ? "❌ لم نعثر على حسابك. برجاء الاتصال بنا للاستعلام عن الدفعات."
        : "❌ We couldn’t find your account. Please call us for payment info."
    );
    // لو عندك Main Menu function:
    // return sendMain(phone, lang);
    return;
  }

  const clientId = found.client.id;
  const clientProfile = await findClinetData(clientId);
  const isRenter = clientProfile?.role === ClientRole.RENTER;

  await withReadOnlyConnection(async (prisma) => {
    // قاعدة مشتركة
    const baseWhere = { status: { not: "PAID" } };

    let where;
    if (isRenter) {
      // مستأجر ⇒ نفلتر بـ rentAgreement.renterId و بأنواع المستأجر فقط
      where = {
        ...baseWhere,
        paymentType: { in: RENTER_PAYMENT_TYPES },
        rentAgreement: { renterId: clientId },
      };
    } else {
      // مالك ⇒ نعرض فقط عمولة الإدارة والصيانة
      // وتأكيد الربط بالملكية:
      where = {
        ...baseWhere,
        paymentType: { in: OWNER_PAYMENT_TYPES },
        OR: [
          // دفع مرتبط مباشرة بعقار يملكه
          { property: { clientId } },
          // دفع مرتبط بعقد إيجار لوحدة ضمن عقار يملكه
          { rentAgreement: { unit: { property: { clientId } } } },
          // صيانة موجهة للمالك (لو كان في جدول الصيانة ownerId)
          { maintenance: { ownerId: clientId } },
        ],
      };
    }

    const pendingPayments = await prisma.payment.findMany({
      where,
      orderBy: { dueDate: "asc" },
      select: {
        id: true,
        amount: true,
        paidAmount: true,
        status: true,
        dueDate: true,
        paymentType: true,

        // لعروض الصيانة المباشرة
        property: { select: { name: true } },
        unit: { select: { number: true } },

        // لعقود الإيجار
        rentAgreement: {
          select: {
            id: true,
            renterId: true,
            unit: {
              select: {
                number: true,
                property: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!pendingPayments.length) {
      await sendWhatsAppMessage(
        phone,
        ar
          ? "لا توجد دفعات مستحقة حالياً."
          : "No pending payments at the moment.",
        incomingMessage
      );
      // return sendMain(phone, lang);
      return;
    }

    // رأس الرسالة
    // رأس الرسالة
    let text = ar
      ? "💳 الدفعات المستحقة:\n────────────────────────\n\n"
      : "💳 Pending Payments:\n────────────────────────\n\n";

    for (const p of pendingPayments) {
      const id = String(p.id);
      const dueStr = formatDate(p.dueDate, lang);
      const amountLeft = computeAmountLeft(p);
      const prettyStatus = label(PaymentStatusLabels, p.status, lang);
      const prettyType = label(PaymentTypeLabels, p.paymentType, lang);
      const { propertyName, unitNo } = pickPropertyUnit(p);
      const LTRS = "\u202D",
        LTRE = "\u202C";

      if (ar) {
        text +=
          `#${LTRS}${id}${LTRE}\n` +
          `   ${propertyName || "—"} • ${unitNo || "—"}\n` +
          `   📅 الاستحقاق: ${dueStr}\n` +
          `   💰 المتبقي: ${amountLeft} درهم (الإجمالي: ${p.amount})\n` +
          `   الحالة: ${prettyStatus} • النوع: ${prettyType}\n\n`;
      } else {
        text +=
          `#${LTRS}${id}${LTRE}\n` +
          `   ${propertyName || "—"} • ${unitNo || "—"}\n` +
          `   📅 Due: ${dueStr}\n` +
          `   💰 Left: ${amountLeft} AED (Total: ${p.amount})\n` +
          `   Status: ${prettyStatus} • Type: ${prettyType}\n\n`;
      }
    }

    // شريط سفلي بسيط (اختياري)
    text += ar ? "────────────────────────" : "────────────────────────";

    await sendWhatsAppMessage(phone, text.trim(), incomingMessage);
  });

  // return sendMain(phone, lang);
}

export async function handleRenewal(phone, language, incomingMessage) {
  const ar = language === LANG.AR;
  const found = await findClientWithPropertyProduction(phone);
  let contact;

  if (!found?.success || !found?.client) {
    await sendWhatsAppMessage(
      phone,
      ar
        ? "❌ لم نجد حسابك. اتصل بنا لتجديد العقد."
        : "❌ We couldn't find your account. Please call us for renewal."
    );
    return sendMain(phone, language);
  }

  await withWriteConnection(async (prisma) => {
    contact = await prisma.contact.create({
      data: {
        name: found.client.name,
        phone,
        description: `طلب تجديد عقد عبر البوت - ${new Date().toISOString()}`,
      },
    });
  });
  await sendContactFormSubmissionToCS({
    type: "RENEW_CONTRACT",
    clientName: found.client.name,
    clientEmail: found.client.email,
    clientPhone: phone,
    preferedLng: found.client.language,
    id: contact.id,
  });
  return await sendWhatsAppMessage(
    phone,
    ar
      ? "✅ تم تسجيل طلب التجديد. سيتواصل معك فريق المبيعات خلال 24 ساعة."
      : "✅ Renewal request recorded. Sales team will contact you within 24 hours.",
    incomingMessage
  );
  // return sendMain(phone, language);
}
