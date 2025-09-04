"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Tooltip,
  DialogActions,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormLabel,
  Paper,
  Divider,
  Button,
  useTheme,
} from "@mui/material";
import { useFastList } from "@/helpers/hooks/useFastList";
import ItemsSelect from "@/components/utility/ItemsSelect";
import {
  AiFillCloseCircle,
  AiOutlineMinusCircle,
  AiOutlinePlusCircle,
  AiOutlineSwap,
} from "react-icons/ai";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { MobileDatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { Typography } from "antd";

const locales = ["en-gb"];

function CounterpartyPicker({ value, onChange }) {
  const { loading: glLoading, items: gls } = useFastList("glAccounts");
  const { loading: ownersLoading, items: owners } = useFastList("owners");
  const { loading: rentersLoading, items: renters } = useFastList("renter");

  const currentType = value?.type || "";

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <FormControl fullWidth>
        <FormLabel sx={{ mb: 1 }}>الجهة المقابلة (اختر واحدة)</FormLabel>
        <RadioGroup
          row
          value={currentType}
          onChange={(e) =>
            onChange({ type: e.target.value, id: "", label: "" })
          }
        >
          <FormControlLabel value="GL" control={<Radio />} label="حساب GL" />
          <FormControlLabel value="OWNER" control={<Radio />} label="مالك" />
          <FormControlLabel value="RENTER" control={<Radio />} label="مستأجر" />
          <FormControlLabel value="LABEL" control={<Radio />} label="نص حر" />
        </RadioGroup>
      </FormControl>

      <Stack spacing={1.5} sx={{ mt: 1 }}>
        {currentType === "GL" && (
          <ItemsSelect
            label="حساب GL"
            value={value?.id}
            onChange={(v) => onChange({ ...value, id: v })}
            options={gls}
            loading={glLoading}
            disabled={glLoading}
          />
        )}

        {currentType === "OWNER" && (
          <ItemsSelect
            label="المالك"
            value={value?.id}
            onChange={(v) => onChange({ ...value, id: v })}
            options={owners}
            loading={ownersLoading}
            disabled={ownersLoading}
          />
        )}

        {currentType === "RENTER" && (
          <ItemsSelect
            label="المستأجر"
            value={value?.id}
            onChange={(v) => onChange({ ...value, id: v })}
            options={renters}
            loading={rentersLoading}
            disabled={rentersLoading}
          />
        )}

        {currentType === "LABEL" && (
          <TextField
            label="النص الحر"
            value={value?.label || ""}
            onChange={(e) => onChange({ ...value, label: e.target.value })}
            fullWidth
          />
        )}
      </Stack>
    </Paper>
  );
}

