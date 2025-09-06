"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { FiRotateCcw } from "react-icons/fi";
import { MobileDatePicker } from "@mui/x-date-pickers";
import { handleRequestSubmit } from "@/helpers/functions/handleRequestSubmit";

export function RefundSecurityDepositButton({
  deposit,
  amount,
  onSuccess,
  buttonText = "استرجاع الوديعة",
}) {
  const [open, setOpen] = useState(false);
  const [refundedAt, setRefundedAt] = useState(dayjs());
  const [deductedAmount, setDeductedAmount] = useState("");
  const [refundedAmount, setRefundedAmount] = useState("");
  const [deductionReason, setDeductionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const parsedDeducted = Number(deductedAmount || 0);
  const parsedRefunded = Number(refundedAmount || 0);
  const totalEntered = parsedDeducted + parsedRefunded;

  const validationError = useMemo(() => {
    if (isNaN(parsedDeducted) || isNaN(parsedRefunded))
      return "القيم يجب أن تكون أرقاماً صحيحة.";
    if (parsedDeducted < 0 || parsedRefunded < 0)
      return "لا يُسمح بالقيم السالبة.";
    if (amount == null) return "قيمة الوديعة غير محددة.";
    if (totalEntered !== Number(amount)) {
      return `المجموع (${totalEntered.toLocaleString()}) يجب أن يساوي قيمة الوديعة (${Number(
        amount
      ).toLocaleString()}).`;
    }
    return "";
  }, [parsedDeducted, parsedRefunded, amount, totalEntered]);

  const remaining = useMemo(
    () => Number(amount || 0) - totalEntered,
    [amount, totalEntered]
  );

  const resetForm = () => {
    setRefundedAt(dayjs());
    setDeductedAmount("");
    setRefundedAmount("");
    setDeductionReason("");
    setErrorMsg("");
  };

  const handleOpen = () => {
    resetForm();
    setOpen(true);
  };
  const handleClose = () => {
    if (!submitting) setOpen(false);
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    const res = await handleRequestSubmit(
      {
        depositId: deposit.id,
        refund: refundedAmount,
        deduct: deductedAmount,
        reason: deductionReason,
        paymentId: deposit.paymentId,
        refundedAt,
      },
      setSubmitting,
      `main/security-deposits/${deposit.id}`,
      false,
      "جاري تنفيذ العملية"
    );
    if (res.status === 200) {
      onSuccess();
      setErrorMsg("");
      handleClose();
    }
  };

  return (
    <>
      <Button variant="contained" onClick={handleOpen} sx={{ borderRadius: 5 }}>
        {buttonText}
      </Button>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>استرجاع / تسوية الوديعة</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              قيمة الوديعة: <b>{Number(amount || 0).toLocaleString()}</b>
            </Typography>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <MobileDatePicker
                label="تاريخ الاسترجاع"
                value={refundedAt}
                onChange={(d) => setRefundedAt(d)}
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
              />
            </LocalizationProvider>

            <TextField
              label="مبلغ الخصم (اختياري)"
              value={deductedAmount}
              onChange={(e) => setDeductedAmount(e.target.value)}
              type="number"
              fullWidth
              size="small"
              inputProps={{ min: 0, step: "0.01" }}
            />

            <TextField
              label="الكمية المُرجَّعة"
              value={refundedAmount}
              onChange={(e) => setRefundedAmount(e.target.value)}
              type="number"
              fullWidth
              size="small"
              inputProps={{ min: 0, step: "0.01" }}
            />

            <TextField
              label="سبب الخصم (اختياري)"
              value={deductionReason}
              onChange={(e) => setDeductionReason(e.target.value)}
              fullWidth
              size="small"
              multiline
              minRows={2}
            />

            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography
                variant="body2"
                color={remaining === 0 ? "success.main" : "error.main"}
              >
                المتبقي: {remaining.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                المجموع المدخل: {totalEntered.toLocaleString()}
              </Typography>
            </Box>

            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
            {validationError && !errorMsg && (
              <Alert severity="warning">{validationError}</Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>
            إلغاء
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || !!validationError}
          >
            {submitting ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : (
              "تنفيذ الاسترجاع"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
