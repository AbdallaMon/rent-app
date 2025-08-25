"use client";
import { Box, Modal, Paper, Fade, Typography, useTheme } from "@mui/material";
import { useEffect, useMemo } from "react";
import { useTableForm } from "@/app/context/TableFormProvider/TableFormProvider";
import { Form } from "@/components/ui/FormComponents/Forms/Form";

const modalStyle = (theme, fullWidth) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: theme.shadows[24],
  borderRadius: 2,
  p: { xs: 1.5, md: 3 },
  width: fullWidth ? "29.5cm" : { xs: "92%", md: 720, lg: 840 },
  maxWidth: fullWidth ? "100%" : { xs: "92%", md: "50%" },
  maxHeight: "90vh",
  overflow: "auto",
  border: `1px solid ${theme.palette.divider}`,
});

export function EditTableModal({
  inputs,
  rows,
  formTitle,
  id,
  setData,
  extraDataName,
  setExtraData,
  children,
  extraData,
  fullWidth,
  handleEditBeforeSubmit,
  canEdit,
  rerender,
}) {
  const theme = useTheme();
  const { openModal, setOpenModal, submitData } = useTableForm();
  const data = rows?.find((row) => row.id === id);

  useEffect(() => {
    if (!extraDataName) return;
    if (data && data[extraDataName] !== undefined) {
      setExtraData?.(data[extraDataName]);
    } else {
      setExtraData?.(undefined);
    }
  }, [data, id, extraDataName, setExtraData]);

  const modalInputs = useMemo(
    () =>
      (inputs || []).map((input) => ({
        ...input,
        data: { ...input.data },
        value: data ? data[input?.data?.id] : input.value,
      })),
    [inputs, data]
  );

  const style = modalStyle(theme, fullWidth);
  const canUserEdit = typeof canEdit === "function" ? canEdit() : true;

  return (
    <Modal
      open={!!openModal}
      onClose={() => setOpenModal(false)}
      keepMounted
      aria-labelledby="edit-modal-title"
      closeAfterTransition
      slotProps={{ backdrop: { timeout: 200 } }}
    >
      <Fade in={!!openModal}>
        <Paper elevation={3} sx={style}>
          {canUserEdit ? (
            <Form
              formTitle={formTitle}
              inputs={modalInputs}
              rerender={rerender}
              onSubmit={async (formValues) => {
                if (typeof handleEditBeforeSubmit === "function") {
                  const ok = handleEditBeforeSubmit();
                  if (!ok) return;
                }
                const payload = { ...formValues, extraData };
                const newData = await submitData(payload, setOpenModal, id);
                const editedData = (rows || []).map((row) =>
                  row.id === newData.id ? newData : row
                );
                setData?.(editedData);
              }}
              variant="outlined"
              btnText="تعديل"
            >
              {children}
            </Form>
          ) : (
            <Box sx={{ py: 6, px: 2 }}>
              <Typography
                id="edit-modal-title"
                variant="h5"
                align="center"
                color="error"
                fontWeight={700}
              >
                ليس لديك الصلاحية لتعديل هذا العنصر
              </Typography>
            </Box>
          )}
        </Paper>
      </Fade>
    </Modal>
  );
}