export function BankCashForm({
  variant = "inflow",
  onCancel,
  onSubmit,
  isPettyCash,
}) {
  const theme = useTheme();
  const isTransfer = variant === "transfer";
  const isInflow = variant === "inflow";

  // GL accounts (unchanged)
  const { loading: accLoading, items: accounts } = useFastList("glAccounts");

  // shared fields
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [date, setDate] = useState(() => dayjs());
  const [partyClientLabel, setPartyClientLabel] = useState("");

  // keep same keys
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [accountId, setAccountId] = useState("");

  const canSubmit = useMemo(() => {
    if (Number(amount) <= 0 || !memo.trim()) return false;
    if (isTransfer) return fromId && toId && fromId !== toId;
    if (isInflow || (!isInflow && !isTransfer)) {
      return (
        partyClientLabel.trim().length > 0 &&
        (Boolean(accountId) || isPettyCash)
      );
    }
    return Boolean(accountId);
  }, [amount, memo, isTransfer, fromId, toId, accountId, partyClientLabel]);

  const handleSubmit = () => {
    const base = {
      amount: Number(amount),
      memo: memo.trim(),
      entryDate: new Date(date).toISOString(),
      partyClientLabel,
      isPettyCash,
    };

    if (isTransfer) {
      const payload = {
        kind: "TRANSFER",
        fromGlAccountId: Number(fromId), // مدين
        toGlAccountId: Number(toId), // دائن
        ...base,
      };
      onSubmit ? onSubmit(payload) : console.log(payload);
      return;
    }

    // inflow / outflow stay as-is
    const payload = {
      kind: isInflow ? "INFLOW" : "OUTFLOW",
      glAccountId: Number(accountId),
      ...base,
    };
    onSubmit ? onSubmit(payload) : console.log(payload);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={locales}>
      <Box dir="rtl">
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderColor: "divider",
            boxShadow: theme.shadows[0],
            "& .MuiInputBase-root": { borderRadius: 2 },
          }}
        >
          <Stack spacing={2}>
            {/* الحالة */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: isTransfer
                  ? "primary.main"
                  : isInflow
                    ? "success.main"
                    : "error.main",
                fontWeight: 700,
              }}
            >
              {isTransfer
                ? "قيد محاسبي (مدين/دائن)  "
                : isInflow
                  ? `إيداع / إضافة مبلغ ${isPettyCash ? "إلى صندوق النثرية" : "الى الحساب"}`
                  : `سحب / صرف مبلغ من ${isPettyCash ? "صندوق النثرية" : "الحساب"}`}{" "}
            </Box>

            <Divider />

            {/* اختيار الحسابات */}
            {isTransfer ? (
              // transfer: show vertically (each under the other)
              <Stack direction="column" spacing={2}>
                {/* مدين (Dr) — keep key as fromId */}

                <ItemsSelect
                  label="مدين (Dr)"
                  value={fromId}
                  onChange={setFromId}
                  options={accounts}
                  loading={accLoading}
                  disabled={accLoading}
                  helperText="اختر الحساب الذي سيتم تدوينه مدينًا"
                />

                {/* دائن (Cr) — keep key as toId */}
                <ItemsSelect
                  label="دائن (Cr)"
                  value={toId}
                  onChange={setToId}
                  options={accounts.filter(
                    (a) => String(a.id) !== String(fromId)
                  )}
                  loading={accLoading}
                  disabled={accLoading}
                  helperText="اختر الحساب الذي سيتم تدوينه دائنًا"
                />
              </Stack>
            ) : (
              <>
                {isPettyCash ? (
                  <Typography variant="body2" color="textSecondary">
                    سيتم تسجيل العملية على حساب صندوق النثرية ك{" "}
                    {isInflow ? "مدين" : "دائن"}
                  </Typography>
                ) : (
                  <ItemsSelect
                    label="الحساب"
                    value={accountId}
                    onChange={setAccountId}
                    options={accounts}
                    loading={accLoading}
                    disabled={accLoading}
                  />
                )}
                <TextField
                  label={isInflow ? "الدائن" : "المدين"}
                  value={partyClientLabel}
                  onChange={(e) => setPartyClientLabel(e.target.value)}
                  fullWidth
                />
              </>
            )}

            {/* المبلغ + السبب/الوصف */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="المبلغ"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                inputProps={{ min: 0, step: "0.01" }}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">درهم</InputAdornment>
                  ),
                }}
              />
              <TextField
                label={
                  isTransfer
                    ? "وصف القيد المحاسبي"
                    : isInflow
                      ? "سبب إضافة المبلغ"
                      : "سبب سحب/صرف المبلغ"
                }
                placeholder={
                  isTransfer
                    ? "مثال: قيد من الصندوق (مدين) إلى البنك (دائن)"
                    : undefined
                }
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                fullWidth
              />
            </Stack>

            {/* التاريخ */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <MobileDatePicker
                label="التاريخ"
                value={date}
                onChange={(v) => setDate(v)}
                ampm={false}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    InputLabelProps: { shrink: true },
                  },
                }}
              />
            </Stack>

            <Divider />

            {/* الأزرار */}
            <DialogActions sx={{ px: 0, justifyContent: "space-between" }}>
              <Button
                onClick={onCancel}
                startIcon={<AiFillCloseCircle />}
                sx={{ borderRadius: 2, px: 2.5 }}
              >
                إلغاء
              </Button>

              <Tooltip
                title={
                  !memo
                    ? isTransfer
                      ? "من فضلك اكتب وصف القيد"
                      : "من فضلك اكتب سبب العملية"
                    : Number(amount) <= 0
                      ? "المبلغ يجب أن يكون أكبر من صفر"
                      : !isTransfer && !partyClientLabel
                        ? `يرجى إدخال ${isInflow ? "الدائن" : "المدين"}`
                        : isTransfer && fromId === toId
                          ? "حساب (مدين) و(دائن) يجب أن يكونا مختلفين"
                          : ""
                }
                disableHoverListener={canSubmit}
              >
                <span>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    startIcon={
                      isTransfer ? (
                        <AiOutlineSwap size={18} />
                      ) : isInflow ? (
                        <AiOutlinePlusCircle size={18} />
                      ) : (
                        <AiOutlineMinusCircle size={18} />
                      )
                    }
                    sx={{
                      borderRadius: 2,
                      px: 3,
                      bgcolor: isTransfer
                        ? "primary.main"
                        : isInflow
                          ? "success.main"
                          : "error.main",
                      "&:hover": {
                        bgcolor: isTransfer
                          ? "primary.dark"
                          : isInflow
                            ? "success.dark"
                            : "error.dark",
                      },
                    }}
                  >
                    {isTransfer
                      ? "تسجيل القيد المحاسبي"
                      : isInflow
                        ? "إضافة المبلغ"
                        : "سحب المبلغ"}
                  </Button>
                </span>
              </Tooltip>
            </DialogActions>
          </Stack>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
}
