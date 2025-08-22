// file: src/app/UiComponents/FormComponents/Forms/CreateMaintenanceRequest.jsx
import { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
  CircularProgress,
  FormHelperText,
  Autocomplete
} from "@mui/material";

export default function CreateMaintenanceRequestForm({ open, onClose, onRequestCreated }) {
  const [formData, setFormData] = useState({
    clientId: "",
    propertyId: "",
    unitId: "",
    description: "",
    priority: "MEDIUM",
    status: "PENDING"
  });
  
  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchFormData();
    }
  }, [open]);

  useEffect(() => {
    if (formData.propertyId) {
      fetchUnits(formData.propertyId);
    } else {
      setUnits([]);
    }
  }, [formData.propertyId]);

  const fetchFormData = async () => {
    try {
      setDataLoading(true);
      const response = await fetch("/api/request/maintenance/formData");
      if (!response.ok) {
        throw new Error("Failed to fetch form data");
      }
      const data = await response.json();
      setClients(data.clients || []);
      setProperties(data.properties || []);
      setDataLoading(false);
    } catch (error) {
      console.error("Error fetching form data:", error);
      setDataLoading(false);
    }
  };

  const fetchUnits = async (propertyId) => {
    try {
      const response = await fetch(`/api/request/maintenance/units?propertyId=${propertyId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch units");
      }
      const data = await response.json();
      setUnits(data);
    } catch (error) {
      console.error("Error fetching units:", error);
      setUnits([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear errors for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
  };

  const handleClientChange = (event, newValue) => {
    setFormData({
      ...formData,
      clientId: newValue ? newValue.id : ""
    });
    
    if (errors.clientId) {
      setErrors({
        ...errors,
        clientId: ""
      });
    }
  };

  const handlePropertyChange = (event, newValue) => {
    setFormData({
      ...formData,
      propertyId: newValue ? newValue.id : "",
      unitId: "" // Reset unit when property changes
    });
    
    if (errors.propertyId) {
      setErrors({
        ...errors,
        propertyId: ""
      });
    }
  };

  const handleUnitChange = (event, newValue) => {
    setFormData({
      ...formData,
      unitId: newValue ? newValue.id : ""
    });
    
    if (errors.unitId) {
      setErrors({
        ...errors,
        unitId: ""
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.clientId) {
      newErrors.clientId = "يرجى اختيار العميل";
    }
    
    if (!formData.description) {
      newErrors.description = "وصف المشكلة مطلوب";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // تحويل المعرفات إلى أرقام صحيحة للتأكد من أنها ترسل بالشكل الصحيح
      const requestData = {
        ...formData,
        clientId: parseInt(formData.clientId),
        lastRequestTime: new Date().toISOString()
      };
      
      // تحويل معرف العقار والوحدة إلى أرقام صحيحة إذا كانت موجودة
      if (formData.propertyId) {
        requestData.propertyId = parseInt(formData.propertyId);
      }
      
      if (formData.unitId) {
        requestData.unitId = parseInt(formData.unitId);
      }
      
      console.log("إرسال بيانات طلب الصيانة:", requestData);
      
      const response = await fetch("/api/request/maintenance/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error("خطأ من الخادم:", responseData);
        alert(`فشل في إنشاء طلب الصيانة: ${responseData.details || responseData.error || "خطأ غير معروف"}`);
        throw new Error(responseData.details || responseData.error || "Failed to create maintenance request");
      }
      
      console.log("تم إنشاء طلب الصيانة بنجاح:", responseData);
      onRequestCreated(responseData);
      
      // Reset form
      setFormData({
        clientId: "",
        propertyId: "",
        unitId: "",
        description: "",
        priority: "MEDIUM",
        status: "PENDING"
      });
      
    } catch (error) {
      console.error("Error creating maintenance request:", error);
      alert(`فشل في إنشاء طلب الصيانة: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      clientId: "",
      propertyId: "",
      unitId: "",
      description: "",
      priority: "MEDIUM",
      status: "PENDING"
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle align="right">إنشاء طلب صيانة جديد</DialogTitle>
      
      <DialogContent>
        {dataLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box component="form" noValidate sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={clients}
                  getOptionLabel={(option) => option.name}
                  onChange={handleClientChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="العميل"
                      fullWidth
                      required
                      error={!!errors.clientId}
                      helperText={errors.clientId}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={properties}
                  getOptionLabel={(option) => option.name}
                  onChange={handlePropertyChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="العقار"
                      fullWidth
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={units}
                  getOptionLabel={(option) => 
                    `${option.number || ''}${option.floor ? ` (طابق ${option.floor})` : ''}`
                  }
                  disabled={!formData.propertyId}
                  onChange={handleUnitChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="الوحدة"
                      fullWidth
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="priority-label">الأولوية</InputLabel>
                  <Select
                    labelId="priority-label"
                    name="priority"
                    value={formData.priority}
                    label="الأولوية"
                    onChange={handleChange}
                  >
                    <MenuItem value="LOW">منخفضة</MenuItem>
                    <MenuItem value="MEDIUM">متوسطة</MenuItem>
                    <MenuItem value="HIGH">عالية</MenuItem>
                    <MenuItem value="URGENT">عاجلة</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="وصف المشكلة"
                  fullWidth
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  error={!!errors.description}
                  helperText={errors.description}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          إلغاء
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          variant="contained"
          disabled={loading || dataLoading}
        >
          {loading ? <CircularProgress size={24} /> : 'إنشاء'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
