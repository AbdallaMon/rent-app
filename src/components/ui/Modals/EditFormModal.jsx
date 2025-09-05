"use client";
import React, { useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Slide,
  Box,
  useTheme,
} from "@mui/material";
import { Form } from "@/components/ui/FormComponents/Forms/Form";
import { useToastContext } from "@/app/context/ToastLoading/ToastLoadingProvider";
import { handleRequestSubmit } from "@/helpers/functions/handleRequestSubmit";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export function EditFormModal({
  open,
  inputs,
  onSubmit,
  disabled,
  reFetch,
  children,
  formTitle,
  extraComponent,
  fullWidth,
  currentId,
  rows,
  closeEditModal,
  url,
  setData,
}) {
  const theme = useTheme();
  const currentData = rows.find((row) => row.id === currentId);
  const { setLoading } = useToastContext();
  const editInputs = useMemo(
    () =>
      (inputs || []).map((input) => ({
        ...input,
        data: { ...input.data },
        value: currentData ? currentData[input?.data?.id] : input.value,
      })),
    [inputs, currentData]
  );

  async function onEdit(data) {
    const reqeust = await handleRequestSubmit(
      data,
      setLoading,
      `${url}/${currentId}`,
      false,
      "جاري التحديث",
      "PUT"
    );
    if (reqeust.status === 200) {
      if (onSubmit) {
        return await onSubmit(data);
      }
      if (reqeust.data) {
        if (setData) {
          setData((old) =>
            old.map((item) => {
              if (item.id === currentId) {
                return reqeust.data;
              }
              return item;
            })
          );
        }
      }
      if (closeEditModal) {
        closeEditModal();
      }
    }
  }
  return (
    <Dialog
      open={open}
      onClose={closeEditModal}
      TransitionComponent={Transition}
      keepMounted
      maxWidth={false}
      scroll="paper"
      PaperProps={{
        sx: {
          width: fullWidth ? "29.5cm" : { xs: "92%", md: 720, lg: 840 },
          maxWidth: fullWidth ? "100%" : { xs: "92%", md: "50%" },
          height: "90vh",
          overflow: "hidden",
          borderRadius: 2,
          boxShadow: theme.shadows[24],
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: "background.paper",
        },
      }}
      slotProps={{ backdrop: { timeout: 200 } }}
      aria-labelledby="edit-form-dialog-title"
    >
      <DialogTitle id="edit-form-dialog-title" sx={{ pb: 1, fontWeight: 700 }}>
        {"تعديل " + formTitle}
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ "&.MuiDialogContent-root": { p: { xs: 1.5, sm: 2, md: 3 } } }}
      >
        <Form
          formTitle={null}
          inputs={editInputs}
          onSubmit={onEdit}
          variant={"outlined"}
          btnText={"تعديل"}
          disabled={disabled}
          reFetch={reFetch}
          extraComponent={extraComponent}
        >
          {children}
        </Form>
      </DialogContent>
    </Dialog>
  );
}
