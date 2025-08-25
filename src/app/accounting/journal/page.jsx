"use client";

import TableFormProvider from "@/app/context/TableFormProvider/TableFormProvider";
import JournalEntryPanel from "@/components/accounting/JournalEntry";
import ViewComponent from "@/components/ViewComponent/ViewComponent";
import { useDataFetcher } from "@/helpers/hooks/useDataFetcher";
import {
  Box,
  TextField,
  Typography,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useState } from "react";
import dayjs from "dayjs";
import { ownerInputs } from "@/app/owners/ownerInputs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import FilterSelect from "@/components/utility/FilterSelect.jsx";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
dayjs.locale("ar");

export default function JournalPage({ searchParams }) {
  return (
    <TableFormProvider url={"fast-handler"}>
      <JournalWrapper />
    </TableFormProvider>
  );
}
function JournalWrapper() {
  const { data, loading, setFilters } = useDataFetcher(
    `main/accounting/journal`
  );
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
    const filters = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
    setFilters(filters);
  };

  const columns = [
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
      field: "lines",
      headerName: "سطور القيود",
      width: 250,
      printable: true,
      renderCell: (params) => {
        return <JournalEntryPanel lines={params.row.lines} />;
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
      <ViewComponent
        rows={data}
        columns={columns}
        loading={loading}
        noPagination={true}
        noCreate={true}
      ></ViewComponent>
    </>
  );
}
