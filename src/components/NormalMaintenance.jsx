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
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import Link from "next/link";
import { MaintaincePayer, PaymentStatus } from "@/config/Enums";
import { usePathname, useRouter } from "next/navigation";
import Box from "@mui/material/Box";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import "dayjs/locale/ar";
import dayjs from "dayjs";
import { formatCurrencyAED } from "@/helpers/functions/convertMoneyToArabic";
import EditMaintenanceModal from "@/components/ui/Modals/EditMaintainceModal";
import { useAuth } from "@/app/context/AuthProvider/AuthProvider";
import { getCurrentPrivilege } from "@/helpers/functions/getUserPrivilege";
import DeleteModal from "./ui/Modals/DeleteModal";
import FilterPaperContainer from "./utility/FilterPaperContainer";

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
    setFilters,
  } = useDataFetcher("main/maintenance");
  const { id, submitData } = useTableForm();
  const [propertyId, setPropertyId] = useState(null);
  const [payerType, setPayerType] = useState(null);
  const [propertiesData, setPropertiesData] = useState(null);
  const [selectProperties, setSelectProperties] = useState([]);
  const [startDate, setStartDate] = useState(dayjs().startOf("month"));
  const [endDate, setEndDate] = useState(dayjs().endOf("month"));
  const [typesData, setTypesData] = useState(null);
  const [selectProperty, setSelectProperty] = useState(null);
  const [glAccount, setGlAccount] = useState(null);
  const [glAccounts, setGlAccounts] = useState([]);
  const [disabled, setDisabled] = useState({
    unitId: true,
    glAccountId: true,
  });
  const [reFetch, setRefetch] = useState({ unitId: false, glAccountId: false });
  const router = useRouter();
  const [extraData, setExtraData] = useState({});
  const { user } = useAuth();
  const pathName = usePathname();

  function canEdit() {
    const currentPrivilege = getCurrentPrivilege(user, pathName);
    return currentPrivilege?.privilege.canEdit;
  }

  useEffect(() => {
    async function get() {
      const properties = await getProperties();
      setSelectProperties(properties.data);
    }

    get();
  }, []);

  useEffect(() => {
    const currentProperty = propertiesData?.find(
      (property) => property.id === +propertyId
    );
    if (currentProperty) {
      setExtraData({
        ownerId: currentProperty.client.id,
        ownerName: currentProperty.client.name,
      });
    }
  }, [propertyId]);

  const handleDateChange = (type, date) => {
    if (type === "start") {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
  };

  const handlePropertySelectChange = (e) => {
    setSelectProperty(e.target.value);
  };

  const handleFilter = async () => {
    const filters = {
      propertyId: selectProperty,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
    setFilters(filters);
  };

  async function getProperties() {
    const res = await fetch("/api/fast-handler?id=properties");
    const data = await res.json();
    setPropertiesData(data);
    return { data };
  }
  function handlePayerTypeChange(value) {
    setPayerType(value);

    setDisabled((old) => ({ ...old, glAccountId: false }));
    setRefetch((old) => ({ ...old, glAccountId: true }));
  }

  async function getGlAccounts() {
    const res = await fetch(
      "/api/fast-handler?id=glAccounts&type=" +
        `${payerType === "OWNER" ? "ASSET" : "EXPENSE"}`
    );
    const data = await res.json();
    setGlAccounts(data);
    const returnedData = data.filter((account) => {
      return payerType === "OWNER"
        ? account.code === "1210"
        : account.code !== "1210";
    });
    return { data: returnedData, id: payerType };
  }
  function handleGlAccountChange(value) {
    const currentAccount = glAccounts.find((account) => account.id === value);
    setGlAccount(currentAccount);
  }
  function handlePropertyChange(value) {
    setPropertyId(value);
    setDisabled((old) => ({ ...old, unitId: false }));
    setRefetch((old) => ({ ...old, unitId: true }));
  }
  async function getUnits() {
    const res = await fetch(
      "/api/fast-handler?id=unit&propertyId=" + propertyId
    );

    const data = await res.json();

    const dataWithLabel = [
      { id: null, name: "عام - العقار كله", number: "عام - العقار كله" },
      ...data.map((item) => ({ ...item, name: item.number })),
    ];

    return { data: dataWithLabel, id: propertyId };
  }

  async function getExpenseTypes() {
    const res = await fetch("/api/fast-handler?id=expenseTypes");
    const data = await res.json();
    setTypesData(data);
    return { data };
  }

  const defInputs = maintenanceInputs.map((input) => {
    switch (input.data.id) {
      case "propertyId":
        return {
          ...input,
          getData: getProperties,
          onChange: handlePropertyChange,
        };
      case "unitId":
        return { ...input, getData: getUnits };
      case "typeId":
        return { ...input, getData: getExpenseTypes };
      case "date":
        return {
          ...input,
          value: new Date().toISOString().split("T")[0], // تاريخ اليوم كقيمة افتراضية
        };
      case "payer":
        return {
          ...input,
          onChange: handlePayerTypeChange,
        };
      case "glAccountId":
        return {
          ...input,
          getData: getGlAccounts,
          onChange: handleGlAccountChange,
        };

      default:
        return input;
    }
  });

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
              types={typesData}
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
    const currentType = typesData?.find((type) => type.id === +data.typeId);
    const description = `${currentType.name}`;
    return await submitMaintenance(
      { ...data, description, extraData },
      setSubmitLoading,
      glAccount
    );
  }

  return (
    <>
      <FilterPaperContainer handleFilter={handleFilter}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>العقارات</InputLabel>
          <Select value={selectProperty} onChange={handlePropertySelectChange}>
            <MenuItem value="all">
              <em>جميع العقارات</em>
            </MenuItem>
            {selectProperties.map((property) => (
              <MenuItem key={property.id} value={property.id}>
                {property.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
        inputs={defInputs}
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
        disabled={disabled}
        reFetch={reFetch}
        submitFunction={submit}
        url={"main/maintenance"}
        onModalOpen={() => {
          router.push("/maintenance");
        }}
      />
    </>
  );
};
