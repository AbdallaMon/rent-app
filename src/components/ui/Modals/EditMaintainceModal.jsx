"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { handleRequestSubmit } from "@/helpers/functions/handleRequestSubmit";
import { useToastContext } from "@/app/context/ToastLoading/ToastLoadingProvider";

const modalBoxSx = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 420,
  maxWidth: "92vw",
  bgcolor: "background.paper",
  border: 1,
  borderColor: "divider",
  borderRadius: 2,
  boxShadow: 24,
  p: 3,
};

export default function EditMaintenanceModal({ maintenance, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [typeId, setTypeId] = useState(maintenance.type.id);
  const [types, setTypes] = useState([]);
  const [date, setDate] = useState(dayjs(maintenance.date));
  const [loadingTypes, setLoadingTypes] = useState(false);
  const { setLoading } = useToastContext();

  useEffect(() => {
    setTypeId(maintenance.type.id);
    setDate(dayjs(maintenance.date));
  }, [open, maintenance]);

  useEffect(() => {
    async function getExpenseTypes() {
      setLoadingTypes(true);
      const res = await fetch("/api/fast-handler?id=expenseTypes");
      const data = await res.json();
      setTypes(data);
      setLoadingTypes(false);
      return { data };
    }
    getExpenseTypes();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    const payload = {
      typeId,
      date: date.toISOString(),
    };
    try {
      const updatedData = await handleRequestSubmit(
        payload,
        setLoading,
        "/main/maintenance/" + maintenance.id,
        false,
        " جاري تعديل الصيانة بنجاح ",
        "PUT"
      );
      onUpdate(updatedData.data);
      handleClose();
    } catch (e) {
      console.error("حدثت مشكلة اثناء التعديل:", e);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        borderRadius={2}
        onClick={handleOpen}
      >
        تعديل
      </Button>

      <Modal open={open} onClose={handleClose}>
        <Box sx={modalBoxSx}>
          <Typography variant="h6" gutterBottom>
            تعديل الصيانة
          </Typography>

          <FormControl fullWidth margin="normal">
            <InputLabel>نوع الصيانة</InputLabel>
            <Select
              value={typeId}
              label="نوع الصيانة"
              onChange={(e) => setTypeId(e.target.value)}
            >
              {loadingTypes && (
                <MenuItem disabled>
                  <CircularProgress size={20} sx={{ mr: 1 }} /> تحميل...
                </MenuItem>
              )}
              {types?.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="تاريخ تسجيل الصيانة"
              value={date}
              onChange={(newDate) => setDate(newDate)}
              renderInput={(params) => (
                <TextField {...params} fullWidth margin="normal" />
              )}
              sx={{ width: "100%", mt: 1 }}
            />
          </LocalizationProvider>

          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            sx={{ mt: 2 }}
          >
            تعديل
          </Button>
        </Box>
      </Modal>
    </>
  );
}
