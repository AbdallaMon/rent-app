import React from 'react';
import {
    Box,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Button,
    Grid,
    Typography,
    Chip,
    InputAdornment,
    Tooltip,
    IconButton,
    Collapse,
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterListIcon,
    Clear as ClearIcon,
    Refresh as RefreshIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from 'dayjs';

const AdvancedFilters = ({
    // القيم
    selectedOwner,
    selectedProperty,
    invoiceType,
    paymentStatus,
    searchText,
    startDate,
    endDate,
    
    // البيانات
    owners = [],
    properties = [],
    filteredProperties = [],
    invoiceTypeMapping = {},
    
    // دوال التحديث
    onOwnerChange,
    onPropertyChange,
    onInvoiceTypeChange,
    onPaymentStatusChange,
    onSearchChange,
    onStartDateChange,
    onEndDateChange,
    onClearFilters,
    onApplyFilters,
    
    // حالات
    loading = false,
    activeFiltersCount = 0,
    
    // إعدادات
    showDateFilters = true,
    showAdvanced = true,
    collapsible = false,
}) => {
    const [expanded, setExpanded] = React.useState(!collapsible);
    
    const handleToggleExpanded = () => {
        setExpanded(!expanded);
    };
    
    const paymentStatusOptions = [
        { value: 'all', label: 'كل الحالات' },
        { value: 'paid', label: 'مدفوعة' },
        { value: 'pending', label: 'معلقة' },
        { value: 'overdue', label: 'متأخرة' },
    ];
    
    return (
        <Card sx={{ mb: 3 }}>
            <CardContent sx={{ pb: 2 }}>
                {/* Header */}
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    mb: 2 
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FilterListIcon color="primary" />
                        <Typography variant="h6">
                            الفلاتر المتقدمة
                        </Typography>
                        {activeFiltersCount > 0 && (
                            <Chip 
                                label={`${activeFiltersCount} فلتر نشط`}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                        )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {collapsible && (
                            <IconButton onClick={handleToggleExpanded} size="small">
                                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                        )}
                        
                        <Tooltip title="مسح جميع الفلاتر">
                            <IconButton 
                                onClick={onClearFilters}
                                size="small"
                                color="error"
                                disabled={activeFiltersCount === 0}
                            >
                                <ClearIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
                
                <Collapse in={expanded}>
                    <Grid container spacing={2}>
                        {/* البحث النصي */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                size="small"
                                label="البحث في الفواتير"
                                value={searchText}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder="ابحث برقم الفاتورة، الوصف، العقار، المالك..."
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon color="action" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: searchText && (
                                        <InputAdornment position="end">
                                            <IconButton 
                                                size="small"
                                                onClick={() => onSearchChange('')}
                                            >
                                                <ClearIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        
                        {/* نوع الفاتورة */}
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>نوع الفاتورة</InputLabel>
                                <Select
                                    multiple
                                    value={Array.isArray(invoiceType) ? invoiceType : (invoiceType ? [invoiceType] : [])}
                                    onChange={(e) => onInvoiceTypeChange(e.target.value)}
                                    label="نوع الفاتورة"
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.length === 0 ? (
                                                <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                                                    اختر أنواع الفواتير
                                                </Box>
                                            ) : (
                                                selected.map((value) => (
                                                    <Chip 
                                                        key={value} 
                                                        label={invoiceTypeMapping[value] || value}
                                                        size="small"
                                                        variant="outlined"
                                                        color="primary"
                                                    />
                                                ))
                                            )}
                                        </Box>
                                    )}
                                    displayEmpty
                                >
                                    {Object.entries(invoiceTypeMapping).filter(([key]) => key !== 'ALL').map(([key, value]) => (
                                        <MenuItem key={key} value={key}>
                                            {value}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        {/* حالة الدفع */}
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>حالة الدفع</InputLabel>
                                <Select
                                    value={paymentStatus}
                                    onChange={(e) => onPaymentStatusChange(e.target.value)}
                                    label="حالة الدفع"
                                >
                                    {paymentStatusOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        {/* المالك */}
                        <Grid item xs={12} sm={6} md={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>المالك ({owners.length})</InputLabel>
                                <Select 
                                    value={selectedOwner} 
                                    onChange={(e) => onOwnerChange(e.target.value)}
                                    label={`المالك (${owners.length})`}
                                >
                                    <MenuItem value="">كل المُلاك</MenuItem>
                                    {owners.map((owner) => (
                                        <MenuItem key={owner.id} value={owner.id}>
                                            {owner.name?.replace(/\t/g, ' ').trim()}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        {/* العقار */}
                        <Grid item xs={12} sm={6} md={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>العقار ({filteredProperties.length})</InputLabel>
                                <Select 
                                    value={selectedProperty} 
                                    onChange={(e) => onPropertyChange(e.target.value)}
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
                                <Typography 
                                    variant="caption" 
                                    color="text.secondary"
                                    sx={{ mt: 0.5, display: 'block' }}
                                >
                                    يرجى اختيار مالك أولاً
                                </Typography>
                            )}
                        </Grid>
                        
                        {/* زر التطبيق */}
                        <Grid item xs={12} sm={6} md={4}>
                            <Button
                                fullWidth
                                variant="contained"
                                color="primary"
                                onClick={onApplyFilters}
                                disabled={loading}
                                startIcon={loading ? null : <SearchIcon />}
                                size="large"
                                sx={{ height: '40px' }}
                            >
                                {loading ? "جاري البحث..." : "جلب الفواتير"}
                            </Button>
                        </Grid>
                        
                        {/* فلاتر التاريخ */}
                        {showDateFilters && (
                            <>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                        فترة البحث
                                    </Typography>
                                </Grid>
                                
                                <Grid item xs={12} sm={6} md={3}>
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DatePicker
                                            label="تاريخ البدء"
                                            value={startDate}
                                            onChange={onStartDateChange}
                                            slotProps={{ 
                                                textField: { 
                                                    size: 'small',
                                                    fullWidth: true,
                                                    error: false
                                                } 
                                            }}
                                            format="DD/MM/YYYY"
                                        />
                                    </LocalizationProvider>
                                </Grid>
                                
                                <Grid item xs={12} sm={6} md={3}>
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DatePicker
                                            label="تاريخ الانتهاء"
                                            value={endDate}
                                            onChange={onEndDateChange}
                                            slotProps={{ 
                                                textField: { 
                                                    size: 'small',
                                                    fullWidth: true,
                                                    error: false
                                                } 
                                            }}
                                            format="DD/MM/YYYY"
                                        />
                                    </LocalizationProvider>
                                </Grid>
                                
                                {/* أزرار سريعة للتواريخ */}
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => {
                                                const today = dayjs();
                                                const firstDay = today.startOf('month');
                                                onStartDateChange(firstDay);
                                                onEndDateChange(today);
                                            }}
                                        >
                                            هذا الشهر
                                        </Button>
                                        
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => {
                                                const today = dayjs();
                                                const lastMonth = today.subtract(1, 'month');
                                                const firstDay = lastMonth.startOf('month');
                                                const lastDay = lastMonth.endOf('month');
                                                onStartDateChange(firstDay);
                                                onEndDateChange(lastDay);
                                            }}
                                        >
                                            الشهر الماضي
                                        </Button>
                                        
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => {
                                                const today = dayjs();
                                                const firstDay = today.startOf('year');
                                                onStartDateChange(firstDay);
                                                onEndDateChange(today);
                                            }}
                                        >
                                            هذا العام
                                        </Button>
                                    </Box>
                                </Grid>
                            </>
                        )}
                    </Grid>
                </Collapse>
            </CardContent>
        </Card>
    );
};

export default AdvancedFilters;
