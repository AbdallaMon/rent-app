import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { useTableForm } from "@/app/context/TableFormProvider/TableFormProvider";
import { getData } from "@/helpers/functions/getData";
import { updatePayment } from "@/services/client/updatePayment";
import { useToastContext } from "@/app/context/ToastLoading/ToastLoadingProvider";
import { PaymentModal } from "@/components/ui/Modals/PaymentModal";
import dayjs from "dayjs";
import { PaymentStatus, PaymentType } from "@/config/Enums";

const Payments = ({ renter, rentData, url, title, description, heading }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [id, setId] = useState(null);
  const [modalInputs, setModalInputs] = useState([]);
  const { setOpenModal } = useTableForm();

  useEffect(() => {
    async function fetchData() {
      const data = await getData({
        url: url,
        setLoading,
        others: "",
      });
      setData(data?.data);
    }

    fetchData();
  }, [url]);

  const { setLoading: setSubmitLoading } = useToastContext();

  async function submit(d) {
    const currentPayment = data.find((item) => item.id === id);
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
      title: title,
      description: description,
      invoiceType: currentPayment.paymentType,
    };

    const newData = await updatePayment(submitData, setSubmitLoading);
    const updateData = data.map((item) => {
      if (item.id === id) {
        return newData.payment;
      }
      return item;
    });
    setData(updateData);
    setOpenModal(false);
  }

  return (
    <Box sx={{ mt: 5 }}>
      <Typography variant="h5" gutterBottom>
        {heading}
      </Typography>
      {loading ? (
        <div>loading...</div>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="payments table">
            <TableHead>
              <TableRow>
                <TableCell>اسم المصروف</TableCell>
                <TableCell align="right">ميعاد الدفع</TableCell>
                <TableCell align="right">قيمة الدفعه</TableCell>
                <TableCell align="right">ما تم دفعه</TableCell>
                <TableCell align="right">الباقي</TableCell>
                <TableCell align="right">النوع</TableCell>
                <TableCell align="right">الحالة</TableCell>
                <TableCell align="right">الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell component="th" scope="row">
                    {item.paymentType === "OTHER_EXPENSE" ? item.title : "-"}
                  </TableCell>
                  <TableCell align="right">
                    {dayjs(item.dueDate).format("DD/MM/YYYY")}
                  </TableCell>
                  <TableCell align="right">{item.amount.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    {item.paidAmount.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    {(item.amount - item.paidAmount).toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    {PaymentType[item.paymentType]}
                  </TableCell>
                  <TableCell align="right">
                    {PaymentStatus[item.status]}
                  </TableCell>
                  <TableCell align="right">
                    {item.status !== "PAID" && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                          setId(item.id);
                          setModalInputs(modalInputs);
                          setTimeout(() => {
                            setOpenModal(true);
                          }, 50);
                        }}
                      >
                        دفع
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <PaymentModal id={id} modalInputs={modalInputs} submit={submit} />
    </Box>
  );
};

export default Payments;
