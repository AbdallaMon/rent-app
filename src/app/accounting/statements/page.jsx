"use client";

import TableFormProvider from "@/app/context/TableFormProvider/TableFormProvider";
import ViewComponent from "@/components/ViewComponent/ViewComponent";
import { useDataFetcher } from "@/helpers/hooks/useDataFetcher";
import {
  Box,
  TextField,
  Typography,
  Button,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useState } from "react";
import dayjs from "dayjs";
import { ownerInputs } from "@/app/owners/ownerInputs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import FilterSelect from "@/components/utility/FilterSelect.jsx";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import TableJournalLine from "@/components/accounting/TableJournalLine";
import TableJournalEntry from "@/components/accounting/TableJournalEntry";
dayjs.locale("ar");

export default function StatementPage({ searchParams }) {
  return (
    <TableFormProvider url={"fast-handler"}>
      <StatementWrapper searchParams={searchParams} />
    </TableFormProvider>
  );
}
function getSettlementTotals(row) {
  const total = Number(row?.amount ?? 0) || 0;

  const settled = (row?.settlementLines ?? []).reduce((sum, s) => {
    const v = Number(s?.amountMatched ?? 0);
    return sum + (isNaN(v) ? 0 : v);
  }, 0);
  const leftRaw = total - settled;
  const left = leftRaw > 0 ? leftRaw : 0; // never show negative "left"

  const pct =
    total > 0 ? Math.min(100, Math.max(0, (settled / total) * 100)) : 0;

  return { total, settled, left, pct };
}

