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
import {translateInvoiceType, translateRentType} from "@/config/Enums";

const columnsPropertyDetails = [
    {arabic: " معرف العقار", english: "propertyId"},
    {arabic: "الاسم", english: "name"},
    {arabic: "المساحة المبنية", english: "builtArea"},
    {arabic: "السعر", english: "price"},
    {arabic: "عدد المصاعد", english: "numElevators"},
    {arabic: "عدد مواقف السيارات", english: "numParkingSpaces"},
];

const columnsUnits = [
    {arabic: "رقم الوحدة", english: "number"},
    {arabic: "الطابق", english: "floor"},
    {arabic: "عدد غرف النوم", english: "numBedrooms"},
    {arabic: "عدد الحمامات", english: "numBathrooms"},
    {arabic: "عدد أجهزة التكييف", english: "numACs"},
    {arabic: "عدد غرف المعيشة", english: "numLivingRooms"},
    {arabic: "الحالة", english: "status"},
    {arabic: "اسم المستاجر", english: "renter"},
    {arabic: "الإيجار السنوي", english: "yearlyRentPrice"},
    {arabic: "الايحار الفعلي", english: "actualRentPrice"},
];

const columnsIncome = [
    {arabic: "اسم العقار", english: "invoice.property.name"},
    {arabic: "رقم الوحدة", english: "invoice.rentAgreement.unit.number"},
    {
        arabic: "رقم عقد الإيجار",
        english: "invoice.rentAgreement.rentAgreementNumber",
    },
    {arabic: "تاريخ", english: "createdAt"},
    {arabic: "نوع الفاتورة", english: "invoice.invoiceType"},
    {arabic: "المبلغ", english: "amount"},
];

const columnsExpenses = [
    {arabic: "اسم العقار", english: "invoice.property.name"},
    {arabic: "تاريخ", english: "createdAt"},
    {arabic: "نوع الفاتورة", english: "invoice.invoiceType"},
    {arabic: "المبلغ", english: "amount"},
];

const calculateStatus = (rentAgreements) => {
    return rentAgreements.some((agreement) => agreement.status === "ACTIVE")
          ? "مؤجرة"
          : "شاغرة";
};

