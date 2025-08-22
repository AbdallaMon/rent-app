// مكون اختبار قائمة الملاك المنسدلة
// صفحة اختبار مبسطة للتحقق من عمل قائمة الملاك وترابطها مع العقارات

"use client";
import React, { useEffect, useState } from "react";
import {
    Box,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Typography,
    Alert,
    Grid,
    List,
    ListItem,
    ListItemText,
    Chip,
    CircularProgress
} from "@mui/material";

export default function OwnersDropdownTest() {
    const [owners, setOwners] = useState([]);
    const [properties, setProperties] = useState([]);
    const [selectedOwner, setSelectedOwner] = useState("");
    const [filteredProperties, setFilteredProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // جلب البيانات
    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                // جلب الملاك
                const ownersResponse = await fetch("/api/fast-handler?id=owners");
                const ownersData = await ownersResponse.json();
                console.log("Owners response:", ownersData);
                
                if (Array.isArray(ownersData)) {
                    setOwners(ownersData);
                    console.log("Owners loaded:", ownersData.length);
                } else {
                    console.error("Invalid owners data:", ownersData);
                    setError("بيانات الملاك غير صحيحة");
                }

                // جلب العقارات
                const propertiesResponse = await fetch("/api/fast-handler?id=properties");
                const propertiesData = await propertiesResponse.json();
                console.log("Properties response:", propertiesData);
                
                if (Array.isArray(propertiesData)) {
                    setProperties(propertiesData);
                    setFilteredProperties(propertiesData);
                    console.log("Properties loaded:", propertiesData.length);
                } else {
                    console.error("Invalid properties data:", propertiesData);
                    setError("بيانات العقارات غير صحيحة");
                }

            } catch (error) {
                console.error("Error fetching data:", error);
                setError(`خطأ في جلب البيانات: ${error.message}`);
            }
            setLoading(false);
        }

        fetchData();
    }, []);

    // فلترة العقارات عند تغيير المالك
    useEffect(() => {
        if (!selectedOwner || selectedOwner === "") {
            setFilteredProperties(properties);
        } else {
            const filtered = properties.filter(property => {
                const ownerIdMethods = [
                    property.client?.id,
                    property.clientId,
                    property.ownerId,
                    property.owner?.id
                ];
                
                const propertyOwnerId = ownerIdMethods.find(id => id != null);
                return propertyOwnerId == selectedOwner;
            });
            
            setFilteredProperties(filtered);
            console.log(`Filtered properties for owner ${selectedOwner}:`, filtered.length);
        }
    }, [selectedOwner, properties]);

    const handleOwnerChange = (ownerId) => {
        setSelectedOwner(ownerId);
        console.log("Selected owner:", ownerId);
        
        if (ownerId) {
            const owner = owners.find(o => o.id == ownerId);
            console.log("Owner details:", owner);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>جاري تحميل البيانات...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3, textAlign: 'center' }}>
                اختبار قائمة الملاك المنسدلة
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* معلومات عامة */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                معلومات عامة
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Chip 
                                    label={`إجمالي الملاك: ${owners.length}`} 
                                    color="primary" 
                                />
                                <Chip 
                                    label={`إجمالي العقارات: ${properties.length}`} 
                                    color="secondary" 
                                />
                                <Chip 
                                    label={`العقارات المفلترة: ${filteredProperties.length}`} 
                                    color="success" 
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* قائمة الملاك */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                اختيار المالك
                            </Typography>
                            
                            <FormControl fullWidth>
                                <InputLabel>المالك ({owners.length})</InputLabel>
                                <Select
                                    value={selectedOwner}
                                    onChange={(e) => handleOwnerChange(e.target.value)}
                                    label={`المالك (${owners.length})`}
                                >
                                    <MenuItem value="">كل الملاك</MenuItem>
                                    {owners.map((owner) => (
                                        <MenuItem key={owner.id} value={owner.id}>
                                            {owner.name?.replace(/\t/g, ' ').trim()} (ID: {owner.id})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {selectedOwner && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2">المالك المختار:</Typography>
                                    {(() => {
                                        const owner = owners.find(o => o.id == selectedOwner);
                                        return owner ? (
                                            <List dense>
                                                <ListItem>
                                                    <ListItemText 
                                                        primary={`الاسم: ${owner.name?.replace(/\t/g, ' ').trim()}`}
                                                    />
                                                </ListItem>
                                                <ListItem>
                                                    <ListItemText 
                                                        primary={`ID: ${owner.id}`}
                                                    />
                                                </ListItem>
                                                <ListItem>
                                                    <ListItemText 
                                                        primary={`الهاتف: ${owner.phone || 'غير محدد'}`}
                                                    />
                                                </ListItem>
                                                <ListItem>
                                                    <ListItemText 
                                                        primary={`البريد: ${owner.email || 'غير محدد'}`}
                                                    />
                                                </ListItem>
                                            </List>
                                        ) : null;
                                    })()}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* قائمة العقارات المفلترة */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                العقارات ({filteredProperties.length})
                            </Typography>
                            
                            {filteredProperties.length === 0 ? (
                                <Typography color="text.secondary">
                                    لا توجد عقارات للمالك المختار
                                </Typography>
                            ) : (
                                <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                                    {filteredProperties.map((property) => (
                                        <ListItem key={property.id} divider>
                                            <ListItemText
                                                primary={property.name}
                                                secondary={`ID: ${property.id}`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* معلومات تشخيصية */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                معلومات تشخيصية
                            </Typography>
                            
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                أول 3 ملاك:
                            </Typography>
                            <Box component="pre" sx={{ fontSize: '0.8rem', backgroundColor: 'grey.100', p: 1, borderRadius: 1, overflow: 'auto' }}>
                                {JSON.stringify(owners.slice(0, 3), null, 2)}
                            </Box>

                            <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>
                                أول 3 عقارات:
                            </Typography>
                            <Box component="pre" sx={{ fontSize: '0.8rem', backgroundColor: 'grey.100', p: 1, borderRadius: 1, overflow: 'auto' }}>
                                {JSON.stringify(properties.slice(0, 3), null, 2)}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
