"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import WarningIcon from "@mui/icons-material/Warning";
import dayjs from "dayjs";
import { useToastContext } from "@/app/context/ToastLoading/ToastLoadingProvider";
import { handleRequestSubmit } from "@/helpers/functions/handleRequestSubmit";
import { PaymentStatus } from "@/config/Enums";
import { formatCurrencyAED } from "@/helpers/functions/convertMoneyToArabic";

const modalBoxSx = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "92vw",
  maxWidth: 900,
  maxHeight: "85vh",
  bgcolor: "background.paper",
  border: 1,
  borderColor: "divider",
  borderRadius: 2,
  boxShadow: 24,
  p: { xs: 2, sm: 3 },
  overflow: "auto",
};

export default function InstallmentsPaymentMethodDialog({
  open,
  handleClose,
  rentAgreement,
  onSave,
}) {
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { setLoading: setSubmitLoading } = useToastContext();

  useEffect(() => {
    if (open && rentAgreement) {
      fetchInstallments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rentAgreement]);

  const fetchInstallments = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/main/rentAgreements/${rentAgreement.id}/installments`
      );
      if (!response.ok) throw new Error("Failed to fetch installments");
      const data = await response.json();
      setInstallments(data.data || []);
      setError("");
    } catch (err) {
      console.error("Error fetching installments:", err);
      setError("حدث خطأ أثناء جلب الدفعات");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodChange = (index, value) => {
    const updated = [...installments];
    updated[index].paymentTypeMethod = value;
    if (value !== "CHEQUE") updated[index].chequeNumber = null;
    setInstallments(updated);
  };

  const handleChequeNumberChange = (index, value) => {
    const updated = [...installments];
    updated[index].chequeNumber = value;
    setInstallments(updated);
  };

  const handlePaymentStatusChange = async (installment) => {
    const newStatus = installment.status === "PAID" ? "PENDING" : "PAID";
    try {
      if (newStatus === "PAID" && !installment.paymentTypeMethod) {
        setError("يرجى تحديد طريقة الدفع قبل تغيير الحالة إلى مدفوع");
        return;
      }
      if (
        newStatus === "PAID" &&
        installment.paymentTypeMethod === "CHEQUE" &&
        !installment.chequeNumber?.trim()
      ) {
        setError("يرجى إدخال رقم الشيك قبل تغيير الحالة إلى مدفوع");
        return;
      }

      const data = {
        status: newStatus,
        paidAmount: newStatus === "PAID" ? installment.amount : 0,
        paymentTypeMethod: installment.paymentTypeMethod,
        chequeNumber:
          installment.paymentTypeMethod === "CHEQUE"
            ? installment.chequeNumber
            : null,
      };

      if (rentAgreement?.unit?.property?.bankId) {
        data.bankId = rentAgreement.unit.property.bankId;
        if (
          rentAgreement.unit.property.bankAccount &&
          rentAgreement.unit.property.bankAccount.length > 0
        ) {
          data.bankAccount = rentAgreement.unit.property.bankAccount[0]?.id;
        }
      }

      const updatedItem = await handleRequestSubmit(
        data,
        setSubmitLoading,
        `main/payments/${installment.id}/edit`,
        false,
        `جاري تحديث حالة الدفع إلى ${
          newStatus === "PAID" ? "مدفوع" : "غير مدفوع"
        }`
      );

      if (updatedItem) {
        const updated = installments.map((i) =>
          i.id === installment.id
            ? {
                ...i,
                status: newStatus,
                paidAmount: newStatus === "PAID" ? i.amount : 0,
              }
            : i
        );
        setInstallments(updated);
        setError("");
      }
    } catch (err) {
      console.error("Error updating payment status:", err);
      setError("حدث خطأ أثناء تحديث حالة الدفع");
    }
  };

  const handleSaveInstallment = async (installment) => {
    if (
      installment.paymentTypeMethod === "CHEQUE" &&
      !installment.chequeNumber?.trim()
    ) {
      setError("يرجى إدخال رقم الشيك للدفعات المحددة بطريقة شيك");
      return false;
    }

    const data = {
      paymentTypeMethod: installment.paymentTypeMethod,
      chequeNumber:
        installment.paymentTypeMethod === "CHEQUE"
          ? installment.chequeNumber
          : null,
    };

    if (rentAgreement?.unit?.property?.bankId) {
      data.bankId = rentAgreement.unit.property.bankId;
      if (
        rentAgreement.unit.property.bankAccount &&
        rentAgreement.unit.property.bankAccount.length > 0
      ) {
        data.bankAccount = rentAgreement.unit.property.bankAccount[0]?.id;
      }
    }

    try {
      const updatedItem = await handleRequestSubmit(
        data,
        setSubmitLoading,
        `main/payments/${installment.id}/edit`,
        false,
        "جاري تحديث طريقة الدفع"
      );

      if (updatedItem) {
        const updated = installments.map((i) =>
          i.id === installment.id ? { ...i, ...data } : i
        );
        setInstallments(updated);
        setError("");
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error updating payment method:", err);
      setError("حدث خطأ أثناء تحديث طريقة الدفع");
      return false;
    }
  };

  const handleSaveAll = async () => {
    setError("");
    const invalid = installments.find(
      (inst) =>
        inst.paymentTypeMethod === "CHEQUE" && !inst.chequeNumber?.trim()
    );
    if (invalid) {
      setError("يرجى إدخال رقم الشيك لجميع الدفعات المحددة بطريقة شيك");
      return;
    }

    for (const inst of installments) {
      const ok = await handleSaveInstallment(inst);
      if (!ok) return;
    }

    if (onSave) onSave(installments);
    handleClose();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PAID":
        return <CheckCircleOutlineIcon sx={{ color: "success.main" }} />;
      case "PENDING":
        return <HourglassEmptyIcon sx={{ color: "warning.main" }} />;
      case "OVERDUE":
        return <WarningIcon sx={{ color: "error.main" }} />;
      default:
        return null;
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={modalBoxSx}>
        <Typography variant="h6" mb={1}>
          تعديل طريقة الدفع وحالة الدفعات
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          يمكنك تعديل طريقة الدفع وحالة كل دفعة على حدة
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {error && (
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {loading ? (
          <Typography>جاري تحميل الدفعات...</Typography>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
            <Table stickyHeader size="small" aria-label="installments table">
              <TableHead>
                <TableRow>
                  <TableCell>رقم الدفعة</TableCell>
                  <TableCell>ميعاد الدفع</TableCell>
                  <TableCell>قيمة الدفعة</TableCell>
                  <TableCell>ما تم دفعه</TableCell>
                  <TableCell>الحالة</TableCell>
                  <TableCell>طريقة الدفع</TableCell>
                  <TableCell>رقم الشيك</TableCell>
                  <TableCell>تغيير الحالة</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {installments.map((inst, index) => (
                  <TableRow key={inst.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      {dayjs(inst.dueDate).format("DD/MM/YYYY")}
                    </TableCell>
                    <TableCell>
                      {formatCurrencyAED(Number(inst.amount).toFixed(2))}
                    </TableCell>
                    <TableCell>
                      {formatCurrencyAED(Number(inst.paidAmount).toFixed(2))}
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {getStatusIcon(inst.status)}
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: "bold",
                            color:
                              inst.status === "PAID"
                                ? "success.main"
                                : inst.status === "PENDING"
                                  ? "warning.main"
                                  : "error.main",
                          }}
                        >
                          {PaymentStatus[inst.status]}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <FormControl fullWidth size="small">
                        <InputLabel>طريقة الدفع</InputLabel>
                        <Select
                          label="طريقة الدفع"
                          value={inst.paymentTypeMethod || "CASH"}
                          onChange={(e) =>
                            handlePaymentMethodChange(index, e.target.value)
                          }
                        >
                          <MenuItem value="CASH">كاش</MenuItem>
                          <MenuItem value="BANK">تحويل بنكي</MenuItem>
                          <MenuItem value="CHEQUE">شيك</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      {inst.paymentTypeMethod === "CHEQUE" ? (
                        <TextField
                          size="small"
                          fullWidth
                          value={inst.chequeNumber || ""}
                          onChange={(e) =>
                            handleChequeNumberChange(index, e.target.value)
                          }
                          placeholder="رقم الشيك"
                        />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip
                        title={
                          inst.status === "PAID"
                            ? "تغيير إلى غير مدفوع"
                            : "تغيير إلى مدفوع"
                        }
                      >
                        <Button
                          variant="contained"
                          color={inst.status === "PAID" ? "error" : "success"}
                          size="small"
                          onClick={() => handlePaymentStatusChange(inst)}
                        >
                          {inst.status === "PAID" ? "إلغاء الدفع" : "تم الدفع"}
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
          <Button variant="outlined" onClick={handleClose}>
            إلغاء
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveAll}
            disabled={loading}
          >
            حفظ التغييرات
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
