import { Box, Modal, Paper, Fade, Typography } from "@mui/material";
import { useTableForm } from "@/app/context/TableFormProvider/TableFormProvider";
import { Form } from "@/components/ui/FormComponents/Forms/Form";
import { useEffect, useMemo } from "react";

const modalStyle = (fullWidth) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 2,
  p: { xs: 1.5, md: 3 },
  width: fullWidth
    ? "29.5cm" // لو عايز A4 landscape، سيبها كده
    : { xs: "90%", md: 750, lg: 850 },
  maxWidth: fullWidth ? "100%" : { xs: "90%", md: "50%" },
  maxHeight: "90%",
  overflow: "auto",
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
  const { openModal, setOpenModal, submitData } = useTableForm();
  const data = rows?.find((row) => row.id === id);

  // حمّل extraData لما يتغير id أو data
  useEffect(() => {
    if (!extraDataName) return;
    if (data && data[extraDataName] !== undefined) {
      setExtraData?.(data[extraDataName]);
    } else {
      // في حال عدم وجود قيمة
      setExtraData?.(undefined);
    }
    // مهم: نعتمد على data/id/extraDataName
  }, [data, id, extraDataName, setExtraData]);

  // جهّز قيم المدخلات مع قيمة الصف المختار
  const modalInputs = useMemo(() => {
    return (inputs || []).map((input) => ({
      ...input,
      data: { ...input.data },
      value: data ? data[input?.data?.id] : input.value,
    }));
  }, [inputs, data]);

  const style = modalStyle(fullWidth);
  const canUserEdit = typeof canEdit === "function" ? canEdit() : true;

  return (
    <Modal
      open={!!openModal}
      onClose={() => setOpenModal(false)}
      keepMounted
      aria-labelledby="edit-modal-title"
      aria-describedby="edit-modal-description"
      closeAfterTransition
      slotProps={{
        backdrop: {
          timeout: 200,
        },
      }}
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
                sx={{ fontWeight: "bold" }}
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
