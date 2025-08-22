import { handleRequestSubmit } from "@/helpers/functions/handleRequestSubmit";
import { toast } from "react-toastify";
import { Failed, Success } from "@/components/loading/ToastUpdate";

const PayEveryMonths = {
  ONCE: 1,
  ONE_MONTH: 1,
  TWO_MONTHS: 2,
  FOUR_MONTHS: 4,
  SIX_MONTHS: 6,
  ONE_YEAR: 12,
};

export async function submitMaintenance(data, setLoading) {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  data.payEvery = "ONCE";

  const monthDifference =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());
  const id = toast.loading("يتم مراجعة البيانات...");

  if (
    data.payEvery !== "ONCE" &&
    (monthDifference % PayEveryMonths[data.payEvery] !== 0 ||
      monthDifference < 1)
  ) {
    toast.update(
      id,
      Failed("الرجاء التأكد من تاريخ البداية والنهاية والتكرار المختار "),
    );
    return null;
  } else {
    toast.update(id, Success("تم مراجعة البيانات بنجاح"));
  }
  try {
    const response = await handleRequestSubmit(
      data,
      setLoading,
      "main/maintenance",
      false,
      "جاري إنشاء الصيانة...",
    );
    const installmentsData = {
      maintenanceId: response.data.id,
      maintenance: {
        ...response.data,
        unitId: data.unitId,
      },
      paymentMethodType: data.paymentMethodType,
      payEvery: data.payEvery,
      startDate: data.startDate,
      endDate: data.endDate,
    };
    const req = await handleRequestSubmit(
      installmentsData,
      setLoading,
      "main/maintenance/" + response.data.id + "/installments",
      false,
      "جاري إنشاء الدفعات...",
    );
    const { installments, payments } = req.data;

    response.data.installments = installments;
    response.data.payments = payments;
    return response.data;
  } catch (error) {
    console.error("Error submitting maintenance:", error);
    throw error;
  }
}

// services/submitMaintenanceContract.js

export async function submitMaintenanceContract(data, setLoading) {
  let startDate = new Date(data.startDate);
  let endDate = new Date(data.endDate);
  // Check if start date is the first day of the month
  const isStartDateFirstDay = startDate.getDate() === 1;
  const nextDay = new Date(endDate);
  nextDay.setDate(endDate.getDate() + 1);
  const nextMonth = endDate.getMonth() === 11 ? 0 : endDate.getMonth() + 1;

  const isEndDateLastDay = nextDay.getDate() === 1 && nextDay.getMonth() === nextMonth;
  if (isStartDateFirstDay&&isEndDateLastDay) {
    endDate = nextDay;
  }
  const monthDifference =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth());
  const id = toast.loading("يتم مراجعة البيانات...");

  if (
    data.payEvery !== "ONCE" &&
    (monthDifference % PayEveryMonths[data.payEvery] !== 0 ||
      monthDifference < 1)
  ) {
    toast.update(
      id,
      Failed("الرجاء التأكد من تاريخ البداية والنهاية والتكرار المختار "),
    );
    return null;
  } else {
    toast.update(id, Success("تم مراجعة البيانات بنجاح"));
  }

  try {
    const response = await handleRequestSubmit(
      data,
      setLoading,
      "main/maintenance",
      false,
      "جاري إنشاء عقد الصيانة...",
    );
    const installmentsData = {
      maintenanceId: response.data.id,
      maintenance: {
        ...response.data,
        unitId: data.unitId,
      },
      paymentMethodType: data.paymentMethodType,
      payEvery: data.payEvery,
      startDate: data.startDate,
      endDate: data.endDate,
    };
    const req = await handleRequestSubmit(
      installmentsData,
      setLoading,
      "main/maintenance/" + response.data.id + "/installments",
      false,
      "جاري إنشاء الدفعات...",
    );
    const { installments, payments } = req.data;
    response.data.installments = installments;
    response.data.payments = payments;
    return response.data;
  } catch (error) {
    console.error("Error submitting maintenance contract:", error);
    throw error;
  }
}
