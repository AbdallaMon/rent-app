// pages/Reports.js
"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TableCell,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useReactToPrint } from "react-to-print";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/en-gb";
import ReportTable from "@/components/Tables/ReportTable";
import { formatCurrencyAED } from "@/helpers/functions/convertMoneyToArabic";
import { translateInvoiceType, translateRentType } from "@/config/Enums";

const columnsPropertyDetails = [
  { arabic: "معرف العقار", english: "propertyId" },
  { arabic: "الاسم", english: "name" },
  { arabic: "المساحة المبنية", english: "builtArea" },
  { arabic: "السعر", english: "price" },
  { arabic: "عدد المصاعد", english: "numElevators" },
  { arabic: "عدد مواقف السيارات", english: "numParkingSpaces" },
];

const columnsUnits = [
  { arabic: "رقم الوحدة", english: "number" },
  { arabic: "رقم عقد الايجار", english: "activeAgreement.rentAgreementNumber" },
  { arabic: "الحالة", english: "status" },
  { arabic: "اسم المستاجر", english: "activeAgreement.renter" },
  { arabic: "الطابق", english: "floor" },
  { arabic: "عدد غرف النوم", english: "numBedrooms" },
  { arabic: "أجهزة التكييف", english: "numACs" },
  { arabic: "غرف المعيشة", english: "numLivingRooms" },
  { arabic: "الإيجار التقريبي", english: "yearlyRentPrice" },
  { arabic: "الايجار الفعلي", english: "actualRentPrice" },
];

const columnsRentAgreements = [
  { arabic: "رقم الوحدة", english: "unit" },
  { arabic: "رقم عقد الإيجار", english: "rentAgreementNumber" },
  { arabic: "تاريخ البدء", english: "startDate" },
  { arabic: "تاريخ الانتهاء", english: "endDate" },
  { arabic: "الحالة", english: "status" },
  { arabic: "إجمالي السعر", english: "totalPrice" },
];

const columnsMaintenance = [
  { arabic: "صيانة", english: "description" },
  { arabic: "رقم الوحدة", english: "unitNumber" },
  { arabic: "تاريخ تسجيل الصيانة", english: "date" },
  { arabic: "الحالة", english: "status" },
  { arabic: "ميعاد الدفع", english: "dueDate" },
  { arabic: "المبلغ", english: "amount" },
  { arabic: "المبلغ المدفوع", english: "paidAmount" },
];

const columnsIncome = [
  { arabic: "اسم العقار", english: "invoice.property.name" },
  { arabic: "رقم الوحدة", english: "invoice.rentAgreement.unit.number" },
  {
    arabic: "رقم عقد الإيجار",
    english: "invoice.rentAgreement.rentAgreementNumber",
  },
  { arabic: "تاريخ", english: "createdAt" },
  { arabic: "حالة عقد الايجار", english: "invoice.rentAgreement.status" },
  { arabic: "نوع الفاتورة", english: "invoice.invoiceType" },
  { arabic: "المبلغ", english: "amount" },
];

const columnsExpenses = [
  { arabic: "اسم العقار", english: "invoice.property.name" },
  { arabic: "تاريخ", english: "createdAt" },
  { arabic: "نوع الفاتورة", english: "invoice.invoiceType" },
  { arabic: "المبلغ", english: "amount" },
];

