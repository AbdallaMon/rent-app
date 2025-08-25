import React from "react";
import { Dialog, DialogTitle, DialogContent, Slide, Box } from "@mui/material";
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
  fullWidth, // اختياري لو عايز تفتح بكامل العرض
}) {
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
      keepMounted
      maxWidth={false} // هنتحكم في المقاسات عبر PaperProps.sx
      scroll="paper"
      PaperProps={{
        sx: {
          width: fullWidth ? "29.5cm" : { xs: "90%", md: 750, lg: 850 },
          maxWidth: fullWidth ? "100%" : { xs: "90%", md: "50%" },
          height: "90vh",
          overflow: "hidden",
          borderRadius: 2,
          boxShadow: 24,
        },
      }}
      slotProps={{
        backdrop: { timeout: 200 },
      }}
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
        sx={{
          pt: 2,
          pb: 2,
          "&.MuiDialogContent-root": { p: { xs: 1.5, sm: 2, md: 3 } },
        }}
      >
        {extraComponent ? <Box sx={{ mb: 2 }}>{extraComponent}</Box> : null}

        <Form
          formTitle={null} // العنوان بقى في DialogTitle
          inputs={inputs}
          onSubmit={onSubmit}
          variant="outlined"
          btnText="إضافة"
          disabled={disabled}
          extraData={createModalsData}
          reFetch={reFetch}
        >
          {children}
        </Form>
      </DialogContent>
    </Dialog>
  );
}
