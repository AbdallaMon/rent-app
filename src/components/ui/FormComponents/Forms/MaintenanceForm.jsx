"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  CircularProgress,
  Grid,
} from "@mui/material";
import { handleRequestSubmit } from "@/helpers/functions/handleRequestSubmit";

const payEveryOptions = [
  { value: "ONCE", label: "مرة واحدة" },
  { value: "TWO_MONTHS", label: "كل شهرين" },
  { value: "FOUR_MONTHS", label: "كل أربعة أشهر" },
  { value: "SIX_MONTHS", label: "كل ستة أشهر" },
  { value: "ONE_YEAR", label: "كل سنة" },
];

const MaintenanceForm = () => {
  const { handleSubmit, control, watch, setValue } = useForm();
  const payEvery = watch("payEvery", "ONCE");
  const propertyId = watch("propertyId");

  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingExpenseTypes, setLoadingExpenseTypes] = useState(true);

  useEffect(() => {
    async function fetchProperties() {
      setLoadingProperties(true);
      const res = await fetch("/api/fast-handler?id=properties");
      const data = await res.json();
      setProperties(data);
      setLoadingProperties(false);
    }

    async function fetchExpenseTypes() {
      setLoadingExpenseTypes(true);
      const res = await fetch("/api/fast-handler?id=expenseTypes");
      const data = await res.json();
      setExpenseTypes(data);
      setLoadingExpenseTypes(false);
    }

    fetchProperties();
    fetchExpenseTypes();
  }, []);

  useEffect(() => {
    async function fetchUnits() {
      if (propertyId) {
        setLoadingUnits(true);
        const res = await fetch(
          `/api/fast-handler?id=unit&propertyId=${propertyId}`,
        );
        const data = await res.json();
        setUnits(
          data.map((item) => ({
            ...item,
            name: item.unitId,
          })),
        );
        setLoadingUnits(false);
      } else {
        setUnits([]);
      }
    }

    fetchUnits();
  }, [propertyId]);

  const onSubmit = async (data) => {
    const response = await handleRequestSubmit(
      data,
      null,
      "api/main/maintenance",
      false,
      "جاري إنشاء الصيانة...",
    );
    if (response.status === 200) {
      if (data.payEvery !== "ONCE") {
        const installmentsData = {
          maintenance: response.data,
          payEvery: data.payEvery,
        };
        await handleRequestSubmit(
          installmentsData,
          null,
          "api/main/maintenance/installments",
          false,
          "جاري إنشاء الدفعات...",
        );
      }
      alert(response.message);
    } else {
      alert("حدث خطأ أثناء إنشاء الصيانة.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FormControl variant="outlined" fullWidth margin="normal">
            <InputLabel id="propertyId-label">العقار</InputLabel>
            <Controller
              name="propertyId"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <Select
                  {...field}
                  labelId="propertyId-label"
                  label="العقار"
                  onChange={(e) => {
                    field.onChange(e);
                    setValue("unitId", ""); // Reset unitId when property changes
                  }}
                >
                  {loadingProperties ? (
                    <MenuItem disabled>
                      <CircularProgress size={24} />
                    </MenuItem>
                  ) : (
                    properties.map((property) => (
                      <MenuItem key={property.id} value={property.id}>
                        {property.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              )}
            />
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl variant="outlined" fullWidth margin="normal">
            <InputLabel id="unitId-label">الوحدة</InputLabel>
            <Controller
              name="unitId"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <Select
                  {...field}
                  labelId="unitId-label"
                  label="الوحدة"
                  disabled={!propertyId || loadingUnits}
                >
                  {loadingUnits ? (
                    <MenuItem disabled>
                      <CircularProgress size={24} />
                    </MenuItem>
                  ) : (
                    units.map((unit) => (
                      <MenuItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              )}
            />
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="description"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <TextField
                {...field}
                label="الوصف"
                variant="outlined"
                fullWidth
                margin="normal"
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="cost"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <TextField
                {...field}
                label="التكلفة"
                variant="outlined"
                fullWidth
                margin="normal"
                type="number"
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="date"
            control={control}
            defaultValue={new Date().toISOString().split('T')[0]} // تاريخ اليوم كقيمة افتراضية
            render={({ field }) => (
              <TextField
                {...field}
                label="التاريخ"
                variant="outlined"
                fullWidth
                margin="normal"
                type="date"
                InputLabelProps={{ shrink: true }}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl variant="outlined" fullWidth margin="normal">
            <InputLabel id="typeId-label">نوع المصروف</InputLabel>
            <Controller
              name="typeId"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <Select {...field} labelId="typeId-label" label="نوع المصروف">
                  {loadingExpenseTypes ? (
                    <MenuItem disabled>
                      <CircularProgress size={24} />
                    </MenuItem>
                  ) : (
                    expenseTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              )}
            />
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="totalPrice"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <TextField
                {...field}
                label="السعر الكلي"
                variant="outlined"
                fullWidth
                margin="normal"
                type="number"
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl variant="outlined" fullWidth margin="normal">
            <InputLabel id="payEvery-label">الدفع كل</InputLabel>
            <Controller
              name="payEvery"
              control={control}
              defaultValue="ONCE"
              render={({ field }) => (
                <Select {...field} labelId="payEvery-label" label="الدفع كل">
                  {payEveryOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl>
        </Grid>
        {payEvery !== "ONCE" && (
          <>
            <Grid item xs={12} md={6}>
              <Controller
                name="installmentStartDate"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="تاريخ بداية الأقساط"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="installmentEndDate"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="تاريخ نهاية الأقساط"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
          </>
        )}
      </Grid>
      <Button type="submit" variant="contained" color="primary" fullWidth>
        إضافة الصيانة
      </Button>
    </form>
  );
};

export default MaintenanceForm;
