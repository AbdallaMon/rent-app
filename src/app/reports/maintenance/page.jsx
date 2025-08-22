"use client";
import React, {useEffect, useRef, useState} from "react";
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
import {DatePicker, LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import {useReactToPrint} from "react-to-print";
import "dayjs/locale/en-gb";
import ReportTable from "@/components/Tables/ReportTable";
import {formatCurrencyAED} from "@/helpers/functions/convertMoneyToArabic";

const columnsMaintenance = [
    {arabic: "صيانة", english: "description"},
    {arabic: "رقم الوحدة", english: "unitNumber"},
    {arabic: "تاريخ تسجيل الصيانة", english: "date"},
    {arabic: "الحالة", english: "status"},
    {arabic: "المبلغ", english: "amount"},
    {arabic: "المبلغ المدفوع", english: "paidAmount"},
    {arabic: "ميعاد الدفع", english: "dueDate"},
];

const translateStatus = (status, amount, paidAmount) => {
    if (paidAmount === amount) return "مدفوع بالكامل";
    if (paidAmount > 0) return "مدفوع جزئياً";
    return "قيد الانتظار";
};

const MaintenanceReports = () => {
    const [properties, setProperties] = useState([]);
    const [selectedProperties, setSelectedProperties] = useState([]);
    const [startDate, setStartDate] = useState(dayjs());
    const [endDate, setEndDate] = useState(dayjs());
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
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        };

        try {
            const res = await fetch(
                  `/api/main/reports/maintenance?filters=${JSON.stringify(filters)}`,
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
        content: () => componentRef.current,
        documentTitle: "تقرير الصيانة",
    });

    const renderTableRows = (data, columns, colSpan) => {
        let totalAmount = 0;
        let totalPaidAmount = 0;

        return (
              <>
                  {data.map((row, index) => (
                        <TableRow key={index}>
                            {columns.map((col, colIndex) => {
                                let cellValue = col.english
                                      .split(".")
                                      .reduce((acc, part) => acc && acc[part], row);

                                if (
                                      col.english.includes("date") ||
                                      col.english.includes("Date")
                                ) {
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

                                if (col.english === "status") {
                                    cellValue = translateStatus(
                                          row.status,
                                          row.amount,
                                          row.paidAmount,
                                    );
                                }

                                if (col.english.includes("amount")) {
                                    totalAmount += row.amount;
                                }

                                if (col.english.includes("paidAmount")) {
                                    totalPaidAmount += row.paidAmount;
                                }

                                return (
                                      <TableCell
                                            key={colIndex}
                                            sx={{backgroundColor: "#ffffff", padding: "8px"}}
                                      >
                                          {cellValue}
                                      </TableCell>
                                );
                            })}
                        </TableRow>
                  ))}
                  {columns.some((col) => col.english.includes("amount")) && (
                        <TableRow>
                            <TableCell
                                  colSpan={colSpan ? colSpan : columns.length - 2}
                                  sx={{
                                      backgroundColor: "#f0f0f0",
                                      padding: "8px",
                                      fontWeight: "bold",
                                  }}
                            >
                                الإجمالي
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
                            <TableCell
                                  sx={{
                                      backgroundColor: "#ffffff",
                                      padding: "8px",
                                      fontWeight: "bold",
                                  }}
                            >
                                {formatCurrencyAED(totalPaidAmount)}
                            </TableCell>
                            <TableCell
                                  sx={{
                                      backgroundColor: "#ffffff",
                                      padding: "8px",
                                      fontWeight: "bold",
                                  }}
                            >
                                {formatCurrencyAED(totalAmount - totalPaidAmount)}
                            </TableCell>
                        </TableRow>
                  )}
              </>
        );
    };
    const handleDownloadCSV = () => {
        if (!reportData) return;
    
        const csvRows = [];
        
        // Add headers for the CSV
        const headers = columnsMaintenance.map(col => col.arabic).join(",");
        csvRows.push(headers);
    
        // Add maintenance data
        reportData.forEach(property => {
            property.maintenances.forEach(maintenance => {
                maintenance.payments.forEach(payment => {
                    const row = columnsMaintenance.map(col => {
                        let value = col.english.split(".").reduce((acc, part) => acc && acc[part], {
                            ...maintenance,
                            ...payment,
                            unitNumber: maintenance.unit?.number,
                        });
    
                        if (col.english.includes("date") || col.english.includes("Date")) {
                            value = dayjs(value).format("DD/MM/YYYY");
                        } else if (col.english === "status") {
                            value = translateStatus(payment.status, payment.amount, payment.paidAmount);
                        } else if (
                            col.english.includes("price") ||
                            col.english.includes("amount") ||
                            col.english.includes("totalPrice") ||
                            col.english.includes("paidAmount") ||
                            col.english.includes("yearlyRentPrice")
                        ) {
                            value = formatCurrencyAED(value);
                        }
    
                        return `"${value}"`;
                    });
    
                    csvRows.push(row.join(","));
                });
            });
        });
    
        // Convert to CSV string
        const csvContent = csvRows.join("\n");
        
        // Create blob and download
        const blob = new Blob(['\ufeff' + csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `تقرير_الصيانة_${dayjs().format("YYYY-MM-DD")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    if (loading) return <CircularProgress/>;
    return (
          <Container sx={{p: {xs: 0, md: 1}}}>
              <Box sx={{my: 4}}>
                  <Typography variant="h4" gutterBottom>
                      إنشاء تقارير الصيانة
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
                      {submitLoading ? <CircularProgress size={24}/> : "إنشاء التقرير"}
                  </Button>
              </Box>

              <Box ref={componentRef}>
                  {reportData && (
                        <Box sx={{mt: 4, p: 2, border: "1px solid #ddd"}}>
                            {reportData.map((property) => {
                                const totalAmount = property.maintenances.reduce(
                                      (acc, maintenance) =>
                                            acc +
                                            maintenance.payments.reduce(
                                                  (sum, payment) => sum + payment.amount,
                                                  0,
                                            ),
                                      0,
                                );
                                const totalPaid = property.maintenances.reduce(
                                      (acc, maintenance) =>
                                            acc +
                                            maintenance.payments.reduce(
                                                  (sum, payment) => sum + payment.paidAmount,
                                                  0,
                                            ),
                                      0,
                                );

                                return (
                                      <Box key={property.id} sx={{mb: 4}}>
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
                                                              unitNumber: maintenance.unit?.number,
                                                          })),
                                                    ),
                                                    columnsMaintenance,
                                                    4,
                                              )}
                                          </ReportTable>
                                          <Typography variant="h6" sx={{mt: 2}}>
                                              الإجمالي: {formatCurrencyAED(totalAmount)}
                                          </Typography>
                                          <Typography variant="h6" sx={{mt: 2}}>
                                              المدفوع: {formatCurrencyAED(totalPaid)}
                                          </Typography>
                                          <Typography variant="h6" sx={{mt: 2}}>
                                              المتبقي: {formatCurrencyAED(totalAmount - totalPaid)}
                                          </Typography>
                                      </Box>
                                );
                            })}
                        </Box>
                  )}
              </Box>

              {reportData && (
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    <Button variant="contained" color="secondary" onClick={handlePrint}>
                        طباعة التقرير
                    </Button>
                    <Button variant="contained" color="primary" onClick={handleDownloadCSV}>
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
          </Container>
    );
};

export default MaintenanceReports;
