"use client";

import TableFormProvider from "@/app/context/TableFormProvider/TableFormProvider";
import ViewComponent from "@/components/ViewComponent/ViewComponent";
import { useDataFetcher } from "@/helpers/hooks/useDataFetcher";
import React, { useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ar";
import {
  Box,
  TextField,
  Typography,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Tooltip,
  Card,
  CardContent,
  Divider,
  Skeleton,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { alpha } from "@mui/material/styles";
import {
  AiOutlineArrowUp,
  AiOutlineArrowDown,
  AiOutlineMinus,
} from "react-icons/ai";

dayjs.locale("ar");

// ====== اتجاه الرصيد: توحيد القيم + ألوان/أيقونات موحّدة ======
const trendBase = {
  up: { colorKey: "success", icon: AiOutlineArrowUp, label: "صاعد" },
  down: { colorKey: "error", icon: AiOutlineArrowDown, label: "هابط" },
  flat: { colorKey: "info", icon: AiOutlineMinus, label: "مستقر" },
};

function normalizeTrend(trend, totalBalance) {
  const t = String(trend ?? "").toLowerCase();
  const up = new Set([
    "up",
    "increase",
    "increasing",
    "pos",
    "positive",
    "gain",
    "high",
  ]);
  const down = new Set([
    "down",
    "decrease",
    "decreasing",
    "neg",
    "negative",
    "loss",
    "low",
  ]);
  const flat = new Set(["flat", "neutral", "zero", "stable", "steady"]);

  if (up.has(t)) return "up";
  if (down.has(t)) return "down";
  if (flat.has(t)) return "flat";

  if (typeof totalBalance === "number") {
    if (totalBalance > 0) return "up";
    if (totalBalance < 0) return "down";
    return "flat";
  }
  return "flat";
}

// Chip ناعمة بالألوان (soft) موحّدة في الجدول والملخّص
function TrendChip({ trend, totalBalance, size = "small" }) {
  const key = normalizeTrend(trend, totalBalance);
  const cfg = trendBase[key] || trendBase.flat;
  const Icon = cfg.icon;

  return (
    <Chip
      size={size}
      icon={<Icon size={16} />}
      label={cfg.label}
      // بنعمل لون soft يدويًا بدل ألوان Chip الافتراضية
      sx={(theme) => {
        const main = theme.palette[cfg.colorKey].main;
        return {
          direction: "rtl",
          fontWeight: 600,
          borderRadius: "999px",
          px: 1,
          bgcolor: alpha(main, 0.1),
          color:
            theme.palette.mode === "dark"
              ? theme.palette[cfg.colorKey].light
              : main,
          border: `1px solid ${alpha(main, 0.25)}`,
          "& .MuiChip-icon": { mr: 0, ml: 0.5, color: "inherit" },
        };
      }}
    />
  );
}

export default function TrialBalancePage() {
  return (
    <TableFormProvider url={"fast-handler"}>
      <TrialBalanceWrapper />
    </TableFormProvider>
  );
}

function TrialBalanceWrapper() {
  const { data, loading, setFilters, filters, otherData } = useDataFetcher(
    `main/accounting/trial-balance`
  );

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
      field: "name",
      headerName: "اسم الحساب",
      width: 220,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "debits",
      headerName: "رصيد مدين",
      width: 150,
      printable: true,
      valueGetter: (params) => params.row?.debits ?? 0,
    },
    {
      field: "credits",
      headerName: "رصيد دائن",
      width: 150,
      printable: true,
      valueGetter: (params) => params.row?.credits ?? 0,
    },
    {
      field: "balance",
      headerName: "الرصيد",
      width: 150,
      printable: true,
      valueGetter: (params) => params.row?.balance ?? 0,
    },
    {
      field: "balanceTrend",
      headerName: "اتجاه الرصيد",
      width: 170,
      printable: true,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Tooltip
          title={`الاتجاه: ${trendBase[normalizeTrend(params.row.balanceTrend, params.row?.totalBalance)]?.label || "مستقر"}`}
          arrow
          placement="top"
        >
          <span>
            <TrendChip
              trend={params.row.balanceTrend}
              totalBalance={params.row?.totalBalance}
            />
          </span>
        </Tooltip>
      ),
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

  return (
    <>
      {/* أدوات التصفية بالأعلى */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 4,
          pr: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
        dir="rtl"
      >
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

      <TrialBalanceSummary otherData={otherData} loading={loading} />

      <ViewComponent
        rows={data}
        columns={columns}
        loading={loading}
        noPagination
        noCreate
      />
    </>
  );
}

function TrialBalanceSummary({ loading, otherData, currency = "AED" }) {
  if (loading) {
    return (
      <Card variant="outlined" sx={{ borderRadius: 2 }} dir="rtl">
        <CardContent>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1 }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              ميزان المراجعة
            </Typography>
            <CircularProgress size={18} />
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Skeleton
              variant="rounded"
              height={72}
              sx={{ flex: 1, minWidth: 220 }}
            />
            <Skeleton
              variant="rounded"
              height={72}
              sx={{ flex: 1, minWidth: 220 }}
            />
            <Skeleton
              variant="rounded"
              height={72}
              sx={{ flex: 1, minWidth: 220 }}
            />
          </Stack>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1.5, display: "block" }}
          >
            جارِ التحميل...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!otherData) {
    return (
      <Card variant="outlined" sx={{ borderRadius: 2 }} dir="rtl">
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            ميزان المراجعة
          </Typography>
        </CardContent>
        <Divider />
        <Box p={2} dir="rtl">
          <Typography variant="body2" color="text.secondary">
            لا يوجد بيانات
          </Typography>
        </Box>
      </Card>
    );
  }

  const totalDebits = otherData?.totalDebits ?? 0;
  const totalCredits = otherData?.totalCredits ?? 0;
  const totalBalance = otherData?.totalBalance ?? 0;
  const balanceTrend = otherData?.balanceTrend;

  const fmt = (n) =>
    new Intl.NumberFormat("ar-EG", { style: "currency", currency }).format(
      Number(n) || 0
    );

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        borderColor: "divider",
        bgcolor: "background.paper",
        mb: 2,
      }}
      dir="rtl"
    >
      <CardContent>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              ميزان المراجعة
            </Typography>
          </Stack>

          {/* نفس الشيب المستخدمة في الجدول */}
          <TrendChip trend={balanceTrend} totalBalance={totalBalance} />
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          useFlexGap
          flexWrap="wrap"
        >
          <StatItem title="إجمالي المدين" value={fmt(totalDebits)} />
          <StatItem title="إجمالي الدائن" value={fmt(totalCredits)} />
          <StatItem
            title="الصافي"
            value={fmt(totalBalance)}
            valueColor={(theme) => {
              const key = normalizeTrend(balanceTrend, totalBalance);
              if (key === "up") return theme.palette.success.main;
              if (key === "down") return theme.palette.error.main;
              return theme.palette.text.primary;
            }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

function StatItem({ title, value, valueColor = "text.primary" }) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 220,
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h6" sx={{ mt: 0.5 }} color={valueColor}>
        {value}
      </Typography>
    </Box>
  );
}
