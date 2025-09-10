// pages/maintenance/MaintenancePage.js
"use client";
import TableFormProvider, {
  useTableForm,
} from "@/app/context/TableFormProvider/TableFormProvider";
import { useDataFetcher } from "@/helpers/hooks/useDataFetcher";
import ViewComponent from "@/components/ViewComponent/ViewComponent";
import { useEffect, useState } from "react";
import { useToastContext } from "@/app/context/ToastLoading/ToastLoadingProvider";
import { submitMaintenance } from "@/services/client/maintenance";
import { Button, TextField } from "@mui/material";
import Link from "next/link";
import { MaintaincePayer, PaymentStatus } from "@/config/Enums";
import { usePathname, useRouter } from "next/navigation";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import "dayjs/locale/ar";
import dayjs from "dayjs";
import { formatCurrencyAED } from "@/helpers/functions/convertMoneyToArabic";
import EditMaintenanceModal from "@/components/ui/Modals/EditMaintainceModal";
import { useAuth } from "@/app/context/AuthProvider/AuthProvider";
import { getCurrentPrivilege } from "@/helpers/functions/getUserPrivilege";
import DeleteModal from "../ui/Modals/DeleteModal";
import FilterPaperContainer from "../utility/FilterPaperContainer";
import ExpenseDialogButton from "./ExpenseDialog";
import FilterSelect from "../utility/FilterSelect";

dayjs.locale("ar");

async function getPaymentMethodTypes() {
  const methodTypes = [
    { id: "CASH", name: "نقدي" },
    { id: "BANK", name: "تحويل بنكي" },
  ];
  return { data: methodTypes };
}
async function getPayerTypes() {
  return {
    data: Object.keys(MaintaincePayer).map((key) => ({
      id: key,
      name: MaintaincePayer[key],
    })),
  };
}

export const maintenanceInputs = [
  {
    data: {
      id: "propertyId",
      type: "select",
      label: "العقار",
      name: "propertyId",
    },
    autocomplete: true,
    extraId: false,
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال العقار",
      },
    },
    sx: {
      width: {
        xs: "100%",
        md: "48%",
      },
      mr: "auto",
    },
  },
  {
    data: {
      id: "unitId",
      type: "select",
      label: "الوحدة (اختياري)",
      name: "unitId",
    },
    autocomplete: true,
    extraId: true,
    rerender: true,
    pattern: {
      required: {
        value: false,
        message: "يرجى إدخال الوحدة",
      },
    },
    sx: {
      width: {
        xs: "100%",
        md: "48%",
      },
      mr: "auto",
    },
  },
  {
    data: {
      id: "cost",
      type: "number",
      label: "التكلفة",
      name: "cost",
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال التكلفة",
      },
    },
    sx: {
      width: {
        xs: "100%",
        md: "48%",
      },
      mr: "auto",
    },
  },
  {
    data: {
      id: "date",
      type: "date",
      label: "تاريخ الصرف",
      name: "date",
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال تاريخ الصرف",
      },
    },
    sx: {
      width: {
        xs: "100%",
        md: "48%",
      },
    },
  },
  {
    data: {
      id: "typeId",
      type: "select",
      label: "نوع المصروف",
      name: "typeId",
    },
    autocomplete: true,
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال نوع المصروف",
      },
    },
    sx: {
      width: {
        xs: "100%",
        md: "48%",
      },
      mr: "auto",
    },
  },
  {
    data: {
      id: "paymentMethodType",
      type: "select",
      label: "طريقة الدفع",
      name: "paymentMethodType",
    },
    autocomplete: true,
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال طريقة الدفع",
      },
    },
    getData: getPaymentMethodTypes,
    sx: {
      width: {
        xs: "100%",
        md: "48%",
      },
    },
  },
  {
    data: {
      id: "payer",
      type: "select",
      label: "الدافع",
      name: "payer",
    },
    getData: getPayerTypes,
    sx: {
      width: {
        xs: "100%",
        md: "48%",
      },
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال الدفع",
      },
    },
  },
  {
    id: "glAccountId",
    data: {
      id: "glAccountId",
      type: "select",
      label: "حساب المدين",
      name: "glAccountId",
    },
    autocomplete: true,
    extraId: true,
    rerender: true,
    sx: {
      width: {
        xs: "100%",
        sm: "48%",
        md: "47%",
        lg: "48%",
      },
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال حساب المدين",
      },
    },
  },
];
export default function NormalMaintenance() {
  return (
    <TableFormProvider url={"fast-handler"}>
      <MaintenanceWrapper />
    </TableFormProvider>
  );
}

