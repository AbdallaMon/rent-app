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
    Grid
} from '@mui/material';

export default function TestInvoicesPage() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchInvoices() {
            try {
                setLoading(true);
                
                // فلاتر لآخر 3 أشهر - جميع الفواتير
                const filters = {
                    startDate: new Date('2025-01-01').toISOString(),
                    endDate: new Date('2025-12-31').toISOString(),
                    invoiceType: 'ALL'
                };
                
                console.log('🔍 جلب الفواتير مع الفلاتر:', filters);
                
                const response = await fetch(`/api/main/invoices?filters=${JSON.stringify(filters)}`);
                
                console.log('📊 حالة الاستجابة:', response.status);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('📄 بيانات الاستجابة:', data);
                
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
                اختبار جلب الفواتير
            </Typography>
            
            <Typography variant="h6" sx={{ mb: 2 }}>
                عدد الفواتير المُسترجعة: {invoices.length}
            </Typography>
            
            {invoices.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography>لا توجد فواتير</Typography>
                </Paper>
            ) : (
                <Grid container spacing={2}>
                    {invoices.slice(0, 10).map((invoice, index) => (
                        <Grid item xs={12} md={6} key={invoice.id || index}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="h6">
                                            فاتورة #{invoice.id}
                                        </Typography>
                                        <Chip 
                                            label={invoice.invoiceType} 
                                            size="small"
                                            color="primary"
                                        />
                                    </Box>
                                    
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>المبلغ:</strong> {invoice.amount} درهم
                                    </Typography>
                                    
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>الوصف:</strong> {invoice.description || 'غير محدد'}
                                    </Typography>
                                    
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>العنوان:</strong> {invoice.title || 'غير محدد'}
                                    </Typography>
                                    
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>التاريخ:</strong> {new Date(invoice.createdAt).toLocaleDateString('ar-SA')}
                                    </Typography>
                                    
                                    {invoice.property && (
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>العقار:</strong> {invoice.property.name}
                                        </Typography>
                                    )}
                                    
                                    {invoice.owner && (
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>المالك:</strong> {invoice.owner.name}
                                        </Typography>
                                    )}
                                    
                                    {invoice.renter && (
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>المستأجر:</strong> {invoice.renter.name}
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
            
            {invoices.length > 10 && (
                <Typography sx={{ mt: 2, textAlign: 'center' }} color="text.secondary">
                    عرض أول 10 فواتير من {invoices.length}
                </Typography>
            )}
            
            <Box sx={{ mt: 4 }}>
                <Typography variant="h6">تفاصيل تشخيصية:</Typography>
                <Paper sx={{ p: 2, mt: 1, backgroundColor: '#f5f5f5' }}>
                    <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                        {JSON.stringify(invoices.slice(0, 2), null, 2)}
                    </pre>
                </Paper>
            </Box>
        </Container>
    );
}
