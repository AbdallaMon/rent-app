"use client";
import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Select,
  MenuItem,
  InputLabel,
  Grid
} from "@mui/material";

// Status translations
const statusTranslation = {
  PENDING: "قيد الانتظار",
  IN_PROGRESS: "قيد التنفيذ",
  COMPLETED: "مكتمل",
  REJECTED: "مرفوض"
};

// Priority translations
const priorityTranslation = {
  LOW: "منخفضة",
  MEDIUM: "متوسطة",
  HIGH: "عالية",
  URGENT: "عاجلة"
};

export default function MaintenanceRequestStatusForm({ open, onClose, request, onStatusUpdated }) {
  const [status, setStatus] = useState(request?.status || "PENDING");
  const [priority, setPriority] = useState(request?.priority || "MEDIUM");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Updated to remove phoneNumber parameter
  const sendWhatsAppNotification = async (requestId, newStatus) => {
    try {
      const response = await fetch('/api/notifications/whatsapp/request/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          newStatus
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('WhatsApp notification failed:', errorData);
        // Optional: You might want to handle notification failure differently
      }
    } catch (err) {
      console.error('Error sending WhatsApp notification:', err);
    }
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
  };

  const handlePriorityChange = (event) => {
    setPriority(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/request/maintenance/${request.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: status,
          priority: priority
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل تحديث الطلب');
      }

      const updatedRequest = await response.json();
      
      // Send WhatsApp notification (only for status changes)
      await sendWhatsAppNotification(request.id, status);

      setSuccess(true);
     
      // Notify parent component about the status update
      if (onStatusUpdated) {
        onStatusUpdated(updatedRequest);
      }
     
      // Close the dialog after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      dir="rtl"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        تحديث طلب الصيانة
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            رقم الطلب: {request?.id}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            العميل: {request?.client?.name || "—"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            الوصف: {request?.description}
          </Typography>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            تم تحديث الطلب بنجاح
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="status-label">حالة الطلب</InputLabel>
                <Select
                  labelId="status-label"
                  id="status"
                  value={status}
                  label="حالة الطلب"
                  onChange={handleStatusChange}
                >
                  <MenuItem value="PENDING">{statusTranslation.PENDING}</MenuItem>
                  <MenuItem value="IN_PROGRESS">{statusTranslation.IN_PROGRESS}</MenuItem>
                  <MenuItem value="COMPLETED">{statusTranslation.COMPLETED}</MenuItem>
                  <MenuItem value="REJECTED">{statusTranslation.REJECTED}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="priority-label">الأولوية</InputLabel>
                <Select
                  labelId="priority-label"
                  id="priority"
                  value={priority}
                  label="الأولوية"
                  onChange={handlePriorityChange}
                >
                  <MenuItem value="LOW">{priorityTranslation.LOW}</MenuItem>
                  <MenuItem value="MEDIUM">{priorityTranslation.MEDIUM}</MenuItem>
                  <MenuItem value="HIGH">{priorityTranslation.HIGH}</MenuItem>
                  <MenuItem value="URGENT">{priorityTranslation.URGENT}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'flex-start' }}>
        <Button onClick={onClose} color="inherit">
          إلغاء
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'حفظ'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
