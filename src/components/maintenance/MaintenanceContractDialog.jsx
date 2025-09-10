"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Typography,
  Divider,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  FormHelperText,
  useTheme,
  Paper,
  Grid,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import {
  FiPlus,
  FiUser,
  FiBriefcase,
  FiAperture,
  FiCreditCard,
} from "react-icons/fi";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/ar";

// =============================
// Helpers: API fetchers (unchanged)
// =============================
async function getProperties() {
  const res = await fetch("/api/fast-handler?id=properties");
  const data = await res.json();
  return data;
}
async function getUnitsByProperty(propertyId) {
  if (!propertyId) return [];
  const res = await fetch(`/api/fast-handler?id=unit&propertyId=${propertyId}`);
  const data = await res.json();
  const dataWithLabel = [
    { id: null, name: "عام - العقار كله", number: "عام - العقار كله" },
    ...data.map((u) => ({ id: u.id, name: u.number || `وحدة #${u.id}` })),
  ];
  return dataWithLabel;
}
async function getExpenseTypes() {
  const res = await fetch("/api/fast-handler?id=expenseTypes");
  const data = await res.json();
  return data;
}
async function getPaymentMethodTypes() {
  const methodTypes = [
    { id: "CASH", name: "نقدي" },
    { id: "BANK", name: "تحويل بنكي" },
  ];
  return { data: methodTypes };
}
async function getGlAccountsByType(type) {
  const res = await fetch(`/api/fast-handler?id=glAccounts&type=EXPENSE&`);
  const data = await res.json();
  return data;
}
async function getCompanyAccounts() {
  const res = await fetch("/api/fast-handler?id=glAccounts&type=ASSET");
  const data = await res.json();
  return data.filter(
    (account) => account.code !== "1210" && account.code !== "1220"
  );
}
// جديد: خيارات "دفع كل"
async function getPayEveryOptions() {
  const data = [
    { id: "ONE_MONTH", name: "كل شهر" },
    { id: "TWO_MONTHS", name: "كل شهرين" },
    { id: "FOUR_MONTHS", name: "كل أربعة أشهر" },
    { id: "SIX_MONTHS", name: "كل ستة أشهر" },
    { id: "ONE_YEAR", name: "كل سنة" },
  ];
  return { data };
}

// =============================
// Small Date Field (reused)
// =============================
function DateField({ label, value, onChange, required, error, helperText }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ar">
      <DatePicker
        label={label}
        value={value ? dayjs(value) : null}
        onChange={(newValue) => {
          onChange(newValue ? newValue.format("YYYY-MM-DD") : "");
        }}
        format="DD/MM/YYYY"
        slotProps={{
          textField: {
            required,
            fullWidth: true,
            size: "medium",
            error: !!error,
            helperText: error ? helperText : "",
          },
        }}
      />
    </LocalizationProvider>
  );
}

// =============================
// Reusable async autocomplete
// =============================
function AsyncAutocomplete({
  label,
  value,
  onChange,
  loadOptions,
  disabled,
  getOptionLabel = (o) => o?.name || "",
  isOptionEqualToValue = (o, v) => o?.id === v?.id,
  placeholder,
  required = false,
  helperText,
  error = false,
  sx,
}) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await loadOptions();
      setOptions(Array.isArray(data) ? data : data?.data || []);
    } catch (e) {
      console.error(e);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!disabled) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  return (
    <Box sx={sx}>
      <Autocomplete
        disabled={disabled}
        options={options}
        value={value}
        onChange={(_, v) => onChange(v)}
        loading={loading}
        noOptionsText="لا توجد نتائج"
        autoHighlight
        getOptionLabel={getOptionLabel}
        isOptionEqualToValue={isOptionEqualToValue}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            required={required}
            placeholder={placeholder}
            size="medium"
            error={error}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress size={18} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
      {helperText ? (
        <FormHelperText sx={{ mx: 1, mt: 0.5 }}>{helperText}</FormHelperText>
      ) : null}
    </Box>
  );
}

// =============================
// Sections
// =============================
function SectionHeader({ title, subtitle, icon }) {
  const theme = useTheme();
  return (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {icon ? (
          <Box sx={{ display: "inline-flex", color: "text.secondary" }}>
            {icon}
          </Box>
        ) : null}
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
      </Box>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {subtitle}
        </Typography>
      ) : null}
      <Divider sx={{ mt: 1, borderColor: theme.palette.divider }} />
    </Box>
  );
}

