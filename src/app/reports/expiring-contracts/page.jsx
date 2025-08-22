// تقرير العقود المنتهية
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
    Chip,
} from "@mui/material";
import {useReactToPrint} from "react-to-print";
import {DatePicker, LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/en-gb";
import ReportTable from "@/components/Tables/ReportTable";
import {formatCurrencyAED} from "@/helpers/functions/convertMoneyToArabic";

const columnsExpiringContracts = [
    {arabic: "العقار", english: "unit.property.name"},
    {arabic: "رقم الوحدة", english: "unit.number"},
    {arabic: "المستأجر", english: "renter.name"},
    {arabic: "هاتف المستأجر", english: "renter.phone"},
    {arabic: "تاريخ الانتهاء", english: "endDate"},
    {arabic: "الأيام المتبقية", english: "daysRemaining"},
    {arabic: "الحالة", english: "urgencyLevel"},
    {arabic: "إجمالي السعر", english: "totalPrice"},
];

const ExpiringContractsReport = () => {
    const [reportData, setReportData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [filterPeriod, setFilterPeriod] = useState("all"); // all, expired, month1, month2
    const [selectedProperty, setSelectedProperty] = useState("all");
    const [properties, setProperties] = useState([]);
    const componentRef = useRef();
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [reportData, filterPeriod, selectedProperty]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // جلب العقود المنتهية
            const contractsRes = await fetch("/api/main/endingRents");
            const contractsData = await contractsRes.json();
            
            // جلب العقارات للفلترة
            const propertiesRes = await fetch("/api/fast-handler?id=properties");
            const propertiesData = await propertiesRes.json();
            
            // حساب الأيام المتبقية ومستوى الاستعجال لكل عقد
            const processedData = contractsData.data.map(contract => {
                const today = dayjs();
                const endDate = dayjs(contract.endDate);
                const daysRemaining = endDate.diff(today, 'day');
                
                let urgencyLevel = "";
                let urgencyColor = "default";
                
                if (daysRemaining < 0) {
                    urgencyLevel = "منتهي";
                    urgencyColor = "error";
                } else if (daysRemaining <= 30) {
                    urgencyLevel = "عاجل";
                    urgencyColor = "error";
                } else if (daysRemaining <= 60) {
                    urgencyLevel = "قريب";
                    urgencyColor = "warning";
                } else {
                    urgencyLevel = "عادي";
                    urgencyColor = "success";
                }
                
                return {
                    ...contract,
                    daysRemaining,
                    urgencyLevel,
                    urgencyColor
                };
            });

            setReportData(processedData);
            setProperties(propertiesData);
            setSnackbarMessage("تم تحميل بيانات العقود بنجاح");
            setSnackbarOpen(true);
        } catch (error) {
            console.error("Failed to fetch data", error);
            setSnackbarMessage("فشل في تحميل البيانات");
            setSnackbarOpen(true);
        }
        setLoading(false);
    };

    const applyFilters = () => {
        let filtered = [...reportData];

        // فلترة حسب الفترة الزمنية
        if (filterPeriod !== "all") {
            const today = dayjs();
            filtered = filtered.filter(contract => {
                const daysRemaining = contract.daysRemaining;
                
                switch (filterPeriod) {
                    case "expired":
                        return daysRemaining < 0;
                    case "month1":
                        return daysRemaining >= 0 && daysRemaining <= 30;
                    case "month2":
                        return daysRemaining > 30 && daysRemaining <= 60;
                    default:
                        return true;
                }
            });
        }

        // فلترة حسب العقار
        if (selectedProperty !== "all") {
            filtered = filtered.filter(contract => 
                contract.unit.property.id === selectedProperty
            );
        }

        // ترتيب حسب الأيام المتبقية (الأقل أولاً)
        filtered.sort((a, b) => a.daysRemaining - b.daysRemaining);

        setFilteredData(filtered);
    };

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: "تقرير العقود المنتهية",
    });

    const renderTableRows = (data, columns) => {
        let totalAmount = 0;

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
                                    col.english.includes("Date")
                                ) {
                                    cellValue = dayjs(cellValue).format("DD/MM/YYYY");
                                } else if (
                                    col.english.includes("price") ||
                                    col.english.includes("amount") ||
                                    col.english.includes("totalPrice")
                                ) {
                                    cellValue = formatCurrencyAED(cellValue);
                                    totalAmount += isNaN(row.totalPrice) ? 0 : +row.totalPrice;                                } else if (col.english === "renter.phone") {
                                    cellValue = cellValue || "غير متوفر";
                                } else if (col.english === "urgencyLevel") {
                                    cellValue = (
                                        <Chip 
                                            label={row.urgencyLevel} 
                                            color={row.urgencyColor}
                                            size="small"
                                        />
                                    );                                } else if (col.english === "daysRemaining") {
                                    cellValue = row.daysRemaining < 0 
                                        ? `متأخر ${Math.abs(row.daysRemaining)} يوم`
                                        : `${row.daysRemaining} يوم`;
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
                    );
                })}                {data.length > 0 && (
                    <TableRow>
                        <TableCell
                            colSpan={columns.length - 1}
                            sx={{
                                backgroundColor: "#f0f0f0",
                                padding: "8px",
                                fontWeight: "bold",
                            }}
                        >
                            إجمالي قيمة العقود
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
                    </TableRow>
                )}
            </>
        );
    };

    const handleDownloadCSV = () => {
        if (filteredData.length === 0) return;

        const csvRows = [];
        
        // إضافة عنوان التقرير
        csvRows.push(["تقرير العقود المنتهية أو المنتهية قريباً"]);
        csvRows.push([`تاريخ التقرير: ${dayjs().format("DD/MM/YYYY")}`]);
        csvRows.push([""]);
        
        // إضافة العناوين
        csvRows.push(columnsExpiringContracts.map(col => col.arabic));
        
        // إضافة البيانات
        filteredData.forEach(row => {
            const rowData = columnsExpiringContracts.map(col => {
                let value = col.english
                    .split(".")
                    .reduce((acc, part) => acc && acc[part], row);                if (col.english.includes("date") || col.english.includes("Date")) {
                    value = dayjs(value).format("DD/MM/YYYY");
                } else if (col.english.includes("price") || col.english.includes("totalPrice")) {
                    value = formatCurrencyAED(value);
                } else if (col.english === "renter.phone") {
                    value = value || "غير متوفر";
                } else if (col.english === "urgencyLevel") {
                    value = row.urgencyLevel;
                } else if (col.english === "daysRemaining") {
                    value = row.daysRemaining < 0 
                        ? `متأخر ${Math.abs(row.daysRemaining)} يوم`
                        : `${row.daysRemaining} يوم`;
                }

                return `"${value}"`;
            });
            csvRows.push(rowData);
        });

        // تحويل إلى نص CSV
        const csvContent = csvRows.map(row => row.join(",")).join("\n");

        // إنشاء الملف وتحميله
        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `تقرير_العقود_المنتهية_${dayjs().format("YYYY-MM-DD")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getFilteredCount = (type) => {
        switch (type) {
            case "expired":
                return reportData.filter(c => c.daysRemaining < 0).length;
            case "month1":
                return reportData.filter(c => c.daysRemaining >= 0 && c.daysRemaining <= 30).length;
            case "month2":
                return reportData.filter(c => c.daysRemaining > 30 && c.daysRemaining <= 60).length;
            default:
                return reportData.length;
        }
    };

    if (loading) return <CircularProgress />;

    return (
        <Container sx={{p: {xs: 0, md: 1}}}>
            <Box sx={{my: 4}}>
                <Typography variant="h4" gutterBottom>
                    تقرير العقود المنتهية أو المنتهية قريباً
                </Typography>
                
                {/* إحصائيات سريعة */}
                <Box sx={{mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap'}}>
                    <Chip 
                        label={`المنتهية: ${getFilteredCount('expired')}`} 
                        color="error" 
                        variant="outlined"
                    />
                    <Chip 
                        label={`خلال شهر: ${getFilteredCount('month1')}`} 
                        color="warning" 
                        variant="outlined"
                    />
                    <Chip 
                        label={`خلال شهرين: ${getFilteredCount('month2')}`} 
                        color="info" 
                        variant="outlined"
                    />
                    <Chip 
                        label={`المجموع: ${reportData.length}`} 
                        color="primary" 
                        variant="outlined"
                    />
                </Box>

                {/* فلاتر التقرير */}
                <Box sx={{mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap'}}>
                    <FormControl sx={{minWidth: 200}}>
                        <InputLabel>فترة الانتهاء</InputLabel>
                        <Select
                            value={filterPeriod}
                            onChange={(e) => setFilterPeriod(e.target.value)}
                        >
                            <MenuItem value="all">جميع العقود</MenuItem>
                            <MenuItem value="expired">المنتهية فعلاً</MenuItem>
                            <MenuItem value="month1">تنتهي خلال شهر</MenuItem>
                            <MenuItem value="month2">تنتهي خلال شهرين</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl sx={{minWidth: 200}}>
                        <InputLabel>العقار</InputLabel>
                        <Select
                            value={selectedProperty}
                            onChange={(e) => setSelectedProperty(e.target.value)}
                        >
                            <MenuItem value="all">جميع العقارات</MenuItem>
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
                        onClick={fetchData}
                        disabled={submitLoading}
                    >
                        {submitLoading ? <CircularProgress size={24} /> : "تحديث التقرير"}
                    </Button>
                </Box>

                {filteredData.length > 0 && (
                    <Box
                        sx={{mt: 4, p: 2, border: "1px solid #ddd"}}
                        ref={componentRef}
                    >
                        <Box sx={{my: 2}}>
                            <Typography variant="h6">
                                تقرير العقود المنتهية - {dayjs().format("DD/MM/YYYY")}
                            </Typography>
                            <Typography variant="subtitle2" color="textSecondary">
                                عدد العقود: {filteredData.length}
                            </Typography>
                        </Box>

                        <ReportTable
                            headings={columnsExpiringContracts}
                            title="العقود المنتهية أو المنتهية قريباً"
                        >
                            {renderTableRows(filteredData, columnsExpiringContracts)}
                        </ReportTable>
                    </Box>
                )}

                {filteredData.length === 0 && !loading && (
                    <Box sx={{textAlign: 'center', py: 4}}>
                        <Typography variant="h6" color="textSecondary">
                            لا توجد عقود تطابق المعايير المحددة
                        </Typography>
                    </Box>
                )}

                {filteredData.length > 0 && (
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
                        {snackbarMessage}
                    </Alert>
                </Snackbar>
            </Box>
        </Container>
    );
};

export default ExpiringContractsReport;
