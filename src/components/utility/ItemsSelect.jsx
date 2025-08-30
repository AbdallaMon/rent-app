"use client";

import {
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  TextField,
  Select,
} from "@mui/material";

export default function ItemsSelect({
  label,
  value,
  onChange,
  disabled,
  options = [],
  loading,
}) {
  console.log(value, "value");
  return (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>

      <Select
        select
        label={label}
        value={options?.find((option) => option.id == value)?.name || ""}
        onChange={(e) => onChange(e.target.value)}
        renderValue={(selected) => {
          if (loading) {
            return (
              <Box display="flex" alignItems="center">
                <CircularProgress size={20} sx={{ marginRight: 2 }} />
                <span>جاري التحميل</span>
              </Box>
            );
          }
          return selected;
        }}
      >
        {options?.map((o) => (
          <MenuItem key={o.id} value={o.id}>
            {o.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
