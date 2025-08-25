"use client";
import TableFormProvider, {
  useTableForm,
} from "@/app/context/TableFormProvider/TableFormProvider";
import { useDataFetcher } from "@/helpers/hooks/useDataFetcher";
import React, { useEffect, useRef, useState } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  GlobalStyles,
  Modal,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";

import dayjs from "dayjs";
import { getData } from "@/helpers/functions/getData";
import { PaymentModal } from "@/components/ui/Modals/PaymentModal";
import { DataCard } from "@/components/RentDataCard";
import { PaymentStatus, PaymentType } from "@/config/Enums";
import { updatePayment } from "@/services/client/updatePayment";
import { useToastContext } from "@/app/context/ToastLoading/ToastLoadingProvider";
import { useReactToPrint } from "react-to-print";
import { handleRequestSubmit } from "@/helpers/functions/handleRequestSubmit";
import { CancelRent } from "@/components/ui/Modals/CancelRentModal";
import { RenewRent } from "@/components/ui/Modals/RenewRent";

import { formatCurrencyAED } from "@/helpers/functions/convertMoneyToArabic";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useSubmitLoader } from "@/app/context/SubmitLoaderProvider/SubmitLoaderProvider";
import AttachmentUploader from "@/components/Attatchment";
import EditPaymentMethodModal from "@/components/ui/Modals/EditPaymentMethod";

export default function PropertyPage({ params }) {
  const id = params.id;
  return <ViewWrapper urlId={id} />;
}

