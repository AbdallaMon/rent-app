"use client";
import React, { useState, useMemo, useCallback } from "react";
import {
  Box,
  Modal,
  Fade,
  Button,
  Tooltip,
  Typography,
  IconButton,
  Stack,
  Divider,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { AiOutlineClose } from "react-icons/ai";
import { useTableForm } from "@/app/context/TableFormProvider/TableFormProvider";
import { Form } from "@/components/ui/FormComponents/Forms/Form";

const modalStyle = (theme, fullWidth) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: theme.shadows[6],
  p: { xs: 2, sm: 3, md: 4 },
  borderRadius: 3,
  width: fullWidth ? "29.5cm" : { xs: "92%", md: 720, lg: 840 },
  maxWidth: fullWidth ? "100%" : { xs: "92%", md: "50%" },
  maxHeight: "90vh",
  overflow: "auto",
  border: `1px solid ${theme.palette.divider}`,
});

export function CreateModal({
  oldData,
  setData,
  extraId,
  modalInputs,
  id,
  select,
}) {
  const theme = useTheme();
  const { submitData } = useTableForm();
  const [openModal, setOpenModal] = useState(false);

  // better tooltip message when disabled
  const disabled = !oldData || (select?.extraId && !extraId);
  const tooltipTitle = useMemo(() => {
    if (!oldData) return "لا توجد بيانات حالية لعرضها/الإضافة عليها";
    if (select?.extraId && !extraId)
      return "من فضلك اختر/مرّر المعرف المطلوب أولًا";
    return "إضافة";
  }, [oldData, select?.extraId, extraId]);

  const handleClick = useCallback(() => {
    if (select?.extraId && !extraId) return;
    setOpenModal(true);
  }, [select?.extraId, extraId]);

  return (
    <>
      <Tooltip title={tooltipTitle}>
        <span>
          <Button
            variant="contained"
            color="primary"
            onClick={handleClick}
            disabled={disabled}
            sx={{ minWidth: 40, p: 0.75, borderRadius: 2 }}
            aria-label="إضافة عنصر جديد"
          >
            <AddIcon fontSize="small" />
          </Button>
        </span>
      </Tooltip>

      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        closeAfterTransition
        BackdropProps={{
          sx: {
            backgroundColor: "rgba(9,30,66,0.3)",
            backdropFilter: "blur(2px)",
          },
        }}
        keepMounted
      >
        <Fade in={openModal}>
          <Box
            sx={modalStyle(theme, false)}
            dir="rtl"
            role="dialog"
            aria-label="نافذة إنشاء عنصر"
          >
            <Stack spacing={2}>
              {/* Header */}
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="h6" fontWeight={700}>
                  إنشاء
                </Typography>
                <IconButton
                  aria-label="إغلاق"
                  onClick={() => setOpenModal(false)}
                  size="small"
                >
                  <AiOutlineClose />
                </IconButton>
              </Stack>

              <Typography variant="body2" color="text.secondary">
                املأ الحقول المطلوبة ثم اضغط <b>إنشاء</b>.
              </Typography>

              <Divider />

              {/* Form (unchanged API) */}
              <Form
                formTitle="انشاء"
                inputs={modalInputs}
                onSubmit={async (data) => {
                  const newData = await submitData(
                    data,
                    setOpenModal,
                    null,
                    "POST",
                    { id, extraId }
                  );
                  setData([...oldData, newData]);
                }}
                variant="outlined"
                btnText="انشاء"
              />
            </Stack>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}