const Reports = () => {
  const componentRef = useRef();
  const [properties, setProperties] = useState([]);
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs());
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const resProperties = await fetch("/api/fast-handler?id=properties");
        const dataProperties = await resProperties.json();
        setProperties(dataProperties);
      } catch (error) {
        console.error("Failed to fetch data", error);
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  const handleGenerateReport = async () => {
    setSubmitLoading(true);
    const filters = {
      propertyIds: selectedProperties,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    try {
      const res = await fetch(
        `/api/main/reports?filters=${JSON.stringify(filters)}`
      );
      const data = await res.json();
      setReportData(data.data);
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Failed to generate report", error);
    }
    setSubmitLoading(false);
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "report",
  });

  const renderTableRows = (data, columns, colSpan) => {
    let totalAmount = 0;
    let totalPaidAmount = 0;

    return (
      <>
        {data.map((row, index) => {
          return (
            <TableRow key={index}>
              {columns.map((col, colIndex) => {
                let cellValue = col.english
                  .split(".")
                  .reduce((acc, part) => acc && acc[part], row);

                if (
                  col.english.includes("date") ||
                  col.english.includes("Date") ||
                  col.english.includes("createdAt")
                ) {
                  cellValue = dayjs(cellValue).format("DD/MM/YYYY");
                } else if (
                  col.english.includes("price") ||
                  col.english.includes("amount") ||
                  col.english.includes("totalPrice") ||
                  col.english.includes("paidAmount") ||
                  col.english.includes("yearlyRentPrice") ||
                  col.english.includes("actualRentPrice")
                ) {
                  cellValue = formatCurrencyAED(cellValue);
                }

                if (col.english === "invoice.invoiceType") {
                  cellValue = translateInvoiceType(cellValue);
                }

                if (col.english.includes("amount")) {
                  totalAmount += isNaN(row.amount) ? 0 : +row.amount;
                }
                if (col.english === "yearlyRentPrice") {
                  totalAmount += isNaN(row.yearlyRentPrice)
                    ? 0
                    : +row.yearlyRentPrice;
                }
                if (col.english.includes("totalPrice")) {
                  totalAmount += isNaN(row.totalPrice) ? 0 : +row.totalPrice;
                }
                if (col.english === "actualRentPrice") {
                  totalPaidAmount += isNaN(row.actualRentPrice)
                    ? 0
                    : +row.actualRentPrice;
                }
                if (
                  col.english.includes("totalPrice") &&
                  row.invoice?.rentAgreement?.status === "ACTIVE"
                ) {
                  totalPaidAmount += isNaN(row.totalPrice)
                    ? 0
                    : +row.totalPrice;
                }

                if (col.english.includes("paidAmount")) {
                  totalPaidAmount += row.paidAmount;
                }
                if (col.english === "invoice.rentAgreement.status") {
                  cellValue = translateRentType(cellValue);
                }
                return (
                  <TableCell
                    key={colIndex}
                    sx={{ backgroundColor: "#ffffff", padding: "8px" }}
                  >
                    {cellValue}
                  </TableCell>
                );
              })}
            </TableRow>
          );
        })}
        {columns.some(
          (col) =>
            col.english.includes("amount") ||
            col.english.includes("totalPrice") ||
            col.english === "actualRentPrice" ||
            col.english === "yearlyRentPrice"
        ) && (
          <TableRow>
            <TableCell
              colSpan={colSpan ? colSpan : columns.length - 2}
              sx={{
                backgroundColor: "#f0f0f0",
                padding: "8px",
                fontWeight: "bold",
              }}
            >
              الاجمالي
            </TableCell>
            <TableCell
              sx={{
                backgroundColor: "#ffffff",
                padding: "8px",
                fontWeight: "bold",
              }}
            >
              {formatCurrencyAED(totalAmount)}
            </TableCell>
            {totalPaidAmount > 0 && (
              <TableCell
                sx={{
                  backgroundColor: "#ffffff",
                  padding: "8px",
                  fontWeight: "bold",
                }}
              >
                {formatCurrencyAED(totalPaidAmount)}
              </TableCell>
            )}
          </TableRow>
        )}
      </>
    );
  };
  const handleDownloadCSV = () => {
    if (!reportData) return;

    const csvRows = [];

    // Helper function to add a section to the CSV
    const addSectionToCSV = (data, columns, sectionTitle) => {
      if (data.length === 0) return;

      // Add section title
      csvRows.push([sectionTitle]);
      csvRows.push(columns.map((col) => col.arabic));

      // Add rows
      data.forEach((row) => {
        const rowData = columns.map((col) => {
          let value = col.english
            .split(".")
            .reduce((acc, part) => acc && acc[part], row);

          if (
            col.english.includes("date") ||
            col.english.includes("Date") ||
            col.english.includes("createdAt")
          ) {
            value = dayjs(value).format("DD/MM/YYYY");
          } else if (
            col.english.includes("price") ||
            col.english.includes("amount") ||
            col.english.includes("totalPrice") ||
            col.english.includes("paidAmount") ||
            col.english.includes("yearlyRentPrice") ||
            col.english.includes("actualRentPrice")
          ) {
            value = formatCurrencyAED(value);
          }

          if (col.english === "invoice.invoiceType") {
            value = translateInvoiceType(value);
          }

          if (col.english === "invoice.rentAgreement.status") {
            value = translateRentType(value);
          }

          return `"${value}"`;
        });

        csvRows.push(rowData);
      });

      // Add an empty row for spacing
      csvRows.push([]);
    };

    // Iterate through each property and add its data to the CSV
    reportData.forEach((property) => {
      // Add property details
      addSectionToCSV([property], columnsPropertyDetails, "تفاصيل العقار");

      // Add units
      addSectionToCSV(property.units, columnsUnits, "الوحدات");

      // Add rent agreements
      const rentAgreements = property.units.flatMap(
        (unit) => unit.rentAgreements
      );
      addSectionToCSV(rentAgreements, columnsRentAgreements, "عقود الإيجار");

      // Add maintenance
      const maintenancePayments = property.maintenances.flatMap((maintenance) =>
        maintenance.payments.map((payment) => ({
          ...maintenance,
          ...payment,
          unitNumber: maintenance.unit?.number,
        }))
      );
      addSectionToCSV(maintenancePayments, columnsMaintenance, "صيانة");

      // Add income
      addSectionToCSV(property.income, columnsIncome, "الدخل");

      // Add expenses
      addSectionToCSV(property.expenses, columnsExpenses, "المصروفات المدفوعة");
    });

    // Convert the CSV rows to a string
    const csvContent = csvRows.map((row) => row.join(",")).join("\n");

    // Create a Blob and trigger the download
    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `تقرير_العقار_${dayjs().format("YYYY-MM-DD")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  if (loading) return <CircularProgress />;
  return (
    <Container sx={{ p: { xs: 0, md: 1 } }}>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
          إنشاء التقارير
        </Typography>
        <FormControl fullWidth margin="normal">
          <InputLabel>العقارات</InputLabel>
          <Select
            multiple
            value={selectedProperties}
            onChange={(e) => setSelectedProperties(e.target.value)}
          >
            {properties.map((property) => (
              <MenuItem key={property.id} value={property.id}>
                {property.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
          <FormControl fullWidth margin="normal">
            <DatePicker
              label="تاريخ البدء"
              value={startDate}
              onChange={(date) => setStartDate(date)}
              renderInput={(params) => <TextField {...params} />}
            />
          </FormControl>
          <FormControl fullWidth margin="normal">
            <DatePicker
              label="تاريخ الانتهاء"
              value={endDate}
              onChange={(date) => setEndDate(date)}
              renderInput={(params) => <TextField {...params} />}
            />
          </FormControl>
        </LocalizationProvider>

        <Button
          variant="contained"
          color="primary"
          onClick={handleGenerateReport}
          disabled={submitLoading}
        >
          {submitLoading ? <CircularProgress size={24} /> : "إنشاء التقرير"}
        </Button>

        <div ref={componentRef}>
          {reportData && (
            <Box sx={{ mt: 4, p: 2, border: "1px solid #ddd" }}>
              {reportData.map((property) => (
                <Box key={property.id} sx={{ mb: 4 }}>
                  <Box sx={{ my: 2 }}>
                    <Typography variant="h6">
                      تقرير من المدة {startDate.format("DD/MM/YYYY")} إلى{" "}
                      {endDate.format("DD/MM/YYYY")}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      mb: 4,
                      p: 2,
                      backgroundColor: "#f5f5f5",
                      borderRadius: "8px",
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      تفاصيل المالك
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "10px",
                      }}
                    >
                      <div>
                        <strong>اسم المالك:</strong> {property.client?.name}
                      </div>
                      <div>
                        <strong> هوية المالك:</strong>{" "}
                        {property.client?.nationalId}
                      </div>
                      <div>
                        <strong> ايميل المالك:</strong> {property.client?.email}
                      </div>
                      <div>
                        <strong> رقمة هاتف المالك:</strong>{" "}
                        {property.client?.phone}
                      </div>
                    </Typography>
                  </Box>

                  <Typography variant="h6">{property.name}</Typography>
                  <ReportTable
                    headings={columnsPropertyDetails}
                    title="تفاصيل العقار"
                  >
                    {renderTableRows([property], columnsPropertyDetails)}
                  </ReportTable>
                  <ReportTable headings={columnsUnits} title="الوحدات">
                    {renderTableRows(property.units, columnsUnits)}
                  </ReportTable>

                  <ReportTable
                    headings={columnsRentAgreements}
                    title="عقود الإيجار"
                  >
                    {renderTableRows(
                      property.units.flatMap((unit) => unit.rentAgreements),
                      columnsRentAgreements,
                      5
                    )}
                  </ReportTable>

                  <ReportTable headings={columnsMaintenance} title="صيانة">
                    {renderTableRows(
                      property.maintenances.flatMap((maintenance) =>
                        maintenance.payments.map((payment) => ({
                          description: maintenance.description,
                          date: maintenance.date,
                          amount: payment.amount,
                          paidAmount: payment.paidAmount,
                          dueDate: payment.dueDate,
                          status: payment.status,
                          unitNumber: maintenance?.unit?.number,
                        }))
                      ),
                      columnsMaintenance,
                      5
                    )}
                  </ReportTable>

                  <ReportTable headings={columnsIncome} title="الدخل">
                    {renderTableRows(property.income, columnsIncome, 6)}
                  </ReportTable>

                  <ReportTable
                    headings={columnsExpenses}
                    title=" المصروفات المدفوعه"
                  >
                    {renderTableRows(property.expenses, columnsExpenses, 3)}
                  </ReportTable>
                </Box>
              ))}
            </Box>
          )}
        </div>

        {reportData && (
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button variant="contained" color="secondary" onClick={handlePrint}>
              طباعة التقرير
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleDownloadCSV}
            >
              تحميل CSV
            </Button>
          </Stack>
        )}

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity="success">
            تم إنشاء التقرير بنجاح!
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default Reports;
