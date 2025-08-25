"use client";
import React, { useState } from "react";
import { Box, Button, Modal, Stack, Typography, useTheme } from "@mui/material";
import { useToastContext } from "@/app/context/ToastLoading/ToastLoadingProvider";
import { useRouter } from "next/navigation";
import { submitRentAgreement } from "@/services/client/createRentAgreement";

export const CancelRent = ({ data, setData }) => {
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelData, setCancelData] = useState(null);
  const { setLoading: setSubmitLoading } = useToastContext();
  const router = useRouter();

  const handleOpenCancelModal = (rentData) => {
    setCancelData(rentData);
    setCancelModalOpen(true);
  };

  const handleCloseCancelModal = () => {
    setCancelModalOpen(false);
    setCancelData(null);
  };

  const handleCancelConfirm = async () => {
    await submitRentAgreement(
      { ...cancelData, canceling: true },
      setSubmitLoading,
      "PUT",
      [
        {
          route: `/${cancelData.id}?installments=true`,
          message: "جاري البحث عن اي دفعات لم يتم استلامها...",
        },
        {
          route: `/${cancelData.id}?feeInvoices=true`,
          message: "جاري البحث عن اي رسوم لم يتم دفعها...",
        },
        {
          route: `/${cancelData.id}?otherExpenses=true`,
          message: "جاري البحث عن اي مصاريف اخري لم يتم دفعها...",
        },
        {
          route: `/${cancelData.id}?cancel=true`,
          message: "جاري تحديث حالة العقد القديم...",
        },
      ],
      true
    );

    if (setData) {
      setData((prev) => prev.filter((item) => item.id !== +cancelData.id));
    } else {
      router.push("/rent/");
    }
    handleCloseCancelModal();
  };

  return (
    <>
      <Button
        variant="contained"
        color="error"
        onClick={() => handleOpenCancelModal(data)}
        sx={{ borderRadius: 2 }}
      >
        إلغاء العقد
      </Button>

      <CancelRentModal
        open={cancelModalOpen}
        handleClose={handleCloseCancelModal}
        handleConfirm={handleCancelConfirm}
      />
    </>
  );
};

export function CancelRentModal({ open, handleClose, handleConfirm }) {
  const theme = useTheme();

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "92%", md: 420 },
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: theme.shadows[24],
          border: `1px solid ${theme.palette.divider}`,
          p: { xs: 2, sm: 3 },
        }}
      >
        <Typography variant="h6" component="h2" mb={2} fontWeight={700}>
          هل أنت متأكد أنك تريد إلغاء هذا العقد؟
        </Typography>

        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          <Button variant="text" color="inherit" onClick={handleClose}>
            إلغاء
          </Button>
          <Button variant="contained" color="secondary" onClick={handleConfirm}>
            نعم
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
}
