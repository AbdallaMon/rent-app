"use client";
import React, {useEffect, useRef, useState, useMemo} from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    IconButton,
    Tooltip,
    InputAdornment,
} from "@mui/material";
import {
    Search as SearchIcon,
    FilterList as FilterListIcon,
    Clear as ClearIcon,
    Print as PrintIcon,
    AttachMoney as AttachMoneyIcon,
    Receipt as ReceiptIcon,
    Assignment as AssignmentIcon,
    TrendingUp as TrendingUpIcon,
    MonetizationOn as MonetizationOnIcon,
    AccountBalance as AccountBalanceIcon,
    Build as BuildIcon,
    Description as DescriptionIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
    Cancel as CancelIcon,
} from "@mui/icons-material";
import {DatePicker, LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import {useReactToPrint} from "react-to-print";
import dayjs from "dayjs";
import "dayjs/locale/ar";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// إعداد dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('ar');
import InvoicePrint from "./InvoicePrint";
import CombinedInvoicePrint from "./CombinedInvoicePrint";
import {formatCurrencyAED} from "@/helpers/functions/convertMoneyToArabic";
import { 
    EnhancedStatsCard, 
    InvoiceStatusChip, 
    EnhancedInvoiceRow, 
    LoadingIndicator, 
    EmptyState 
} from "@/components/invoices/InvoiceAdvancedComponents";
import AdvancedFilters from "@/components/invoices/AdvancedFilters";
const invoiceTypeMapping = {
    ALL: "كل الفواتير",
    RENT: "إيجار",
    TAX: "ضرائب",
    INSURANCE: "تأمين",
    REGISTRATION: "تسجيل",
    MAINTENANCE: "صيانة",
    CONTRACT_EXPENSE: "مصاريف عقد",
    OTHER_EXPENSE: "مصاريف أخرى",
    MANAGEMENT_COMMISSION: "عمولة إدارة",
    OTHER: "أخرى",
};

// تصنيف نوع الفاتورة للعرض البصري
const getInvoiceTypeConfig = (invoiceType) => {
    const configs = {
        RENT: { 
            color: 'info', 
            icon: AttachMoneyIcon, 
            type: 'توثيق', 
            bgColor: '#e3f2fd' 
        },
        TAX: { 
            color: 'info', 
            icon: AccountBalanceIcon, 
            type: 'توثيق', 
            bgColor: '#e3f2fd' 
        },
        INSURANCE: { 
            color: 'success', 
            icon: MonetizationOnIcon, 
            type: 'دخل', 
            bgColor: '#e8f5e8' 
        },
        REGISTRATION: { 
            color: 'success', 
            icon: MonetizationOnIcon, 
            type: 'دخل', 
            bgColor: '#e8f5e8' 
        },
        CONTRACT_EXPENSE: { 
            color: 'success', 
            icon: MonetizationOnIcon, 
            type: 'دخل', 
            bgColor: '#e8f5e8' 
        },
        OTHER_EXPENSE: { 
            color: 'success', 
            icon: MonetizationOnIcon, 
            type: 'دخل', 
            bgColor: '#e8f5e8' 
        },
        MANAGEMENT_COMMISSION: { 
            color: 'success', 
            icon: TrendingUpIcon, 
            type: 'دخل', 
            bgColor: '#e8f5e8' 
        },
        MAINTENANCE: { 
            color: 'error', 
            icon: BuildIcon, 
            type: 'مصروف', 
            bgColor: '#fdeaea' 
        },
        OTHER: { 
            color: 'info', 
            icon: DescriptionIcon, 
            type: 'توثيق', 
            bgColor: '#e3f2fd' 
        }
    };
    
    return configs[invoiceType] || { 
        color: 'default', 
        icon: ReceiptIcon, 
        type: 'عام', 
        bgColor: '#f5f5f5' 
    };
};

// مكون رقاقة نوع الفاتورة
const InvoiceTypeChip = ({ invoiceType }) => {
    const config = getInvoiceTypeConfig(invoiceType);
    const IconComponent = config.icon;
    
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box 
                sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: '50%', 
                    backgroundColor: config.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <IconComponent sx={{ fontSize: 14, color: `${config.color}.main` }} />
            </Box>
            <Box>
                <Typography variant="body2" fontWeight="medium">
                    {invoiceTypeMapping[invoiceType] || invoiceType}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {config.type}
                </Typography>
            </Box>
        </Box>
    );
};

