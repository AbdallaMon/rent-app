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

const columnsMeters = [
  { arabic: "معرف العقار", english: "property.propertyId" },
  { arabic: "اسم العداد", english: "name" },
  { arabic: "رقم العداد", english: "meterId" },
];

const columnsUnits = [
  { arabic: "معرف العقار", english: "property.propertyId" },
  { arabic: "معرف الوحدة", english: "unitId" },
  { arabic: "رقم الوحدة", english: "number" },
  { arabic: "رقم عداد الكهرباء", english: "electricityMeter" },
];

const ElectricMeterReport = () => {
  const [properties, setProperties] = useState([]);
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [startDate, setStartDate] = useState(dayjs().startOf("month"));
  const [endDate, setEndDate] = useState(dayjs().endOf("month"));
  const [reportData, setReportData] = useState(null);
  const componentRef = useRef();
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  console.log(reportData, "reportData");
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
        `/api/main/reports/electricmeters?filters=${JSON.stringify(filters)}`
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
    documentTitle: "تقرير عدادات الكهرباء",
  });

  const renderTableRows = (data, columns, colSpan) => (
    <>
      {data.map((row, index) => (
        <TableRow key={index}>
          {columns.map((col, colIndex) => {
            let cellValue = col.english
              .split(".")
              .reduce((acc, part) => acc && acc[part], row);

            if (col.english.includes("date") || col.english.includes("Date")) {
              cellValue = dayjs(cellValue).format("DD/MM/YYYY");
            } else if (
              col.english.includes("price") ||
              col.english.includes("amount") ||
              col.english.includes("totalPrice") ||
              col.english.includes("paidAmount") ||
              col.english.includes("yearlyRentPrice")
            ) {
              cellValue = formatCurrencyAED(cellValue);
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
      ))}
    </>
  );
  const handleDownloadCSV = () => {
    if (!reportData) return;

    const csvRows = [];

    // Add headers and data for each property
    reportData.forEach((property) => {
      // Add property owner details
      csvRows.push(["تفاصيل المالك"]);
      csvRows.push([
        "اسم المالك",
        "هوية المالك",
        "ايميل المالك",
        "رقم هاتف المالك",
      ]);
      csvRows.push([
        property.client?.name || "",
        property.client?.nationalId || "",
        property.client?.email || "",
        property.client?.phone || "",
      ]);
      csvRows.push([]); // Empty row for spacing

      // Add property name
      csvRows.push([`العقار: ${property.name}`]);
      csvRows.push([]); // Empty row for spacing

      // Add electricity meters
      if (property.electricityMeters && property.electricityMeters.length > 0) {
        csvRows.push(["عدادات الكهرباء"]);
        csvRows.push(columnsMeters.map((col) => col.arabic));

        property.electricityMeters.forEach((meter) => {
          const row = columnsMeters.map((col) => {
            let value = col.english
              .split(".")
              .reduce((acc, part) => acc && acc[part], meter);
            return value || "";
          });
          csvRows.push(row);
        });
      } else {
        csvRows.push(["لا توجد عدادات كهرباء لهذا العقار"]);
      }

      csvRows.push([]); // Empty row for spacing

      // Add units
      if (property.units && property.units.length > 0) {
        csvRows.push(["الوحدات"]);
        csvRows.push(columnsUnits.map((col) => col.arabic));

        property.units.forEach((unit) => {
          const row = columnsUnits.map((col) => {
            let value = col.english
              .split(".")
              .reduce((acc, part) => acc && acc[part], unit);
            return value || "";
          });
          csvRows.push(row);
        });
      } else {
        csvRows.push(["لا توجد وحدات لهذا العقار"]);
      }

      csvRows.push([]); // Empty row between properties
      csvRows.push([]); // Additional spacing between properties
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
    link.setAttribute(
      "download",
      `تقرير_عدادات_الكهرباء_${dayjs().format("YYYY-MM-DD")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  if (loading) return <CircularProgress />;
  return (
    <Container
      sx={{
        p: {
          xs: 0,
          md: 1,
        },
      }}
    >
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
          إنشاء تقرير عدادات الكهرباء
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
            {reportData.map((property) => {
              return (
                <div key={property.id}>
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
                        <strong>هوية المالك:</strong>{" "}
                        {property.client?.nationalId}
                      </div>
                      <div>
                        <strong>ايميل المالك:</strong> {property.client?.email}
                      </div>
                      <div>
                        <strong>رقم هاتف المالك:</strong>{" "}
                        {property.client?.phone}
                      </div>
                    </Typography>
                  </Box>

                  <Typography variant="h6" gutterBottom>
                    {property.name}
                  </Typography>

                  <ReportTable headings={columnsMeters} title="عدادات الكهرباء">
                    {renderTableRows(property.electricityMeters, columnsMeters)}
                  </ReportTable>

                  <ReportTable headings={columnsUnits} title="الوحدات">
                    {renderTableRows(property.units, columnsUnits)}
                  </ReportTable>
                </div>
              );
            })}
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

export default ElectricMeterReport;
