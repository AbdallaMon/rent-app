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
  Grid,
} from "@mui/material";
import { useState } from "react";
import dayjs from "dayjs";
import FilterSelect from "@/components/utility/FilterSelect.jsx";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import TableJournalLine from "@/components/accounting/TableJournalLine";
import { formatCurrencyAED } from "@/helpers/functions/convertMoneyToArabic";
import FilterPaperContainer from "@/components/utility/FilterPaperContainer";
import { AccountingSummaryCard } from "@/components/accounting/AccountingSummaryCard";
import { FaArrowDown, FaArrowUp, FaPiggyBank } from "react-icons/fa";
import { FaScaleBalanced } from "react-icons/fa6";
dayjs.locale("ar");

export default function LedgarPage({ searchParams }) {
  return (
    <TableFormProvider url={"fast-handler"}>
      <LedgarWrapper searchParams={searchParams} />
    </TableFormProvider>
  );
}

function LedgarWrapper({ searchParams }) {
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
  } = useDataFetcher(`main/accounting/ledgar?`, null, searchParams);

  const [mode, setMode] = useState("accounts");

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
      field: "description",
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
      field: "signedChange",
      headerName: "الكمية",
      width: 100,
      printable: true,
      cardWidth: 48,
    },

    {
      field: "currentBalance",
      headerName: "الرصيد",
      width: 100,
      printable: true,
      cardWidth: 48,
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
      mode,
    });
  };

  const handleModeChange = (_, next) => {
    if (!next) return;
    setMode(next);

    setFilters({ mode: next });
  };
  console.log(data, "data");
  return (
    <>
      {/* Top Controls */}
      <FilterPaperContainer handleFilter={applyFilters}>
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
            <ToggleButton value="accounts">الحسابات</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        {mode === "accounts" && (
          <FilterSelect
            label="الحسابات العامة"
            param={"glAccountId"}
            setFilters={setFilters}
            apiPoint={"/api/fast-handler?id=glAccounts"}
          />
        )}

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
      </FilterPaperContainer>

      <Grid container spacing={2} sx={{ mt: 0 }}>
        <Grid size={{ sm: 6, md: 3 }}>
          <AccountingSummaryCard
            title="الرصيد الافتتاحي"
            value={formatCurrencyAED(otherData?.openingBalance)}
            icon={FaPiggyBank}
            color="secondary"
            subtitle="رصيد بداية الفترة"
          />
        </Grid>

        <Grid size={{ sm: 6, md: 3 }}>
          <AccountingSummaryCard
            title="المدين"
            value={formatCurrencyAED(otherData?.totalCredits)}
            icon={FaArrowDown}
            color="info"
            subtitle="إجمالي المدين خلال الفترة"
          />
        </Grid>

        <Grid size={{ sm: 6, md: 3 }}>
          <AccountingSummaryCard
            title="الدائن"
            value={formatCurrencyAED(otherData?.totalDebits)}
            icon={FaArrowUp}
            color="warning"
            subtitle="إجمالي الدائن خلال الفترة"
          />
        </Grid>

        <Grid size={{ sm: 6, md: 3 }}>
          <AccountingSummaryCard
            title="الرصيد الختامي"
            value={formatCurrencyAED(otherData?.totalBalance)}
            icon={FaScaleBalanced}
            color={otherData?.totalBalance > 0 ? "success" : "error"}
            subtitle={`الرصيد الختامي لهذا الشهر`}
          />
        </Grid>
      </Grid>

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
      />
    </>
  );
}
