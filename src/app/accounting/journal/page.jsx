"use client";

import TableFormProvider from "@/app/context/TableFormProvider/TableFormProvider";
import ViewComponent from "@/components/ViewComponent/ViewComponent";
import { useDataFetcher } from "@/helpers/hooks/useDataFetcher";
import { Box, TextField, Typography, Button } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useState } from "react";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import FilterSelect from "@/components/utility/FilterSelect.jsx";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import TableJournalLine from "@/components/accounting/TableJournalLine";
import TableJournalEntry from "@/components/accounting/TableJournalEntry";
import CreateAJournalEntry from "@/components/accounting/CreateAJournalEntry";
import DeleteModal from "@/components/ui/Modals/DeleteModal";
dayjs.locale("ar");

export default function JournalPage({ searchParams }) {
  return (
    <TableFormProvider url={"fast-handler"}>
      <JournalWrapper searchParams={searchParams} />
    </TableFormProvider>
  );
}
function JournalWrapper({ searchParams }) {
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
  } = useDataFetcher(`main/accounting/journal`, null, searchParams);
  const [startDate, setStartDate] = useState(dayjs().startOf("month"));
  const [endDate, setEndDate] = useState(dayjs().endOf("month"));

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

  return (
    <>
      <Box sx={{ display: "flex", gap: 2, mb: 4, pr: 8, alignItems: "center" }}>
        <FilterSelect
          label="الحسابات العامة"
          param={"glAccount"}
          setFilters={setFilters}
          apiPoint={"/api/fast-handler?id=glAccounts"}
        />

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
        <Button variant="contained" onClick={handleFilter}>
          تطبيق الفلاتر
        </Button>
      </Box>
      <Box>
        <CreateAJournalEntry onSuccess={() => setRender((old) => !old)} />
      </Box>
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
      ></ViewComponent>
    </>
  );
}