// مكون رقاقة حالة الدفع
const PaymentStatusChip = ({ invoice }) => {
    // تحديد حالة الدفع بناءً على نوع الفاتورة والبيانات المتاحة
    let status = 'paid'; // افتراضي
    let statusText = 'مدفوع';
    let color = 'success';
    let icon = CheckCircleIcon;
    
    if (invoice.payment) {
        // إذا كان هناك payment مرتبط، فحص حالته
        const isPaid = invoice.payment.amount && invoice.amount <= invoice.payment.amount;
        const isOverdue = invoice.payment.dueDate && new Date(invoice.payment.dueDate) < new Date();
        
        if (isOverdue && !isPaid) {
            status = 'overdue';
            statusText = 'متأخر';
            color = 'error';
            icon = CancelIcon;
        } else if (!isPaid) {
            status = 'pending';
            statusText = 'معلق';
            color = 'warning';
            icon = ScheduleIcon;
        }
    } else {
        // إذا لم يكن هناك payment مرتبط
        if (invoice.invoiceType === "RENT" || invoice.invoiceType === "TAX") {
            // للإيجار والضرائب، قد تكون معلقة أو متأخرة
            const now = new Date();
            const invoiceDate = new Date(invoice.createdAt);
            const daysDiff = Math.floor((now - invoiceDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff > 30) {
                status = 'overdue';
                statusText = 'متأخر';
                color = 'error';
                icon = CancelIcon;
            } else if (daysDiff > 0) {
                status = 'pending';
                statusText = 'معلق';
                color = 'warning';
                icon = ScheduleIcon;
            }
        }
        // الأنواع الأخرى مثل INSURANCE, REGISTRATION تبقى كما هي (مدفوعة)
    }
    
    const IconComponent = icon;
    
    return (
        <Chip 
            icon={<IconComponent sx={{ fontSize: 16 }} />}
            label={statusText}
            color={color}
            variant="outlined"
            size="small"
        />
    );
};

// مكون بطاقات الإحصائيات المحسن
const InvoiceStatsCards = ({ invoices }) => {
    const stats = useMemo(() => {
        // دخل الشركة: التأمين، التسجيل، مصاريف العقد، مصاريف أخرى، عمولة الإدارة
        const companyIncome = invoices.filter(inv => 
            ['INSURANCE', 'REGISTRATION', 'CONTRACT_EXPENSE', 'OTHER_EXPENSE', 'MANAGEMENT_COMMISSION'].includes(inv.invoiceType)
        );
        // مصروفات المُلاك: الصيانة
        const ownerExpenses = invoices.filter(inv => inv.invoiceType === 'MAINTENANCE');
        // التوثيق والمتابعة: أخرى، إيجار، ضرائب (تحتاج متابعة ومراجعة)
        const documentation = invoices.filter(inv => 
            ['OTHER', 'RENT', 'TAX'].includes(inv.invoiceType)
        );
        
        return {
            companyIncome: {
                count: companyIncome.length,
                amount: companyIncome.reduce((sum, inv) => sum + (inv.amount || 0), 0)
            },
            ownerExpenses: {
                count: ownerExpenses.length,
                amount: ownerExpenses.reduce((sum, inv) => sum + (inv.amount || 0), 0)
            },
            documentation: {
                count: documentation.length,
                amount: documentation.reduce((sum, inv) => sum + (inv.amount || 0), 0)
            },
            total: invoices.length
        };
    }, [invoices]);
    
    const cards = [
        {
            title: 'دخل الشركة',
            count: stats.companyIncome.count,
            amount: stats.companyIncome.amount,
            color: 'linear-gradient(135deg, #66bb6a 0%, #4caf50 100%)',
            icon: TrendingUpIcon,
            textColor: '#2e7d32'
        },
        {
            title: 'مصروفات المُلاك',
            count: stats.ownerExpenses.count,
            amount: stats.ownerExpenses.amount,
            color: 'linear-gradient(135deg, #ef5350 0%, #f44336 100%)',
            icon: BuildIcon,
            textColor: '#c62828'
        },
        {
            title: 'التوثيق والمتابعة',
            count: stats.documentation.count,
            amount: stats.documentation.amount,
            color: 'linear-gradient(135deg, #42a5f5 0%, #2196f3 100%)',
            icon: AssignmentIcon,
            textColor: '#1565c0'
        },
        {
            title: 'إجمالي الفواتير',
            count: stats.total,
            amount: invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
            color: 'linear-gradient(135deg, #ab47bc 0%, #9c27b0 100%)',
            icon: ReceiptIcon,
            textColor: '#6a1b9a'
        }
    ];
    
    return (
        <Grid container spacing={2} sx={{ mb: 3 }}>
            {cards.map((card, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                    <EnhancedStatsCard
                        title={card.title}
                        count={card.count}
                        amount={card.amount}
                        color={card.color}
                        icon={card.icon}
                        textColor={card.textColor}
                    />
                </Grid>
            ))}
        </Grid>
    );

};

const InvoicePage = () => {
    // المتغيرات الأساسية
    const [properties, setProperties] = useState([]);
    const [selectedProperty, setSelectedProperty] = useState("");
    const [owners, setOwners] = useState([]);
    const [selectedOwner, setSelectedOwner] = useState("");
    const [startDate, setStartDate] = useState(dayjs().startOf("month"));
    const [endDate, setEndDate] = useState(dayjs().endOf("month"));
    const [invoices, setInvoices] = useState([]);
    const [currentInvoice, setCurrentInvoice] = useState(null);
    const [invoiceType, setInvoiceType] = useState([]);
    const [paymentStatus, setPaymentStatus] = useState("all");
    const [searchText, setSearchText] = useState("");
    
    // المراجع والتحميل
    const componentRef = useRef();
    const printRef = useRef();
    const combinedPrintRef = useRef();
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [printLoading, setPrintLoading] = useState(false);
    const [combinedPrintLoading, setCombinedPrintLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    // جلب البيانات الأولية
    useEffect(() => {
        async function fetchInitialData() {
            setLoading(true);
            try {
                // جلب العقارات
                const resProperties = await fetch("/api/fast-handler?id=properties");
                const dataProperties = await resProperties.json();
                setProperties(Array.isArray(dataProperties) ? dataProperties : []);

                // جلب المُلاك
                const resOwners = await fetch("/api/fast-handler?id=owners");
                const dataOwners = await resOwners.json();
                console.log("Owners API response:", dataOwners); // للتشخيص
                console.log("Is owners array:", Array.isArray(dataOwners)); // للتشخيص
                const ownersArray = Array.isArray(dataOwners) ? dataOwners : [];
                console.log("Final owners array:", ownersArray); // للتشخيص
                setOwners(ownersArray);
            } catch (error) {
                console.error("Failed to fetch initial data", error);
            }
            setLoading(false);
        }

        fetchInitialData();
    }, []);

    // useEffect للتشخيص - مراقبة تحديث state الملاك
    useEffect(() => {
        console.log("Owners state updated:", owners);
        console.log("Owners count:", owners.length);
        if (owners.length > 0) {
            console.log("First owner:", owners[0]);
        }
    }, [owners]);

    // فلترة العقارات بناءً على المالك المختار
    const filteredProperties = useMemo(() => {
        if (!selectedOwner || selectedOwner === "") {
            return properties;
        }
        
        return properties.filter(property => {
            const ownerIdMethods = [
                property.client?.id,
                property.clientId,
                property.ownerId,
                property.owner?.id
            ];
            
            const propertyOwnerId = ownerIdMethods.find(id => id != null);
            return propertyOwnerId && String(propertyOwnerId) === String(selectedOwner);
        });
    }, [properties, selectedOwner]);

    // فلترة الفواتير المحسنة
    const filteredInvoices = useMemo(() => {
        return invoices.filter((invoice) => {
            // فلتر المالك
            if (selectedOwner && selectedOwner !== "") {
                const ownerMethods = [
                    invoice.property?.client?.id,
                    invoice.property?.clientId,
                    invoice.property?.ownerId,
                    invoice.property?.owner?.id,
                    invoice.clientId,
                    invoice.ownerId,
                    invoice.rentAgreement?.unit?.property?.client?.id,
                    invoice.rentAgreement?.unit?.property?.clientId
                ];
                
                const foundOwnerId = ownerMethods.find(id => id != null);
                if (!foundOwnerId || String(foundOwnerId) !== String(selectedOwner)) {
                    return false;
                }
            }

            // فلتر العقار
            if (selectedProperty && selectedProperty !== "") {
                const propertyId = invoice.property?.id || invoice.propertyId;
                if (String(propertyId) !== String(selectedProperty)) {
                    return false;
                }
            }

            // فلتر نوع الفاتورة
            if (Array.isArray(invoiceType) && invoiceType.length > 0) {
                if (!invoiceType.includes(invoice.invoiceType)) {
                    return false;
                }
            }

            // فلتر حالة الدفع
            if (paymentStatus !== "all") {
                // تحديد حالة الدفع للفاتورة
                let invoiceStatus = "paid"; // افتراضي أن الفاتورة مدفوعة
                
                if (invoice.payment) {
                    // إذا كان هناك payment مرتبط، فحص حالته
                    const isPaid = invoice.payment.amount && invoice.amount <= invoice.payment.amount;
                    const isOverdue = invoice.payment.dueDate && new Date(invoice.payment.dueDate) < new Date();
                    
                    if (isOverdue && !isPaid) {
                        invoiceStatus = "overdue";
                    } else if (!isPaid) {
                        invoiceStatus = "pending";
                    } else {
                        invoiceStatus = "paid";
                    }
                } else {
                    // إذا لم يكن هناك payment مرتبط، فحص إذا كانت فاتورة إيجار أو ضريبة
                    if (invoice.invoiceType === "RENT" || invoice.invoiceType === "TAX") {
                        // للإيجار والضرائب، قد تكون معلقة أو متأخرة
                        const now = new Date();
                        const invoiceDate = new Date(invoice.createdAt);
                        const daysDiff = Math.floor((now - invoiceDate) / (1000 * 60 * 60 * 24));
                        
                        if (daysDiff > 30) {
                            invoiceStatus = "overdue";
                        } else if (daysDiff > 0) {
                            invoiceStatus = "pending";
                        }
                    }
                    // الأنواع الأخرى مثل INSURANCE, REGISTRATION تعتبر مدفوعة افتراضياً
                }
                
                // تطبيق الفلتر
                if (paymentStatus === "paid" && invoiceStatus !== "paid") return false;
                if (paymentStatus === "pending" && invoiceStatus !== "pending") return false;
                if (paymentStatus === "overdue" && invoiceStatus !== "overdue") return false;
            }

            // البحث النصي
            if (searchText) {
                const searchLower = searchText.toLowerCase();
                const searchFields = [
                    invoice.id?.toString(),
                    invoice.displayId, // البحث بالرقم التسلسلي الجديد
                    invoice.description,
                    invoice.title,
                    invoice.property?.name,
                    invoice.rentAgreement?.unit?.number?.toString(),
                    invoice.renter?.name,
                    invoice.owner?.name,
                    invoiceTypeMapping[invoice.invoiceType]
                ];
                
                const found = searchFields.some(field => 
                    field?.toLowerCase().includes(searchLower)
                );
                
                if (!found) return false;
            }

            return true;
        });
    }, [invoices, selectedOwner, selectedProperty, invoiceType, paymentStatus, searchText]);
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (selectedOwner) count++;
        if (selectedProperty) count++;
        if (Array.isArray(invoiceType) && invoiceType.length > 0) count++;
        if (paymentStatus !== "all") count++;
        if (searchText) count++;
        return count;
    }, [selectedOwner, selectedProperty, invoiceType, paymentStatus, searchText]);

    // تحديث العقار عند تغيير المالك
    useEffect(() => {
        if (selectedOwner && selectedProperty) {
            const propertyBelongsToOwner = filteredProperties.find(p => 
                String(p.id) === String(selectedProperty)
            );
            
            if (!propertyBelongsToOwner) {
                setSelectedProperty("");
            }
        } else if (!selectedOwner && selectedProperty) {
            setSelectedProperty("");
        }
    }, [selectedOwner, selectedProperty, filteredProperties]);

    // جلب الفواتير
    const handleGenerateInvoices = async () => {
        setSubmitLoading(true);
        const filters = {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            propertyId: selectedProperty || null,
            ownerId: selectedOwner || null,
            invoiceType: invoiceType,
        };

        try {
            const res = await fetch(
                `/api/main/invoices?filters=${JSON.stringify(filters)}`,
            );
            const data = await res.json();
            setInvoices(data.data || []);
        } catch (error) {
            console.error("Failed to generate invoices", error);
        }
        setSubmitLoading(false);
    };

    // مسح جميع الفلاتر
    const handleClearFilters = () => {
        setSelectedOwner("");
        setSelectedProperty("");
        setInvoiceType([]);
        setPaymentStatus("all");
        setSearchText("");
        setStartDate(dayjs().startOf("month"));
        setEndDate(dayjs().endOf("month"));
    };

    // طباعة الفاتورة
    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: "فاتورة",
        onBeforeGetContent: () => setPrintLoading(true),
        onAfterPrint: () => setPrintLoading(false),
    });

    // طباعة الفاتورة المجمعة
    const handleCombinedPrint = useReactToPrint({
        content: () => combinedPrintRef.current,
        documentTitle: "فاتورة مجمعة",
        onBeforeGetContent: () => setCombinedPrintLoading(true),
        onAfterPrint: () => setCombinedPrintLoading(false),
    });

    // إنشاء ملخص الفلاتر للطباعة
    const createFilterSummary = () => {
        const summary = {};
        
        if (startDate && endDate) {
            summary.period = `من ${startDate.format('DD/MM/YYYY')} إلى ${endDate.format('DD/MM/YYYY')}`;
        }
        
        if (selectedOwner) {
            const owner = owners.find(o => String(o.id) === String(selectedOwner));
            summary.owner = owner ? `${owner.firstName || ''} ${owner.lastName || ''}`.trim() : selectedOwner;
        }
        
        if (selectedProperty) {
            const property = properties.find(p => String(p.id) === String(selectedProperty));
            summary.property = property ? property.name : selectedProperty;
        }
        
        if (Array.isArray(invoiceType) && invoiceType.length > 0) {
            const typeNames = invoiceType.map(type => invoiceTypeMapping[type] || type);
            summary.invoiceType = typeNames.join(', ');
        }
        
        if (paymentStatus !== "all") {
            const statusMapping = {
                paid: "مدفوع",
                pending: "معلق", 
                overdue: "متأخر"
            };
            summary.paymentStatus = statusMapping[paymentStatus] || paymentStatus;
        }
        
        return summary;
    };

    // عرض تفاصيل الفاتورة
    const handleViewInvoice = (invoice) => {
        // يمكن إضافة modal لعرض التفاصيل هنا
        console.log("عرض تفاصيل الفاتورة:", invoice);
    };

    // عرض الفواتير بتصميم محسن
    const renderInvoices = (invoices) => {
        if (!invoices || invoices.length === 0) {
            return (
                <EmptyState
                    title="لا توجد فواتير للعرض"
                    description="لم يتم العثور على فواتير تطابق المعايير المحددة. جرب تعديل الفلاتر أو إضافة فواتير جديدة."
                    action={
                        <Button 
                            variant="outlined" 
                            onClick={handleClearFilters}
                            startIcon={<ClearIcon />}
                        >
                            مسح الفلاتر
                        </Button>
                    }
                />
            );
        }

        return (
            <Box>
                {invoices.map((invoice) => (
                    <EnhancedInvoiceRow
                        key={invoice.id}
                        invoice={invoice}
                        onPrint={() => {
                            setCurrentInvoice(invoice);
                            setTimeout(handlePrint, 500);
                        }}
                        onView={handleViewInvoice}
                        printLoading={printLoading}
                        getInvoiceTypeConfig={getInvoiceTypeConfig}
                    />
                ))}
            </Box>
        );
    };

    if (loading) {
        return (
            <Container>
                <LoadingIndicator message="جاري تحميل البيانات الأولية..." />
            </Container>
        );
    }

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
                <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ReceiptIcon color="primary" />
                    نظام إدارة الفواتير المتقدم
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                    نظام شامل لإدارة وفلترة الفواتير مع إحصائيات متقدمة
                </Typography>

                {/* الإحصائيات */}
                {filteredInvoices.length > 0 && (
                    <InvoiceStatsCards invoices={filteredInvoices} />
                )}

                {/* الفلاتر المتقدمة */}
                <AdvancedFilters
                    selectedOwner={selectedOwner}
                    selectedProperty={selectedProperty}
                    invoiceType={invoiceType}
                    paymentStatus={paymentStatus}
                    searchText={searchText}
                    startDate={startDate}
                    endDate={endDate}
                    owners={owners}
                    properties={properties}
                    filteredProperties={filteredProperties}
                    invoiceTypeMapping={invoiceTypeMapping}
                    onOwnerChange={setSelectedOwner}
                    onPropertyChange={setSelectedProperty}
                    onInvoiceTypeChange={setInvoiceType}
                    onPaymentStatusChange={setPaymentStatus}
                    onSearchChange={setSearchText}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                    onClearFilters={handleClearFilters}
                    onApplyFilters={handleGenerateInvoices}
                    loading={submitLoading}
                    activeFiltersCount={activeFiltersCount}
                />

                {/* نتائج البحث */}
                {invoices.length > 0 && (
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                                <Typography variant="h6">
                                    نتائج البحث ({filteredInvoices.length} من {invoices.length})
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                    {filteredInvoices.length !== invoices.length && (
                                        <Chip 
                                            label={`تم تطبيق فلاتر`} 
                                            color="primary" 
                                            size="small" 
                                        />
                                    )}
                                    {filteredInvoices.length > 0 && (
                                        <Button
                                            variant="contained"
                                            color="secondary"
                                            size="small"
                                            startIcon={combinedPrintLoading ? <CircularProgress size={16} color="inherit" /> : <PrintIcon />}
                                            onClick={handleCombinedPrint}
                                            disabled={combinedPrintLoading}
                                            sx={{ minWidth: 'auto' }}
                                        >
                                            {combinedPrintLoading ? "جاري الطباعة..." : "طباعة مجمعة"}
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                            {renderInvoices(filteredInvoices)}
                        </CardContent>
                    </Card>
                )}

                {/* حالة عدم وجود نتائج */}
                {invoices.length === 0 && !submitLoading && (
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            لا توجد فواتير لعرضها
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            يرجى تحديد المعايير والضغط على &quot;جلب الفواتير&quot;
                        </Typography>
                    </Paper>
                )}

                {/* مكونات الطباعة المخفية */}
                {currentInvoice && (
                    <div style={{display: "none"}}>
                        <InvoicePrint ref={printRef} invoice={currentInvoice}/>
                    </div>
                )}
                
                {filteredInvoices.length > 0 && (
                    <div style={{display: "none"}}>
                        <CombinedInvoicePrint 
                            ref={combinedPrintRef} 
                            invoices={filteredInvoices}
                            filterSummary={createFilterSummary()}
                        />
                    </div>
                )}

                {/* إشعار النجاح */}
                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={6000}
                    onClose={() => setSnackbarOpen(false)}
                >
                    <Alert onClose={() => setSnackbarOpen(false)} severity="success">
                        تم تحديث الفاتورة بنجاح!
                    </Alert>
                </Snackbar>
            </Box>
        </Container>
    );
};

export default InvoicePage;
