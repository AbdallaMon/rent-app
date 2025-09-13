"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Typography,
  Grid, // MUI Grid v2
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  TextField,
  Checkbox,
  FormControlLabel,
  Chip,
  Stack,
  Tooltip,
  CircularProgress,
  InputAdornment,
  Card,
  CardContent,
  CardHeader,
  Alert,
  Badge,
  Skeleton,
} from "@mui/material";
import { Autocomplete } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/ar";
import {
  FiFileText,
  FiUser,
  FiHome,
  FiKey,
  FiSettings,
  FiSearch,
  FiCalendar,
  FiCheckSquare,
  FiX,
  FiHash,
  FiCreditCard,
  FiFilter,
  FiInfo,
  FiCheck,
  FiAlertCircle,
  FiDollarSign,
  FiRefreshCw,
} from "react-icons/fi";
import { PaymentType } from "@/config/Enums";
import { formatCurrencyAED } from "@/helpers/functions/convertMoneyToArabic";

const ROLE_OWNER = "OWNER";
const ROLE_RENTER = "RENTER";

const ownerAllowedTypes = ["MAINTENANCE", "MANAGEMENT_COMMISSION"];
const renterAllowedTypes = [
  "RENT",
  "TAX",
  "INSURANCE",
  "REGISTRATION",
  "CONTRACT_EXPENSE",
];

// ========================
// Stub API functions (unchanged endpoints)
// ========================
async function searchOwners({ q }) {
  const req = await fetch("/api/fast-handler?id=owners");
  const data = await req.json();
  return { data };
}
async function searchRenters({ q }) {
  const req = await fetch("/api/fast-handler?id=renter");
  const data = await req.json();
  return { data };
}
async function getPropertiesByOwner(ownerId, { q }) {
  const req = await fetch(
    `/api/fast-handler?id=properties&clientId=${ownerId}&`
  );
  const data = await req.json();
  return { data };
}
async function getUnitsByProperty(propertyId, { q }) {
  const req = await fetch(
    `/api/fast-handler?id=unit&propertyId=${propertyId}&`
  );
  const data = await req.json();
  return { data };
}
async function getRentAgreementsByRenter(renterId, { q }) {
  const req = await fetch(
    `/api/fast-handler?id=rentAgreements&renterId=${renterId}&`
  );
  const data = await req.json();
  return { data };
}
async function getEligiblePayments(params) {
  // params: { role, ownerId, renterId, propertyId, unitId, rentAgreementId, types, from, to }
  const req = await fetch(
    `/api/fast-handler?id=payments&filters=${encodeURIComponent(
      JSON.stringify(params)
    )}&`
  );
  const data = await req.json();
  console.log(req, "req");
  // Return shape:
  // [{ id, paymentType, amount, paidAmount, dueDate, property, unit, maintenance, rentAgreement, billingInvoices:[{amountApplied, billingInvoice:{invoiceNumber}}] }]
  return { data };
}

