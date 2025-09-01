import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const type = searchParams.get("type") || "all";
    const limit = parseInt(searchParams.get("limit")) || 100;

    console.log("📨 جلب التذكيرات من قاعدة البيانات...");

    // بناء شروط البحث
    const whereClause = {
      messageType: {
        in: [
          "payment_reminder",
          "contract_expiry_reminder",
          "maintenance_reminder",
        ],
      },
    };

    // فلترة حسب الحالة
    if (status !== "all") {
      whereClause.status = status;
    }

    // فلترة حسب النوع
    if (type !== "all") {
      if (type === "payment") {
        whereClause.messageType = "payment_reminder";
      } else if (type === "contract") {
        whereClause.messageType = "contract_expiry_reminder";
      } else if (type === "maintenance") {
        whereClause.messageType = "maintenance_reminder";
      }
    }

    // جلب التذكيرات
    const reminders = await prisma.whatsappMessageLog.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: {
        sentAt: "desc",
      },
      take: limit,
    });

    // ربط الرسائل بالعملاء حسب رقم الهاتف (للرسائل غير المرتبطة)
    const linkedReminders = await linkMessagesToClients(reminders);

    // حساب الإحصائيات
    const allStats = await prisma.whatsappMessageLog.groupBy({
      by: ["messageType", "status"],
      _count: {
        id: true,
      },
      where: {
        messageType: {
          in: [
            "payment_reminder",
            "contract_expiry_reminder",
            "maintenance_reminder",
          ],
        },
      },
    });

    // تنظيم الإحصائيات
    const summary = {
      total: linkedReminders.length,
      byType: {
        payment: allStats
          .filter((s) => s.messageType === "payment_reminder")
          .reduce((sum, s) => sum + s._count.id, 0),
        contract: allStats
          .filter((s) => s.messageType === "contract_expiry_reminder")
          .reduce((sum, s) => sum + s._count.id, 0),
        maintenance: allStats
          .filter((s) => s.messageType === "maintenance_reminder")
          .reduce((sum, s) => sum + s._count.id, 0),
      },
      byStatus: {
        sent: allStats
          .filter((s) => s.status === "sent")
          .reduce((sum, s) => sum + s._count.id, 0),
        delivered: allStats
          .filter((s) => s.status === "delivered")
          .reduce((sum, s) => sum + s._count.id, 0),
        read: allStats
          .filter((s) => s.status === "read")
          .reduce((sum, s) => sum + s._count.id, 0),
        failed: allStats
          .filter((s) => s.status === "failed")
          .reduce((sum, s) => sum + s._count.id, 0),
        pending: allStats
          .filter((s) => s.status === "pending")
          .reduce((sum, s) => sum + s._count.id, 0),
      },
    };

    // حساب معدل النجاح
    const totalMessages =
      summary.byStatus.sent +
      summary.byStatus.delivered +
      summary.byStatus.read +
      summary.byStatus.failed;
    const successfulMessages =
      summary.byStatus.delivered + summary.byStatus.read;
    summary.successRate =
      totalMessages > 0
        ? ((successfulMessages / totalMessages) * 100).toFixed(1)
        : 0;

    // إحصائيات اليوم
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayStats = await prisma.whatsappMessageLog.count({
      where: {
        messageType: {
          in: [
            "payment_reminder",
            "contract_expiry_reminder",
            "maintenance_reminder",
          ],
        },
        sentAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const todaySummary = {
      total: todayStats,
    };

    console.log(`✅ تم جلب ${linkedReminders.length} تذكير بنجاح`);

    return NextResponse.json({
      success: true,
      data: {
        reminders: linkedReminders.map((reminder) => ({
          id: reminder.id,
          messageId: reminder.messageId,
          messageType: reminder.messageType,
          status: reminder.status,
          recipient: reminder.recipient,
          client: reminder.client,
          sentAt: reminder.sentAt,
          updatedAt: reminder.updatedAt,
          metadata: reminder.metadata,
        })),
        summary,
        todaySummary,
      },
      message: "تم جلب التذكيرات بنجاح",
    });
  } catch (error) {
    console.error("خطأ في جلب التذكيرات:", error);
    return NextResponse.json(
      {
        success: false,
        error: "خطأ في تحميل التذكيرات",
        details: error.message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// دالة مساعدة لربط الرسائل بالعملاء حسب رقم الهاتف
async function linkMessagesToClients(messages) {
  for (const message of messages) {
    if (!message.client && message.recipient) {
      try {
        // تنسيق أرقام الهاتف للبحث
        const phoneFormats = [];

        if (message.recipient.startsWith("+971")) {
          const localPhone = "0" + message.recipient.substring(4);
          phoneFormats.push(message.recipient, localPhone);
        } else if (message.recipient.startsWith("971")) {
          const withPlus = "+" + message.recipient;
          const localPhone = "0" + message.recipient.substring(3);
          phoneFormats.push(message.recipient, withPlus, localPhone);
        } else if (message.recipient.startsWith("0")) {
          const internationalPhone = "+971" + message.recipient.substring(1);
          const internationalNoPlus = "971" + message.recipient.substring(1);
          phoneFormats.push(
            message.recipient,
            internationalPhone,
            internationalNoPlus
          );
        } else {
          phoneFormats.push(message.recipient);
        }

        // البحث عن عميل
        const client = await prisma.client.findFirst({
          where: {
            phone: {
              in: phoneFormats,
            },
          },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        });

        if (client) {
          message.client = client;
          // تحديث الرسالة بمعرف العميل
          await prisma.whatsappMessageLog
            .update({
              where: { id: message.id },
              data: { clientId: client.id },
            })
            .catch(() => {
              // تجاهل أخطاء التحديث
            });
        } else {
          // تعيين عميل افتراضي للعرض
          message.client = {
            id: null,
            name: `عميل ${message.recipient}`,
            phone: message.recipient,
            email: null,
          };
        }
      } catch (error) {
        console.warn(`تعذر ربط الرسالة ${message.id} بعميل:`, error.message);
        message.client = {
          id: null,
          name: `عميل ${message.recipient}`,
          phone: message.recipient,
          email: null,
        };
      }
    }
  }
  return messages;
}
