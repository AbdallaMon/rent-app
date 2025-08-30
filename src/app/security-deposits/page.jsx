"use client";

import TableFormProvider from "@/app/context/TableFormProvider/TableFormProvider";
import ViewComponent from "@/components/ViewComponent/ViewComponent";
import { useDataFetcher } from "@/helpers/hooks/useDataFetcher";
import {
  Box,
  TextField,
  Typography,
  Button,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Link,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import FilterSelect from "@/components/utility/FilterSelect.jsx";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { RefundSecurityDepositButton } from "@/components/deposits/RefundSecurityDepositButton";
import { depositsInputs } from "./inputs";
import DeleteModal from "@/components/ui/Modals/DeleteModal";
dayjs.locale("ar");

// enum للواجهة
const DateFilterMode = {
  RECEIVED: "receivedAt", // بوقت الاستلام
  REFUNDED: "refundedAt", // بوقت الارجاع
};

export default function DepositsPage({ searchParams }) {
  return (
    <TableFormProvider url={"fast-handler"}>
      <DepositsPageWrapper searchParams={searchParams} />
    </TableFormProvider>
  );
}

function DepositsPageWrapper({ searchParams }) {
  const {
    data,
    loading,
    filters,
    setFilters,
    page,
    setPage,
    limit,
    setLimit,
    total,
    setData,
    setTotal,
    setRender,
  } = useDataFetcher(`main/security-deposits`, null, searchParams);

  // حالة التواريخ + نوع الفلترة
  const [dateMode, setDateMode] = useState(DateFilterMode.RECEIVED);
  const [startDate, setStartDate] = useState(dayjs().startOf("month"));
  const [endDate, setEndDate] = useState(dayjs().endOf("month"));
  const [renterId, setRenterId] = useState();
  const [disabled, setDisabled] = useState({
    rentAgreementId: true,
  });

  const [reFetch, setRefetch] = useState({
    rentAgreementId: false,
  });
  async function getRentersData() {
    const res = await fetch("/api/fast-handler?id=renter");
    const data = await res.json();

    return { data };
  }

  async function getRentAgreementsByRenterId() {
    const res = await fetch(
      "/api/fast-handler?id=rentAgreements&renterId=" + renterId
    );
    const data = await res.json();
    return { data, id: renterId };
  }

  const handleDateChange = (type, date) => {
    if (type === "start") setStartDate(date);
    else setEndDate(date);
  };

  // هننضف أي مفاتيح تواريخ قديمة قبل ما نرسل فلاتر جديدة
  const cleanFilters = useMemo(() => {
    const {
      startDate: _s,
      endDate: _e,
      dateField: _f,
      ...rest
    } = filters || {};
    return rest;
  }, [filters]);

  const handleFilter = () => {
    const newFilters = {
      ...cleanFilters, // احتفاظ بكل الفلاتر الأخرى
      dateField: dateMode, // الحقل المُراد الفلترة عليه
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    };
    setFilters(newFilters);
  };

  // أعمدة الجدول
  const columns = [
    {
      field: "id",
      headerName: "المعرف",
      width: 80,
      printable: false,
      cardWidth: 48,
    },
    {
      field: "amount",
      headerName: "قيمة الوديعة",
      width: 140,
      renderCell: (params) => (
        <Typography>
          {Number(params.row.amount).toLocaleString()} درهم
        </Typography>
      ),
    },
    {
      field: "deductedAmount",
      headerName: "المبلغ المخصوم",
      width: 160,
      renderCell: (params) =>
        params.row?.deductedAmount ? (
          <Typography color="error">
            {Number(params.row.deductedAmount).toLocaleString()} درهم
          </Typography>
        ) : (
          <Typography color="text.secondary">لا يوجد</Typography>
        ),
    },
    {
      field: "deductionReason",
      headerName: "سبب الخصم",
      width: 200,
      renderCell: (params) => (
        <Typography noWrap>{params.row.deductionReason ?? "—"}</Typography>
      ),
    },
    {
      field: "status",
      headerName: "الحالة",
      width: 180,
      renderCell: (params) => {
        const status = params.row.status;
        const map = {
          HELD: "محتجزة",
          PARTIALLY_REFUNDED: "مسترجعة جزئياً",
          REFUNDED: "مسترجعة بالكامل",
          FORFEITED: "مصادرة",
        };
        const color =
          status === "HELD"
            ? "warning"
            : status === "PARTIALLY_REFUNDED"
              ? "info"
              : status === "REFUNDED"
                ? "success"
                : "error";
        return (
          <Chip label={map[status] || status} color={color} size="small" />
        );
      },
    },
    {
      field: "receivedAt",
      headerName: "تاريخ الاستلام",
      width: 180,
      renderCell: (p) => (
        <Typography>{dayjs(p.row.receivedAt).format("YYYY/MM/DD")}</Typography>
      ),
    },
    {
      field: "refundedAt",
      headerName: "تاريخ الاسترجاع",
      width: 180,
      renderCell: (p) =>
        p.row.refundedAt ? (
          <Typography>
            {dayjs(p.row.refundedAt).format("YYYY/MM/DD")}
          </Typography>
        ) : (
          <Typography color="text.secondary">—</Typography>
        ),
    },
    {
      field: "unit",
      headerName: "الوحدة",
      width: 160,
      renderCell: (p) => {
        const unit = p.row?.unit;
        if (!unit) return <Typography color="text.secondary">—</Typography>;
        return (
          <Link component={Link} href={`/units/${unit.id}`} underline="hover">
            {unit.unitId || `#${unit.id}`}
          </Link>
        );
      },
    },
    // العقار + لينك
    {
      field: "property",
      headerName: "العقار",
      width: 200,
      renderCell: (p) => {
        const prop = p.row?.unit?.property;
        if (!prop) return <Typography color="text.secondary">—</Typography>;
        return (
          <Link
            component={Link}
            href={`/properties/${prop.id}`}
            underline="hover"
          >
            {prop.name}
          </Link>
        );
      },
    },
    // عقد الإيجار + لينك
    {
      field: "rentAgreement",
      headerName: "عقد الإيجار",
      width: 200,
      renderCell: (p) => {
        const ra = p.row?.rentAgreement;
        if (!ra) return <Typography color="text.secondary">—</Typography>;
        return (
          <Link component={Link} href={`/rents/${ra.id}`} underline="hover">
            {ra.rentAgreementNumber || `RA-${ra.id}`}
          </Link>
        );
      },
    },
    // المستأجر + لينك
    {
      field: "renter",
      headerName: "المستأجر",
      width: 200,
      renderCell: (p) => {
        const renter = p.row?.renter;
        if (!renter) return <Typography color="text.secondary">—</Typography>;
        return (
          <Link
            component={Link}
            href={`/renters/${renter.id}`}
            underline="hover"
          >
            {renter.name}
          </Link>
        );
      },
    },
    {
      field: "actions",
      headerName: "الاجراءت",
      width: 300,
      renderCell: (params) => {
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <RefundSecurityDepositButton
              amount={params.row.amount}
              deposit={params.row}
              buttonText={
                params.row.status === "HELD"
                  ? "ارجاع الوديعه"
                  : "تعديل عملية الارجاع"
              }
              onSuccess={() => {
                setRender((old) => !old);
              }}
            />
            <DeleteModal
              item={params.row}
              handleClose={() => setRender((old) => !old)}
              href={`main/security-deposits`}
            />
          </Box>
        );
      },
    },
  ];
  const handleRenterChange = (newValue) => {
    setRenterId(newValue);
    setDisabled({
      rentAgreementId: newValue === null,
    });
    setRefetch({ rentAgreementId: true });
  };
  const handleRentAgreementChange = (newValue) => {
    setRefetch({ rentAgreementId: false });
  };

  const startLabel =
    dateMode === DateFilterMode.RECEIVED
      ? "بداية تاريخ الاستلام"
      : "بداية تاريخ الارجاع";
  const endLabel =
    dateMode === DateFilterMode.RECEIVED
      ? "نهاية تاريخ الاستلام"
      : "نهاية تاريخ الارجاع";
  const dataInputs = depositsInputs.map((input) => {
    switch (input.data.id) {
      case "renterId":
        return {
          ...input,
          extraId: false,
          getData: getRentersData,
          onChange: handleRenterChange,
        };
      case "rentAgreementId":
        return {
          ...input,
          getData: getRentAgreementsByRenterId,
          onChange: handleRentAgreementChange,
          disabled: disabled.rentAgreementId,
        };

      default:
        return input;
    }
  });
  return (
    <>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 4,
          pr: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <FilterSelect
          label="المستأجرين"
          param={"renterId"}
          setFilters={setFilters}
          loading={loading}
          apiPoint={"/api/fast-handler?id=renter"}
        />

        <ToggleButtonGroup
          exclusive
          value={dateMode}
          onChange={(_, val) => {
            if (!val) return;
            setDateMode(val);
            setFilters((prev) => {
              const { startDate, endDate, dateField, ...rest } = prev || {};
              return rest;
            });
          }}
          size="small"
        >
          <ToggleButton value={DateFilterMode.RECEIVED}>
            فلترة بوقت الاستلام
          </ToggleButton>
          <ToggleButton value={DateFilterMode.REFUNDED}>
            فلترة بوقت الارجاع
          </ToggleButton>
        </ToggleButtonGroup>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label={startLabel}
            value={startDate}
            onChange={(d) => handleDateChange("start", d)}
            format="DD/MM/YYYY"
            slotProps={{ textField: { size: "small" } }}
          />
          <DatePicker
            label={endLabel}
            value={endDate}
            onChange={(d) => handleDateChange("end", d)}
            format="DD/MM/YYYY"
            slotProps={{ textField: { size: "small" } }}
          />
        </LocalizationProvider>

        <Button variant="contained" onClick={handleFilter}>
          تطبيق الفلاتر
        </Button>
      </Box>

      <ViewComponent
        rows={data}
        columns={columns}
        loading={loading}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        setData={setData}
        setTotal={setTotal}
        total={total}
        inputs={dataInputs}
        formTitle={`وديعة تامين`}
        title={"ودائع التامين"}
        disabled={disabled}
        reFetch={reFetch}
        url="main/security-deposits"
      />
    </>
  );
}
