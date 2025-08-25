"use client";
import React, { useEffect, useState } from "react";
import { Alert, Button, Snackbar } from "@mui/material";
import { useRouter } from "next/navigation";
import { useToastContext } from "@/app/context/ToastLoading/ToastLoadingProvider";
import { submitRentAgreement } from "@/services/client/createRentAgreement";
import { rentAgreementInputs } from "@/app/rent/rentInputs";
import { Box, Modal, Typography } from "@mui/material";
import { Form } from "@/components/ui/FormComponents/Forms/Form";
import { InstallmentComponent } from "@/components/InstallmentComponent";

export function RenewRent({ data, setData }) {
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [renewData, setRenewData] = useState(null);
  const { setLoading: setSubmitLoading } = useToastContext();
  const [propertyId, setPropertyId] = useState(data.unit.property.id);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const [disabled, setDisabled] = useState({ unitId: false });
  const [reFetch, setRefetch] = useState({ unitId: false });

  const router = useRouter();

  const handleOpenRenewModal = (rentData) => {
    setRenewData(rentData);
    setRenewModalOpen(true);
  };

  const handleCloseRenewModal = () => {
    setRenewModalOpen(false);
    setRenewData(null);
  };

  async function getRenters() {
    const res = await fetch("/api/fast-handler?id=renter");
    const data = await res.json();
    return { data };
  }

  async function getRentTypes() {
    const res = await fetch("/api/fast-handler?id=rentType");
    const data = await res.json();
    const dataWithLabel = data.map((item) => ({
      ...item,
      name: item.title,
    }));
    return { data: dataWithLabel };
  }

  async function getProperties() {
    const res = await fetch("/api/fast-handler?id=properties");
    const data = await res.json();
    return { data };
  }

  function handlePropertyChange(value) {
    setPropertyId(value);
    setDisabled((d) => ({ ...d, unitId: false }));
    setRefetch((r) => ({ ...r, unitId: true }));
  }

  async function getUnits() {
    const res = await fetch(
      `/api/fast-handler?id=unit&propertyId=${propertyId}`
    );
    const data = await res.json();
    const dataWithLabel = data.map((item) => ({
      ...item,
      name: item.unitId,
      disabled: item.rentAgreements?.some((rent) => rent.status === "ACTIVE"),
    }));
    return { data: dataWithLabel, id: propertyId };
  }

  async function getRentCollectionType() {
    const data = [
      { id: "TWO_MONTHS", name: "شهرين" },
      { id: "THREE_MONTHS", name: "ثلاثة أشهر" },
      { id: "FOUR_MONTHS", name: "أربعة أشهر" },
      { id: "SIX_MONTHS", name: "ستة أشهر" },
      { id: "ONE_YEAR", name: "سنة واحدة" },
    ];
    return { data };
  }

  const dataInputs = rentAgreementInputs.map((input) => {
    switch (input.data.id) {
      case "rentCollectionType":
        return { ...input, extraId: false, getData: getRentCollectionType };
      case "renterId":
        return { ...input, extraId: false, getData: getRenters };
      case "typeId":
        return { ...input, extraId: false, getData: getRentTypes };
      case "propertyId":
        return {
          ...input,
          getData: getProperties,
          onChange: handlePropertyChange,
        };
      case "unitId":
        return { ...input, getData: getUnits };
      default:
        return input;
    }
  });

  const handleSnackbarClose = () => setSnackbarOpen(false);

  const validateTotalPrice = (formData) => {
    const discountedTotal =
      parseFloat(formData.totalPrice) - (parseFloat(formData.discount) || 0);
    const totalInstallments = formData.installments.reduce(
      (sum, i) => sum + parseFloat(i.amount),
      0
    );
    return totalInstallments === discountedTotal;
  };

  const handleRenewSubmit = async (formData) => {
    if (!validateTotalPrice(formData)) {
      setSnackbarOpen(true);
      return;
    }
    const extraData = { otherExpenses: [] };
    const payload = { ...formData, extraData };
    const ret = await submitRentAgreement(
      { ...payload },
      setSubmitLoading,
      "PUT",
      [
        {
          route: `/${renewData.id}?installments=true`,
          message: "جاري البحث عن اي دفعات لم يتم استلامها...",
        },
        {
          route: `/${renewData.id}?feeInvoices=true`,
          message: "جاري البحث عن اي رسوم لم يتم دفعها...",
        },
        {
          route: `/${renewData.id}?otherExpenses=true`,
          message: "جاري البحث عن اي مصاريف اخري لم يتم دفعها...",
        },
        {
          route: `/${renewData.id}?renew=true`,
          message: "جاري تحديث حالة العقد القديم...",
        },
      ]
    );

    if (!ret) return;

    if (setData) {
      setData((prev) => prev.filter((item) => +item.id !== +renewData.id));
    } else {
      router.push("/rent/" + ret.id);
    }
    handleCloseRenewModal();
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={() => handleOpenRenewModal(data)}
      >
        تجديد العقد
      </Button>

      <RenewRentModal
        open={renewModalOpen}
        handleClose={handleCloseRenewModal}
        initialData={renewData}
        inputs={dataInputs}
        onSubmit={handleRenewSubmit}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="error"
          sx={{ width: "100%" }}
        >
          المجموع الكلي للأقساط لا يتطابق مع السعر الكلي. يرجى التحقق من
          المدخلات.
        </Alert>
      </Snackbar>
    </>
  );
}

const modalBoxSx = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "92%", md: 750, lg: 860 },
  height: "90vh",
  overflowY: "auto",
  bgcolor: "background.paper",
  border: 1,
  borderColor: "divider",
  borderRadius: 2,
  boxShadow: 24,
  p: { xs: 1.5, sm: 2, md: 4 },
};

export function RenewRentModal({
  open,
  handleClose,
  initialData,
  inputs,
  onSubmit,
  children,
  title = "تجديد",
}) {
  const [modalInputs, setModalInputs] = useState([]);

  useEffect(() => {
    function createInputs() {
      // clone to avoid mutating original
      const base = inputs.map((x) => ({ ...x, data: { ...x.data } }));

      base[0] = {
        data: {
          id: "propertyId",
          label: "العقار",
          type: "text",
          name: "propertyId",
          disabled: true,
        },
        value: initialData?.unit.property.name,
        sx: {
          width: { xs: "100%", sm: "48%" },
          mr: "auto",
        },
      };

      base[1] = {
        data: {
          id: "unitNumber",
          label: " رقم الوحدة",
          type: "text",
          disabled: true,
        },
        value: initialData?.unit.number,
        sx: {
          width: { xs: "100%", sm: "48%" },
        },
      };

      base[base.length] = {
        data: {
          id: "unitId",
          label: "الوحدة",
          type: "text",
          name: "unitId",
        },
        sx: {
          width: { xs: "100%", sm: "48%" },
          display: "none",
        },
      };

      const hydrated =
        initialData &&
        base.map((input) => {
          if (["propertyId", "unitNumber"].includes(input.data.id))
            return input;
          return { ...input, value: initialData[input.data.id] };
        });

      setModalInputs(hydrated || base);
    }

    if (open) createInputs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData]);

  if (!open) return null;

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={modalBoxSx}>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          {`${title} عقد الإيجار`}
        </Typography>

        <Form
          formTitle={"تجديد عقد الإيجار"}
          inputs={modalInputs}
          onSubmit={onSubmit}
          variant={"outlined"}
          btnText={title}
          initialData={initialData}
          extraComponent={InstallmentComponent}
        >
          {children}
        </Form>
      </Box>
    </Modal>
  );
}
