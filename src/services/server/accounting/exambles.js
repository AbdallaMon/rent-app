// (أ) عمولة إدارة 3% — إنشاء المستحق ثم تحصيل جزئي

// عند الإنشاء (مستحق على المالك)

// GL: 4000 (إيرادات عمولة)، ذمم: partyType=OWNER
// ممكن تربط القيد بالسياق: rentAgreementId / propertyId / unitId

const glCommission = await getGLIdByCode("4000");
const ownerId = await getClientIdOrThrow(11);

await createJournalEntry({
  description: "Management commission 3% on RA-123",
  lines: [
    {
      side: "DEBIT",
      amount: 300,
      partyType: "OWNER",
      partyClientId: ownerId,
      memo: "AR Owner",
      rentAgreementId: 123,
    },
    {
      side: "CREDIT",
      amount: 300,
      glAccountId: glCommission,
      memo: "Commission revenue",
      rentAgreementId: 123,
    },
  ],
});

// تحصيل جزئي 200 إلى الحساب الجاري

// CompanyBank: CHECKING

const bankChecking = await getCompanyBankIdByType("CHECKING");

await createJournalEntry({
  description: "Partial collection commission",
  lines: [
    {
      side: "DEBIT",
      amount: 200,
      companyBankAccountId: bankChecking,
      memo: "Cash in bank",
      rentAgreementId: 123,
    },
    {
      side: "CREDIT",
      amount: 200,
      partyType: "OWNER",
      partyClientId: ownerId,
      memo: "AR Owner",
      rentAgreementId: 123,
    },
  ],
});
// لو عايز تربط التسوية بين سطر الذمم القديم والجديد: استخدم settleLines(matching...)

// (ب) رسوم تسجيل عقد (كإيراد خدمة)

// إثبات مستحق على المستأجر

// GL: 4100 (إيرادات تسجيل)

const glRegistration = await getGLIdByCode("4100");
const renterId = await getClientIdOrThrow(22);

await createJournalEntry({
  description: "Contract registration fee",
  lines: [
    {
      side: "DEBIT",
      amount: 150,
      partyType: "RENTER",
      partyClientId: renterId,
      memo: "AR Renter",
      rentAgreementId: 123,
    },
    {
      side: "CREDIT",
      amount: 150,
      glAccountId: glRegistration,
      memo: "Registration revenue",
      rentAgreementId: 123,
    },
  ],
});

// القبض كاملًا إلى الجاري

await createJournalEntry({
  description: "Collect registration fee",
  lines: [
    {
      side: "DEBIT",
      amount: 150,
      companyBankAccountId: bankChecking,
      rentAgreementId: 123,
    },
    {
      side: "CREDIT",
      amount: 150,
      partyType: "RENTER",
      partyClientId: renterId,
      rentAgreementId: 123,
    },
  ],
});

// (ج) ودائع المستأجرين (بديل “دفعه تأمين”)

// عند القبض → نركنها في التوفير + نثبت التزام

// CompanyBank: SAVINGS، GL: 2100 (التزام ودائع)

const bankSavings = await getCompanyBankIdByType("SAVINGS");
const glDeposits = await getGLIdByCode("2100"); // لازم تكون موجودة في GLAccount (type=LIABILITY)

await createJournalEntry({
  description: "Tenant security deposit",
  lines: [
    {
      side: "DEBIT",
      amount: 1000,
      companyBankAccountId: bankSavings,
      memo: "Savings deposit",
      rentAgreementId: 123,
    },
    {
      side: "CREDIT",
      amount: 1000,
      glAccountId: glDeposits,
      memo: "Security deposit liability",
      rentAgreementId: 123,
    },
  ],
});

// خصم 200 منها لصيانة

// نقل من الالتزام إلى مصروف صيانة (أو إلى حساب مصروف مناسب)

const glMaint = await getGLIdByCode("5200"); // "مصاريف صيانة عقارية" في شجرتك

await createJournalEntry({
  description: "Apply part of deposit to damages",
  lines: [
    {
      side: "DEBIT",
      amount: 200,
      glAccountId: glDeposits,
      memo: "Reduce liability",
      propertyId: 33,
    },
    {
      side: "CREDIT",
      amount: 200,
      glAccountId: glMaint,
      memo: "Maintenance expense (covered by deposit)",
      propertyId: 33,
    },
  ],
});

// ردّ الباقي 800 للمستأجر من التوفير

await createJournalEntry({
  description: "Refund deposit to tenant",
  lines: [
    {
      side: "DEBIT",
      amount: 800,
      glAccountId: glDeposits,
      rentAgreementId: 123,
    },
    {
      side: "CREDIT",
      amount: 800,
      companyBankAccountId: bankSavings,
      rentAgreementId: 123,
    },
  ],
});

// ملاحظة: لو عايز تربط الوديعة بمستأجر معيّن على مستوى Subledger، ممكن تضيف partyType/partyClientId في سطر الالتزام (اختياري على حسب رؤيتك للتقارير).

// (د) مصاريف صيانة تُخصم من الجاري وتُسترد من المالك

// الدفع (الشركة دفعت 500 من الجاري) — قيدان واضحان (مفضّل):

// إثبات المصروف وصرفه (GL مصروف صيانة مقابل Bank CHECKING)

await createJournalEntry({
  description: "Maintenance paid by company",
  lines: [
    { side: "DEBIT", amount: 500, glAccountId: glMaint, propertyId: 33 },
    {
      side: "CREDIT",
      amount: 500,
      companyBankAccountId: bankChecking,
      propertyId: 33,
    },
  ],
});

// إعادة تصنيف المصروف ليصبح “مسترد من المالك” (ذمم على Owner بدل ما يفضل مصروف على الشركة)

const owner2Id = await getClientIdOrThrow(11);

await createJournalEntry({
  description: "Reclass maintenance to owner receivable",
  lines: [
    {
      side: "DEBIT",
      amount: 500,
      partyType: "OWNER",
      partyClientId: owner2Id,
      propertyId: 33,
      memo: "Owner receivable",
    },
    { side: "CREDIT", amount: 500, glAccountId: glMaint, propertyId: 33 },
  ],
});

// سداد المالك 300 (جزئيًا) إلى الجاري

await createJournalEntry({
  description: "Owner pays back maintenance (partial)",
  lines: [
    {
      side: "DEBIT",
      amount: 300,
      companyBankAccountId: bankChecking,
      propertyId: 33,
    },
    {
      side: "CREDIT",
      amount: 300,
      partyType: "OWNER",
      partyClientId: owner2Id,
      propertyId: 33,
    },
  ],
});
// تقدر بعدها تستخدم settleLines لربط 300 من الذمم مع التحصيل

// (هـ) صندوق النثرية

// تأسيس/تعزيز 2000 من الجاري إلى النثرية

const bankPetty = await getCompanyBankIdByType("PETTY_CASH");

await createJournalEntry({
  description: "Fund petty cash",
  lines: [
    { side: "DEBIT", amount: 2000, companyBankAccountId: bankPetty },
    { side: "CREDIT", amount: 2000, companyBankAccountId: bankChecking },
  ],
});

// صرف نثرية 150 (مستلزمات)

const glOtherExp = await getGLIdByCode("5100"); // أو 6200 عندك لمصاريف تشغيلية/أخرى
await createJournalEntry({
  description: "Petty cash spend - supplies",
  lines: [
    { side: "DEBIT", amount: 150, glAccountId: glOtherExp, memo: "Supplies" },
    { side: "CREDIT", amount: 150, companyBankAccountId: bankPetty },
  ],
});
