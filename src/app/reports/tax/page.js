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
import {useReactToPrint} from "react-to-print";
import {DatePicker, LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/en-gb";
import ReportTable from "@/components/Tables/ReportTable";
import {formatCurrencyAED} from "@/helpers/functions/convertMoneyToArabic";

const columnsTaxPayments = [
    {arabic: "اسم العقار", english: "propertyName"},
    {arabic: "رقم الوحدة", english: "unitNumber"},
    {arabic: "ميعاد الدفع", english: "dueDate"},
    {arabic: " نسبة الضريبة", english: "rentAgreement.tax"},
    {arabic: " قيمة عقد الايجار", english: "rentAgreement.totalPrice"},
    {arabic: "المبلغ الإجمالي", english: "amount"},
    {arabic: "المبلغ المدفوع", english: "paidAmount"},
    {arabic: "المبلغ المتبقي", english: "remainingAmount"},
];

const TaxPaymentsReport = () => {
    const [owners, setOwners] = useState([]);
    const [selectedOwner, setSelectedOwner] = useState("");
    const [startDate, setStartDate] = useState(dayjs().startOf("month"));
    const [endDate, setEndDate] = useState(dayjs().endOf("month"));
    const [reportData, setReportData] = useState(null);
    const componentRef = useRef();
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const resOwners = await fetch("/api/fast-handler?id=ownerByProperty");
                const dataOwners = await resOwners.json();
                setOwners(dataOwners);
            } catch (error) {
                console.error("Failed to fetch owners", error);
            }
            setLoading(false);
        }

        fetchData();
    }, []);

    const handleGenerateReport = async () => {
        setSubmitLoading(true);
        const filters = {
            ownerId: selectedOwner,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        };

        try {
            const res = await fetch(
                  `/api/main/reports/tax?filters=${JSON.stringify(filters)}`,
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
        documentTitle: "تقرير الضريبة",
    });

    const renderTableRows = (data) => {
        let totalAmount = 0;
        let totalPaidAmount = 0;
        let totalRemaining = 0;
        let totalAmountOfRent = 0;
        return (
              <>
                  {data.map((payment, index) => {
                      totalAmount += payment.amount;
                      totalPaidAmount += payment.paidAmount;
                      totalRemaining += payment.amount - payment.paidAmount;
                      totalAmountOfRent += payment.rentAgreement.totalPrice;
                      return (
                            <TableRow key={index}>
                                <TableCell sx={{backgroundColor: "#ffffff", padding: "8px"}}>
                                    {payment.propertyName}
                                </TableCell>
                                <TableCell sx={{backgroundColor: "#ffffff", padding: "8px"}}>
                                    {payment.unitNumber}
                                </TableCell>
                                <TableCell sx={{backgroundColor: "#ffffff", padding: "8px"}}>
                                    {dayjs(payment.dueDate).format("DD/MM/YYYY")}
                                </TableCell>
                                <TableCell sx={{backgroundColor: "#ffffff", padding: "8px"}}>
                                    {payment.rentAgreement.tax + "%"}
                                </TableCell>
                                <TableCell sx={{backgroundColor: "#ffffff", padding: "8px"}}>
                                    {formatCurrencyAED(payment.rentAgreement.totalPrice)}
                                </TableCell>
                                <TableCell sx={{backgroundColor: "#ffffff", padding: "8px"}}>
                                    {formatCurrencyAED(payment.amount)}
                                </TableCell>
                                <TableCell sx={{backgroundColor: "#ffffff", padding: "8px"}}>
                                    {formatCurrencyAED(payment.paidAmount)}
                                </TableCell>
                                <TableCell sx={{backgroundColor: "#ffffff", padding: "8px"}}>
                                    {formatCurrencyAED(payment.amount - payment.paidAmount)}
                                </TableCell>
                            </TableRow>
                      );
                  })}
                  <TableRow>
                      <TableCell
                            colSpan={4}
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
                          {formatCurrencyAED(totalAmountOfRent)}
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
                          {formatCurrencyAED(totalRemaining)}
                      </TableCell>
                  </TableRow>
              </>
        );
    };
    const handleDownloadCSV = () => {
        if (!reportData) return;

        const csvRows = [];
        
        // Add headers for the CSV
        reportData.forEach(property => {
            // Add property owner details
            csvRows.push(['تفاصيل المالك']);
            csvRows.push(['اسم المالك', 'هوية المالك', 'ايميل المالك', 'رقمة هاتف المالك']);
            csvRows.push([
                property.client?.name || '',
                property.client?.nationalId || '',
                property.client?.email || '',
                property.client?.phone || ''
            ]);
            csvRows.push([]); // Empty row for spacing

            // Add property details
            csvRows.push(['تفاصيل العقار']);
            csvRows.push(columnsPropertyDetails.map(col => col.arabic));
            csvRows.push(columnsPropertyDetails.map(col => {
                const value = col.english.split('.').reduce((acc, part) => acc && acc[part], property);
                return col.english.includes('price') ? formatCurrencyAED(value) : value || '';
            }));
            csvRows.push([]); // Empty row for spacing

            // Add units details
            csvRows.push(['الوحدات']);
            csvRows.push(columnsUnits.map(col => col.arabic));
            property.units.forEach(unit => {
                csvRows.push(columnsUnits.map(col => {
                    let value = col.english.split('.').reduce((acc, part) => acc && acc[part], unit);
                    if (col.english.includes('price') || col.english.includes('amount')) {
                        value = formatCurrencyAED(value);
                    } else if (col.english === 'invoice.invoiceType') {
                        value = translateInvoiceType(value);
                    } else if (col.english === 'invoice.rentAgreement.status') {
                        value = translateRentType(value);
                    }
                    return value || '';
                }));
            });
            csvRows.push([]); // Empty row between properties
        });

        // Convert to CSV string
        const csvContent = csvRows.map(row => row.join(',')).join('\n');
        
        // Create blob and download
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `تقرير_${dayjs().format('YYYY-MM-DD')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    if (loading) return <CircularProgress/>;
    return (
          <Container sx={{p: {xs: 0, md: 1}}}>
              <Box sx={{my: 4}}>
                  <Typography variant="h4" gutterBottom>
                      إنشاء تقرير الضريبة
                  </Typography>
                  <FormControl fullWidth margin="normal">
                      <InputLabel>المالك</InputLabel>
                      <Select
                            value={selectedOwner}
                            onChange={(e) => setSelectedOwner(e.target.value)}
                      >
                          {owners?.map((owner) => (
                                <MenuItem key={owner.id} value={owner.id}>
                                    {owner.name}
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

                  {reportData && (
                        <Box
                              sx={{mt: 4, p: 2, border: "1px solid #ddd"}}
                              ref={componentRef}
                        >
                            <Typography variant="h6" gutterBottom>
                                تقرير الضريبة من المدة {startDate.format("DD/MM/YYYY")} إلى{" "}
                                {endDate.format("DD/MM/YYYY")}
                            </Typography>
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
                                        <strong>اسم المالك:</strong>{" "}
                                        {owners?.find((owner) => owner.id === selectedOwner)?.name}
                                    </div>
                                    <div>
                                        <strong> هوية المالك:</strong>{" "}
                                        {
                                            owners?.find((owner) => owner.id === selectedOwner)
                                                  ?.nationalId
                                        }
                                    </div>
                                    <div>
                                        <strong> ايميل المالك:</strong>{" "}
                                        {owners?.find((owner) => owner.id === selectedOwner)?.email}
                                    </div>
                                    <div>
                                        <strong> رقمة هاتف المالك:</strong>{" "}
                                        {owners?.find((owner) => owner.id === selectedOwner)?.phone}
                                    </div>
                                </Typography>
                            </Box>

                            <ReportTable
                                  headings={columnsTaxPayments.map((col) => col)}
                                  title="تفاصيل الضريبة"
                            >
                                {renderTableRows(reportData)}
                            </ReportTable>
                        </Box>
                  )}

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
              </Box>
          </Container>
    );
};

export default TaxPaymentsReport;
