import { handleRequestSubmit } from "@/helpers/functions/handleRequestSubmit";

export async function updatePayment(data, setLoading) {
  const payment = await handleRequestSubmit(
    {
      paidAmount: +data.paidAmount,
      amount: +data.amount,
      currentPaidAmount: +data.currentPaidAmount,
        timeOfPayment: data.timeOfPayment,
    },
    setLoading,
    `main/payments/${data.id}`,
    false,
    "جاري تحديث الدفعة...",
    "PUT",
  );

  const invoice = await handleRequestSubmit(
    { ...data, paymentId: payment.data.id,        timeOfPayment: data.timeOfPayment,paymentTypeMethod:payment.data.paymentTypeMethod,chequeNumber:payment.data.chequeNumber

    },
    setLoading,
    `main/payments/${data.id}/invoices`,
    false,
    "جاري انشاء فاتورة...",
  );
  return { payment: payment.data, invoice: invoice.data };
}
