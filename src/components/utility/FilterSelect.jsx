import React, { useEffect, useState } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Box,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { handleSearchParamsChange } from "@/helpers/functions/handleSearchParamsChange";

const FilterSelect = ({
  label,
  options,
  param,
  onChange,
  loading,
  setFilters,
  reset,
  withAll = true,
  apiPoint,
}) => {
  const [localOptions, setLocalOptions] = useState(options || []);
  const [localLoading, setLoading] = useState(loading || !options?.length > 0);
  const searchParams = useSearchParams();
  const router = useRouter();
  const current = searchParams.get(param);
  useEffect(() => {
    if (searchParams.get(param) && localOptions?.length > 0) {
      if (reset) {
        setFilters({ [param]: searchParams.get(param) });
      } else {
        setFilters((oldFilters) => ({
          ...oldFilters,
          [param]: searchParams.get(param),
        }));
      }
    }
  }, [searchParams, localOptions]);

  useEffect(() => {
    if (apiPoint && localOptions?.length === 0) {
      async function getOptions() {
        setLoading(true);
        const response = await fetch(apiPoint);
        const data = await response.json();
        setLocalOptions(data);
        setLoading(false);
      }
      getOptions();
    }
  }, [apiPoint]);
  function handleChange(event) {
    handleSearchParamsChange(event, param, searchParams, router, onChange);
  }

  return (
    <Box>
      <FormControl
        variant="outlined"
        margin="normal"
        sx={{
          minWidth: "120px",
          width: {
            xs: "100%",
            sm: 200,
          },
        }}
      >
        <InputLabel>{label}</InputLabel>

        <Select
          value={
            localOptions?.find((option) => option.id == current)?.name || "All"
          }
          onChange={handleChange}
          label={label}
          disabled={localLoading}
          renderValue={(selected) => {
            if (localLoading) {
              return (
                <Box display="flex" alignItems="center">
                  <CircularProgress size={20} sx={{ marginRight: 2 }} />
                  <span>جاري التحميل</span>
                </Box>
              );
            }
            return selected || "الكل";
          }}
        >
          {withAll && <MenuItem value="">الكل</MenuItem>}
          {localOptions.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              {option.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default FilterSelect;
