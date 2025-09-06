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
  Typography,
} from "@mui/material";
import { useReactToPrint } from "react-to-print";
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

const Reports = () => {
  const [properties, setProperties] = useState([]);
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [reportData, setReportData] = useState(null);
  const componentRef = useRef();
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
    };

    try {
      const res = await fetch(
        `/api/main/reports/units?filters=${JSON.stringify(filters)}`
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
    documentTitle: "تقرير الوحدات",
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

    // Add headers for the CSV
    reportData.forEach((property) => {
      // Add property owner details
      csvRows.push(["تفاصيل المالك"]);
      csvRows.push([
        "اسم المالك",
        "هوية المالك",
        "ايميل المالك",
        "رقمة هاتف المالك",
      ]);
      csvRows.push([
        property.client?.name || "",
        property.client?.nationalId || "",
        property.client?.email || "",
        property.client?.phone || "",
      ]);
      csvRows.push([]); // Empty row for spacing

      // Add property details
      csvRows.push(["تفاصيل العقار"]);
      csvRows.push(columnsPropertyDetails.map((col) => col.arabic));
      csvRows.push(
        columnsPropertyDetails.map((col) => {
          const value = col.english
            .split(".")
            .reduce((acc, part) => acc && acc[part], property);
          return col.english.includes("price")
            ? formatCurrencyAED(value)
            : value || "";
        })
      );
      csvRows.push([]); // Empty row for spacing

      // Add units details
      csvRows.push(["الوحدات"]);
      csvRows.push(columnsUnits.map((col) => col.arabic));
      property.units.forEach((unit) => {
        csvRows.push(
          columnsUnits.map((col) => {
            let value = col.english
              .split(".")
              .reduce((acc, part) => acc && acc[part], unit);
            if (
              col.english.includes("price") ||
              col.english.includes("amount")
            ) {
              value = formatCurrencyAED(value);
            } else if (col.english === "invoice.invoiceType") {
              value = translateInvoiceType(value);
            } else if (col.english === "invoice.rentAgreement.status") {
              value = translateRentType(value);
            }
            return value || "";
          })
        );
      });
      csvRows.push([]); // Empty row between properties
    });

    // Convert to CSV string
    const csvContent = csvRows.map((row) => row.join(",")).join("\n");

    // Create blob and download
    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_${dayjs().format("YYYY-MM-DD")}.csv`);
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

        <Button
          variant="contained"
          color="primary"
          onClick={handleGenerateReport}
          disabled={submitLoading}
        >
          {submitLoading ? <CircularProgress size={24} /> : "إنشاء التقرير"}
        </Button>

        {reportData && (
          <Box
            sx={{ mt: 4, p: 2, border: "1px solid #ddd" }}
            ref={componentRef}
          >
            {reportData.map((property) => (
              <Box key={property.id} sx={{ mb: 4 }}>
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
              </Box>
            ))}
          </Box>
        )}

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