function CommonFields({
  amount,
  setAmount,
  date,
  setDate,
  description,
  setDescription,
  expenseType,
  setExpenseType,
  paymentMethod,
  setPaymentMethod,
  payEvery,
  setPayEvery,
  startInstallmentsDate,
  setStartInstallmentsDate,
  endInstallmentsDate,
  setEndInstallmentsDate,
  currency = "AED",
  touched,
}) {
  const amountError = touched && !(Number(amount) > 0);
  const dateError = touched && !date;
  const expenseError = touched && !expenseType?.id;
  const paymentError = touched && !paymentMethod?.id;

  const payEveryError = touched && !payEvery?.id;
  const startErr = touched && !startInstallmentsDate;
  const endErr = touched && !endInstallmentsDate;

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <SectionHeader title="بيانات عقد الصيانة" icon={<FiAperture />} />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <TextField
            label="مبلغ كل قسط"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            fullWidth
            size="medium"
            error={amountError}
            helperText={amountError ? "من فضلك أدخل مبلغًا أكبر من صفر" : ""}
            inputProps={{ min: 0, step: "0.01" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">{currency}</InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <DateField
            label="تاريخ إنشاء العقد"
            value={date}
            onChange={setDate}
            required
            error={dateError}
            helperText="اختر تاريخ العقد"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <AsyncAutocomplete
            label="نوع عقد الصيانة"
            value={expenseType}
            onChange={setExpenseType}
            loadOptions={getExpenseTypes}
            required
            error={expenseError}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <AsyncAutocomplete
            label="طريقة الدفع"
            value={paymentMethod}
            onChange={setPaymentMethod}
            loadOptions={getPaymentMethodTypes}
            required
            error={paymentError}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            label="الوصف"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            size="medium"
            multiline
            minRows={2}
            placeholder="وصف اختياري لتوضيح تفاصيل عقد الصيانة..."
          />
        </Grid>
      </Grid>

      {/* خطة الأقساط */}
      <Box sx={{ mt: 2 }}>
        <SectionHeader title="خطة الأقساط" />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <AsyncAutocomplete
              label="دفع كل"
              value={payEvery}
              onChange={setPayEvery}
              loadOptions={getPayEveryOptions}
              required
              error={payEveryError}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <DateField
              label="تاريخ بداية الأقساط"
              value={startInstallmentsDate}
              onChange={setStartInstallmentsDate}
              required
              error={startErr}
              helperText="اختر تاريخ البداية"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <DateField
              label="تاريخ نهاية الأقساط"
              value={endInstallmentsDate}
              onChange={setEndInstallmentsDate}
              required
              error={endErr}
              helperText="اختر تاريخ النهاية"
            />
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}

function OwnerSection({
  property,
  setProperty,
  unit,
  setUnit,
  creditCompanyAccount,
  setCreditCompanyAccount,
  touched,
}) {
  const [unitsOptions, setUnitsOptions] = useState([]);
  const propertyId = property?.id ?? null;

  useEffect(() => {
    (async () => {
      setUnit(null);
      if (!propertyId) {
        setUnitsOptions([]);
        return;
      }
      const data = await getUnitsByProperty(propertyId);
      setUnitsOptions(data);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const propertyError = touched && !property?.id;
  const accountError = touched && !creditCompanyAccount?.id;

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <SectionHeader
        title="عقد صيانة على المالك"
        icon={<FiUser />}
        subtitle="سيتم إثبات القيد: مدين على ذمم الملاك (مالك العقار)، ودائن على حساب الشركة المختار."
      />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <AsyncAutocomplete
            label="العقار"
            value={property}
            onChange={setProperty}
            loadOptions={getProperties}
            required
            error={propertyError}
            helperText="اختيار العقار يفعّل اختيار الوحدة (اختياري)"
            placeholder="ابحث باسم العقار..."
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Autocomplete
            disabled={!propertyId}
            options={unitsOptions}
            value={unit}
            onChange={(_, v) => setUnit(v)}
            getOptionLabel={(o) => o?.name || ""}
            isOptionEqualToValue={(o, v) => o?.id === v?.id}
            noOptionsText={propertyId ? "لا توجد وحدات" : "اختر عقار أولًا"}
            renderInput={(params) => (
              <TextField {...params} label="الوحدة (اختياري)" size="medium" />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <AsyncAutocomplete
            label="مصدر الدفع (حساب الشركة – دائن)"
            value={creditCompanyAccount}
            onChange={setCreditCompanyAccount}
            loadOptions={getCompanyAccounts}
            required
            error={accountError}
            placeholder="ابحث باسم الحساب..."
            helperText="ملاحظة: يفضّل عدم استخدام حساب الذمم هنا."
          />
        </Grid>
      </Grid>
    </Paper>
  );
}

export default function MaintenanceContractDialogButton({ onSaved }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [open, setOpen] = useState(false);
  const [payer, setPayer] = useState("OWNER");
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  // common
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [expenseType, setExpenseType] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);

  // installments plan (NEW)
  const [payEvery, setPayEvery] = useState(null);
  const [startInstallmentsDate, setStartInstallmentsDate] = useState("");
  const [endInstallmentsDate, setEndInstallmentsDate] = useState("");

  // owner
  const [property, setProperty] = useState(null);
  const [unit, setUnit] = useState(null);
  const [ownerCreditCompanyAccount, setOwnerCreditCompanyAccount] =
    useState(null);

  // company
  const [debitGl, setDebitGl] = useState(null);
  const [companyCreditCompanyAccount, setCompanyCreditCompanyAccount] =
    useState(null);

  const isOwner = payer === "OWNER";

  const baseOk =
    Number(amount) > 0 &&
    Boolean(date) &&
    Boolean(expenseType?.id) &&
    Boolean(paymentMethod?.id) &&
    Boolean(payEvery?.id) &&
    Boolean(startInstallmentsDate) &&
    Boolean(endInstallmentsDate);

  const canSubmit = useMemo(() => {
    if (isOwner) {
      return (
        baseOk &&
        Boolean(property?.id) &&
        Boolean(ownerCreditCompanyAccount?.id)
      );
    }
    return (
      baseOk && Boolean(debitGl?.id) && Boolean(companyCreditCompanyAccount?.id)
    );
  }, [
    baseOk,
    isOwner,
    property,
    ownerCreditCompanyAccount,
    debitGl,
    companyCreditCompanyAccount,
  ]);

  const resetAll = () => {
    setPayer("OWNER");
    setAmount("");
    setDescription("");
    setExpenseType(null);
    setPaymentMethod(null);
    setProperty(null);
    setUnit(null);
    setOwnerCreditCompanyAccount(null);
    setDebitGl(null);
    setCompanyCreditCompanyAccount(null);
    setDate(new Date().toISOString().slice(0, 10));
    setPayEvery(null);
    setStartInstallmentsDate("");
    setEndInstallmentsDate("");
    setTouched(false);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setTouched(true);
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    const payloadCommon = {
      cost: Number(amount),
      date,
      description,
      typeId: expenseType?.id,
      paymentMethodType: paymentMethod?.id,
      payEvery: payEvery?.id,
      installmentsStartDate: startInstallmentsDate,
      installmentsEndDate: endInstallmentsDate,
    };

    try {
      const payload = {
        ...payloadCommon,
        propertyId: property?.id,
        unitId: unit?.id ?? null,
        creditCompanyAccountId: ownerCreditCompanyAccount?.id,
        payer: "OWNER",
      };

      await onSaved(payload);
      setOpen(false);
      resetAll();
    } catch (e) {
      console.error(e);
      alert("حصل خطأ أثناء الحفظ. حاول مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<FiPlus />}
        onClick={() => setOpen(true)}
        sx={{ borderRadius: 2 }}
      >
        إضافة عقد صيانة
      </Button>

      <Dialog
        open={open}
        onClose={() => (!submitting ? setOpen(false) : null)}
        fullWidth
        maxWidth="lg"
        fullScreen={fullScreen}
        dir="rtl"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <FiCreditCard /> إضافة عقد صيانة
        </DialogTitle>

        <DialogContent sx={{ pt: 0.5 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              {isOwner && (
                <OwnerSection
                  property={property}
                  setProperty={setProperty}
                  unit={unit}
                  setUnit={setUnit}
                  creditCompanyAccount={ownerCreditCompanyAccount}
                  setCreditCompanyAccount={setOwnerCreditCompanyAccount}
                  touched={touched}
                />
              )}
            </Grid>

            <Grid size={{ xs: 12 }}>
              <CommonFields
                amount={amount}
                setAmount={setAmount}
                date={date}
                setDate={setDate}
                description={description}
                setDescription={setDescription}
                expenseType={expenseType}
                setExpenseType={setExpenseType}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                payEvery={payEvery}
                setPayEvery={setPayEvery}
                startInstallmentsDate={startInstallmentsDate}
                setStartInstallmentsDate={setStartInstallmentsDate}
                endInstallmentsDate={endInstallmentsDate}
                setEndInstallmentsDate={setEndInstallmentsDate}
                touched={touched}
              />
            </Grid>
          </Grid>
        </DialogContent>

        {/* Sticky actions */}
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            position: fullScreen ? "static" : "sticky",
            bottom: 0,
            bgcolor: "background.paper",
            borderTop: (t) => `1px solid ${t.palette.divider}`,
          }}
        >
          <Button
            onClick={() => (!submitting ? setOpen(false) : null)}
            disabled={submitting}
          >
            إلغاء
          </Button>
          <Button
            variant="contained"
            loading={submitting}
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
          >
            حفظ
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
