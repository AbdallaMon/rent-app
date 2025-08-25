"use client";
import { Button, Modal, Box, Tooltip, useTheme } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useState } from "react";
import { useTableForm } from "@/app/context/TableFormProvider/TableFormProvider";
import { Form } from "@/components/ui/FormComponents/Forms/Form";

const modalStyle = (theme, fullWidth) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: theme.shadows[24],
  p: { xs: 2, sm: 3, md: 4 },
  borderRadius: 2,
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

  function handleClick() {
    if (select?.extraId && !extraId) return;
    setOpenModal(true);
  }

  return (
    <>
      <Tooltip title="إضافة">
        <span>
          <Button
            variant="contained"
            color="primary"
            onClick={handleClick}
            disabled={!oldData || (select?.extraId && !extraId)}
            sx={{ minWidth: 40, p: 0.75, borderRadius: 2 }}
          >
            <AddIcon fontSize="small" />
          </Button>
        </span>
      </Tooltip>

      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box sx={modalStyle(theme, false)}>
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
        </Box>
      </Modal>
    </>
  );
}
