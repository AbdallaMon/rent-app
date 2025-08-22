import {Box, Button, Modal, Typography} from "@mui/material";
import React, {useState} from "react";
import {useToastContext} from "@/app/context/ToastLoading/ToastLoadingProvider";
import {useRouter} from "next/navigation";
import {submitRentAgreement} from "@/services/client/createRentAgreement";

export const CancelRent = ({data, setData}) => {
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelData, setCancelData] = useState(null);
    const {setLoading: setSubmitLoading} = useToastContext();
    const router = useRouter();
    const handleOpenCancelModal = (rentData) => {
        setCancelData(rentData);
        setCancelModalOpen(true);
    };

    const handleCloseCancelModal = () => {
        setCancelModalOpen(false);
        setCancelData(null);
    };

    const handleCancelConfirm = async () => {
        await submitRentAgreement(
              {...cancelData, canceling: true},
              setSubmitLoading,
              "PUT",
              [
                  {
                      route: `/${cancelData.id}?installments=true`,
                      message: "جاري البحث عن اي دفعات لم يتم استلامها...",
                  },
                  {
                      route: `/${cancelData.id}?feeInvoices=true`,
                      message: "جاري البحث عن اي رسوم لم يتم دفعها...",
                  },
                  {
                      route: `/${cancelData.id}?otherExpenses=true`,
                      message: "جاري البحث عن اي مصاريف اخري لم يتم دفعها...",
                  },
                  {
                      route: `/${cancelData.id}?cancel=true`,
                      message: "جاري تحديث حالة العقد القديم...",
                  },
              ],
              true,
        );
        if (setData) {
            setData((prevData) => {
                return prevData.filter((item) => {
                    return item.id !== +cancelData.id
                });
            });
        } else {

            router.push("/rent/");
        }
        handleCloseCancelModal();
    };

    return (
          <>
              <Button
                    variant="contained"
                    color="error"
                    onClick={() => handleOpenCancelModal(data)}
              >
                  إلغاء العقد
              </Button>
              <CancelRentModal
                    open={cancelModalOpen}
                    handleClose={handleCloseCancelModal}
                    handleConfirm={handleCancelConfirm}
              />
          </>
    );
};


export function CancelRentModal({open, handleClose, handleConfirm}) {
    return (
          <Modal open={open} onClose={handleClose}>
              <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: {
                            xs: "90%",
                            md: "fit-content",
                        },
                        height: "auto",
                        overflowY: "auto",
                        bgcolor: "background.paper",
                        border: "2px solid #000",
                        boxShadow: 24,
                        p: {
                            xs: 1,
                            sm: 2,
                            md: 4,
                        },
                    }}
              >
                  <Typography variant="h6" component="h2" mb={2}>
                      هل أنت متأكد أنك تريد إلغاء هذا العقد؟
                  </Typography>
                  <Box display="flex" justifyContent="space-between">
                      <Button variant="text" color="secondary" onClick={handleConfirm}>
                          نعم
                      </Button>
                      <Button variant="text" onClick={handleClose}>
                          إلغاء
                      </Button>
                  </Box>
              </Box>
          </Modal>
    );
}
