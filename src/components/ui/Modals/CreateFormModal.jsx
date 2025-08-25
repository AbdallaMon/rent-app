"use client";
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Slide,
  Box,
  useTheme,
} from "@mui/material";
import { Form } from "@/components/ui/FormComponents/Forms/Form";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export function CreateFormModal({
  open,
  handleClose,
  inputs,
  onSubmit,
  disabled,
  createModalsData,
  reFetch,
  children,
  formTitle,
  extraComponent,
  fullWidth,
}) {
  const theme = useTheme();
  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
      aria-labelledby="create-form-dialog-title"
    >
      <DialogTitle
        id="create-form-dialog-title"
        sx={{ pb: 1, fontWeight: 700 }}
      >
        {"اضافة " + formTitle}
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ "&.MuiDialogContent-root": { p: { xs: 1.5, sm: 2, md: 3 } } }}
      >
        <Form
          formTitle={null}
          inputs={inputs}
          onSubmit={onSubmit}
          variant={"outlined"}
          btnText={"إضافة"}
          disabled={disabled}
          extraData={createModalsData}
          reFetch={reFetch}
          extraComponent={extraComponent}
        >
          {children}
        </Form>
      </DialogContent>
    </Dialog>
  );
}
