import React from "react";
import { Select, MenuItem, Typography, Pagination } from "@mui/material";
import { paginationOptions } from "@/config/constants";

export default function CustomPagination({
  page,
  limit,
  setPage,
  setLimit,
  total,
}) {
  const totalPages = Math.ceil(total / limit);
  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleRowsPerPageChange = (event) => {
    const newLimit = parseInt(event.target.value, 10);
    setLimit(newLimit);
    setPage(1); // Reset to first page when limit changes
  };

  return (
    <div className="flex flex-col sm:flex-row gap-5 justify-between items-center p-4">
      <div className="flex items-center space-x-2">
        <Typography>عرض</Typography>
        <Select
          value={limit}
          onChange={handleRowsPerPageChange}
          displayEmpty
          inputProps={{ "aria-label": "عدد الصفوف" }}
        >
          {paginationOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
        <Typography>صفوف</Typography>
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          variant="outlined"
          shape="rounded"
          size="small"
        />
      </div>
    </div>
  );
}