const ViewWrapper = ({ urlId }) => {
  const theme = useTheme();
  const { data, loading } = useDataFetcher("main/rentAgreements/" + urlId);
  const [contractExpenses, setContractExpenses] = useState(null);
  const [wait, setWait] = useState(true);

  useEffect(() => {
    if (data && !loading && typeof data === "object") {
      setContractExpenses(
        data.contractExpenses?.map((item) => item.contractExpense)
      );
      window.setTimeout(() => setWait(false), 100);
    }
  }, [data, loading]);

  const componentRef = useRef();
  const handlePrint = useReactToPrint({ content: () => componentRef.current });

  if (loading || typeof data !== "object" || wait) {
    return (
      <Box
        sx={{
          py: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!loading && Object.keys(data).length === 0) return null;

  const fullData = { ...data, contractExpenses };

  return (
    <Box ref={componentRef} sx={{ p: { xs: 1, sm: 2 } }}>
      {/* MUI GlobalStyles for print instead of a <style> tag */}
      <GlobalStyles
        styles={{
          "@media print": {
            body: { padding: "15px" },
            ".MuiButton-root": { display: "none !important" },
          },
        }}
      />

      <DataCard data={fullData} />

      <TableFormProvider
        url={
          "main/payments/" +
          urlId +
          "?clientId=" +
          data.unit.property.client.id +
          "&"
        }
      >
        <Box sx={{ display: "flex", gap: 2, py: 2 }}>
          <RenewRent data={data} />
          {data?.status === "ACTIVE" && <CancelRent data={data} />}
        </Box>

        <Payments
          renter={data.renter}
          rentData={data}
          url={`main/rentAgreements/${urlId}/installments`}
          description={"فاتورة دفعة ايجار"}
          title={"فاتورة دفعة ايجار"}
          heading={"الدفعات"}
        />

        <Payments
          renter={data.renter}
          rentData={data}
          url={`main/rentAgreements/${urlId}/feeInvoices`}
          description={"فاتورة رسوم العقد"}
          title={"فاتورة رسوم العقد"}
          heading={"رسوم العقد"}
        />
      </TableFormProvider>

      <AttachmentUploader rentAgreementId={urlId} />

      <Button
        variant="contained"
        color="primary"
        onClick={handlePrint}
        sx={{ mt: 5 }}
      >
        طباعة الصفحة بالكامل
      </Button>
    </Box>
  );
};

const Payments = ({
  renter,
  rentData,
  url,
  title,
  description,
  heading,
  showName,
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [id, setId] = useState(null);
  const [modalInputs, setModalInputs] = useState([]);
  const { setOpenModal } = useTableForm();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editPayments, setEditPayments] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const { setLoading: setEditLoading } = useToastContext();

  useEffect(() => {
    async function fetchData() {
      const data = await getData({ url, setLoading, others: "" });
      setData(data?.data);
    }
    fetchData();
  }, [url]);

  const handleEditOpen = () => {
    setEditPayments(data);
    setEditModalOpen(true);
  };

  const handleEditClose = () => setEditModalOpen(false);

  const handleEditSave = async () => {
    const totalAmount = rentData.totalPrice;
    const editedTotal = editPayments.reduce(
      (acc, payment) => acc + payment.amount,
      0
    );

    if (totalAmount !== editedTotal) {
      setSnackbarMessage(
        `المجموع المعدل ${editedTotal} لا يساوي إجمالي المبلغ ${totalAmount}`
      );
      setSnackbarOpen(true);
      return;
    }

    try {
      const res = await handleRequestSubmit(
        editPayments,
        setEditLoading,
        "main/rentAgreements/" + rentData.id + "/edit",
        false,
        "جاري تحديث الدفعات..."
      );

      if (res) {
        setData(res.data);
        setEditModalOpen(false);
        setSnackbarMessage("تم تحديث الدفعات بنجاح!");
        setSnackbarOpen(true);
      } else {
        console.error("Failed to update payments");
      }
    } catch (error) {
      console.error("Failed to update payments", error);
    }
  };

  const handleEditChange = (index, key, value) => {
    const updatedPayments = [...editPayments];
    updatedPayments[index][key] = key === "amount" ? parseFloat(value) : value;
    setEditPayments(updatedPayments);
  };

  const { setLoading: setSubmitLoading } = useToastContext();
  const { setMessage, setSeverity, setOpen } = useSubmitLoader();

  async function submit(d) {
    const currentPayment = data.find((item) => item.id === id);
    d.paymentTypeMethod = currentPayment.paymentTypeMethod;
    d.chequeNumber = currentPayment.chequeNumber;

    const unit = {
      id: rentData.unit.id,
      number: rentData.unit.number,
      unitId: rentData.unit.unitId,
      client: {
        id: rentData.renter.id,
        name: rentData.renter.name,
      },
    };

    const rentAgreement = {
      rentAgreementNumber: rentData.rentAgreementNumber,
      unit,
    };

    currentPayment.rentAgreement = rentAgreement;

    if (d.paymentTypeMethod !== "CASH") {
      if (!currentPayment.property.bankAccount) {
        setOpen(true);
        setSeverity("error");
        setMessage(
          "لا يمكن اتمام هذه العمليه ليس هناك حساب بنكي مرتبط بهذا العقار"
        );
        return null;
      }
    }

    const submitData = {
      ...d,
      currentPaidAmount: +currentPayment.paidAmount,
      id,
      amount: currentPayment.amount,
      propertyId: currentPayment.propertyId,
      rentAgreementId: currentPayment.rentAgreementId,
      installmentId: currentPayment.installmentId,
      renterId: rentData.renterId,
      ownerId: rentData.unit.property.client.id,
      title,
      description,
      invoiceType: currentPayment.paymentType,
      bankId: currentPayment.property.bankAccount
        ? currentPayment.property.bankAccount[0]?.id
        : null,
      bankAccount: currentPayment.property.bankAccount
        ? currentPayment.property.bankAccount?.id
        : null,
    };

    const newData = await updatePayment(submitData, setSubmitLoading);
    if (newData) {
      const updateData = data.map((item) =>
        item.id === id
          ? {
              ...newData.payment,
              invoices: [...item.invoices, newData.invoice],
            }
          : item
      );
      if (updateData) {
        setData(updateData);
        setOpenModal(false);
      }
    }
  }

  return (
    <Box sx={{ mt: 5 }}>
      <Typography variant="h5" gutterBottom>
        {heading}
      </Typography>

      {heading === "الدفعات" && (
        <Button
          variant="contained"
          color="primary"
          onClick={handleEditOpen}
          sx={{ mb: 2 }}
        >
          تعديل الدفعات
        </Button>
      )}

      {loading ? (
        <Box
          sx={{
            py: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: `1px solid`, borderColor: "divider", borderRadius: 2 }}
        >
          <Table sx={{ minWidth: 650 }} aria-label="payment table">
            <TableHead>
              <TableRow sx={{ backgroundColor: "action.hover" }}>
                <TableCell>دفعه رقم</TableCell>
                <TableCell>ميعاد الدفع</TableCell>
                {showName && <TableCell>اسم المصروف</TableCell>}
                <TableCell>قيمة الدفعه</TableCell>
                <TableCell>ما تم دفعه</TableCell>
                <TableCell>الباقي</TableCell>
                <TableCell>النوع</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell>تعديل طريقة الدفع</TableCell>
                <TableCell>دفع</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {data?.map((item, index) => (
                <React.Fragment key={item.id}>
                  <PaymentRow
                    setData={setData}
                    data={data}
                    item={item}
                    setId={setId}
                    setModalInputs={setModalInputs}
                    renter={renter}
                    showName={showName}
                    index={index + 1}
                  />
                  {item.invoices && item.invoices.length > 0 && (
                    <InvoiceRows invoices={item.invoices} index={index + 1} />
                  )}
                </React.Fragment>
              ))}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TableCell colSpan={9}>
                  <Typography
                    variant="body2"
                    align="center"
                    sx={{ py: 1.5, color: "text.secondary" }}
                  >
                    إجمالي المدفوعات:{" "}
                    {formatCurrencyAED(
                      data
                        .reduce((acc, item) => acc + item.paidAmount, 0)
                        .toFixed(2)
                    )}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      )}

      <PaymentModal
        id={id}
        modalInputs={modalInputs}
        submit={submit}
        setId={setId}
      />

      <Modal
        open={editModalOpen}
        onClose={handleEditClose}
        aria-labelledby="edit-payments-modal"
        aria-describedby="edit-payments-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: 360, sm: 520, md: 600 },
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 3,
            borderRadius: 2,
          }}
        >
          <Typography
            id="edit-payments-modal"
            variant="h6"
            component="h2"
            sx={{ mb: 2 }}
          >
            تعديل الدفعات
          </Typography>

          {editPayments.map((payment, index) => (
            <Box
              key={payment.id}
              sx={{
                my: 1.5,
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
              }}
            >
              <TextField
                label={`دفعة ${index + 1} - القيمة`}
                value={payment.amount}
                onChange={(e) =>
                  handleEditChange(index, "amount", e.target.value)
                }
                fullWidth
                type="number"
                InputProps={{
                  inputProps: { min: 0 },
                  readOnly: payment.status === "PAID",
                }}
              />
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label={`دفعة ${index + 1} - ميعاد الدفع`}
                  value={dayjs(payment.dueDate)}
                  onChange={(date) => handleEditChange(index, "dueDate", date)}
                  slotProps={{ textField: { fullWidth: true } }}
                  format="DD/MM/YYYY"
                />
              </LocalizationProvider>
            </Box>
          ))}

          <Button
            variant="contained"
            color="primary"
            onClick={handleEditSave}
            sx={{ mt: 2 }}
          >
            حفظ
          </Button>
        </Box>
      </Modal>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="error"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const PaymentRow = ({
  item,
  setModalInputs,
  setId,
  index,
  showName,
  data,
  setData,
}) => {
  const theme = useTheme();
  const { setOpenModal } = useTableForm();
  const [editPaymentMethodModal, setPaymentMethodModal] = useState(false);
  const [editPaymentId, setEditPaymentId] = useState(null);
  const [editPaymentMethod, setEditPaymentMethod] = useState(
    item.paymentTypeMethod ? item.paymentTypeMethod : "CASH"
  );
  const [editChequeNumber, setEditChequeNumber] = useState(
    item.chequeNumber ? item.chequeNumber : ""
  );

  async function handleSavePaymentMethod(newItem) {
    const editedData = data.map((row) =>
      row.id === newItem.id
        ? {
            ...row,
            paymentTypeMethod: newItem.paymentTypeMethod,
            chequeNumber: newItem.chequeNumber,
          }
        : row
    );
    setData(editedData);
  }

  const modalInputs = [
    {
      data: {
        name: "paidAmount",
        label: "القيمة المراد دفعها",
        type: "number",
        id: "paidAmount",
        defaultValue: (item.amount - item.paidAmount).toFixed(2),
      },
      pattern: {
        required: { value: true, message: "يرجى إدخال القيمة المراد دفعها" },
        sx: {
          width: { xs: "100%", sm: "68%" },
          mr: "auto",
        },
        max: {
          value: item.amount - item.paidAmount,
          message: `القيمة المراد دفعها يجب أن تكون أقل من ${item.amount - item.paidAmount} والتي هي القيمة المتبقية لهذه الدفعة`,
        },
      },
    },
    {
      data: {
        id: "timeOfPayment",
        type: "date",
        label: " تاريخ الدفع",
        name: "timeOfPayment",
      },
      value: dayjs().format("YYYY-MM-DD"),
      pattern: {
        required: { value: true, message: "يرجى إدخال تاريخ الدفع" },
      },
      sx: {
        width: { xs: "100%", sm: "30%" },
      },
    },
  ];

  const statusColor =
    item.status === "PAID"
      ? theme.palette.success.main
      : item.status === "PENDING"
        ? theme.palette.warning.main
        : theme.palette.error.main;

  return (
    <>
      <TableRow hover>
        <TableCell>{index}</TableCell>
        <TableCell>{dayjs(item.dueDate).format("DD/MM/YYYY")}</TableCell>
        {showName && <TableCell>{item.title}</TableCell>}
        <TableCell>{formatCurrencyAED(item.amount.toFixed(2))}</TableCell>
        <TableCell>{formatCurrencyAED(item.paidAmount.toFixed(2))}</TableCell>
        <TableCell>
          {formatCurrencyAED((item.amount - item.paidAmount).toFixed(2))}
        </TableCell>
        <TableCell>{PaymentType[item.paymentType]}</TableCell>
        <TableCell>
          <Typography
            variant="body2"
            sx={{ color: statusColor, fontWeight: "bold" }}
          >
            {PaymentStatus[item.status]}
          </Typography>
        </TableCell>
        <TableCell>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setEditPaymentId(item.id);
              setEditPaymentMethod(item.paymentTypeMethod || "CASH");
              setEditChequeNumber(item.chequeNumber || "");
              setPaymentMethodModal(true);
            }}
          >
            طريقة الدفع
          </Button>
        </TableCell>
        <TableCell>
          {item.status !== "PAID" && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setId(item.id);
                setModalInputs(modalInputs);
                setTimeout(() => setOpenModal(true), 50);
              }}
            >
              دفع
            </Button>
          )}
        </TableCell>
      </TableRow>

      <EditPaymentMethodModal
        open={editPaymentMethodModal}
        handleClose={() => setPaymentMethodModal(false)}
        paymentId={editPaymentId}
        item={item}
        currentMethod={editPaymentMethod}
        currentChequeNumber={editChequeNumber}
        onSave={handleSavePaymentMethod}
      />
    </>
  );
};

