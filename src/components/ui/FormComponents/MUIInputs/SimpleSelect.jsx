import { FormControl, FormHelperText, InputLabel, Select } from "@mui/material";
import { useState } from "react";
import MenuItem from "@mui/material/MenuItem";

export default function SimpleSelect({
  select,
  variant = "filled",
  register,
  errors,
}) {
  const selectData = select.data;
  const options = select.options;
  const [value, setValue] = useState(
    selectData.value ? selectData.value : null,
  );

  const handleChange = (event) => {
    setValue(event.target.value);
    select.onChange && select.onChange(event);
  };

  return (
    <FormControl
      variant={variant}
      sx={select.sx ? select.sx : { minWidth: 120 }}
      error={Boolean(errors[selectData.id])}
      className={"mb-3"}
    >
      <InputLabel id={selectData.label}>{selectData.label}</InputLabel>
      <Select
        {...register(selectData.id, select.pattern)}
        {...selectData}
        value={value}
        onChange={handleChange}
      >
        {options?.map((item) => {
          return (
            <MenuItem value={item.value} key={item.label}>
              {item.label}
            </MenuItem>
          );
        })}
      </Select>
      <FormHelperText>{errors[selectData.id]?.message}</FormHelperText>
    </FormControl>
  );
}