const MaintenanceWrapper = () => {
  const {
    data,
    loading,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
    setData,
    total,
    setTotal,
    setRender,
    filters,
    setFilters,
  } = useDataFetcher("main/maintenance");
  const { id } = useTableForm();
  const [startDate, setStartDate] = useState(dayjs().startOf("month"));
  const [endDate, setEndDate] = useState(dayjs().endOf("month"));
  const router = useRouter();
  const pathName = usePathname();
  const { user } = useAuth();
  function canEdit() {
    const currentPrivilege = getCurrentPrivilege(user, pathName);
    return currentPrivilege?.privilege.canEdit;
  }

  const handleDateChange = (type, date) => {
    if (type === "start") {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
  };

  const handleFilter = async () => {
    const currentFIlter = {
      ...filters,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
    setFilters(currentFIlter);
  };

  async function handleDelete(id) {
    const filterData = data.filter((item) => +item.id !== +id);
    setData(filterData);
    setTotal((old) => old - 1);
    if (page === 1 && total >= limit) {
      setRender((old) => !old);
    } else {
      setPage((old) => (old > 1 ? old - 1 : 1) || 1);
    }
  }

  function handleUpdate(newMaintaince) {
    const editedData = data.map((maintaince) => {
      if (maintaince.id === newMaintaince.id) {
        maintaince.date = newMaintaince.date;
        maintaince.type = newMaintaince.type;
      }
      return maintaince;
    });

    setData(editedData);
  }

  const { setLoading: setSubmitLoading } = useToastContext();
  const columns = [
    {
      field: "id",
      headerName: "id ",
      width: 200,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "propertyId",
      headerName: "اسم العقار",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Link href={"/properties/" + params.row.property.id}>
          <Button variant={"text"}>{params.row.property.name}</Button>
        </Link>
      ),
    },
    {
      field: "unit",
      headerName: " رقم الوحده",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Link href={"/units/" + params.row.unit?.id}>
          <Button variant={"text"} sx={{ maxWidth: 100, overflow: "auto" }}>
            {params.row.unit?.number}
          </Button>
        </Link>
      ),
    },
    {
      field: "type",
      headerName: "نوع المصروف",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => <>{params.row.type?.name}</>,
    },
    {
      field: "payer",
      headerName: "الدافع",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => <>{MaintaincePayer[params.row.payer]}</>,
    },
    {
      field: "status",
      headerName: "الحالة",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => {
        const hasPendingPayment = params.row.payments?.some(
          (payment) => payment.status === "PENDING"
        );
        return hasPendingPayment || params.row.payments?.length === 0 ? (
          <span className={"text-red-600"}>{PaymentStatus.PENDING}</span>
        ) : (
          <span className="text-green-700">{PaymentStatus.PAID}</span>
        );
      },
    },
    {
      field: "date",
      headerName: "تاريخ تسجيل الصيانة",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <>{new Date(params.row.date).toLocaleDateString()}</>
      ),
    },
    {
      field: "totalPrice",
      headerName: "السعر الكلي",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => <>{formatCurrencyAED(params.row.totalPrice)}</>,
    },
    {
      field: "actions",
      width: 250,
      printable: false,
      renderCell: (params) => (
        <>
          {canEdit() && (
            <EditMaintenanceModal
              maintenance={params.row}
              onUpdate={handleUpdate}
              type="EXPENSE"
            />
          )}

          <DeleteModal
            href={`main/maintenance`}
            item={params.row}
            handleClose={() => handleDelete(params.row.id)}
          />
        </>
      ),
    },
  ];

  async function submit(data) {
    return await submitMaintenance({ ...data }, setSubmitLoading);
  }

  return (
    <>
      <FilterPaperContainer handleFilter={handleFilter}>
        <FilterSelect
          label="العقارات"
          param={"propertyId"}
          setFilters={setFilters}
          apiPoint={"/api/fast-handler?id=properties"}
        />
        <DatePicker
          label="تاريخ البدء"
          value={startDate}
          onChange={(date) => handleDateChange("start", date)}
          renderInput={(params) => <TextField {...params} />}
          format="DD/MM/YYYY"
        />
        <DatePicker
          label="تاريخ الانتهاء"
          value={endDate}
          onChange={(date) => handleDateChange("end", date)}
          renderInput={(params) => <TextField {...params} />}
          format="DD/MM/YYYY"
        />
      </FilterPaperContainer>
      <ViewComponent
        noCreate={true}
        formTitle={"مصروف"}
        title={"المصروفات"}
        totalPages={totalPages}
        rows={data}
        columns={columns}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        id={id}
        loading={loading}
        setData={setData}
        setTotal={setTotal}
        total={total}
        noModal={true}
        submitFunction={submit}
        url={"main/maintenance"}
        anotherComponent={ExpenseDialogButton}
        onModalOpen={() => {
          router.push("/maintenance");
        }}
      />
    </>
  );
};
