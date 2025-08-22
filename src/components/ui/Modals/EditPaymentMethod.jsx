import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Modal,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { useToastContext } from "@/app/context/ToastLoading/ToastLoadingProvider";
import { handleRequestSubmit } from "@/helpers/functions/handleRequestSubmit";

const EditPaymentMethodModal = ({
  open,
  handleClose,
  paymentId,
  currentMethod,
  currentChequeNumber,
  onSave,
                                  item
}) => {
  const [paymentMethod, setPaymentMethod] = useState(currentMethod);
  const [chequeNumber, setChequeNumber] = useState(currentChequeNumber);
  const { setLoading: setSubmitLoading } = useToastContext();

  const handleSave = async () => {
    const data = {
      paymentTypeMethod: paymentMethod,
      chequeNumber: paymentMethod === "CHEQUE" ? chequeNumber : null,
      bankId: item.property.bankId,
    };
    const updatedPayment = await handleRequestSubmit(
      data,
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

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          borderRadius: 1,
        }}
      >
        <Typography id="edit-payment-method-modal" variant="h6" component="h2">
          تعديل طريقة الدفع
        </Typography>
        <FormControl fullWidth margin="normal">
          <InputLabel> طريقة الدفع</InputLabel>
          <Select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <MenuItem value="CASH">كاش</MenuItem>
            <MenuItem value="BANK">تحويل بنكي</MenuItem>
            <MenuItem value="CHEQUE">شيك</MenuItem>
          </Select>
        </FormControl>
        {paymentMethod === "CHEQUE" && (
          <TextField
            label="رقم الشيك "
            value={chequeNumber}
            onChange={(e) => setChequeNumber(e.target.value)}
            fullWidth
            margin="normal"
          />
        )}
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          sx={{ mt: 2 }}
        >
          تعديل
        </Button>
      </Box>
    </Modal>
  );
};

export default EditPaymentMethodModal;

async function updatePaymentMethod(paymentId, data) {
  const response = await fetch(`/api/payments/${paymentId}/update-method`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update payment method");
  }

  return response.json();
}
