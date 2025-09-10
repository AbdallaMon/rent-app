import React, { useEffect, useMemo, useState } from "react";
import { Autocomplete, TextField, CircularProgress, Box } from "@mui/material";
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
  setCurrent,
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

  const computedOptions = useMemo(() => {
    const base = localOptions || [];
    return withAll ? [{ id: "", name: "الكل" }, ...base] : base;
  }, [withAll, localOptions]);

  const selectedOption = useMemo(() => {
    const found = computedOptions.find((o) => String(o.id) === String(current));
    if (found) return found;
    return withAll ? computedOptions[0] : null;
  }, [computedOptions, current, withAll]);

  function handleAutocompleteChange(_, newValue) {
    const valueId = newValue ? newValue.id : "";
    // Reuse your existing helper (expects an event-like shape)
    const fakeEvent = { target: { value: valueId } };
    handleSearchParamsChange(fakeEvent, param, searchParams, router, onChange);

    if (setCurrent) {
      const currObj =
        localOptions?.find((option) => String(option.id) === String(valueId)) ||
        null;
      setCurrent(currObj);
    }
  }

  return (
    <Box>
      <Autocomplete
        options={computedOptions}
        value={selectedOption}
        onChange={handleAutocompleteChange}
        getOptionLabel={(option) => option?.name ?? ""}
        isOptionEqualToValue={(option, value) =>
          String(option.id) === String(value.id)
        }
        loading={localLoading}
        loadingText="جاري التحميل..."
        // Allow clearing to switch back to "الكل"
        disableClearable={!withAll}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            margin="normal"
            variant="outlined"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {localLoading ? (
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        sx={{
          minWidth: "120px",
          width: { xs: "100%", sm: 200 },
        }}
      />
    </Box>
  );
};

export default FilterSelect;
