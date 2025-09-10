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
import { FaCoins, FaMoneyCheckAlt, FaWallet } from "react-icons/fa";
import { handleRequestSubmit } from "@/helpers/functions/handleRequestSubmit";
import FilterPaperContainer from "@/components/utility/FilterPaperContainer";
import { formatCurrencyAED } from "@/helpers/functions/convertMoneyToArabic";
import { AccountingSummaryCard } from "@/components/accounting/AccountingSummaryCard";
dayjs.locale("ar");

export default function PettyCashPage({ searchParams }) {
  return (
    <TableFormProvider url={"fast-handler"}>
      <PettyCashWrapper searchParams={searchParams} />
    </TableFormProvider>
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
      field: "signedChange",
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
            {params.row.debit?.isSettled || params.row.credit?.isSettled
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
              <AccountingSummaryCard
                title="إجمالي المبلغ"
                value={formatCurrencyAED(otherData?.totalAmount || 0)}
                icon={FaWallet}
                color="primary"
                subtitle="الرصيد الكلي للصندوق"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <AccountingSummaryCard
                title="إجمالي المصروف"
                value={formatCurrencyAED(otherData?.totalSettled || 0)}
                icon={FaMoneyCheckAlt}
                color="success"
                subtitle={`${settledPercentage}% من الإجمالي`}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <AccountingSummaryCard
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