// ========================
// Reusable: AsyncAutocomplete (size = "medium")
// ========================
function AsyncAutocomplete({
  label,
  placeholder,
  fetcher, // (args:{q})=>{data:[{id,name,...}]}
  value,
  onChange,
  getOptionLabel = (o) => o?.name || "",
  deps = [],
  disabled = false,
  icon,
}) {
  const [input, setInput] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const runFetch = useCallback(
    async (q = "") => {
      if (!fetcher || disabled) {
        setOptions([]);
        return;
      }
      setLoading(true);
      try {
        const { data } = await fetcher({ q });
        setOptions(Array.isArray(data) ? data : []);
      } catch (e) {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [fetcher, disabled]
  );

  // refresh when deps change
  useEffect(() => {
    runFetch("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // fetch on input change (debounced)
  useEffect(() => {
    const t = setTimeout(() => runFetch(input), 250);
    return () => clearTimeout(t);
  }, [input, runFetch]);

  return (
    <Autocomplete
      options={options}
      value={value}
      onChange={(_, v) => onChange?.(v || null)}
      onInputChange={(_, v) => setInput(v)}
      loading={loading}
      size="medium"
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={(o, v) => o?.id === v?.id}
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          size="medium"
          label={label}
          placeholder={placeholder || "ابحث..."}
          variant="outlined"
          InputProps={{
            ...params.InputProps,
            startAdornment: icon && (
              <InputAdornment position="start">{icon}</InputAdornment>
            ),
            endAdornment: (
              <>
                {loading ? (
                  <CircularProgress size={20} color="primary" />
                ) : (
                  <FiSearch size={18} />
                )}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}

// ========================
// Subcomponents
// ========================
function RoleSelector({ role, setRole, onRoleChange }) {
  const handleRoleChange = (_, newRole) => {
    if (newRole && newRole !== role) {
      setRole(newRole);
      onRoleChange?.(newRole);
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent sx={{ pb: 2 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
          dir="rtl"
        >
          <FiUser /> من سيتم إصدار الفاتورة له؟
        </Typography>
        <ToggleButtonGroup
          exclusive
          value={role}
          onChange={handleRoleChange}
          size="large"
          sx={{
            direction: "rtl",
            "& .MuiToggleButton-root": {
              px: 3,
              py: 1.25,
              borderRadius: 2,
            },
          }}
        >
          <ToggleButton value={ROLE_OWNER}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <FiUser />
              <Typography fontWeight={600}>مالك</Typography>
            </Stack>
          </ToggleButton>
          <ToggleButton value={ROLE_RENTER}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <FiKey />
              <Typography fontWeight={600}>مستأجر</Typography>
            </Stack>
          </ToggleButton>
        </ToggleButtonGroup>
      </CardContent>
    </Card>
  );
}

function OwnerSelectors({
  owner,
  setOwner,
  property,
  setProperty,
  unit,
  setUnit,
}) {
  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardHeader
        avatar={<FiHome />}
        title="بيانات المالك والعقار"
        titleTypographyProps={{ fontWeight: 700, variant: "h6" }}
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ pt: 0 }}>
        <Grid container spacing={3} dir="rtl">
          <Grid size={{ xs: 12, md: 4 }}>
            <AsyncAutocomplete
              label="اختر المالك"
              icon={<FiUser />}
              fetcher={searchOwners}
              value={owner}
              onChange={(v) => {
                setOwner(v);
                setProperty(null);
                setUnit(null);
              }}
              getOptionLabel={(o) => o?.name || ""}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <AsyncAutocomplete
              label="العقار (اختياري)"
              icon={<FiHome />}
              fetcher={
                owner ? (args) => getPropertiesByOwner(owner.id, args) : null
              }
              value={property}
              onChange={(v) => {
                setProperty(v);
                setUnit(null);
              }}
              disabled={!owner}
              getOptionLabel={(o) => o?.name || ""}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <AsyncAutocomplete
              label="الوحدة (اختياري)"
              icon={<FiHash />}
              fetcher={
                property
                  ? (args) => getUnitsByProperty(property.id, args)
                  : null
              }
              value={unit}
              onChange={setUnit}
              disabled={!property}
              getOptionLabel={(o) => o?.name || o?.number || ""}
            />
          </Grid>
        </Grid>
        {owner && (
          <Alert icon={<FiCheck />} severity="success" sx={{ mt: 2 }}>
            تم اختيار المالك: <strong>{owner.name}</strong>
            {property && (
              <>
                {" | العقار: "}
                <strong>{property.name}</strong>
              </>
            )}
            {unit && (
              <>
                {" | الوحدة: "}
                <strong>{unit.name || unit.number}</strong>
              </>
            )}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function RenterSelectors({
  renter,
  setRenter,
  rentAgreement,
  setRentAgreement,
}) {
  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardHeader
        avatar={<FiKey />}
        title="بيانات المستأجر وعقد الإيجار"
        titleTypographyProps={{ fontWeight: 700, variant: "h6" }}
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ pt: 0 }}>
        <Grid container spacing={3} dir="rtl">
          <Grid size={{ xs: 12, md: 6 }}>
            <AsyncAutocomplete
              label="اختر المستأجر"
              icon={<FiUser />}
              fetcher={searchRenters}
              value={renter}
              onChange={(v) => {
                setRenter(v);
                setRentAgreement(null);
              }}
              getOptionLabel={(o) => o?.name || ""}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <AsyncAutocomplete
              label="عقد الإيجار (اختياري)"
              icon={<FiFileText />}
              fetcher={
                renter
                  ? (args) => getRentAgreementsByRenter(renter.id, args)
                  : null
              }
              value={rentAgreement}
              onChange={setRentAgreement}
              disabled={!renter}
              getOptionLabel={(o) =>
                o
                  ? `${o?.rentAgreementNumber || ""} — ${o?.unit?.number || ""}${
                      o?.property?.name ? " | " + o.property.name : ""
                    }`
                  : ""
              }
            />
          </Grid>
        </Grid>
        {renter && (
          <Alert icon={<FiCheck />} severity="success" sx={{ mt: 2 }}>
            تم اختيار المستأجر: <strong>{renter.name}</strong>
            {rentAgreement && (
              <>
                {" | عقد الإيجار: "}
                <strong>{rentAgreement.rentAgreementNumber}</strong>
              </>
            )}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function PaymentTypeSelector({ role, types, setTypes }) {
  const allowed = role === ROLE_OWNER ? ownerAllowedTypes : renterAllowedTypes;
  const options = allowed.map((id) => ({ id, name: PaymentType[id] }));

  return (
    <Autocomplete
      multiple
      options={options}
      value={options.filter((o) => types.includes(o.id))}
      onChange={(_, vals) => setTypes(vals.map((v) => v.id))}
      size="medium"
      getOptionLabel={(o) => o.name}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            key={option.id}
            label={option.name}
            color="primary"
            variant="outlined"
          />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          size="medium"
          label="نوع الدفعة"
          placeholder="اختر نوع/أنواع الدفعات"
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <InputAdornment position="start">
                  <FiFilter />
                </InputAdornment>
                {params.InputProps.startAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}

function PeriodSelector({ from, to, setFrom, setTo }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ar">
      <Grid container spacing={2} dir="rtl">
        <Grid size={{ xs: 12, md: 6 }}>
          <DatePicker
            label="من تاريخ"
            value={from}
            onChange={(v) => setFrom(v)}
            format="DD/MM/YYYY"
            slotProps={{
              textField: {
                fullWidth: true,
                size: "medium",
                InputProps: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <FiCalendar />
                    </InputAdornment>
                  ),
                },
              },
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DatePicker
            label="إلى تاريخ"
            value={to}
            onChange={(v) => setTo(v)}
            format="DD/MM/YYYY"
            slotProps={{
              textField: {
                fullWidth: true,
                size: "medium",
                InputProps: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <FiCalendar />
                    </InputAdornment>
                  ),
                },
              },
            }}
          />
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
}

// ========================
// Helpers (unchanged)
// ========================
function calcAppliedViaBilling(payment) {
  const arr = Array.isArray(payment?.billingInvoices)
    ? payment.billingInvoices
    : [];
  return arr.reduce((s, row) => s + (Number(row?.amountApplied) || 0), 0);
}

// ========================
// Memoized Row
// ========================
const PaymentRow = React.memo(
  function PaymentRow({ row, idx, onToggle, onAmount }) {
    console.log(row, "row");
    const applied = React.useMemo(
      () => calcAppliedViaBilling(row),
      [row.billingInvoices]
    );
    const remaining = React.useMemo(
      () => Math.max(0, (row.amount || 0) - (row.paidAmount || 0)) - applied,
      [row.amount, row.paidAmount]
    );
    const details = React.useMemo(
      () =>
        [
          row.rentAgreement?.rentAgreementNumber
            ? `عقد: ${row.rentAgreement.rentAgreementNumber}`
            : null,
          row.property?.name ? `عقار: ${row.property.name}` : null,
          row.unit?.number ? `وحدة: ${row.unit.number}` : null,
          row.maintenance?.description
            ? `صيانة: ${row.maintenance.description}`
            : null,
        ]
          .filter(Boolean)
          .join(" | "),
      [row.rentAgreement, row.property, row.unit, row.maintenance]
    );

    return (
      <Paper key={row.id} variant="outlined" sx={{ p: 2, mb: 1 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!row.checked && remaining > 0}
                  onChange={(e) => onToggle(idx, e.target.checked)}
                  color="primary"
                />
              }
              label=""
              sx={{ m: 0 }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <Stack spacing={1}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
              >
                <Chip
                  size="small"
                  icon={<FiHash />}
                  label={`#${row.id}`}
                  color="default"
                  variant="outlined"
                />
                <Chip
                  size="small"
                  icon={<FiSettings />}
                  label={PaymentType[row.paymentType] || row.paymentType}
                  color="primary"
                />
                {row.dueDate && (
                  <Chip
                    size="small"
                    icon={<FiCalendar />}
                    label={dayjs(row.dueDate).format("DD/MM/YYYY")}
                    color="warning"
                    variant="outlined"
                  />
                )}
              </Stack>

              {!!details && (
                <Typography variant="body2" color="text.secondary">
                  {details}
                </Typography>
              )}

              {/* Existing Billing Invoices wrapper */}
              {Array.isArray(row.billingInvoices) &&
                row.billingInvoices.length > 0 && (
                  <Box
                    sx={{
                      mt: 1,
                      p: 1.25,
                      bgcolor: (t) => t.palette.action.hover,
                      borderRadius: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ display: "block", mb: 0.5 }}
                    >
                      مرتبط بـ فواتير مُطالبة:
                    </Typography>
                    {remaining <= 0 && (
                      <Alert severity="error">
                        لا يمكن اضافة دفعه اذا كانت مرتطبة بمبلغ كامل بفاتورة
                        اخري
                      </Alert>
                    )}
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {row.billingInvoices.map((bi, idx2) => (
                        <Chip
                          key={idx2}
                          size="small"
                          variant="outlined"
                          label={`${bi?.billingInvoice?.invoiceNumber || "—"} • ${formatCurrencyAED(
                            Number(bi?.amountApplied) || 0
                          )}`}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  تفاصيل المبالغ:
                </Typography>
                <Stack direction="row" spacing={1.5} flexWrap="wrap">
                  <Chip
                    size="small"
                    label={`إجمالي: ${formatCurrencyAED(row.amount)}`}
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label={`مدفوع: ${formatCurrencyAED(row.paidAmount)}`}
                    color="success"
                    variant="outlined"
                  />
                  {applied > 0 && (
                    <Chip
                      size="small"
                      label={`مربوط بفواتير: ${formatCurrencyAED(applied)}`}
                      color="info"
                      variant="outlined"
                    />
                  )}
                  <Chip
                    size="small"
                    label={`متبقي: ${formatCurrencyAED(remaining)}`}
                    color="error"
                    variant="outlined"
                  />
                </Stack>
              </Box>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              size="medium"
              fullWidth
              type="number"
              label="المبلغ المطلوب"
              inputProps={{ min: 0, step: "0.01" }}
              value={row.amountToBill}
              onChange={(e) => onAmount(idx, e.target.value)}
              error={
                row.checked && (!row.amountToBill || row.amountToBill <= 0)
              }
              helperText={
                row.checked && (!row.amountToBill || row.amountToBill <= 0)
                  ? "المبلغ يجب أن يكون > 0"
                  : `الحد الأقصى: ${formatCurrencyAED(remaining)}`
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FiDollarSign />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>
    );
  },
  // Only re-render if the row object reference actually changed:
  (prev, next) => prev.row === next.row
);

// ========================
// Optimized PaymentsList
// ========================
function PaymentsList({ rows, setRows, loading }) {
  const selectedCount = React.useMemo(
    () => rows.filter((r) => r.checked).length,
    [rows]
  );

  // Update ONE row by index (no full map) — keeps other row object refs intact
  const handleToggle = React.useCallback(
    (idx, checked) => {
      setRows((prev) => {
        const current = prev[idx];
        if (!current || current.checked === checked) return prev;
        const next = prev.slice();
        next[idx] = { ...current, checked };
        return next;
      });
    },
    [setRows]
  );

  const handleAmount = React.useCallback(
    (idx, val) => {
      setRows((prev) => {
        const current = prev[idx];
        if (!current) return prev;

        let v = Number(val) || 0;
        if (v < 0) v = 0;

        const max = Math.max(
          0,
          (current.amount || 0) - (current.paidAmount || 0)
        );
        if (v > max) v = max;

        // Bail out if value didn't change
        if (current.amountToBill === v) return prev;

        const next = prev.slice();
        next[idx] = { ...current, amountToBill: v };
        return next;
      });
    },
    [setRows]
  );

  if (loading) {
    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardHeader
          avatar={<CircularProgress size={20} />}
          title="جاري تحميل الدفعات..."
          titleTypographyProps={{ fontWeight: 700 }}
        />
        <CardContent>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} height={80} animation={false} sx={{ mb: 1 }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardHeader
        avatar={
          <Badge badgeContent={selectedCount} color="primary">
            <FiCreditCard />
          </Badge>
        }
        title="الدفعات المؤهلة"
        titleTypographyProps={{ fontWeight: 700 }}
      />
      <CardContent sx={{ pt: 0 }}>
        {rows.length === 0 ? (
          <Alert severity="info" icon={<FiInfo />}>
            لا توجد دفعات مطابقة للمعايير الحالية. قم بتعديل معايير البحث أو
            اضغط &quot;بحث الدفعات&quot;.
          </Alert>
        ) : (
          <Box sx={{ maxHeight: 420, overflowY: "auto" }}>
            {rows.map((row, idx) => (
              <PaymentRow
                key={row.id}
                row={row}
                idx={idx}
                onToggle={handleToggle}
                onAmount={handleAmount}
              />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function InvoiceMeta({
  dueDate,
  setDueDate,
  paymentTerms,
  setPaymentTerms,
  description,
  setDescription,
}) {
  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardHeader
        avatar={<FiFileText />}
        title="بيانات الفاتورة"
        titleTypographyProps={{ fontWeight: 700, variant: "h6" }}
      />
      <CardContent>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ar">
          <Grid container spacing={3} dir="rtl">
            <Grid size={{ xs: 12, md: 6 }}>
              <DatePicker
                label="تاريخ المطالبة/الاستحقاق"
                value={dueDate}
                onChange={setDueDate}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "medium",
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <FiCalendar />
                        </InputAdornment>
                      ),
                    },
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="شروط الدفع"
                fullWidth
                size="medium"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="مثل: Net 30"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FiSettings />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 12 }}>
              <TextField
                label="وصف الفاتورة"
                fullWidth
                size="medium"
                multiline
                minRows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف مختصر للفاتورة..."
              />
            </Grid>
          </Grid>
        </LocalizationProvider>
      </CardContent>
    </Card>
  );
}

// ========================
// Main component
// ========================
export default function BillingInvoiceDialogButton({ onSaved }) {
  const [open, setOpen] = useState(false);

  const [role, setRole] = useState(ROLE_OWNER);

  // Owner selections
  const [owner, setOwner] = useState(null);
  const [property, setProperty] = useState(null);
  const [unit, setUnit] = useState(null);

  // Renter selections
  const [renter, setRenter] = useState(null);
  const [rentAgreement, setRentAgreement] = useState(null);

  // Filters
  const [types, setTypes] = useState(ownerAllowedTypes); // default when owner
  const [from, setFrom] = useState(dayjs().startOf("month"));
  const [to, setTo] = useState(dayjs().endOf("month"));

  // Payments list
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [rows, setRows] = useState([]);

  // Invoice meta
  const [dueDate, setDueDate] = useState(dayjs());
  const [paymentTerms, setPaymentTerms] = useState("");
  const [description, setDescription] = useState("");

  // total
  const total = useMemo(
    () =>
      rows
        .filter((r) => r.checked)
        .reduce((s, r) => s + (Number(r.amountToBill) || 0), 0),
    [rows]
  );

  // Reset function for role changes
  const resetAllData = useCallback(() => {
    // Reset entity selections
    setOwner(null);
    setProperty(null);
    setUnit(null);
    setRenter(null);
    setRentAgreement(null);
    // Reset payments and filters
    setRows([]);
    // Reset invoice meta
    setDueDate(dayjs());
    setPaymentTerms("");
    setDescription("");
  }, []);

  // Handle role change
  const handleRoleChange = useCallback(
    (newRole) => {
      resetAllData();
      if (newRole === ROLE_OWNER) {
        setTypes(ownerAllowedTypes);
      } else {
        setTypes(renterAllowedTypes);
      }
    },
    [resetAllData]
  );

  // keep allowed types in sync with role
  useEffect(() => {
    if (role === ROLE_OWNER) {
      setTypes((prev) =>
        prev.filter((t) => ownerAllowedTypes.includes(t)).length > 0
          ? prev.filter((t) => ownerAllowedTypes.includes(t))
          : ownerAllowedTypes
      );
    } else {
      const defaultTypes = renterAllowedTypes;
      setTypes((prev) =>
        prev.filter((t) => defaultTypes.includes(t)).length > 0
          ? prev.filter((t) => defaultTypes.includes(t))
          : defaultTypes
      );
    }
  }, [role]);

  // Fetch payments when the user clicks "بحث الدفعات" (explicit action)
  const canSearchPayments = useMemo(() => {
    if (!types?.length) return false;
    if (!from || !to) return false;
    if (role === ROLE_OWNER) return !!owner;
    if (role === ROLE_RENTER) return !!renter;
    return false;
  }, [role, types, from, to, owner, renter]);

  const runSearchPayments = async () => {
    if (!canSearchPayments) return;
    setLoadingPayments(true);
    try {
      const params = {
        role,
        ownerId: role === ROLE_OWNER ? owner?.id : undefined,
        renterId: role === ROLE_RENTER ? renter?.id : undefined,
        propertyId: role === ROLE_OWNER ? property?.id : undefined,
        unitId: role === ROLE_OWNER ? unit?.id : undefined,
        rentAgreementId: role === ROLE_RENTER ? rentAgreement?.id : undefined,
        types,
        from: from.toISOString(),
        to: to.toISOString(),
      };
      const { data } = await getEligiblePayments(params);

      const mapped = (data || []).map((p) => {
        const applied = calcAppliedViaBilling(p);
        const remaining =
          Math.max(0, (p.amount || 0) - (p.paidAmount || 0)) - applied;
        return { ...p, checked: remaining > 0, amountToBill: remaining };
      });
      setRows(mapped);
    } catch (e) {
      console.log(e, "error in searching");
      setRows([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  // Submit
  const handleCreate = async () => {
    const billedClientId =
      role === ROLE_OWNER
        ? owner?.id
        : role === ROLE_RENTER
          ? renter?.id
          : null;
    if (!billedClientId) {
      alert("من فضلك اختر العميل (مالك/مستأجر).");
      return;
    }

    const selected = rows.filter(
      (r) => r.checked && Number(r.amountToBill) > 0
    );
    if (!selected.length) {
      alert("اختر دفعة واحدة على الأقل وحدد مبلغًا أكبر من صفر.");
      return;
    }

    const payload = {
      billedClientId,
      dueDate: dueDate.toISOString(),
      paymentTerms: paymentTerms || null,
      periodStart: from.toISOString(),
      periodEnd: to.toISOString(),
      description: description || null,
      category: types.length === 1 ? types[0] : null,
      propertyId: property?.id || null,
      unitId: unit?.id || null,
      amount: total,
      lines: selected.map((r) => ({
        paymentId: r.id,
        amountApplied: Number(r.amountToBill) || 0,
      })),
    };

    const res = await onSaved(payload);
    if (res?.status === 200) {
      setOpen(false);
      resetAllData();
    }
  };

  // Reset when dialog opens
  const handleOpen = () => {
    setOpen(true);
    resetAllData();
    setRole(ROLE_OWNER);
    setTypes(ownerAllowedTypes);
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<FiFileText />}
        onClick={handleOpen}
        size="large"
        sx={{ borderRadius: 2, px: 3, py: 1.25, fontWeight: 700 }}
      >
        إنشاء فاتورة مُطالبة
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="lg"
        fullWidth
        dir="rtl"
        PaperProps={{ sx: { borderRadius: 3, minHeight: "80vh" } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            pb: 1,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: "primary.main",
              color: "white",
              display: "flex",
              alignItems: "center",
            }}
          >
            <FiFileText size={20} />
          </Box>
          <Typography variant="h5" fontWeight={700}>
            إنشاء فاتورة مُطالبة (BillingInvoice)
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 3, pb: 2 }}>
          {/* Section: Who */}
          <RoleSelector
            role={role}
            setRole={setRole}
            onRoleChange={handleRoleChange}
          />

          {/* Section: Entity selectors */}
          {role === ROLE_OWNER ? (
            <OwnerSelectors
              owner={owner}
              setOwner={setOwner}
              property={property}
              setProperty={setProperty}
              unit={unit}
              setUnit={setUnit}
            />
          ) : (
            <RenterSelectors
              renter={renter}
              setRenter={setRenter}
              rentAgreement={rentAgreement}
              setRentAgreement={setRentAgreement}
            />
          )}

          {/* Filters Section */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardHeader
              avatar={<FiFilter />}
              title="معايير البحث"
              titleTypographyProps={{ fontWeight: 700, variant: "h6" }}
            />
            <CardContent>
              <Grid container spacing={3} dir="rtl">
                <Grid size={{ xs: 12, md: 6 }}>
                  <PaymentTypeSelector
                    role={role}
                    types={types}
                    setTypes={setTypes}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <PeriodSelector
                    from={from}
                    to={to}
                    setFrom={setFrom}
                    setTo={setTo}
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Tooltip title="سيتم جلب الدفعات وفقًا للمعايير المحددة بالأعلى">
                  <span>
                    <Button
                      variant="contained"
                      startIcon={
                        loadingPayments ? <FiRefreshCw /> : <FiSearch />
                      }
                      disabled={!canSearchPayments || loadingPayments}
                      onClick={runSearchPayments}
                      size="large"
                      sx={{ px: 3, py: 1.25, borderRadius: 2, fontWeight: 600 }}
                    >
                      {loadingPayments ? "جاري البحث..." : "بحث الدفعات"}
                    </Button>
                  </span>
                </Tooltip>
              </Box>

              {!canSearchPayments && (
                <Alert
                  severity="warning"
                  sx={{ mt: 2 }}
                  icon={<FiAlertCircle />}
                >
                  {role === ROLE_OWNER
                    ? "يرجى اختيار المالك وتحديد نوع الدفعة والفترة الزمنية للبحث"
                    : "يرجى اختيار المستأجر وتحديد نوع الدفعة والفترة الزمنية للبحث"}
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Payments list */}
          <PaymentsList
            rows={rows}
            setRows={setRows}
            loading={loadingPayments}
          />

          {/* Invoice Meta */}
          <InvoiceMeta
            dueDate={dueDate}
            setDueDate={setDueDate}
            paymentTerms={paymentTerms}
            setPaymentTerms={setPaymentTerms}
            description={description}
            setDescription={setDescription}
          />

          {/* Total Summary */}
        </DialogContent>

        <DialogActions
          sx={{ px: 3, py: 3, borderTop: 1, borderColor: "divider" }}
        >
          <Box
            sx={{
              width: "100%",
              display: "flex",
              gap: 2,
              alignItems: "center",
            }}
          >
            <Card
              variant="outlined"
              sx={{
                border: 2,
                borderColor: "success.main",
                "&.MuiPaper-root": { flex: 1 },
              }}
            >
              <CardContent>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  flexWrap="wrap"
                  spacing={2}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor: "success.main",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <FiDollarSign size={20} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      إجمالي المبلغ المطلوب للفوترة
                    </Typography>
                  </Stack>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 800, color: "success.main" }}
                  >
                    {formatCurrencyAED(total)}
                  </Typography>
                </Stack>
                {rows.filter((r) => r.checked).length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      عدد الدفعات المحددة:{" "}
                      {rows.filter((r) => r.checked).length} من أصل{" "}
                      {rows.length}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
            <Button
              startIcon={<FiX />}
              onClick={() => setOpen(false)}
              size="large"
              sx={{ px: 3, py: 1 }}
            >
              إلغاء
            </Button>
            <Button
              variant="contained"
              startIcon={<FiCheck />}
              onClick={handleCreate}
              disabled={
                (role === ROLE_OWNER && !owner) ||
                (role === ROLE_RENTER && !renter) ||
                rows.filter((r) => r.checked && Number(r.amountToBill) > 0)
                  .length === 0
              }
              size="large"
              sx={{ px: 4, py: 1.25, fontWeight: 700 }}
            >
              إنشاء الفاتورة
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  );
}
