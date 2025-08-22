import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Chip,
    Typography,
    Grid,
    IconButton,
    Tooltip,
    LinearProgress,
    Avatar,
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
    Cancel as CancelIcon,
    Print as PrintIcon,
    Visibility as VisibilityIcon,
    Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { formatCurrencyAED } from "@/helpers/functions/convertMoneyToArabic";
import dayjs from 'dayjs';
import 'dayjs/locale/ar';

// تعريف الـ mapping هنا لضمان التوافق
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

// مكون بطاقة إحصائية محسنة
export const EnhancedStatsCard = ({ title, count, amount, color, icon: IconComponent, textColor, trend = null }) => {
    return (
        <Card 
            sx={{ 
                background: color,
                color: 'white',
                transition: 'all 0.3s ease',
                '&:hover': { 
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                },
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* تأثير الخلفية */}
            <Box
                sx={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                }}
            />
            
            <CardContent sx={{ textAlign: 'center', py: 3, position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Avatar
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.2)',
                            width: 56,
                            height: 56,
                        }}
                    >
                        <IconComponent sx={{ fontSize: 28 }} />
                    </Avatar>
                </Box>
                
                <Typography variant="h6" gutterBottom fontWeight="600">
                    {title}
                </Typography>
                
                <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                    {count}
                </Typography>
                
                <Typography variant="body1" sx={{ opacity: 0.9, mb: 1 }}>
                    {formatCurrencyAED(amount)}
                </Typography>
                
                {trend && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            {trend}
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

// مكون رقاقة حالة الفاتورة المحسن
export const InvoiceStatusChip = ({ invoice }) => {
    let status, label, color, icon;
    
    // تحديد الحالة بناءً على البيانات
    const isPaid = invoice.payment?.amount && invoice.amount === invoice.payment.amount;
    const isOverdue = invoice.payment?.dueDate && new Date(invoice.payment.dueDate) < new Date();
    
    if (isPaid) {
        status = 'paid';
        label = 'مدفوع';
        color = 'success';
        icon = CheckCircleIcon;
    } else if (isOverdue) {
        status = 'overdue';
        label = 'متأخر';
        color = 'error';
        icon = CancelIcon;
    } else {
        status = 'pending';
        label = 'معلق';
        color = 'warning';
        icon = ScheduleIcon;
    }
    
    const IconComponent = icon;
    
    return (
        <Chip
            icon={<IconComponent sx={{ fontSize: 16 }} />}
            label={label}
            color={color}
            variant="filled"
            size="small"
            sx={{
                fontWeight: 'bold',
                '& .MuiChip-icon': {
                    marginLeft: 1
                }
            }}
        />
    );
};

// مكون صف الفاتورة المحسن
export const EnhancedInvoiceRow = ({ 
    invoice, 
    onPrint, 
    onView, 
    printLoading = false,
    getInvoiceTypeConfig 
}) => {
    const config = getInvoiceTypeConfig(invoice.invoiceType);
    const IconComponent = config.icon;
    
    return (
        <Box
            sx={{
                p: 2,
                mb: 1,
                borderRadius: 2,
                border: `1px solid #e0e0e0`,
                borderLeft: `4px solid`,
                borderLeftColor: `${config.color}.main`,
                background: 'white',
                transition: 'all 0.2s ease',
                '&:hover': {
                    backgroundColor: config.bgColor,
                    borderColor: `${config.color}.main`,
                    transform: 'translateX(4px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }
            }}
        >
            <Grid container spacing={2} alignItems="center">
                {/* نوع الفاتورة */}
                <Grid item xs={12} sm={6} md={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                            sx={{
                                width: 32,
                                height: 32,
                                bgcolor: config.bgColor,
                                border: `2px solid ${config.color}.main`
                            }}
                        >
                            <IconComponent sx={{ fontSize: 16, color: `${config.color}.main` }} />
                        </Avatar>
                        <Box>
                            <Typography variant="body2" fontWeight="600">
                                {invoiceTypeMapping[invoice.invoiceType] || invoice.invoiceType}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {config.type}
                            </Typography>
                        </Box>
                    </Box>
                </Grid>
                
                {/* رقم الفاتورة */}
                <Grid item xs={6} sm={3} md={2}>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                        {invoice.displayId || `#${invoice.id}`}
                    </Typography>
                </Grid>
                
                {/* العقار والوحدة */}
                <Grid item xs={6} sm={3} md={2}>
                    <Typography variant="body2" noWrap>
                        {invoice.property?.name || "N/A"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        الوحدة: {invoice.rentAgreement?.unit?.number || "غير محدد"}
                    </Typography>
                </Grid>
                
                {/* التاريخ */}
                <Grid item xs={6} sm={4} md={1}>
                    <Typography variant="body2">
                        {dayjs(invoice.createdAt).format('DD/MM/YYYY')}
                    </Typography>
                </Grid>
                
                {/* المبلغ */}
                <Grid item xs={6} sm={4} md={2}>
                    <Typography 
                        variant="body1" 
                        fontWeight="bold" 
                        color={config.color}
                        sx={{ direction: 'ltr', textAlign: 'right' }}
                    >
                        {formatCurrencyAED(invoice.amount)}
                    </Typography>
                </Grid>
                
                {/* الحالة والإجراءات */}
                <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                        <InvoiceStatusChip invoice={invoice} />
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="طباعة الفاتورة">
                                <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => onPrint(invoice)}
                                    disabled={printLoading}
                                >
                                    <PrintIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="عرض التفاصيل">
                                <IconButton
                                    size="small"
                                    color="info"
                                    onClick={() => onView(invoice)}
                                >
                                    <VisibilityIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

// مكون مؤشر التحميل المحسن
export const LoadingIndicator = ({ message = "جاري التحميل..." }) => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
        <LinearProgress sx={{ mb: 2, maxWidth: 300, mx: 'auto' }} />
        <Typography variant="body2" color="text.secondary">
            {message}
        </Typography>
    </Box>
);

// مكون الحالة الفارغة المحسن
export const EmptyState = ({ 
    icon: IconComponent = ReceiptIcon, 
    title = "لا توجد فواتير",
    description = "لم يتم العثور على أي فواتير تطابق المعايير المحددة",
    action = null
}) => (
    <Box sx={{ textAlign: 'center', py: 6 }}>
        <IconComponent 
            sx={{ 
                fontSize: 80, 
                color: 'text.secondary', 
                mb: 2,
                opacity: 0.5 
            }} 
        />
        <Typography variant="h6" gutterBottom color="text.secondary">
            {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {description}
        </Typography>
        {action}
    </Box>
);

export default {
    EnhancedStatsCard,
    InvoiceStatusChip,
    EnhancedInvoiceRow,
    LoadingIndicator,
    EmptyState
};
