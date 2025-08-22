import {Box, Modal} from "@mui/material";
import {useTableForm} from "@/app/context/TableFormProvider/TableFormProvider";
import {Form} from "@/components/ui/FormComponents/Forms/Form";
import {useEffect} from "react";
import Typography from "@mui/material/Typography";

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
        xs: 1,
        md: 3,
    },
    borderRadius: "10px",
    maxWidth: fullWidth ? "100%" : {xs: "90%", md: "50%"},
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
                                   rerender
                               }) {
    const {openModal, setOpenModal, submitData} = useTableForm();
    const data = rows.find((row) => row.id === id);
    useEffect(() => {
        if (extraDataName) {
            setExtraData(data[extraDataName]);
        }
    }, [extraDataName]);
    let modalInputs = inputs.map((input) => {
        return {
            ...input,
            data: {
                ...input.data,
            },
            value: data ? data[input.data.id] : input.value,
        };
    });


    const modelStyle = modalStyle(fullWidth);
    return (
          <Modal open={openModal} onClose={() => setOpenModal(false)}>
              {canEdit() ? (
                    <Box sx={modelStyle}>
                        <Form
                              formTitle={formTitle}
                              inputs={modalInputs}
                              rerender={rerender}
                              onSubmit={async (data) => {
                                  if (handleEditBeforeSubmit) {
                                      const continueEditing = handleEditBeforeSubmit();
                                      if (!continueEditing) return;
                                  }
                                  data = {...data, extraData};
                                  const newData = await submitData(data, setOpenModal, id);
                                  const editedData = rows.map((row) => {
                                      return row.id === newData.id ? newData : row;
                                  });
                                  setData(editedData);
                              }}
                              variant={"outlined"}
                              btnText={"تعديل"}
                        >
                            {children}
                        </Form>
                    </Box>
              ) : (
                    <Box sx={modelStyle}>
                        <Typography
                              variant={"h5"}
                              align={"center"}
                              color={"error"}
                              sx={{fontWeight: "bold"}}
                        >
                            ليس لديك الصلاحية لتعديل هذا العنصر
                        </Typography>
                    </Box>
              )}
          </Modal>
    );
}
