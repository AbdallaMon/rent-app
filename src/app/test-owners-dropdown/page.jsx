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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Button,
    Alert
} from '@mui/material';

export default function TestOwnersDropdownPage() {
    const [owners, setOwners] = useState([]);
    const [properties, setProperties] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [selectedOwner, setSelectedOwner] = useState('');
    const [selectedProperty, setSelectedProperty] = useState('');
    const [loading, setLoading] = useState(true);
    const [fetchingInvoices, setFetchingInvoices] = useState(false);
    const [error, setError] = useState(null);

    // جلب البيانات الأولية
    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                
                // جلب الملاك
                console.log('📊 جلب الملاك...');
                const ownersRes = await fetch('/api/fast-handler?id=owners');
                const ownersData = await ownersRes.json();
                console.log('👥 بيانات الملاك:', ownersData);
                setOwners(Array.isArray(ownersData) ? ownersData : []);
                
                // جلب العقارات
                console.log('🏢 جلب العقارات...');
                const propertiesRes = await fetch('/api/fast-handler?id=properties');
                const propertiesData = await propertiesRes.json();
                console.log('🏘️ بيانات العقارات:', propertiesData);
                setProperties(Array.isArray(propertiesData) ? propertiesData : []);
                
            } catch (err) {
                console.error('❌ خطأ في جلب البيانات:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    // فلترة العقارات حسب المالك المختار
    const filteredProperties = selectedOwner 
        ? properties.filter(property => {
            const ownerIdMethods = [
                property.client?.id,
                property.clientId,
                property.ownerId,
                property.owner?.id
            ];
            const propertyOwnerId = ownerIdMethods.find(id => id != null);
            return propertyOwnerId?.toString() === selectedOwner?.toString();
        })
        : properties;

    // جلب الفواتير
    const fetchInvoices = async () => {
        try {
            setFetchingInvoices(true);
            
            const filters = {
                startDate: new Date('2025-01-01').toISOString(),
                endDate: new Date('2025-12-31').toISOString(),
                ownerId: selectedOwner || null,
                propertyId: selectedProperty || null,
                invoiceType: 'ALL'
            };
            
            console.log('🔍 جلب الفواتير مع الفلاتر:', filters);
            
            const response = await fetch(`/api/main/invoices?filters=${JSON.stringify(filters)}`);
            const data = await response.json();
            
            console.log('📄 فواتير مُسترجعة:', data);
            
            setInvoices(data.data || []);
            
        } catch (err) {
            console.error('❌ خطأ في جلب الفواتير:', err);
        } finally {
            setFetchingInvoices(false);
        }
    };

    // تنفيذ جلب الفواتير عند تغيير الفلاتر
    useEffect(() => {
        fetchInvoices();
    }, [selectedOwner, selectedProperty]);

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>جلب بيانات الملاك والعقارات...</Typography>
            </Container>
        );
    }

    if (error) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">خطأ: {error}</Alert>
            </Container>
        );
    }

    return (
        <Container sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>
                اختبار قائمة الملاك المنسدلة
            </Typography>
            
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                        <InputLabel>المالك ({owners.length})</InputLabel>
                        <Select
                            value={selectedOwner}
                            onChange={(e) => {
                                setSelectedOwner(e.target.value);
                                setSelectedProperty(''); // إعادة تعيين العقار عند تغيير المالك
                            }}
                            label={`المالك (${owners.length})`}
                        >
                            <MenuItem value="">كل الملاك</MenuItem>
                            {owners.map((owner) => (
                                <MenuItem key={owner.id} value={owner.id}>
                                    {owner.name?.replace(/\t/g, ' ').trim()}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                        <InputLabel>العقار ({filteredProperties.length})</InputLabel>
                        <Select
                            value={selectedProperty}
                            onChange={(e) => setSelectedProperty(e.target.value)}
                            label={`العقار (${filteredProperties.length})`}
                            disabled={!selectedOwner && selectedOwner !== ""}
                        >
                            <MenuItem value="">كل العقارات</MenuItem>
                            {filteredProperties.map((property) => (
                                <MenuItem key={property.id} value={property.id}>
                                    {property.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {!selectedOwner && selectedOwner !== "" && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            يرجى اختيار مالك أولاً
                        </Typography>
                    )}
                </Grid>

                <Grid item xs={12} md={4}>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={fetchInvoices}
                        disabled={fetchingInvoices}
                        sx={{ height: '56px' }}
                    >
                        {fetchingInvoices ? 'جلب الفواتير...' : 'تحديث الفواتير'}
                    </Button>
                </Grid>
            </Grid>

            {/* إحصائيات الفواتير */}
            <Box sx={{ mt: 4 }}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            إحصائيات الفواتير
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6} sm={3}>
                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}>
                                    <Typography variant="h4" color="primary">
                                        {invoices.length}
                                    </Typography>
                                    <Typography variant="body2">إجمالي الفواتير</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e8' }}>
                                    <Typography variant="h4" color="success.main">
                                        {invoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
                                    </Typography>
                                    <Typography variant="body2">إجمالي المبلغ</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fff3e0' }}>
                                    <Typography variant="h4" color="warning.main">
                                        {[...new Set(invoices.map(inv => inv.invoiceType))].length}
                                    </Typography>
                                    <Typography variant="body2">أنواع الفواتير</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fce4ec' }}>
                                    <Typography variant="h4" color="secondary.main">
                                        {owners.length}
                                    </Typography>
                                    <Typography variant="body2">عدد الملاك</Typography>
                                </Paper>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Box>

            {/* أنواع الفواتير */}
            {invoices.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                توزيع أنواع الفواتير
                            </Typography>
                            <Grid container spacing={2}>
                                {Object.entries(
                                    invoices.reduce((acc, invoice) => {
                                        acc[invoice.invoiceType] = (acc[invoice.invoiceType] || 0) + 1;
                                        return acc;
                                    }, {})
                                ).map(([type, count]) => (
                                    <Grid item xs={6} sm={4} md={3} key={type}>
                                        <Paper sx={{ p: 1.5, textAlign: 'center' }}>
                                            <Typography variant="h6" color="primary">
                                                {count}
                                            </Typography>
                                            <Typography variant="body2">
                                                {type}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        </CardContent>
                    </Card>
                </Box>
            )}

            {/* تفاصيل الملاك */}
            <Box sx={{ mt: 3 }}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            قائمة الملاك في النظام
                        </Typography>
                        {owners.map((owner, index) => (
                            <Box key={owner.id} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                                <Typography variant="subtitle1">
                                    <strong>{index + 1}. {owner.name?.replace(/\t/g, ' ').trim()}</strong>
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    معرف المالك: {owner.id}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    عدد العقارات المرتبطة: {properties.filter(p => {
                                        const ownerIdMethods = [
                                            p.client?.id,
                                            p.clientId,
                                            p.ownerId,
                                            p.owner?.id
                                        ];
                                        const propertyOwnerId = ownerIdMethods.find(id => id != null);
                                        return propertyOwnerId?.toString() === owner.id?.toString();
                                    }).length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    عدد الفواتير: {invoices.filter(inv => 
                                        inv.ownerId === owner.id || 
                                        inv.property?.client?.id === owner.id ||
                                        inv.rentAgreement?.unit?.property?.client?.id === owner.id
                                    ).length}
                                </Typography>
                            </Box>
                        ))}
                    </CardContent>
                </Card>
            </Box>

            {fetchingInvoices && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>جلب الفواتير...</Typography>
                </Box>
            )}
        </Container>
    );
}
