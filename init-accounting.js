// /lib/accounting/initAccounts.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function initAccounts(options = {}) {
  const { pettyCashOpeningBalance = 0, now = new Date() } = options;

  // GL (شجرة الحسابات)
  const glAccounts = [
    { code: "1110", name: "حساب جاري", type: "ASSET" },
    { code: "1120", name: "حساب توفير", type: "ASSET" },
    { code: "1210", name: "ذمم على الملاك", type: "ASSET" },
    { code: "1220", name: "ذمم على المستأجرين", type: "ASSET" },
    { code: "2100", name: "أمانات المستأجرين (تأمينات)", type: "LIABILITY" },
    { code: "4000", name: "إيرادات عمولة الإدارة", type: "REVENUE" },
    { code: "4100", name: "إيرادات تسجيل العقود", type: "REVENUE" },
    { code: "4900", name: "إيرادات أخرى (خصومات التأمين)", type: "REVENUE" }, // اختياري/مفيد
    { code: "5000", name: "الرواتب والأجور", type: "EXPENSE" },
    { code: "5100", name: "مصاريف تشغيلية", type: "EXPENSE" },
    { code: "5200", name: "مصاريف صيانة عقارية", type: "EXPENSE" },
  ];

  await Promise.all(
    glAccounts.map((acc) =>
      prisma.gLAccount.upsert({
        where: { code: acc.code },
        update: {
          name: acc.name,
          type: acc.type,
          isActive: true,
          updatedAt: now,
        },
        create: {
          code: acc.code,
          name: acc.name,
          type: acc.type,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      })
    )
  );

  // حسابات الشركة (جاري/توفير/نثرية)
  const bankAccounts = [
    { name: "الحساب الجاري", accountType: "CHECKING", openingBalance: 0 },
    { name: "حساب التوفير", accountType: "SAVINGS", openingBalance: 0 },
    {
      name: "صندوق نثرية",
      accountType: "PETTY_CASH",
      openingBalance: pettyCashOpeningBalance,
    },
  ];

  await Promise.all(
    bankAccounts.map((ba) =>
      prisma.companyBankAccount.upsert({
        where: {
          name_accountType: { name: ba.name, accountType: ba.accountType },
        },
        update: {
          openingBalance: ba.openingBalance,
          isActive: true,
          updatedAt: now,
        },
        create: { ...ba, isActive: true, createdAt: now, updatedAt: now },
      })
    )
  );

  return {
    ok: true,
    glCount: glAccounts.length,
    bankCount: bankAccounts.length,
  };
}
