import { Button, Modal, Box } from "@mui/material";
import { useTableForm } from "@/app/context/TableFormProvider/TableFormProvider";
import { Form } from "@/components/ui/FormComponents/Forms/Form";
import AddIcon from "@mui/icons-material/Add";
import { useState } from "react";

const modalStyle = (fullWidth) => ({
  position: "absolute",
  width: fullWidth
    ? "29.5cm"
    : {
        xs: "90%",

        md: "750px",
        lg: "850px",
      },
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: {
    xs: 2,
    sm: 3,
    md: 4,
  },
  borderRadius: "10px",
  maxWidth: {
    xs: "90%",
    md: fullWidth ? "100%" : "50%",
  },
  maxHeight: "90%",
  overflow: "auto",
});

export function CreateModal({
  oldData,
  setData,
  extraId,
  modalInputs,
  id,
  select,
}) {
  const { submitData } = useTableForm();
  const modelStyle = modalStyle(false);
  const [openModal, setOpenModal] = useState(false);

  function handleClick() {
    if (select?.extraId && !extraId) {
      return;
    }
    setOpenModal(true);
  }

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={() => handleClick()}
        disabled={!oldData || (select?.extraId && !extraId)}
      >
        <AddIcon />
      </Button>{" "}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box sx={modelStyle}>
          <Form
            formTitle={"انشاء"}
            inputs={modalInputs}
            onSubmit={async (data) => {
              const newData = await submitData(
                data,
                setOpenModal,
                null,
                "POST",
                { id, extraId },
              );
              setData([...oldData, newData]);
            }}
            variant={"outlined"}
            btnText={"انشاء"}
          >
            {/*{children}*/}
          </Form>
        </Box>
      </Modal>
    </>
  );
}
