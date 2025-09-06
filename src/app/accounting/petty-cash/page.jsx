"use client";

import TableFormProvider from "@/app/context/TableFormProvider/TableFormProvider";
import ViewComponent from "@/components/ViewComponent/ViewComponent";
import { useDataFetcher } from "@/helpers/hooks/useDataFetcher";
import {
  Box,
  TextField,
  Typography,
  Button,
  Paper,
  Grid,
  CardContent,
  alpha,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import TableJournalLine from "@/components/accounting/TableJournalLine";
import TableJournalEntry from "@/components/accounting/TableJournalEntry";
import DeleteModal from "@/components/ui/Modals/DeleteModal";
import PettyCashActions from "@/components/accounting/PettyCashActions";
import { useToastContext } from "@/app/context/ToastLoading/ToastLoadingProvider";
import { Card } from "antd";
import { FaCoins, FaMoneyCheckAlt, FaWallet } from "react-icons/fa";
import { handleRequestSubmit } from "@/helpers/functions/handleRequestSubmit";
import FilterPaperContainer from "@/components/utility/FilterPaperContainer";
import { formatCurrencyAED } from "@/helpers/functions/convertMoneyToArabic";
dayjs.locale("ar");

export default function PettyCashPage({ searchParams }) {
  return (
    <TableFormProvider url={"fast-handler"}>
      <PettyCashWrapper searchParams={searchParams} />
    </TableFormProvider>
  );
}
function SummaryCard({ title, value, icon: Icon, color, subtitle }) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: "100%",
        background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.1)} 0%, ${alpha(theme.palette[color].main, 0.05)} 100%)`,
        borderTop: `4px solid ${theme.palette[color].main}`,
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              color="text.secondary"
              gutterBottom
              variant="subtitle2"
              sx={{ fontWeight: 500 }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              component="div"
              sx={{
                fontWeight: 700,
                color: theme.palette[color].main,
                mb: 1,
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block" }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: alpha(theme.palette[color].main, 0.1),
              borderRadius: "12px",
              p: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={28} color={theme.palette[color].main} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
function PettyCashWrapper({ searchParams }) {
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
    otherData,
  } = useDataFetcher(`main/accounting/petty-cash`, null, searchParams);
  const theme = useTheme();

  const [startDate, setStartDate] = useState(dayjs().startOf("month"));
  const [endDate, setEndDate] = useState(dayjs().endOf("month"));
  const { setLoading } = useToastContext();
  const handleDateChange = (type, date) => {
    if (type === "start") {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
  };
  const handleFilter = async () => {
    const newFilters = {
      ...filters,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
    setFilters(newFilters);
  };

  const columns = [
    {
      field: "id",
      headerName: "معرف",
      width: 50,
      printable: false,
      cardWidth: 48,
    },
    {
      field: "entryDate",
      headerName: "تاريخ القيد",
      width: 100,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => {
        return (
          <Typography variant="body2" noWrap>
            {dayjs(params.row.entryDate).format("DD/MM/YYYY")}
          </Typography>
        );
      },
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
      field: "debitAmount",
      headerName: "الكمية",
      width: 100,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "settlement",
      headerName: "التسوية",
      width: 100,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => {
        return (
          <Typography>
            {params.row.debit.isSettled || params.row.credit.isSettled
              ? "مُسوّى"
              : "غير مُسوّى"}
          </Typography>
        );
      },
    },
    {
      field: "actions",
      headerName: "العمليات",
      width: 250,
      printable: true,
      renderCell: (params) => {
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TableJournalEntry entry={params.row} />
            {params.row.manull ? (
              <DeleteModal
                item={params.row}
                setData={setData}
                href={"main/accounting/journal"}
              />
            ) : (
              <Typography variant="caption" noWrap>
                لا يمكن حذف هذا العنصر
              </Typography>
            )}
          </Box>
        );
      },
    },
  ];
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
        value: formatCurrencyAED(otherData.totalAmount),
      },
      {
        label: "اجمالي المسدد",
        value: formatCurrencyAED(otherData.totalSettled),
      },
      {
        label: "اجمالي المتبقي",
        value: formatCurrencyAED(otherData.totalLeft),
      },
    ];
  }
  async function onSubmit(data) {
    const response = await handleRequestSubmit(
      data,
      setLoading,
      "/main/accounting/accounts",
      false,
      "جاري المعالجة"
    );
    if (response && response.status === 200) {
      setRender((old) => !old);
      return response;
    }
  }
  const settledPercentage =
    otherData?.totalAmount > 0
      ? ((otherData.totalSettled / otherData.totalAmount) * 100).toFixed(1)
      : 0;
  return (
    <>
      <Box sx={{ p: 1.5 }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              mb: 3,
              fontWeight: 700,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            صندوق النثرية
          </Typography>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <SummaryCard
                title="إجمالي المبلغ"
                value={formatCurrencyAED(otherData?.totalAmount || 0)}
                icon={FaWallet}
                color="primary"
                subtitle="الرصيد الكلي للصندوق"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <SummaryCard
                title="إجمالي المسدد"
                value={formatCurrencyAED(otherData?.totalSettled || 0)}
                icon={FaMoneyCheckAlt}
                color="success"
                subtitle={`${settledPercentage}% من الإجمالي`}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <SummaryCard
                title="إجمالي المتبقي"
                value={formatCurrencyAED(otherData?.totalLeft || 0)}
                icon={FaCoins}
                color="warning"
                subtitle="المبلغ المتاح للصرف"
              />
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mb: 3 }}>
          <PettyCashActions onSubmit={onSubmit} />
        </Box>

        <FilterPaperContainer handleFilter={handleFilter}>
          <DatePicker
            label="تاريخ البدء"
            value={startDate}
            onChange={(date) => handleDateChange("start", date)}
            renderInput={(params) => <TextField {...params} />}
            format="DD/MM/YYYY"
            sx={{ minWidth: 200 }}
          />
          <DatePicker
            label="تاريخ الانتهاء"
            value={endDate}
            onChange={(date) => handleDateChange("end", date)}
            renderInput={(params) => <TextField {...params} />}
            format="DD/MM/YYYY"
            sx={{ minWidth: 200 }}
          />
        </FilterPaperContainer>

        <ViewComponent
          rows={data}
          columns={columns}
          loading={loading}
          noCreate={true}
          page={page}
          setPage={setPage}
          limit={limit}
          setLimit={setLimit}
          setData={setData}
          setTotal={setTotal}
          total={total}
          footerRow={[]}
        />
      </Box>
    </>
  );
}