const InvoiceRows = ({ invoices, index }) => {
  const theme = useTheme();
  return invoices.map((invoice) => (
    <TableRow key={invoice.id} sx={{ backgroundColor: "action.selected" }}>
      <TableCell colSpan={8} sx={{ p: 0 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr 1fr 1fr 2fr 1fr 1fr",
            },
            gap: 1,
            p: 1.5,
            bgcolor: "action.hover",
            borderRadius: 1,
          }}
        >
          <Typography variant="subtitle1" sx={{ color: "text.primary" }}>
            {index}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            تاريخ الدفع: {dayjs(invoice.createdAt).format("DD/MM/YYYY")}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            القيمة: {invoice.amount}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            طريقة الدفع:{" "}
            {invoice.paymentTypeMethod === "CASH"
              ? "كاش"
              : invoice.paymentTypeMethod === "BANK"
                ? "تحويل بنكي"
                : "شيك"}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {invoice.paymentTypeMethod === "BANK" && invoice.bankAccount && (
              <>رقم حساب المالك: {invoice.bankAccount.accountNumber}</>
            )}
            {invoice.chequeNumber && (
              <>
                {" "}
                {invoice.paymentTypeMethod === "BANK" && " - "}رقم الشيك:{" "}
                {invoice.chequeNumber}
              </>
            )}
          </Typography>
        </Box>
      </TableCell>
    </TableRow>
  ));
};