const Reports = () => {
    const [owners, setOwners] = useState([]);
    const [selectedOwners, setSelectedOwners] = useState([]);
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
                const resOwners = await fetch("/api/fast-handler?id=ownerByProperty");
                const dataOwners = await resOwners.json();
                setOwners(dataOwners);
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
            ownerIds: selectedOwners,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        };

        try {
            const res = await fetch(
                  `/api/main/reports/owners?filters=${JSON.stringify(filters)}`,
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
        documentTitle: "تقرير المالك",
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
                                      col.english.includes("Date") ||
                                      col.english.includes("created")
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

                                if (
                                      col.english.includes("amount") ||
                                      col.english.includes("yearlyRentPrice")
                                ) {
                                    totalAmount += row[col.english];
                                }

                                if (col.english.includes("actualRentPrice")) {
                                    if (row[col.english]) {
                                        totalPaidAmount += row[col.english];
                                    }
                                }
                                if (col.english === "invoice.rentAgreement.status") {
                                    cellValue = translateRentType(cellValue);
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
                  {columns.some(
                        (col) =>
                              col.english.includes("amount") ||
                              col.english.includes("yearlyRentPrice"),
                  ) && (
                        <TableRow>
                            <TableCell
                                  colSpan={colSpan ? colSpan : columns.length - 1}
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
        csvRows.push(["تقرير المالك", `من ${startDate.format("DD/MM/YYYY")} إلى ${endDate.format("DD/MM/YYYY")}`]);
        csvRows.push([]); // Empty row for spacing
      
        // Add data for each owner
        reportData.forEach((owner) => {
          // Add owner details
          csvRows.push(["تفاصيل المالك"]);
          csvRows.push(["اسم المالك", "هوية المالك", "ايميل المالك", "رقم هاتف المالك"]);
          csvRows.push([owner.name, owner.nationalId, owner.email, owner.phone]);
          csvRows.push([]); // Empty row for spacing
      
          // Add property details for each owner
          owner.properties.forEach((property) => {
            csvRows.push([`تفاصيل العقار: ${property.name}`]);
            csvRows.push(columnsPropertyDetails.map((col) => col.arabic));
            csvRows.push(
              columnsPropertyDetails.map((col) => {
                const value = col.english.split(".").reduce((acc, part) => acc && acc[part], property);
                return value || "";
              }),
            );
            csvRows.push([]); // Empty row for spacing
      
            // Add units details
            csvRows.push(["الوحدات"]);
            csvRows.push(columnsUnits.map((col) => col.arabic));
            property.units.forEach((unit) => {
              const row = columnsUnits.map((col) => {
                let value = col.english.split(".").reduce((acc, part) => acc && acc[part], unit);
                if (col.english === "status") {
                  value = calculateStatus(unit.rentAgreements);
                }
                return value || "";
              });
              csvRows.push(row);
            });
            csvRows.push([]); // Empty row for spacing
      
            // Add income details
            csvRows.push(["الدخل"]);
            csvRows.push(columnsIncome.map((col) => col.arabic));
            property.incomes.forEach((income) => {
              const row = columnsIncome.map((col) => {
                let value = col.english.split(".").reduce((acc, part) => acc && acc[part], income);
                if (col.english.includes("date") || col.english.includes("created")) {
                  value = dayjs(value).format("DD/MM/YYYY");
                } else if (col.english.includes("amount")) {
                  value = formatCurrencyAED(value);
                } else if (col.english === "invoice.invoiceType") {
                  value = translateInvoiceType(value);
                }
                return value || "";
              });
              csvRows.push(row);
            });
            csvRows.push([]); // Empty row for spacing
      
            // Add expenses details
            csvRows.push(["المصروفات"]);
            csvRows.push(columnsExpenses.map((col) => col.arabic));
            property.expenses.forEach((expense) => {
              const row = columnsExpenses.map((col) => {
                let value = col.english.split(".").reduce((acc, part) => acc && acc[part], expense);
                if (col.english.includes("date") || col.english.includes("created")) {
                  value = dayjs(value).format("DD/MM/YYYY");
                } else if (col.english.includes("amount")) {
                  value = formatCurrencyAED(value);
                } else if (col.english === "invoice.invoiceType") {
                  value = translateInvoiceType(value);
                }
                return value || "";
              });
              csvRows.push(row);
            });
            csvRows.push([]); // Empty row for spacing
          });
      
          // Add totals for the owner
          csvRows.push(["إجمالي الدخل والمصروفات للمالك"]);
          csvRows.push(["إجمالي الدخل", "إجمالي المصروفات"]);
          const totalIncome = owner.properties.reduce(
            (sum, property) =>
              sum + property.incomes.reduce((acc, income) => acc + income.amount, 0),
            0,
          );
          const totalExpenses = owner.properties.reduce(
            (sum, property) =>
              sum + property.expenses.reduce((acc, expense) => acc + expense.amount, 0),
            0,
          );
          csvRows.push([formatCurrencyAED(totalIncome), formatCurrencyAED(totalExpenses)]);
          csvRows.push([]); // Empty row between owners
        });
      
        // Convert to CSV string
        const csvContent = csvRows.map((row) => row.join(",")).join("\n");
      
        // Create blob and download
        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `تقرير_الملاك_${dayjs().format("YYYY-MM-DD")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      };
    if (loading) return <CircularProgress/>;
    return (
          <Container
                sx={{
                    p: {
                        xs: 0,
                        md: 1,
                    },
                }}
          >
              <Box sx={{my: 4}}>
                  <Typography variant="h4" gutterBottom>
                      إنشاء تقارير الملاك
                  </Typography>
                  <FormControl fullWidth margin="normal">
                      <InputLabel>الملاك</InputLabel>
                      <Select
                            multiple
                            value={selectedOwners}
                            onChange={(e) => setSelectedOwners(e.target.value)}
                      >
                          {owners.map((owner) => (
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
                            {reportData.map((owner) => (
                                  <Box key={owner.id} sx={{mb: 4}}>
                                      <Box sx={{my: 2}}>
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
                                                  <strong>اسم المالك:</strong> {owner.name}
                                              </div>
                                              <div>
                                                  <strong> هوية المالك:</strong> {owner.nationalId}
                                              </div>
                                              <div>
                                                  <strong> ايميل المالك:</strong> {owner.email}
                                              </div>
                                              <div>
                                                  <strong> رقمة هاتف المالك:</strong> {owner.phone}
                                              </div>
                                          </Typography>
                                      </Box>

                                      <Typography variant="h6">عقارات المالك</Typography>
                                      {owner.properties.map((property) => (
                                            <Box key={property.id} sx={{mb: 4}}>
                                                <Typography variant="h6">{property.name}</Typography>
                                                <ReportTable
                                                      headings={columnsPropertyDetails}
                                                      title="تفاصيل العقار"
                                                >
                                                    {renderTableRows([property], columnsPropertyDetails)}
                                                </ReportTable>

                                                <ReportTable headings={columnsUnits} title="الوحدات">
                                                    {renderTableRows(
                                                          property.units.map((unit) => ({
                                                              ...unit,
                                                              status: calculateStatus(unit.rentAgreements),
                                                          })),
                                                          columnsUnits,
                                                          8,
                                                    )}
                                                </ReportTable>

                                                <ReportTable headings={columnsIncome} title="الدخل">
                                                    {renderTableRows(property.incomes, columnsIncome, 5)}
                                                </ReportTable>
                                                <ReportTable headings={columnsExpenses} title="المصروفات">
                                                    {renderTableRows(property.expenses, columnsExpenses, 3)}
                                                </ReportTable>
                                            </Box>
                                      ))}

                                      <Typography variant="h6" sx={{mt: 4}}>
                                          إجمالي الدخل والمصروفات للمالك
                                      </Typography>
                                      <ReportTable headings={["الدخل", "المصروفات"]} title=" ">
                                          <TableRow>
                                              <TableCell>إجمالي الدخل</TableCell>
                                              <TableCell>
                                                  {formatCurrencyAED(
                                                        owner.properties.reduce(
                                                              (sum, property) =>
                                                                    sum +
                                                                    property.incomes.reduce(
                                                                          (acc, income) => acc + income.amount,
                                                                          0,
                                                                    ),
                                                              0,
                                                        ),
                                                  )}
                                              </TableCell>
                                          </TableRow>
                                          <TableRow>
                                              <TableCell>إجمالي المصروفات</TableCell>
                                              <TableCell>
                                                  {formatCurrencyAED(
                                                        owner.properties.reduce(
                                                              (sum, property) =>
                                                                    sum +
                                                                    property.expenses.reduce(
                                                                          (acc, expense) => acc + expense.amount,
                                                                          0,
                                                                    ),
                                                              0,
                                                        ),
                                                  )}
                                              </TableCell>
                                          </TableRow>
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

export default Reports;
