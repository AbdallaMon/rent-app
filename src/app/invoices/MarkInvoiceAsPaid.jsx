"use client";
import React, { useState, useCallback } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Stack,
} from "@mui/material";
import { FiCheckCircle } from "react-icons/fi";
import { handleRequestSubmit } from "@/helpers/functions/handleRequestSubmit";
import { useToastContext } from "../context/ToastLoading/ToastLoadingProvider";

export default function MarkInvoicePaidDialog({
  invoiceId,
  onSuccess,
  buttonText = "تحديد كمدفوعة",
  disabled = false,
  invoiceNumber,
}) {
  const [open, setOpen] = useState(false);
  const { loading: submitting, setLoading: setSubmitting } = useToastContext();
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    if (!submitting) setOpen(false);
  };

  const handleConfirm = useCallback(async () => {
    if (!invoiceId) return;
    const req = await handleRequestSubmit(
      { invoiceId },
      setSubmitting,
      `main/billing-invoices/${invoiceId}`,
      false,
      "جارٍ التحديث…",
      "PUT" // أبقيتها كما هي حسب كودك الحالي
    );
    if (req?.status === 200) {
      setOpen(false);
      if (typeof onSuccess === "function") onSuccess();
    }
  }, [invoiceId, onSuccess]);

  return (
    <>
      <Button
        variant="contained"
        color="secondary"
        startIcon={<FiCheckCircle />}
        onClick={handleOpen}
        disabled={disabled || !invoiceId}
      >
        {buttonText}
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="confirm-paid-title"
        aria-describedby="confirm-paid-desc"
      >
        <DialogTitle id="confirm-paid-title">تأكيد السداد</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            <DialogContentText id="confirm-paid-desc">
              هل أنت متأكد من تعليم الفاتورة رقم {String(invoiceNumber)}{" "}
              كمدفوعة؟ سيؤدي ذلك إلى تغيير حالتها إلى <b>مدفوعة</b>.
            </DialogContentText>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button onClick={handleClose} disabled={submitting}>
            إلغاء
          </Button>
          <Button
            onClick={handleConfirm}
            color="success"
            variant="contained"
            disabled={submitting}
            startIcon={!submitting ? <FiCheckCircle /> : null}
          >
            {submitting ? (
              <Stack direction="row" alignItems="center" spacing={1}>
                <CircularProgress size={18} />
                <span>جارٍ الحفظ…</span>
              </Stack>
            ) : (
              "تأكيد"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
