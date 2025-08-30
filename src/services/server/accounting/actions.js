import prisma from "@/lib/prisma";
import { createJournalEntry, getGlAccountById } from "./main";
import { Prisma } from "@prisma/client";
export async function handleGlAccountTransaction(data) {
  if (data.kind === "TRANSFER") {
    const fromGlAccount = await getGlAccountById(data.fromGlAccountId);
    const toGlAccount = await getGlAccountById(data.toGlAccountId);

    const amountTxt = `${data.amount.toFixed(2)} درهم`;

    const debitMemo = `قيد مدين على حساب ${fromGlAccount.name} بمبلغ ${amountTxt} مقابل ${toGlAccount.name}`;
    const creditMemo = `قيد دائن لحساب ${toGlAccount.name} بمبلغ ${amountTxt} مقابل ${fromGlAccount.name}`;

    await createJournalEntry({
      description: data.memo,
      entryDate: new Date(data.entryDate),
      manull: true,
      lines: [
        {
          side: "DEBIT",
          amount: data.amount,
          glAccountId: data.fromGlAccountId,
          memo: debitMemo,
          createdAt: new Date(data.entryDate),
        },
        {
          side: "CREDIT",
          amount: data.amount,
          glAccountId: data.toGlAccountId,
          memo: creditMemo,
          createdAt: new Date(data.entryDate),
        },
      ],
    });
  }
  if (data.kind === "OUTFLOW") {
    const fromGlAccount = await getGlAccountById(data.glAccountId);
    await createJournalEntry({
      description: data.memo,
      entryDate: new Date(data.entryDate),
      manull: true,

      lines: [
        {
          side: "CREDIT",
          amount: data.amount,
          glAccountId: data.glAccountId,
          memo: `سحب رصيد من ${fromGlAccount.name}`,
          createdAt: new Date(data.entryDate),
        },
        {
          side: "DEBIT",
          amount: data.amount,
          createdAt: new Date(data.entryDate),
          counterpartyLabel: data.partyClientLabel,
        },
      ],
    });
  }
  if (data.kind === "INFLOW") {
    const toGlAccount = await getGlAccountById(data.glAccountId);
    await createJournalEntry({
      description: data.memo,
      entryDate: new Date(data.entryDate),
      manull: true,

      lines: [
        {
          side: "CREDIT",
          amount: data.amount,
          createdAt: new Date(data.entryDate),
          counterpartyLabel: data.partyClientLabel,
        },
        {
          side: "DEBIT",
          amount: data.amount,
          glAccountId: data.glAccountId,
          memo: `إيداع رصيد في ${toGlAccount.name}`,
          createdAt: new Date(data.entryDate),
        },
      ],
    });
  }
  return { success: true, message: "تمت العملية بنجاح" };
}

export async function deleteAJournalEntry(id) {
  console.log(id, "Id in delete function");
  try {
    return await prisma.journalEntry.delete({
      where: { id: Number(id) },
    });
  } catch (error) {
    console.error("Error deleting journal entry:", error);
    return { success: false, message: "Failed to delete journal entry" };
  }
}

export async function createGlAccount({ name, code, type }) {
  try {
    const newAccount = await prisma.GLAccount.create({
      data: {
        name,
        code,
        type,
      },
    });
    return {
      data: newAccount,
      message: "تمت إضافة الحساب بنجاح",
      status: 200,
    };
  } catch (error) {
    console.error("Error creating GL account:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          success: false,
          message: "هذا الكود مستخدم من قبل، من فضلك اختر كود مختلف",
          status: 400,
        };
      }
    }

    return { success: false, message: "فشل إنشاء الحساب", status: 500 };
  }
}
export async function deleteGlAccount(id) {
  try {
    await prisma.journalEntry.deleteMany({
      where: { lines: { some: { glAccountId: Number(id) } } },
    });
    await prisma.GLAccount.delete({
      where: { id: Number(id) },
    });
    return { success: true, message: "تم حذف الحساب بنجاح" };
  } catch (error) {
    console.error("Error deleting GL account:", error);
    return { success: false, message: "فشل حذف الحساب" };
  }
}
