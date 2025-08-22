import {useEffect, useState} from "react";
import dayjs from "dayjs";
import {
    Box, 
    FormControl, 
    Grid, 
    TextField, 
    Typography, 
    Select, 
    MenuItem, 
    InputLabel,
    Button,
    Modal
} from "@mui/material";
import {Controller} from "react-hook-form";
import {DatePicker} from "@mui/x-date-pickers/DatePicker";
import { useToastContext } from "@/app/context/ToastLoading/ToastLoadingProvider";
import { handleRequestSubmit } from "@/helpers/functions/handleRequestSubmit";

const RentCollectionType = {
    TWO_MONTHS: 2,
    THREE_MONTHS: 3,
    FOUR_MONTHS: 4,
    SIX_MONTHS: 6,
    ONE_YEAR: 12,
};

export function InstallmentComponent({getValues, control, register, errors, setValue, data}) {
    const [dataState, setData] = useState(data);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedInstallmentIndex, setSelectedInstallmentIndex] = useState(null);
    const [editPaymentMethod, setEditPaymentMethod] = useState("");
    const [editChequeNumber, setEditChequeNumber] = useState("");
    const { setLoading: setSubmitLoading } = useToastContext();
    
    let {rentCollectionType, startDate, endDate, totalPrice, discount} = dataState;
    const [installments, setInstallments] = useState([]);

    useEffect(() => {
        if (getValues()) {
            window.setTimeout(() => {
                setData(getValues())
            }, 100)
        }
    }, [getValues])

    useEffect(() => {
        if (data.rentCollectionType && data.startDate && data.endDate && data.totalPrice) {
            setData(data)
        }
    }, [data])

    useEffect(() => {
        setValue("installments", installments);
    }, [installments]);

    useEffect(() => {
        if (rentCollectionType && startDate && endDate && totalPrice) {
            calculateInstallments();
        }
    }, [rentCollectionType, startDate, endDate, totalPrice, discount]);

    const calculateInstallments = () => {
        const start = dayjs(startDate);
        const end = dayjs(endDate);

        const monthDifference = end.startOf('month').diff(start.startOf('month'), 'month');

        const totalInstallments = Math.ceil(
              monthDifference / RentCollectionType[rentCollectionType]
        );

        const discountedPrice = totalPrice - (discount || 0);
        const installmentBaseAmount = discountedPrice / totalInstallments;
        let remainingAmount = discountedPrice;

        const newInstallments = Array(totalInstallments)
              .fill()
              .map((_, i) => {
                  let dueDate = start.add(i * RentCollectionType[rentCollectionType], 'month');
                  let endDate = dueDate.add(RentCollectionType[rentCollectionType], 'month');

                  let installmentAmount;
                  if (i === totalInstallments - 1) {
                      installmentAmount = remainingAmount;
                  } else {
                      installmentAmount = Math.round(installmentBaseAmount / 50) * 50;
                      remainingAmount -= installmentAmount;
                  }
                  setValue(`installments[${i}].dueDate`, dueDate.format("YYYY-MM-DD"));
                  setValue(`installments[${i}].amount`, installmentAmount);
                  setValue(`installments[${i}].paymentTypeMethod`, "CASH"); // Default payment method
                  setValue(`installments[${i}].chequeNumber`, "");

                  return {
                      startDate: start.format("YYYY-MM-DD"),
                      dueDate: dueDate.format("YYYY-MM-DD"),
                      endDate: endDate.format("YYYY-MM-DD"),
                      amount: installmentAmount,
                      paymentTypeMethod: "CASH",
                      chequeNumber: "",
                  };
              });

        setInstallments(newInstallments);
    };

    const handleOpenModal = (index) => {
        setSelectedInstallmentIndex(index);
        setEditPaymentMethod(installments[index].paymentTypeMethod);
        setEditChequeNumber(installments[index].chequeNumber || "");
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedInstallmentIndex(null);
    };

    const handleSavePaymentMethod = async () => {
        if (selectedInstallmentIndex !== null) {
            try {
                const updatedInstallments = [...installments];
                
                // If we're updating an existing payment with an ID, call the API
                if (updatedInstallments[selectedInstallmentIndex].id) {
                    const data = {
                        paymentTypeMethod: editPaymentMethod,
                        chequeNumber: editPaymentMethod === "CHEQUE" ? editChequeNumber : null,
                        bankId: dataState.property?.bankId, // Use property's bank if available
                    };
                    
                    await handleRequestSubmit(
                        data,
                        setSubmitLoading,
                        `/main/payments/${updatedInstallments[selectedInstallmentIndex].id}/edit`,
                        false,
                        "جاري تحديث طريقة الدفع"
                    );
                }
                
                // Update local state
                updatedInstallments[selectedInstallmentIndex].paymentTypeMethod = editPaymentMethod;
                
                if (editPaymentMethod !== "CHEQUE") {
                    updatedInstallments[selectedInstallmentIndex].chequeNumber = "";
                    setValue(`installments[${selectedInstallmentIndex}].chequeNumber`, "");
                } else {
                    updatedInstallments[selectedInstallmentIndex].chequeNumber = editChequeNumber;
                    setValue(`installments[${selectedInstallmentIndex}].chequeNumber`, editChequeNumber);
                }
                
                setInstallments(updatedInstallments);
                setValue(`installments[${selectedInstallmentIndex}].paymentTypeMethod`, editPaymentMethod);
                
                handleCloseModal();
            } catch (error) {
                console.error("Failed to update payment method:", error);
            }
        }
    };

    const handleDirectPaymentMethodChange = (index, value) => {
        const updatedInstallments = [...installments];
        updatedInstallments[index].paymentTypeMethod = value;
        
        // Clear cheque number if payment method is not CHEQUE
        if (value !== "CHEQUE") {
            updatedInstallments[index].chequeNumber = "";
            setValue(`installments[${index}].chequeNumber`, "");
        }
        
        setInstallments(updatedInstallments);
        setValue(`installments[${index}].paymentTypeMethod`, value);
    };

    const handleChequeNumberChange = (index, value) => {
        const updatedInstallments = [...installments];
        updatedInstallments[index].chequeNumber = value;
        setInstallments(updatedInstallments);
        setValue(`installments[${index}].chequeNumber`, value);
    };

    return (
        <Box mt={3}>
            <Typography variant="h6" mb={2} gutterBottom>الدفعات والأقساط</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
                يرجى تحديد المبالغ وطرق الدفع للأقساط
            </Typography>
            
            {/* Payment Method Edit Modal */}
            <Modal open={modalOpen} onClose={handleCloseModal}>
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 400,
                        bgcolor: "background.paper",
                        boxShadow: 24,
                        p: 4,
                        borderRadius: 1,
                    }}
                >
                    <Typography id="edit-payment-method-modal" variant="h6" component="h2">
                        تعديل طريقة الدفع
                    </Typography>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>طريقة الدفع</InputLabel>
                        <Select
                            value={editPaymentMethod}
                            onChange={(e) => setEditPaymentMethod(e.target.value)}
                        >
                            <MenuItem value="CASH">كاش</MenuItem>
                            <MenuItem value="BANK">تحويل بنكي</MenuItem>
                            <MenuItem value="CHEQUE">شيك</MenuItem>
                        </Select>
                    </FormControl>
                    {editPaymentMethod === "CHEQUE" && (
                        <TextField
                            label="رقم الشيك"
                            value={editChequeNumber}
                            onChange={(e) => setEditChequeNumber(e.target.value)}
                            fullWidth
                            margin="normal"
                            required
                            error={editPaymentMethod === "CHEQUE" && !editChequeNumber}
                            helperText={editPaymentMethod === "CHEQUE" && !editChequeNumber ? "يرجى إدخال رقم الشيك" : ""}
                        />
                    )}
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSavePaymentMethod}
                        sx={{ mt: 2 }}
                        disabled={editPaymentMethod === "CHEQUE" && !editChequeNumber}
                    >
                        تعديل
                    </Button>
                </Box>
            </Modal>

            {/* Installments List */}
            {installments.map((installment, index) => (
                <Box key={index} mb={3} p={3} border={1} borderRadius={2} borderColor="grey.300">
                    <Typography variant="h6" mb={2}>الدفعه {index + 1}</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth error={!!errors[`installments[${index}].dueDate`]}>
                                <Controller
                                    name={`installments[${index}].dueDate`}
                                    control={control}
                                    defaultValue={installment.dueDate ? dayjs(installment.dueDate) : null}
                                    rules={{
                                        required: {
                                            value: true,
                                            message: "يرجى إدخال تاريخ الاستحقاق",
                                        },
                                    }}
                                    render={({field: {onChange, value}, fieldState: {error}}) => (
                                        <DatePicker
                                            id={`installments[${index}].dueDate`}
                                            label="تاريخ الاستحقاق"
                                            value={value ? dayjs(value) : null}
                                            onChange={(date) => {
                                                onChange(date ? date.format("YYYY-MM-DD") : null);
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    error={!!error}
                                                    helperText={error ? error.message : ""}
                                                    placeholder="DD/MM/YYYY"
                                                />
                                            )}
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id={`installments[${index}].amount`}
                                label="المبلغ"
                                type="number"
                                variant="outlined"
                                defaultValue={installment.amount}
                                {...register(`installments[${index}].amount`, {
                                    required: {
                                        value: true,
                                        message: "يرجى إدخال المبلغ",
                                    },
                                    min: {
                                        value: 1,
                                        message: "المبلغ يجب أن يكون أكبر من 0",
                                    },
                                })}
                                error={!!errors[`installments[${index}].amount`]}
                                helperText={errors[`installments[${index}].amount`] ? errors[`installments[${index}].amount`].message : ""}
                            />
                        </Grid>
                        
                        {/* Payment method selection */}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel id={`payment-method-label-${index}`}>طريقة الدفع</InputLabel>
                                <Controller
                                    name={`installments[${index}].paymentTypeMethod`}
                                    control={control}
                                    defaultValue={installment.paymentTypeMethod || "CASH"}
                                    render={({ field }) => (
                                        <Select
                                            labelId={`payment-method-label-${index}`}
                                            id={`installments[${index}].paymentTypeMethod`}
                                            label="طريقة الدفع"
                                            {...field}
                                            onChange={(e) => {
                                                field.onChange(e);
                                                handleDirectPaymentMethodChange(index, e.target.value);
                                            }}
                                        >
                                            <MenuItem value="CASH">كاش</MenuItem>
                                            <MenuItem value="BANK">تحويل بنكي</MenuItem>
                                            <MenuItem value="CHEQUE">شيك</MenuItem>
                                        </Select>
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        
                        {/* Cheque number field - only visible when payment method is CHEQUE */}
                        <Grid item xs={12} md={6}>
                            <Controller
                                name={`installments[${index}].chequeNumber`}
                                control={control}
                                defaultValue={installment.chequeNumber || ""}
                                rules={{
                                    required: {
                                        value: installment.paymentTypeMethod === "CHEQUE",
                                        message: "يرجى إدخال رقم الشيك",
                                    }
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        id={`installments[${index}].chequeNumber`}
                                        label="رقم الشيك"
                                        disabled={installment.paymentTypeMethod !== "CHEQUE"}
                                        error={!!error}
                                        helperText={error ? error.message : ""}
                                        variant="outlined"
                                        placeholder={installment.paymentTypeMethod === "CHEQUE" ? "أدخل رقم الشيك" : ""}
                                        onChange={(e) => {
                                            field.onChange(e);
                                            handleChequeNumberChange(index, e.target.value);
                                        }}
                                    />
                                )}
                            />
                        </Grid>
                        
                        {/* Edit button for payment method - only show for existing payments with IDs */}
                        {installment.id && (
                            <Grid item xs={12}>
                                <Button 
                                    variant="outlined" 
                                    color="primary"
                                    onClick={() => handleOpenModal(index)}
                                >
                                    تعديل طريقة الدفع
                                </Button>
                            </Grid>
                        )}
                    </Grid>
                </Box>
            ))}
        </Box>
    );
}
