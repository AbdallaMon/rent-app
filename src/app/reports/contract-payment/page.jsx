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

const columnsContractPayments = [
  { arabic: "رقم الوحدة", english: "unitNumber" },
  { arabic: "رقم عقد الإيجار", english: "rentAgreementNumber" },
  { arabic: "إجمالي سعر العقد", english: "totalAmount" },
  { arabic: "ضريبة القيمة المضافة", english: "tax" },
  { arabic: "رسوم التسجيل", english: "registrationFees" },
  { arabic: "رسوم التأمين", english: "insuranceFees" },
  { arabic: "المبلغ قبل الرسوم", english: "amountBeforeFees" },
  { arabic: "ما تم دفعه", english: "paidAmount" },
  { arabic: "المتبقي", english: "remainingAmount" },
  { arabic: "عمولة الإدارة", english: "managementCommission" },
];

const ContractPaymentsPage = () => {
  const [properties, setProperties] = useState([]);
  const [selectedRent, setSelectedRent] = useState("all");
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [startDate, setStartDate] = useState(dayjs().startOf("month"));
  const [endDate, setEndDate] = useState(dayjs().endOf("month"));
  const [reportData, setReportData] = useState(null);
  const componentRef = useRef();
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        // Use absolute path to ensure compatibility in both dev and prod
        const response = await fetch("/api/fast-handler?id=properties", {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Error fetching properties: ${response.status}`);
        }
        
        const dataProperties = await response.json();
        setProperties(dataProperties);
      } catch (error) {
        console.error("Failed to fetch properties data", error);
        setError("Failed to load properties. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleGenerateReport = async () => {
    if (selectedProperties.length === 0) {
      setError("Please select at least one property");
      return;
    }
    
    setSubmitLoading(true);
    setError(null);
    
    const filters = {
      propertyIds: selectedProperties,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      rentStatus: selectedRent,
    };

    try {
      const res = await fetch(
        `/api/main/reports/contract-payments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filters }),
        }
      );
      
      if (!res.ok) {
        throw new Error(`Error generating report: ${res.status}`);
      }
      
      const data = await res.json();
      setReportData(data.data);
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Failed to generate report", error);
      setError("Failed to generate report. Please try again later.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: "تقرير دفعات العقود",
  });

  function handleRentStatusChange(e) {
    const selectedRent = e.target.value;
    setSelectedRent(selectedRent);
  }

  const renderTableRows = (data, columns) => {
    if (!data || data.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length} align="center">
            لا توجد بيانات
          </TableCell>
        </TableRow>
      );
    }
    
    let totalContractAmount = 0;
    let totalTaxAmount = 0;
    let totalRegistrationFees = 0;
    let totalInsuranceFees = 0;
    let totalAmountBeforeFees = 0;
    let totalPaidAmount = 0;
    let totalRemainingAmount = 0;
    let totalManagementCommission = 0;

    return (
      <>
        {data.map((row, index) => {
          const totalAmount = row.totalAmount || 0;
          const tax = row.tax || 0;
          const registrationFees = row.registrationFees || 0;
          const insuranceFees = row.insuranceFees || 0;
          const amountBeforeFees = totalAmount - (tax + registrationFees + insuranceFees);
          const paidAmount = row.paidAmount || 0;
          const remainingAmount = row.remainingAmount || 0;
          const managementCommission = row.managementCommission || 0;

          totalContractAmount += totalAmount;
          totalTaxAmount += tax;
          totalRegistrationFees += registrationFees;
          totalInsuranceFees += insuranceFees;
          totalAmountBeforeFees += amountBeforeFees;
          totalPaidAmount += paidAmount;
          totalRemainingAmount += remainingAmount;
          totalManagementCommission += managementCommission;

          return (
            <TableRow key={index}>
              {columns.map((col, colIndex) => {
                let cellValue = row[col.english];
                
                // Handle nested properties
                if (col.english.includes('.')) {
                  cellValue = col.english
                    .split(".")
                    .reduce((acc, part) => acc && acc[part], row);
                }

                if (
                  col.english.includes("date") ||
                  col.english.includes("Date")
                ) {
                  cellValue = cellValue ? dayjs(cellValue).format("DD/MM/YYYY") : '';
                } else if (
                  col.english.includes("price") ||
                  col.english.includes("amount") ||
                  col.english.includes("totalAmount") ||
                  col.english.includes("paidAmount") ||
                  col.english.includes("remainingAmount") ||
                  col.english.includes("tax") ||
                  col.english.includes("fees") ||
                  col.english.includes("managementCommission")
                ) {
                  cellValue = formatCurrencyAED(cellValue || 0);
                }

                // Override for amountBeforeFees which is calculated
                if (col.english === "amountBeforeFees") {
                  cellValue = formatCurrencyAED(amountBeforeFees);
                }

                return (
                  <TableCell
                    key={colIndex}
                    sx={{ backgroundColor: "#ffffff", padding: "8px" }}
                  >
                    {cellValue || ''}
                  </TableCell>
                );
              })}
            </TableRow>
          );
        })}

        {/* Totals row */}
        <TableRow>
          <TableCell
            colSpan={2}
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
            {formatCurrencyAED(totalContractAmount)}
          </TableCell>
          <TableCell
            sx={{
              backgroundColor: "#ffffff",
              padding: "8px",
              fontWeight: "bold",
            }}
          >
            {formatCurrencyAED(totalTaxAmount)}
          </TableCell>
          <TableCell
            sx={{
              backgroundColor: "#ffffff",
              padding: "8px",
              fontWeight: "bold",
            }}
          >
            {formatCurrencyAED(totalRegistrationFees)}
          </TableCell>
          <TableCell
            sx={{
              backgroundColor: "#ffffff",
              padding: "8px",
              fontWeight: "bold",
            }}
          >
            {formatCurrencyAED(totalInsuranceFees)}
          </TableCell>
          <TableCell
            sx={{
              backgroundColor: "#ffffff",
              padding: "8px",
              fontWeight: "bold",
            }}
          >
            {formatCurrencyAED(totalAmountBeforeFees)}
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
            {formatCurrencyAED(totalRemainingAmount)}
          </TableCell>
          <TableCell
            sx={{
              backgroundColor: "#ffffff",
              padding: "8px",
              fontWeight: "bold",
            }}
          >
            {formatCurrencyAED(totalManagementCommission)}
          </TableCell>
        </TableRow>
      </>
    );
  };

  const handleDownloadCSV = () => {
    if (!reportData) return;

    const csvRows = [];

    // Add headers and data for each property
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

      // Add property name
      csvRows.push([`العقار: ${property.name}`]);
      csvRows.push([]); // Empty row for spacing

      // Add contract payments
      csvRows.push(['تفاصيل دفعات العقود']);
      csvRows.push(columnsContractPayments.map(col => col.arabic));

      // Add data rows
      if (property.rentAgreements && property.rentAgreements.length > 0) {
        property.rentAgreements.forEach(agreement => {
          const amountBeforeFees = agreement.totalAmount - 
            ((agreement.tax || 0) + (agreement.registrationFees || 0) + (agreement.insuranceFees || 0));

          const row = columnsContractPayments.map(col => {
            if (col.english === "amountBeforeFees") {
              return formatCurrencyAED(amountBeforeFees);
            }

            let value = agreement[col.english];
            
            // Handle nested properties
            if (col.english.includes('.')) {
              value = col.english.split('.').reduce((acc, part) => acc && acc[part], agreement);
            }

            // Format dates
            if (col.english.includes('date') || col.english.includes('Date')) {
              value = value ? dayjs(value).format('DD/MM/YYYY') : '';
            }
            // Format currency values
            else if (
              col.english.includes('amount') ||
              col.english.includes('tax') ||
              col.english.includes('fees') ||
              col.english.includes('managementCommission')
            ) {
              value = formatCurrencyAED(value || 0);
            }

            return value || '';
          });
          csvRows.push(row);
        });

        // Add totals
        const totals = property.rentAgreements.reduce((acc, agreement) => {
          acc.totalAmount += agreement.totalAmount || 0;
          acc.tax += agreement.tax || 0;
          acc.registrationFees += agreement.registrationFees || 0;
          acc.insuranceFees += agreement.insuranceFees || 0;
          acc.paidAmount += agreement.paidAmount || 0;
          acc.remainingAmount += agreement.remainingAmount || 0;
          acc.managementCommission += agreement.managementCommission || 0;
          acc.amountBeforeFees += agreement.totalAmount - 
            ((agreement.tax || 0) + (agreement.registrationFees || 0) + (agreement.insuranceFees || 0));
          return acc;
        }, { 
          totalAmount: 0, 
          tax: 0, 
          registrationFees: 0, 
          insuranceFees: 0, 
          amountBeforeFees: 0,
          paidAmount: 0, 
          remainingAmount: 0, 
          managementCommission: 0 
        });

        const totalRow = [
          'الإجمالي', '',
          formatCurrencyAED(totals.totalAmount),
          formatCurrencyAED(totals.tax),
          formatCurrencyAED(totals.registrationFees),
          formatCurrencyAED(totals.insuranceFees),
          formatCurrencyAED(totals.amountBeforeFees),
          formatCurrencyAED(totals.paidAmount),
          formatCurrencyAED(totals.remainingAmount),
          formatCurrencyAED(totals.managementCommission)
        ];
        
        csvRows.push(totalRow);
      } else {
        csvRows.push(['لا توجد بيانات']);
      }
      
      csvRows.push([]); // Empty row between properties
      csvRows.push([]); // Additional spacing between properties
    });

    // Convert to CSV string
    const csvContent = csvRows.map(row => 
      row.map(cell => 
        // Handle cells containing commas by wrapping in quotes
        typeof cell === 'string' && cell.includes(',') ? 
          `"${cell}"` : 
          cell
      ).join(',')
    ).join('\n');

    // Create blob and download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `تقرير_دفعات_العقود_${dayjs().format('YYYY-MM-DD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
      <CircularProgress />
    </Container>
  );
  
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
          تقرير دفعات العقود
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
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

        <FormControl fullWidth margin="normal">
          <InputLabel>حالة العقد</InputLabel>
          <Select value={selectedRent} onChange={handleRentStatusChange}>
            <MenuItem value={"all"}>
              الجميع
            </MenuItem>
            <MenuItem value={"ACTIVE"}>
              نشط
            </MenuItem>
            <MenuItem value={"EXPIRED"}>
              منتهي
            </MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          color="primary"
          onClick={handleGenerateReport}
          disabled={submitLoading}
          sx={{ mt: 2 }}
        >
          {submitLoading ? <CircularProgress size={24} /> : "إنشاء التقرير"}
        </Button>

        {reportData && (
          <Box
            sx={{ mt: 4, p: 2, border: "1px solid #ddd" }}
            ref={componentRef}
          >
            {reportData.map((property) => (
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
                      gridTemplateColumns: {
                        xs: "1fr", 
                        sm: "repeat(2, 1fr)"
                      },
                      gap: "10px",
                    }}
                  >
                    <div>
                      <strong>اسم المالك:</strong> {property.client?.name || 'غير متوفر'}
                    </div>
                    <div>
                      <strong> هوية المالك:</strong>{" "}
                      {property.client?.nationalId || 'غير متوفر'}
                    </div>
                    <div>
                      <strong> ايميل المالك:</strong> {property.client?.email || 'غير متوفر'}
                    </div>
                    <div>
                      <strong> رقمة هاتف المالك:</strong>{" "}
                      {property.client?.phone || 'غير متوفر'}
                    </div>
                  </Typography>
                </Box>

                <Typography variant="h6" gutterBottom>
                  {property.name}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  تفاصيل دفعات العقود
                </Typography>
                <ReportTable headings={columnsContractPayments} title=" ">
                  {renderTableRows(
                    property.rentAgreements,
                    columnsContractPayments
                  )}
                </ReportTable>
              </div>
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

export default ContractPaymentsPage;
