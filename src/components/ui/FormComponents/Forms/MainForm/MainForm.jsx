"use client";

import { useForm, Controller } from "react-hook-form";
import {
  Box,
  Button,
  Typography,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
} from "@mui/material";

export default function MainForm({
  inputs,
  onSubmit,
  differentButton,
  btnText,
  formTitle,
  subTitle = "",
  formStyle,
  variant,
  children,
  _className, // kept for API compatibility (unused to avoid Tailwind)
}) {
  const { formState, register, handleSubmit, watch, trigger, control } =
    useForm();
  const { errors } = formState;

  const getName = (input) => input?.data?.name || String(input?.data?.id || "");
  const getLabel = (input) => input?.data?.label || getName(input);
  const getPlaceholder = (input) => input?.data?.placeholder || "";
  const getDefault = (input) =>
    input?.data?.defaultValue !== undefined ? input.data.defaultValue : "";
  const getRules = (input) => input?.data?.rules || {};
  const getOptions = (input) => {
    const opts = input?.data?.options || [];
    return opts.map((o) =>
      typeof o === "string" || typeof o === "number"
        ? { value: o, label: String(o) }
        : { value: o.value, label: o.label ?? String(o.value) }
    );
  };
  const getType = (input) => input?.data?.inputType || "text";

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        p: 2.5, // ~ Tailwind p-5
        py: 3, // ~ Tailwind py-6
        bgcolor: (t) => t.palette.grey[100],
        borderRadius: 1, // ~ Tailwind rounded
        boxShadow: 2, // ~ Tailwind shadow-md
        ...(formStyle || {}),
      }}
    >
      <Typography
        variant="h4"
        sx={{ mb: 2, fontWeight: "bold", color: "var(--color_primary)" }}
      >
        {formTitle}
      </Typography>

      {subTitle ? (
        <Typography
          variant="subtitle1"
          sx={{ mb: 2, fontWeight: "bold", color: "var(--color_secondary)" }}
        >
          {subTitle}
        </Typography>
      ) : null}

      <Box sx={{ width: "100%" }}>
        {inputs.map((input) => {
          const name = getName(input);
          const label = getLabel(input);
          const placeholder = getPlaceholder(input);
          const rules = getRules(input);
          const defVal = getDefault(input);

          if (input?.data?.type === "select") {
            const options = getOptions(input);
            return (
              <FormControl
                key={input.data.id}
                fullWidth
                margin="normal"
                error={!!errors?.[name]}
              >
                <InputLabel>{label}</InputLabel>
                <Controller
                  name={name}
                  control={control}
                  defaultValue={defVal}
                  rules={rules}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label={label}
                      variant={variant || "outlined"}
                    >
                      {options.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                <FormHelperText>{errors?.[name]?.message || ""}</FormHelperText>
              </FormControl>
            );
          }

          // default input (text/number/email/password/etc.)
          return (
            <TextField
              key={input.data.id}
              fullWidth
              margin="normal"
              label={label}
              placeholder={placeholder}
              type={getType(input)}
              variant={variant || "outlined"}
              defaultValue={defVal}
              error={!!errors?.[name]}
              helperText={errors?.[name]?.message || ""}
              {...register(name, rules)}
              onBlur={async (e) => {
                if (rules?.validateOnBlur) {
                  await trigger(name);
                }
                if (typeof input?.data?.onBlur === "function") {
                  input.data.onBlur(e, { watch, trigger });
                }
              }}
              onChange={(e) => {
                if (typeof input?.data?.onChange === "function") {
                  input.data.onChange(e, { watch, trigger });
                }
              }}
            />
          );
        })}

        {children}
      </Box>

      {differentButton ? (
        differentButton
      ) : (
        <Button
          type="submit"
          variant="contained"
          size="large"
          color="primary"
          sx={{
            mt: 3,
            width: "100%",
            py: 1.5, // ~ Tailwind p-3
            textTransform: "capitalize",
            fontWeight: "bold",
          }}
        >
          {btnText}
        </Button>
      )}
    </Box>
  );
}
