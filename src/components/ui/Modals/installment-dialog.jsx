import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Modal,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useToastContext } from "@/app/context/ToastLoading/ToastLoadingProvider";
import { handleRequestSubmit } from "@/helpers/functions/handleRequestSubmit";
import dayjs from "dayjs";
import { PaymentStatus } from "@/config/Enums";
import { formatCurrencyAED } from "@/helpers/functions/convertMoneyToArabic";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import WarningIcon from '@mui/icons-material/Warning';

const InstallmentsPaymentMethodDialog = ({
  open,
  handleClose,
  rentAgreement,
  onSave,
}) => {
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { setLoading: setSubmitLoading } = useToastContext();

  useEffect(() => {
    if (open && rentAgreement) {
      fetchInstallments();
    }
  }, [open, rentAgreement]);

  const fetchInstallments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/main/rentAgreements/${rentAgreement.id}/installments`);
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
    const updatedInstallments = [...installments];
    updatedInstallments[index].paymentTypeMethod = value;
    
    // Clear cheque number if the payment method is not CHEQUE
    if (value !== "CHEQUE") {
      updatedInstallments[index].chequeNumber = null;
    }
    
    setInstallments(updatedInstallments);
  };

  const handleChequeNumberChange = (index, value) => {
    const updatedInstallments = [...installments];
    updatedInstallments[index].chequeNumber = value;
    setInstallments(updatedInstallments);
  };

  const handlePaymentStatusChange = async (installment) => {
    // Toggle the payment status
    const newStatus = installment.status === "PAID" ? "PENDING" : "PAID";
    
    try {
      // For marking as paid, we need to ensure payment method is set
      if (newStatus === "PAID" && !installment.paymentTypeMethod) {
        setError("يرجى تحديد طريقة الدفع قبل تغيير الحالة إلى مدفوع");
        return;
      }
      
      // If marking as paid and payment method is CHEQUE but no cheque number
      if (newStatus === "PAID" && installment.paymentTypeMethod === "CHEQUE" && !installment.chequeNumber?.trim()) {
        setError("يرجى إدخال رقم الشيك قبل تغيير الحالة إلى مدفوع");
        return;
      }

      const data = {
        status: newStatus,
        // If marking as paid, set the paidAmount to the full amount
        paidAmount: newStatus === "PAID" ? installment.amount : 0,
        paymentTypeMethod: installment.paymentTypeMethod,
        chequeNumber: installment.paymentTypeMethod === "CHEQUE" ? installment.chequeNumber : null,
      };
      
      // Add bank info if available
      if (rentAgreement && rentAgreement.unit && rentAgreement.unit.property && rentAgreement.unit.property.bankId) {
        data.bankId = rentAgreement.unit.property.bankId;
        if (rentAgreement.unit.property.bankAccount && rentAgreement.unit.property.bankAccount.length > 0) {
          data.bankAccount = rentAgreement.unit.property.bankAccount[0]?.id;
        }
      }

      const updatedItem = await handleRequestSubmit(
        data,
        setSubmitLoading,
        `main/payments/${installment.id}/edit`,
        false,
        `جاري تحديث حالة الدفع إلى ${newStatus === "PAID" ? "مدفوع" : "غير مدفوع"}`
      );

      if (updatedItem) {
        // Update the installment in the local state
        const updatedInstallments = installments.map(item => 
          item.id === installment.id ? { ...item, status: newStatus, paidAmount: newStatus === "PAID" ? item.amount : 0 } : item
        );
        setInstallments(updatedInstallments);
        setError("");
      }
    } catch (err) {
      console.error("Error updating payment status:", err);
      setError("حدث خطأ أثناء تحديث حالة الدفع");
    }
  };

  const handleSaveInstallment = async (installment) => {
    // Validate input
    if (installment.paymentTypeMethod === "CHEQUE" && !installment.chequeNumber?.trim()) {
      setError("يرجى إدخال رقم الشيك للدفعات المحددة بطريقة شيك");
      return false;
    }

    const data = {
      paymentTypeMethod: installment.paymentTypeMethod,
      chequeNumber: installment.paymentTypeMethod === "CHEQUE" ? installment.chequeNumber : null,
    };
    
    // Add bank info if available
    if (rentAgreement && rentAgreement.unit && rentAgreement.unit.property && rentAgreement.unit.property.bankId) {
      data.bankId = rentAgreement.unit.property.bankId;
      if (rentAgreement.unit.property.bankAccount && rentAgreement.unit.property.bankAccount.length > 0) {
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
        // Update the installment in the local state
        const updatedInstallments = installments.map(item => 
          item.id === installment.id ? { ...item, ...data } : item
        );
        setInstallments(updatedInstallments);
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
    let hasError = false;
    
    // Validate all CHEQUE payments have cheque numbers
    const invalidChequePayment = installments.find(
      inst => inst.paymentTypeMethod === "CHEQUE" && !inst.chequeNumber?.trim()
    );
    
    if (invalidChequePayment) {
      setError("يرجى إدخال رقم الشيك لجميع الدفعات المحددة بطريقة شيك");
      return;
    }
    
    // Save each installment payment method
    for (const installment of installments) {
      const success = await handleSaveInstallment(installment);
      if (!success) {
        hasError = true;
        break;
      }
    }
    
    if (!hasError) {
      if (onSave) {
        onSave(installments);
      }
      handleClose();
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PAID":
        return <CheckCircleOutlineIcon sx={{ color: "green" }} />;
      case "PENDING":
        return <HourglassEmptyIcon sx={{ color: "orange" }} />;
      case "OVERDUE":
        return <WarningIcon sx={{ color: "red" }} />;
      default:
        return null;
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
          width: "90%",
          maxWidth: 800,
          maxHeight: "80vh",
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          borderRadius: 1,
          overflow: "auto",
        }}
      >
        <Typography id="installments-payment-method-dialog" variant="h6" component="h2" mb={2}>
          تعديل طريقة الدفع وحالة الدفعات
        </Typography>
        
        <Typography variant="body2" color="text.secondary" mb={2}>
          يمكنك تعديل طريقة الدفع وحالة كل دفعة على حدة
        </Typography>
        
        <Divider sx={{ mb: 2 }} />
        
        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 1, mb: 2 }}>
            {error}
          </Typography>
        )}
        
        {loading ? (
          <Typography>جاري تحميل الدفعات...</Typography>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: "auto" }}>
            <Table stickyHeader sx={{ minWidth: 650 }} aria-label="installments table">
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
                {installments.map((installment, index) => (
                  <TableRow key={installment.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{dayjs(installment.dueDate).format("DD/MM/YYYY")}</TableCell>
                    <TableCell>{formatCurrencyAED(installment.amount.toFixed(2))}</TableCell>
                    <TableCell>{formatCurrencyAED(installment.paidAmount.toFixed(2))}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(installment.status)}
                        <Typography
                          variant="body2"
                          sx={{
                            color:
                              installment.status === "PAID"
                                ? "green"
                                : installment.status === "PENDING"
                                  ? "orange"
                                  : "red",
                            fontWeight: "bold",
                          }}
                        >
                          {PaymentStatus[installment.status]}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <FormControl fullWidth size="small">
                        <Select
                          value={installment.paymentTypeMethod || "CASH"}
                          onChange={(e) => handlePaymentMethodChange(index, e.target.value)}
                        >
                          <MenuItem value="CASH">كاش</MenuItem>
                          <MenuItem value="BANK">تحويل بنكي</MenuItem>
                          <MenuItem value="CHEQUE">شيك</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      {installment.paymentTypeMethod === "CHEQUE" ? (
                        <TextField
                          size="small"
                          fullWidth
                          value={installment.chequeNumber || ""}
                          onChange={(e) => handleChequeNumberChange(index, e.target.value)}
                          placeholder="رقم الشيك"
                        />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={installment.status === "PAID" ? "تغيير إلى غير مدفوع" : "تغيير إلى مدفوع"}>
                        <Button
                          variant="contained"
                          color={installment.status === "PAID" ? "error" : "success"}
                          size="small"
                          onClick={() => handlePaymentStatusChange(installment)}
                        >
                          {installment.status === "PAID" ? "إلغاء الدفع" : "تم الدفع"}
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
          <Button variant="contained" color="primary" onClick={handleSaveAll} disabled={loading}>
            حفظ التغييرات
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default InstallmentsPaymentMethodDialog;
