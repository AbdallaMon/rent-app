// مكون لإدارة تحديث نظام الفواتير
'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Alert,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    Divider,
    Grid,
    Chip
} from '@mui/material';
import {
    UpdateOutlined,
    CheckCircleOutlined,
    ErrorOutlined,
    InfoOutlined
} from '@mui/icons-material';

const InvoiceSystemManager = () => {
    const [loading, setLoading] = useState(false);
    const [updateResult, setUpdateResult] = useState(null);
    const [currentStats, setCurrentStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    // جلب الإحصائيات الحالية
    const fetchCurrentStats = async () => {
        setStatsLoading(true);
        try {
            const response = await fetch('/api/admin/update-invoice-system');
            const data = await response.json();
            setCurrentStats(data.currentStats);
        } catch (error) {
            console.error('خطأ في جلب الإحصائيات:', error);
        } finally {
            setStatsLoading(false);
        }
    };

    // تشغيل تحديث النظام
    const runSystemUpdate = async () => {
        setLoading(true);
        setUpdateResult(null);
        
        try {
            const response = await fetch('/api/admin/update-invoice-system', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            setUpdateResult(result);
            
            if (result.success) {
                // تحديث الإحصائيات بعد النجاح
                await fetchCurrentStats();
            }
        } catch (error) {
            setUpdateResult({
                success: false,
                error: 'فشل في الاتصال بالخادم',
                details: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCurrentStats();
    }, []);

    return (
        <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
            <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
                🔧 إدارة تحديث نظام الفواتير
            </Typography>

            {/* الإحصائيات الحالية */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        📊 الإحصائيات الحالية
                    </Typography>
                    {statsLoading ? (
                        <CircularProgress size={24} />
                    ) : currentStats ? (
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                    <Typography variant="h4" color="primary">
                                        {currentStats.rentInvoices}
                                    </Typography>
                                    <Typography variant="body2">فواتير إيجار</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                    <Typography variant="h4" color="warning.main">
                                        {currentStats.taxInvoices}
                                    </Typography>
                                    <Typography variant="body2">فواتير ضرائب</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                    <Typography variant="h4" color="success.main">
                                        {currentStats.otherInvoices}
                                    </Typography>
                                    <Typography variant="body2">فواتير أخرى</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                    <Typography variant="h4" color="info.main">
                                        {currentStats.commissionRecords}
                                    </Typography>
                                    <Typography variant="body2">سجلات عمولة</Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    ) : (
                        <Alert severity="error">فشل في تحميل الإحصائيات</Alert>
                    )}
                </CardContent>
            </Card>

            {/* شرح التحديث */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        ℹ️ ماذا سيحدث عند التحديث؟
                    </Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText 
                                primary="1. إزالة فواتير الإيجار والضرائب من نظام الفواتير"
                                secondary="لن تظهر هذه الفواتير في قائمة الفواتير الرئيسية"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText 
                                primary="2. تحويل قيم هذه الفواتير إلى عمولات إدارة"
                                secondary="سيتم حساب عمولة الإدارة بناءً على نسبة العمولة المحددة في كل عقار"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText 
                                primary="3. تسجيل عمولات الإدارة كدخل منفصل"
                                secondary="ستظهر عمولات الإدارة في قسم الدخل مع وصف واضح"
                            />
                        </ListItem>
                    </List>
                </CardContent>
            </Card>

            {/* زر التحديث */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={loading ? <CircularProgress size={20} /> : <UpdateOutlined />}
                    onClick={runSystemUpdate}
                    disabled={loading}
                    sx={{ minWidth: 200 }}
                >
                    {loading ? 'جاري التحديث...' : 'بدء تحديث النظام'}
                </Button>
            </Box>

            {/* نتائج التحديث */}
            {updateResult && (
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            {updateResult.success ? (
                                <CheckCircleOutlined color="success" sx={{ mr: 1 }} />
                            ) : (
                                <ErrorOutlined color="error" sx={{ mr: 1 }} />
                            )}
                            <Typography variant="h6">
                                {updateResult.success ? 'تم التحديث بنجاح!' : 'فشل التحديث'}
                            </Typography>
                        </Box>

                        {updateResult.success ? (
                            <>
                                <Alert severity="success" sx={{ mb: 3 }}>
                                    {updateResult.message}
                                </Alert>

                                {/* إحصائيات التحديث */}
                                <Typography variant="h6" gutterBottom>
                                    📈 إحصائيات التحديث
                                </Typography>
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Chip
                                            label={`${updateResult.statistics.processedInvoices} فاتورة معالجة`}
                                            color="primary"
                                            variant="outlined"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Chip
                                            label={`${updateResult.statistics.totalCommission.toLocaleString()} ريال عمولة`}
                                            color="success"
                                            variant="outlined"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Chip
                                            label={`${updateResult.statistics.averageCommission.toFixed(2)} متوسط العمولة`}
                                            color="info"
                                            variant="outlined"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Chip
                                            label={`${updateResult.statistics.remainingInvoices} فاتورة متبقية`}
                                            color="warning"
                                            variant="outlined"
                                        />
                                    </Grid>
                                </Grid>

                                {/* تفاصيل التحديث */}
                                {updateResult.details && updateResult.details.length > 0 && (
                                    <>
                                        <Typography variant="h6" gutterBottom>
                                            📋 تفاصيل التحديث
                                        </Typography>
                                        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                                            {updateResult.details.slice(0, 10).map((detail, index) => (
                                                <Box key={index} sx={{ mb: 1, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                                    <Typography variant="body2">
                                                        فاتورة #{detail.invoiceId} - 
                                                        {detail.action === 'updated' ? ' تم التحديث' : 
                                                         detail.action === 'created' ? ' تم الإنشاء' : ' خطأ'}
                                                        {detail.commissionAmount && (
                                                            ` - عمولة: ${detail.commissionAmount.toLocaleString()} ريال`
                                                        )}
                                                    </Typography>
                                                </Box>
                                            ))}
                                            {updateResult.details.length > 10 && (
                                                <Typography variant="body2" color="text.secondary">
                                                    ... و {updateResult.details.length - 10} فاتورة أخرى
                                                </Typography>
                                            )}
                                        </Box>
                                    </>
                                )}
                            </>
                        ) : (
                            <Alert severity="error">
                                <Typography variant="body1" gutterBottom>
                                    {updateResult.error}
                                </Typography>
                                {updateResult.details && (
                                    <Typography variant="body2">
                                        التفاصيل: {updateResult.details}
                                    </Typography>
                                )}
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default InvoiceSystemManager;