export function fmt(n) {
  return Number(n || 0).toLocaleString("ar-AE", { maximumFractionDigits: 2 });
}
function StatementWrapper({ searchParams }) {
  const {
    data,
    loading,
    setFilters,
    filters,
    page,
    setPage,
    total,
    setTotal,
    limit,
    setLimit,
    setData,
    otherData,
    setOtherData,
  } = useDataFetcher(
    `main/accounting/statements?type=statement&`,
    null,
    searchParams
  );

  const [mode, setMode] = useState("owner");

  const [startDate, setStartDate] = useState(dayjs().startOf("month"));
  const [endDate, setEndDate] = useState(dayjs().endOf("month"));

  const columns = [
    {
      field: "id",
      headerName: "معرف",
      width: 50,
      printable: false,
      cardWidth: 48,
    },
    {
      field: "createdAt",
      headerName: "تاريخ القيد",
      width: 100,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Typography variant="body2" noWrap>
          {dayjs(params.row.createdAt).format("DD/MM/YYYY")}
        </Typography>
      ),
    },
    {
      field: "memo",
      headerName: "الوصف",
      width: 200,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "Debit",
      headerName: "مدين",
      width: 100,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => {
        return <TableJournalLine line={params.row.debit} />;
      },
    },
    {
      field: "Credit",
      headerName: "دائن",
      width: 100,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => {
        return <TableJournalLine line={params.row.credit} />;
      },
    },
    {
      field: "debitAmount",
      headerName: "الكمية",
      width: 100,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "settlement",
      headerName: "التسوية",
      width: 220,
      printable: true,
      renderCell: (params) => {
        // has settlement lines?
        if (params.row?.settlementLines?.length > 0) {
          const { settled, left } = getSettlementTotals(params.row);
          return (
            <Box
              sx={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}
            >
              <Typography variant="body2" noWrap>
                المسدد:{" "}
                <Box component="span" sx={{ fontWeight: 600 }}>
                  {fmt(settled)}
                </Box>
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{ color: left > 0 ? "warning.main" : "success.main" }}
              >
                المتبقي:{" "}
                <Box component="span" sx={{ fontWeight: 600 }}>
                  {fmt(left)}
                </Box>
              </Typography>
            </Box>
          );
        }

        const { left } = getSettlementTotals(params.row);
        return (
          <Typography variant="body2" color="text.secondary" noWrap>
            غير مُسدد — المتبقي {fmt(left)}
          </Typography>
        );
      },
    },

    {
      field: "actions",
      headerName: "التفاصيل",
      width: 250,
      printable: true,
      renderCell: (params) => {
        return (
          <TableJournalEntry
            entry={params.row.entry}
            withMemo={false}
            withSettlment={false}
            label="تفاصيل القيد"
            withLineChange={false}
          />
        );
      },
    },
  ];

  const handleDateChange = (type, date) => {
    if (type === "start") setStartDate(date);
    else setEndDate(date);
  };

  const applyFilters = () => {
    setFilters({
      ...filters,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    });
  };

  const handleModeChange = (_, next) => {
    if (!next) return;
    setMode(next);

    setFilters({ mode: next });
  };

  let rowFooter = [];

  if (otherData) {
    rowFooter = [
      {
        label: "",
        value: "",
        colSpan: 3,
      },
      {
        label: "اجمالي المبلغ",
        value: fmt(otherData.totalAmount),
      },
      {
        label: "اجمالي المسدد",
        value: fmt(otherData.totalSettled),
      },
      {
        label: "اجمالي المتبقي",
        value: fmt(otherData.totalLeft),
      },
    ];
  }
  return (
    <>
      {/* Top Controls */}
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
        {/* Mode Toggle */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            طريقة التصفية
          </Typography>
          <ToggleButtonGroup
            exclusive
            value={mode}
            onChange={handleModeChange}
            size="small"
            color="primary"
          >
            <ToggleButton value="owner">المالك</ToggleButton>
            <ToggleButton value="renter">المستأجر</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Always available: GL Account */}
        <FilterSelect
          label="الحسابات العامة"
          param={"glAccount"}
          setFilters={setFilters}
          apiPoint={"/api/fast-handler?id=glAccounts"}
        />

        <FilterSelect
          label="حالة التسوية"
          param={"isSettled"}
          setFilters={setFilters}
          options={[
            { name: "مسوي", id: "SETTLED" },
            { name: "غير مسوي", id: "NOTSETTLED" },
          ]}
        />

        {mode === "owner" && (
          <>
            <FilterSelect
              label="الملاك"
              param={"ownerId"}
              setFilters={setFilters}
              apiPoint={"/api/fast-handler?id=owner"}
            />

            {filters.ownerId && filters.ownerId !== "all" && (
              <FilterSelect
                label="العقارات"
                param={"propertyId"}
                setFilters={setFilters}
                apiPoint={`/api/fast-handler?id=properties&clientId=${filters.ownerId}`}
              />
            )}

            {filters.propertyId && filters.propertyId !== "all" && (
              <FilterSelect
                label="الوحدات"
                param={"unitId"}
                setFilters={setFilters}
                apiPoint={`/api/fast-handler?id=unit&propertyId=${filters.propertyId}`}
              />
            )}
          </>
        )}

        {/* Renter mode filters (only renter + accounts) */}
        {mode === "renter" && (
          <FilterSelect
            label="المستأجرين"
            param={"renterId"}
            setFilters={setFilters}
            apiPoint={"/api/fast-handler?id=renter"}
          />
        )}

        {/* Dates + Apply */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="تاريخ البدء"
            value={startDate}
            onChange={(d) => handleDateChange("start", d)}
            renderInput={(params) => <TextField {...params} />}
            format="DD/MM/YYYY"
          />
          <DatePicker
            label="تاريخ الانتهاء"
            value={endDate}
            onChange={(d) => handleDateChange("end", d)}
            renderInput={(params) => <TextField {...params} />}
            format="DD/MM/YYYY"
          />
        </LocalizationProvider>

        <Button variant="contained" onClick={applyFilters}>
          تطبيق الفلاتر
        </Button>
      </Box>

      {/* Table */}
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
        noCreate
        footerRow={rowFooter}
      />
    </>
  );
}
