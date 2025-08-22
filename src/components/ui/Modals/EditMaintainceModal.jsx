import React, {useEffect, useState} from 'react';
import {
    Button,
    Modal,
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    CircularProgress
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import {handleRequestSubmit} from "@/helpers/functions/handleRequestSubmit";
import {useToastContext} from "@/app/context/ToastLoading/ToastLoadingProvider"; // Ensure you have this service function implemented

const EditMaintenanceModal = ({ maintenance, onUpdate }) => {
    const [open, setOpen] = useState(false);
    const [typeId, setTypeId] = useState(maintenance.type.id);
    const [types, setTypes] = useState([]); // Ensure you have this service function implemented
    const [date, setDate] = useState(dayjs(maintenance.date));
    const [loadingTypes, setLoadingTypes] = useState(false);
const {setLoading}=useToastContext()
useEffect(()=>{
    setTypeId(maintenance.type.id)
    setDate(dayjs(maintenance.date))
},[open])
    useEffect(() => {
    async function getExpenseTypes() {
        setLoadingTypes(true);
        const res = await fetch("/api/fast-handler?id=expenseTypes");
        const data = await res.json();
        setTypes(data);
        setLoadingTypes(false);
        return { data };
    }
        getExpenseTypes();
    }, []);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleSubmit = async () => {
        const updatedMaintenance = {
            typeId,
            date: date.toISOString()
        };

        try {
        const updatedData=    await handleRequestSubmit(updatedMaintenance,setLoading,"/main/maintenance/"+maintenance.id,false," جاري تعديل الصيانة بنجاح ","PUT");
            onUpdate(updatedData.data);
            handleClose();
        } catch (error) {
            console.error('حدثت مشكلة اثناء التعديل   :', error);
        }
    };

    return (
          <div>
              <Button variant="contained" color="primary" onClick={handleOpen}>
                  تعديل
              </Button>
              <Modal open={open} onClose={handleClose}>
                  <Box sx={{ ...style, width: 400 }}>
                      <Typography variant="h6" gutterBottom>
                          تعديل الصيانة
                      </Typography>
                      <FormControl fullWidth margin="normal">
                          <InputLabel>نوع الصيانه</InputLabel>

                          <Select value={typeId} onChange={(e) => setTypeId(e.target.value)}>
                                {loadingTypes && <CircularProgress />}
                              {types?.map((type) => (
                                    <MenuItem key={type.id} value={type.id}>
                                        {type.name}
                                    </MenuItem>
                              ))}
                          </Select>
                      </FormControl>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker
                                sx={{ width: '100%', mt: 2 }}
                                label="تاريخ تسجيل الصيانه"
                                value={date}
                                onChange={(newDate) => setDate(newDate)}
                                renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                          />
                      </LocalizationProvider>
                      <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit}
                            sx={{ mt: 2, width: '100%'}}
                      >
                          تعديل
                      </Button>
                  </Box>
              </Modal>
          </div>
    );
};

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

export default EditMaintenanceModal;
