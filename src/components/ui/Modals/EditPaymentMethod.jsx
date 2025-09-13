"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useToastContext } from "@/app/context/ToastLoading/ToastLoadingProvider";
import { handleRequestSubmit } from "@/helpers/functions/handleRequestSubmit";

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

export default function EditPaymentMethodModal({
  open,
  handleClose,
  paymentId,
  currentMethod,
  currentChequeNumber,
  onSave,
  item,
  editBankId,
}) {
  const [paymentMethod, setPaymentMethod] = useState(currentMethod);
  const [chequeNumber, setChequeNumber] = useState(currentChequeNumber || "");
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(editBankId);
  const [loadingData, setLoadingData] = useState(true);
  const { setLoading: setSubmitLoading } = useToastContext();

  useEffect(() => {
    if (open) {
      setPaymentMethod(currentMethod);
      setChequeNumber(currentChequeNumber || "");
      setSelectedBank(editBankId);
    }
  }, [open, currentMethod, currentChequeNumber, editBankId]);

  useEffect(() => {
    async function getBanksData() {
      setLoadingData(true);
      try {
        const res = await fetch("/api/fast-handler?id=bank");
        const data = await res.json();
        setBanks(Array.isArray(data) ? data : []);
      } catch (e) {
        setBanks([]);
      } finally {
        setLoadingData(false);
      }
    }
    getBanksData();
  }, []);

  // if user switches to CASH, clear bank & cheque
  useEffect(() => {
    if (paymentMethod === "CASH") {
      setSelectedBank(null);
      setChequeNumber("");
    }
  }, [paymentMethod]);
  console.log(selectedBank, "selectedBank");
  const handleSave = async () => {
    const payload = {
      paymentTypeMethod: paymentMethod,
      chequeNumber: paymentMethod === "CHEQUE" ? chequeNumber || null : null,
      bankId: paymentMethod === "CASH" ? null : selectedBank || null,
    };

    const updatedPayment = await handleRequestSubmit(
      payload,
      setSubmitLoading,
      `/main/payments/${paymentId}/edit`,
      false,
      "جاري تحديث  طريقة الدفع"
    );

    if (updatedPayment) {
      onSave(updatedPayment);
      handleClose();
    }
  };

  const showBankSelect = paymentMethod !== "CASH";

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={modalBoxSx}>
        <Typography id="edit-payment-method-modal" variant="h6" component="h2">
          تعديل طريقة الدفع
        </Typography>

        <FormControl fullWidth margin="normal">
          <InputLabel>طريقة الدفع</InputLabel>
          <Select
            value={paymentMethod || ""}
            label="طريقة الدفع"
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <MenuItem value="CASH">كاش</MenuItem>
            <MenuItem value="BANK">تحويل بنكي</MenuItem>
            <MenuItem value="CHEQUE">شيك</MenuItem>
          </Select>
        </FormControl>

        {paymentMethod === "CHEQUE" && (
          <TextField
            label="رقم الشيك"
            value={chequeNumber}
            onChange={(e) => setChequeNumber(e.target.value)}
            fullWidth
            margin="normal"
          />
        )}

        {showBankSelect && (
          <FormControl fullWidth margin="normal" disabled={loadingData}>
            <InputLabel id="bank">البنك</InputLabel>
            <Select
              labelId="bank"
              value={selectedBank || ""}
              label="البنك"
              onChange={(e) => setSelectedBank(e.target.value)}
              displayEmpty
            >
              {banks.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name} — {b.city}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {showBankSelect && item?.property?.bank?.name && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            ملاحظة: هذا العقار مرتبط ببنك «{item.property.bank.name}».
          </Typography>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          sx={{ mt: 2 }}
          fullWidth
        >
          تعديل
        </Button>
      </Box>
    </Modal>
  );
}
