import { handleRequestSubmit } from "@/helpers/functions/handleRequestSubmit";

const PayEveryMonths = {
  TWO_MONTHS: 2,
  THREE_MONTHS: 3,
  FOUR_MONTHS: 4,
  SIX_MONTHS: 6,
  ONE_YEAR: 12,
};

export async function submitRentAgreement(
  data,
  setLoading,
  method,
  others,
  cancel,
  dontCheck
) {
  console.log(data, "rent data");
  return;
  // if (!data.canceling && !dontCheck) {
  //     let startDate = new Date(data.startDate);
  //     let endDate = new Date(data.endDate);
  //
  //     const isStartDateFirstDay = startDate.getDate() === 1;
  //
  //     const nextDay = new Date(endDate);
  //     nextDay.setDate(endDate.getDate() + 1);
  //     const nextMonth = endDate.getMonth() === 11 ? 0 : endDate.getMonth() + 1;
  //
  //     const isEndDateLastDay = nextDay.getDate() === 1 && nextDay.getMonth() === nextMonth;
  //
  //     if (isStartDateFirstDay && isEndDateLastDay) {
  //         endDate = nextDay;
  //     }
  //
  //     const monthDifference =
  //           (endDate.getFullYear() - startDate.getFullYear()) * 12 +
  //           (endDate.getMonth() - startDate.getMonth());
  //
  //     const id = toast.loading("يتم مراجعة البيانات...");
  //     if (
  //           monthDifference % PayEveryMonths[data.rentCollectionType] !== 0 ||
  //           monthDifference < 1
  //     ) {
  //         toast.update(
  //               id,
  //               Failed("الرجاء التأكد من تاريخ البداية والنهاية والتكرار المختار "),
  //         );
  //         return null;
  //     } else {
  //         toast.update(id, Success("تم مراجعة البيانات بنجاح"));
  //     }
  //
  //
  // }

  if (method === "PUT") {
    for (const req of others) {
      await handleRequestSubmit(
        data,
        setLoading,
        `main/rentAgreements${req.route}`,
        false,
        req.message,
        "PUT"
      );
    }
  }

  if (cancel) {
    return;
  }
  const installments = data.installments;
  delete data.installments;

  const rentAgreementResponse = await handleRequestSubmit(
    data,
    setLoading,
    "main/rentAgreements",
    false,
    "جاري إنشاء عقد الإيجار..."
  );
  if (rentAgreementResponse.status !== 200) {
    return;
  }

  const rentAgreementId = rentAgreementResponse.data.id;

  // Create Installments and Invoices
  const installmentsData = {
    ...rentAgreementResponse.data,
    rentAgreementId,
    installments,
  };
  await handleRequestSubmit(
    installmentsData,
    setLoading,
    `main/rentAgreements/${rentAgreementId}/installments`,
    false,
    "جاري إنشاء الدفعات ..."
  );

  const feeInvoicesData = {
    ...rentAgreementResponse.data,
    unitId: data.unitId,
  };
  await handleRequestSubmit(
    feeInvoicesData,
    setLoading,
    `main/rentAgreements/${rentAgreementId}/feeInvoices`,
    false,
    "جاري إنشاء رسوم العقود..."
  );

  if (
    !data.extraData ||
    !data.extraData.otherExpenses ||
    data.extraData.otherExpenses?.length < 1
  )
    return rentAgreementResponse.data;

  const otherExpensesData = {
    rentAgreement: rentAgreementResponse.data,
    otherExpenses: data.extraData.otherExpenses,
  };
  await handleRequestSubmit(
    otherExpensesData,
    setLoading,
    `main/rentAgreements/${rentAgreementId}/otherExpenses`,
    false,
    "جاري إنشاء المصاريف الاخري..."
  );
  return rentAgreementResponse.data;
}
