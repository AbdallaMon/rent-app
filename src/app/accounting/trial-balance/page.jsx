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
  Grid,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { alpha } from "@mui/material/styles";
import {
  AiOutlineArrowUp,
  AiOutlineArrowDown,
  AiOutlineMinus,
} from "react-icons/ai";
import FilterPaperContainer from "@/components/utility/FilterPaperContainer";
import { AccountingSummaryCard } from "@/components/accounting/AccountingSummaryCard";
import {
  fmtSigned,
  formatCurrencyAED,
} from "@/helpers/functions/convertMoneyToArabic";
import { Scale, Wallet } from "@mui/icons-material";
import { FaBalanceScale, FaDollarSign, FaWallet } from "react-icons/fa";

dayjs.locale("ar");

// ====== اتجاه الرصيد: توحيد القيم + ألوان/أيقونات موحّدة ======
const trendBase = {
  up: { colorKey: "success", icon: AiOutlineArrowUp, label: "صاعد" },
  down: { colorKey: "error", icon: AiOutlineArrowDown, label: "هابط" },
  flat: { colorKey: "info", icon: AiOutlineMinus, label: "مستقر" },
};

// عرض الرقم بإشارة واضحة

// تعريب نوع الحساب + ألوان خفيفة للـ Chip
const typeLabels = {
  ASSET: "أصل",
  LIABILITY: "التزامات",
  EQUITY: "حقوق ملكية",
  REVENUE: "إيراد",
  EXPENSE: "مصروف",
};

const typeColorKey = {
  ASSET: "info",
  LIABILITY: "error",
  EQUITY: "secondary",
  REVENUE: "success",
  EXPENSE: "warning",
};

function TypeChip({ type, size = "small" }) {
  const t = String(type || "").toUpperCase();
  const label = typeLabels[t] || t || "غير معروف";
  return (
    <Chip
      size={size}
      label={label}
      sx={(theme) => {
        const key = typeColorKey[t];
        const main = key
          ? theme.palette[key].main
          : theme.palette.text.secondary;
        return {
          borderRadius: "999px",
          px: 1,
          height: 24,
          fontWeight: 600,
          bgcolor: alpha(main, 0.1),
          color: main,
          border: `1px solid ${alpha(main, 0.25)}`,
        };
      }}
    />
  );
}

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

  console.log(data, "data");
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
      width: 50,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "name",
      headerName: "نوع الحساب",
      width: 260,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => {
        const type = params.row?.accountType ?? params.row?.type;
        return (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ width: "100%", overflow: "hidden" }}
          >
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {params.value}
            </Typography>
            <TypeChip type={type} />
          </Stack>
        );
      },
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
      width: 170,
      printable: true,

      renderCell: (params) => {
        const nb = params.row?.naturalBalance ?? 0; // natural balance
        return (
          <Typography
            variant="body2"
            sx={(theme) => ({
              fontWeight: 700,
              color:
                nb > 0
                  ? theme.palette.success.main
                  : nb < 0
                    ? theme.palette.error.main
                    : theme.palette.text.primary,
            })}
          >
            {fmtSigned(nb)}
          </Typography>
        );
      },
    },

    // اتجاه الرصيد حسب الطبيعة (up/down/flat) مع fallback للقديم
    {
      field: "balanceTrend",
      headerName: "اتجاه الرصيد",
      width: 170,
      printable: true,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const trend = params.row?.naturalTrend ?? params.row?.balanceTrend;
        const total = params.row?.naturalBalance ?? params.row?.balance ?? 0;

        return (
          <Tooltip
            title={`الاتجاه: ${trendBase[normalizeTrend(trend, total)]?.label || "مستقر"}`}
            arrow
            placement="top"
          >
            <span>
              <TrendChip trend={trend} totalBalance={total} />
            </span>
          </Tooltip>
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

  return (
    <>
      {/* أدوات التصفية بالأعلى */}
      <FilterPaperContainer handleFilter={applyFilters}>
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
  const netColor = (() => {
    const key = normalizeTrend?.(balanceTrend, totalBalance);
    if (key === "up") return "success";
    if (key === "down") return "error";
    return "primary";
  })();
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
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid size={{ md: 4 }}>
            <AccountingSummaryCard
              title="إجمالي المدين"
              value={formatCurrencyAED(totalDebits)}
              icon={FaWallet}
              color="info"
              subtitle="إجمالي الحركة المدينة خلال الفترة"
            />
          </Grid>

          <Grid size={{ md: 4 }}>
            <AccountingSummaryCard
              title="إجمالي الدائن"
              value={formatCurrencyAED(totalCredits)}
              icon={FaDollarSign}
              color="warning"
              subtitle="إجمالي الحركة الدائنة خلال الفترة"
            />
          </Grid>

          <Grid size={{ md: 4 }}>
            <AccountingSummaryCard
              title="الصافي"
              value={formatCurrencyAED(totalBalance)}
              icon={FaBalanceScale}
              color={netColor}
              subtitle={balanceTrend ? `الاتجاه: ${balanceTrend}` : undefined}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
