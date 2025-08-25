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
import DeleteBtn from "@/components/ui/Buttons/DeleteBtn";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import Link from "next/link";
import { PaymentStatus } from "@/config/Enums";
import { usePathname, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/ar";
import dayjs from "dayjs";
import { formatCurrencyAED } from "@/helpers/functions/convertMoneyToArabic";
import EditMaintenanceModal from "@/components/ui/Modals/EditMaintainceModal";
import { useAuth } from "@/app/context/AuthProvider/AuthProvider";
import { getCurrentPrivilege } from "@/helpers/functions/getUserPrivilege";

dayjs.locale("ar");

async function getPaymentMethodTypes() {
  const methodTypes = [
    { id: "CASH", name: "نقدي" },
    { id: "BANK", name: "تحويل بنكي" },
  ];
  return { data: methodTypes };
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
        value: false, // جعل الوحدة اختيارية
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
      label: "تاريخ الصيانة",
      name: "date",
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال تاريخ الصيانة",
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
      label: "نوع الصياتة",
      name: "typeId",
    },
    autocomplete: true,
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال نوع الصيانة",
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
  const [propertiesData, setPropertiesData] = useState(null);
  const [selectProperties, setSelectProperties] = useState([]);
  const [unitData, setUnitData] = useState(null);
  const [startDate, setStartDate] = useState(dayjs().startOf("month"));
  const [endDate, setEndDate] = useState(dayjs().endOf("month"));
  const [typesData, setTypesData] = useState(null);
  const [selectProperty, setSelectProperty] = useState(null);
  const [disabled, setDisabled] = useState({ unitId: false }); // الوحدة متاحة دائماً لأنها اختيارية
  const [reFetch, setRefetch] = useState({ unitId: false });
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

  function handlePropertyChange(value) {
    setPropertyId(value);
    router.push("/maintenance?propertyId=" + value);
    setDisabled({ ...disabled, unitId: false });
    setRefetch({ ...reFetch, unitId: true });
  }

  async function getUnits() {
    const searchParams = new URLSearchParams(window.location.search);
    const propertyId = searchParams.get("propertyId");
    if (!propertyId) return { data: [] };
    const res = await fetch(
      "/api/fast-handler?id=unit&propertyId=" + propertyId
    );
    const data = await res.json();
    setUnitData(data);

    // إضافة خيار "عام - العقار كله" كأول خيار
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

  const otherInputs = [
    {
      data: {
        id: "startDate",
        type: "date",
        label: "تاريخ بداية الأقساط",
        name: "installmentStartDate",
      },
      pattern: {
        required: { value: true, message: "يرجى إدخال تاريخ بداية الأقساط" },
      },
      sx: { width: { xs: "100%", md: "48%" }, mr: "auto" },
    },
    {
      data: {
        id: "endDate",
        type: "date",
        label: "تاريخ نهاية الأقساط",
        name: "installmentEndDate",
      },
      pattern: {
        required: { value: true, message: "يرجى إدخال تاريخ نهاية الأقساط" },
      },
      sx: { width: { xs: "100%", md: "48%" } },
    },
  ];

  const [dataInputs, setDataInputs] = useState([]);
  const [loadingInput, setInputLoading] = useState(true);
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
      case "payEvery":
        return {
          ...input,
          onChange: (value) => {
            if (value === "ONCE") {
              setDataInputs((old) =>
                old.filter(
                  (input) =>
                    input.data.id !== "startDate" && input.data.id !== "endDate"
                )
              );
            } else {
              setDataInputs((old) => {
                const withoutOtherInputs = old.filter(
                  (input) =>
                    input.data.id !== "startDate" && input.data.id !== "endDate"
                );
                return [...withoutOtherInputs, ...otherInputs];
              });
            }
          },
        };
      default:
        return input;
    }
  });

  useEffect(() => {
    setDataInputs(defInputs);
    setInputLoading(false);
  }, []);

  async function handleDelete(id) {
    await submitData(null, null, id, "DELETE", null, null, "main/maintenance");
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
      headerName: "نوع   الصيانة",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => <>{params.row.type?.name}</>,
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
            />
          )}
          <DeleteBtn handleDelete={() => handleDelete(params.row.id)} />
        </>
      ),
    },
  ];

  async function submit(data) {
    const currentType = typesData?.find((type) => type.id === +data.typeId);
    const description = `${currentType.name}`;
    return await submitMaintenance(
      { ...data, description, extraData },
      setSubmitLoading
    );
  }

  if (loadingInput) {
    return null;
  }

  return (
    <>
      <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
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
        <LocalizationProvider dateAdapter={AdapterDayjs}>
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
        </LocalizationProvider>
        <Button variant="contained" color="primary" onClick={handleFilter}>
          تطبيق الفلاتر
        </Button>
      </Box>
      <ViewComponent
        inputs={dataInputs}
        formTitle={" صيانة"}
        title={"الصيانات"}
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
          setDataInputs(defInputs);
        }}
      />
    </>
  );
};
