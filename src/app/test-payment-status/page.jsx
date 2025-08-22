"use client";
import React, { useEffect, useState } from 'react';
import {
    Container,
    Typography,
    Card,
    CardContent,
    Box,
    CircularProgress,
    Paper,
    Chip,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';

// مكون رقاقة حالة الدفع (نسخة من الصفحة الرئيسية)
const PaymentStatusChip = ({ invoice }) => {
    let status = 'paid';
    let statusText = 'مدفوع';
    let color = 'success';
    let icon = CheckCircleIcon;
    
    if (invoice.payment) {
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
        if (invoice.invoiceType === "RENT" || invoice.invoiceType === "TAX") {
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
    }
    
    const IconComponent = icon;
    
    return (
        <Chip
            icon={<IconComponent />}
            label={statusText}
            color={color}
            size="small"
            variant="outlined"
        />
    );
};

export default function TestPaymentStatusPage() {
    const [invoices, setInvoices] = useState([]);
    const [filteredInvoices, setFilteredInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState("all");

    useEffect(() => {
        async function fetchInvoices() {
            try {
                setLoading(true);
                
                const filters = {
                    startDate: new Date('2025-01-01').toISOString(),
                    endDate: new Date('2025-12-31').toISOString(),
                    invoiceType: 'ALL'
                };
                
                const response = await fetch(`/api/main/invoices?filters=${JSON.stringify(filters)}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                setInvoices(data.data || []);
                
            } catch (err) {
                console.error('❌ خطأ في جلب الفواتير:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchInvoices();
    }, []);

    useEffect(() => {
        // فلترة الفواتير حسب حالة الدفع
        const filtered = invoices.filter(invoice => {
            if (paymentStatus === "all") return true;
            
            // تحديد حالة الدفع للفاتورة (نفس المنطق من الصفحة الرئيسية)
            let invoiceStatus = "paid";
            
            if (invoice.payment) {
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
                if (invoice.invoiceType === "RENT" || invoice.invoiceType === "TAX") {
                    const now = new Date();
                    const invoiceDate = new Date(invoice.createdAt);
                    const daysDiff = Math.floor((now - invoiceDate) / (1000 * 60 * 60 * 24));
                    
                    if (daysDiff > 30) {
                        invoiceStatus = "overdue";
                    } else if (daysDiff > 0) {
                        invoiceStatus = "pending";
                    }
                }
            }
            
            return invoiceStatus === paymentStatus;
        });
        
        setFilteredInvoices(filtered);
    }, [invoices, paymentStatus]);

    // إحصائيات حالات الدفع
    const stats = invoices.reduce((acc, invoice) => {
        let status = "paid";
        
        if (invoice.payment) {
            const isPaid = invoice.payment.amount && invoice.amount <= invoice.payment.amount;
            const isOverdue = invoice.payment.dueDate && new Date(invoice.payment.dueDate) < new Date();
            
            if (isOverdue && !isPaid) {
                status = "overdue";
            } else if (!isPaid) {
                status = "pending";
            }
        } else {
            if (invoice.invoiceType === "RENT" || invoice.invoiceType === "TAX") {
                const now = new Date();
                const invoiceDate = new Date(invoice.createdAt);
                const daysDiff = Math.floor((now - invoiceDate) / (1000 * 60 * 60 * 24));
                
                if (daysDiff > 30) {
                    status = "overdue";
                } else if (daysDiff > 0) {
                    status = "pending";
                }
            }
        }
        
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error) {
        return (
            <Container sx={{ mt: 4 }}>
                <Typography color="error">خطأ: {error}</Typography>
            </Container>
        );
    }

    return (
        <Container sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>
                اختبار فلتر حالة الدفع
            </Typography>
            
            {/* إحصائيات */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>الإحصائيات:</Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip label={`المجموع: ${invoices.length}`} color="info" />
                    <Chip label={`مدفوعة: ${stats.paid || 0}`} color="success" />
                    <Chip label={`معلقة: ${stats.pending || 0}`} color="warning" />
                    <Chip label={`متأخرة: ${stats.overdue || 0}`} color="error" />
                </Box>
            </Paper>
            
            {/* فلتر حالة الدفع */}
            <Box sx={{ mb: 3 }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>حالة الدفع</InputLabel>
                    <Select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        label="حالة الدفع"
                    >
                        <MenuItem value="all">جميع الحالات ({invoices.length})</MenuItem>
                        <MenuItem value="paid">مدفوعة ({stats.paid || 0})</MenuItem>
                        <MenuItem value="pending">معلقة ({stats.pending || 0})</MenuItem>
                        <MenuItem value="overdue">متأخرة ({stats.overdue || 0})</MenuItem>
                    </Select>
                </FormControl>
            </Box>
            
            <Typography variant="h6" sx={{ mb: 2 }}>
                النتائج المفلترة: {filteredInvoices.length} فاتورة
            </Typography>
            
            {filteredInvoices.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography>لا توجد فواتير تطابق الفلتر المحدد</Typography>
                </Paper>
            ) : (
                <Grid container spacing={2}>
                    {filteredInvoices.slice(0, 20).map((invoice, index) => (
                        <Grid item xs={12} md={6} key={invoice.id || index}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="h6">
                                            فاتورة #{invoice.id}
                                        </Typography>
                                        <PaymentStatusChip invoice={invoice} />
                                    </Box>
                                    
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>النوع:</strong> {invoice.invoiceType}
                                    </Typography>
                                    
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>المبلغ:</strong> {invoice.amount} درهم
                                    </Typography>
                                    
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>التاريخ:</strong> {new Date(invoice.createdAt).toLocaleDateString('ar-SA')}
                                    </Typography>
                                    
                                    {invoice.payment && (
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>دفعة مرتبطة:</strong> {invoice.payment.amount} درهم
                                            {invoice.payment.dueDate && ` (استحقاق: ${new Date(invoice.payment.dueDate).toLocaleDateString('ar-SA')})`}
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
            
            {filteredInvoices.length > 20 && (
                <Typography sx={{ mt: 2, textAlign: 'center' }} color="text.secondary">
                    عرض أول 20 فاتورة من {filteredInvoices.length}
                </Typography>
            )}
        </Container>
    );
}
