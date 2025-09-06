"use client";
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { useTableForm } from "@/app/context/TableFormProvider/TableFormProvider";
import { useDataFetcher } from "@/helpers/hooks/useDataFetcher";
import ViewComponent from "@/components/ViewComponent/ViewComponent";
import { useToastContext } from "@/app/context/ToastLoading/ToastLoadingProvider";
import { submitMaintenanceContract } from "@/services/client/maintenance";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dayjs from "dayjs";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import "dayjs/locale/ar";
import { formatCurrencyAED } from "@/helpers/functions/convertMoneyToArabic";
import EditMaintenanceModal from "@/components/ui/Modals/EditMaintainceModal";
import { useAuth } from "@/app/context/AuthProvider/AuthProvider";
import { getCurrentPrivilege } from "@/helpers/functions/getUserPrivilege";
import DeleteModal from "./ui/Modals/DeleteModal";
import FilterPaperContainer from "./utility/FilterPaperContainer";

async function getPayEveryOptions() {
  const data = [
    { id: "ONE_MONTH", name: "كل شهر" },
    { id: "TWO_MONTHS", name: "كل شهرين" },
    { id: "FOUR_MONTHS", name: "كل أربعة أشهر" },
    { id: "SIX_MONTHS", name: "كل ستة أشهر" },
    { id: "ONE_YEAR", name: "كل سنة" },
  ];
  return { data };
}

async function getPaymentMethodTypes() {
  const methodTypes = [
    { id: "CASH", name: "نقدي" },
    { id: "BANK", name: "تحويل بنكي" },
  ];
  return { data: methodTypes };
}

const PaymentStatus = {
  PENDING: "قيد الانتظار",
  PAID: "مدفوع",
};

export const maintenanceContractInputs = [
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
      id: "cost",
      type: "number",
      label: "مبلغ كل دفعه",
      name: "cost",
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال مبلغ الدفعه",
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
      id: "date",
      type: "date",
      label: "تاريخ تسجيل الصيانة",
      name: "date",
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال تاريخ تسجيل الصيانة",
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
      id: "typeId",
      type: "select",
      label: "نوع الصيانة",
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
    },
  },
  {
    data: {
      id: "payEvery",
      type: "select",
      label: "الدفع كل",
      name: "payEvery",
    },
    getData: getPayEveryOptions,
    hasOptions: true,
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال نوع التحصيل",
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
      id: "startDate",
      type: "date",
      label: "تاريخ بداية الأقساط",
      name: "installmentStartDate",
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال تاريخ بداية الأقساط",
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
      id: "endDate",
      type: "date",
      label: "تاريخ نهاية الأقساط",
      name: "installmentEndDate",
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال تاريخ نهاية الأقساط",
      },
    },
    sx: {
      width: {
        xs: "100%",
        md: "48%",
      },
    },
  },
];

dayjs.locale("ar");

export default function MaintenanceContracts() {
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
  } = useDataFetcher("main/maintenance/contracts");
  const { id, submitData } = useTableForm();
  const [propertyId, setPropertyId] = useState(null);
  const [propertiesData, setPropertiesData] = useState([]);
  const [selectProperties, setSelectProperties] = useState([]);
  const [startDate, setStartDate] = useState(dayjs().startOf("month"));
  const [endDate, setEndDate] = useState(dayjs().endOf("month"));
  const [typesData, setTypesData] = useState(null);
  const [selectProperty, setSelectProperty] = useState(null);
  const [extraData, setExtraData] = useState({});
  const { setLoading: setSubmitLoading } = useToastContext();
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

  async function getExpenseTypes() {
    const res = await fetch("/api/fast-handler?id=expenseTypes");
    const data = await res.json();
    setTypesData(data);
    return { data };
  }

  const [dataInputs, setDataInputs] = useState([]);
  const [loadingInput, setInputLoading] = useState(true);

  const defInputs = maintenanceContractInputs.map((input) => {
    switch (input.data.id) {
      case "propertyId":
        return {
          ...input,
          getData: getProperties,
          onChange: (value) => setPropertyId(value),
        };
      case "payEvery":
        return { ...input, getData: getPayEveryOptions };
      case "typeId":
        return { ...input, getData: getExpenseTypes };
      default:
        return input;
    }
  });

  useEffect(() => {
    setDataInputs(defInputs);
    setInputLoading(false);
  }, []);

  const handleDelete = async (id) => {
    const filterData = data.filter((item) => +item.id !== +id);
    setData(filterData);
    setTotal((old) => old - 1);
    if (page === 1 && total >= limit) {
      setRender((old) => !old);
    } else {
      setPage((old) => (old > 1 ? old - 1 : 1) || 1);
    }
  };

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
      field: "type",
      headerName: "نوع الصيانة",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => <>{params.row.type?.name}</>,
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
      headerName: "مبلغ الدفعه ",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => <>{formatCurrencyAED(params.row.totalPrice)}</>,
    },
    {
      field: "startDate",
      headerName: "تاريخ بداية الأقساط",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <>
          {new Date(params.row.installments[0]?.startDate).toLocaleDateString()}
        </>
      ),
    },
    {
      field: "endDate",
      headerName: "تاريخ نهاية الأقساط",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => {
        const endDate = new Date(
          params.row.installments[params.row.installments.length - 1]?.endDate
        );
        endDate.setDate(endDate.getDate() - 1);
        return <>{endDate.toLocaleDateString()}</>;
      },
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
          <DeleteModal
            href={`main/maintenance/contracts`}
            item={params.row}
            handleClose={() => handleDelete(params.row.id)}
          />
        </>
      ),
    },
  ];

  const submit = async (data) => {
    const description = "عقد صيانة";
    return await submitMaintenanceContract(
      { ...data, description, extraData },
      setSubmitLoading
    );
  };

  if (loadingInput) {
    return null;
  }

  return (
    <Box>
      <FilterPaperContainer handleFilter={handleFilter}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>العقارات</InputLabel>
          <Select value={selectProperty} onChange={handlePropertySelectChange}>
            <MenuItem value="">
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
        inputs={dataInputs}
        formTitle={"إنشاء عقد صيانة"}
        title={"عقود الصيانة"}
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
        url={"main/maintenance-contracts"}
      />
    </Box>
  );
}
