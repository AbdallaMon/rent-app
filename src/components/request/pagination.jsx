// file: src/app/UiComponents/PaginationControls.jsx
import { Box, Select, MenuItem, Pagination, InputLabel, FormControl } from "@mui/material";

const PaginationControls = ({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [20, 40, 60],
  label = "عدد الصفوف",
}) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
      <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
        <InputLabel id="rows-per-page-label">{label}</InputLabel>
        <Select
          labelId="rows-per-page-label"
          value={rowsPerPage}
          onChange={onRowsPerPageChange}
          label={label}
        >
          {rowsPerPageOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Pagination
        count={count}
        page={page}
        onChange={onPageChange}
        color="primary"
        showFirstButton
        showLastButton
      />
    </Box>
  );
};

export default PaginationControls;
