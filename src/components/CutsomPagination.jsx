"use client";
import React from "react";
import {
  Box,
  Stack,
  Select,
  MenuItem,
  Typography,
  Pagination,
  FormControl,
  InputLabel,
} from "@mui/material";
import { paginationOptions } from "@/config/constants";

export default function CustomPagination({
  page,
  limit,
  setPage,
  setLimit,
  total,
}) {
  const totalPages = Math.ceil((total || 0) / (limit || 1));

  const handlePageChange = (_event, value) => {
    setPage(value);
  };

  const handleRowsPerPageChange = (event) => {
    const newLimit = parseInt(event.target.value, 10);
    setLimit(newLimit);
    setPage(1); // إعادة الضبط لأول صفحة عند تغيير عدد الصفوف
  };

  const start = total ? (page - 1) * limit + 1 : 0;
  const end = total ? Math.min(page * limit, total) : 0;

  const fmt = (n) => (n || 0).toLocaleString("ar-EG");

  return (
    <Box
      dir="rtl"
      sx={(theme) => ({
        borderTop: `1px solid ${theme.palette.divider}`,
        mt: 2,
        pt: 1.5,
        direction: "rtl",
      })}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="rows-per-page-label">عدد الصفوف</InputLabel>
            <Select
              labelId="rows-per-page-label"
              value={limit}
              label="عدد الصفوف"
              onChange={handleRowsPerPageChange}
            >
              {paginationOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary">
            عرض <b>{fmt(start)}</b>–<b>{fmt(end)}</b> من <b>{fmt(total)}</b>
          </Typography>
        </Stack>

        <Pagination
          count={totalPages || 1}
          page={page}
          onChange={handlePageChange}
          variant="outlined"
          shape="rounded"
          size="small"
          sx={{
            direction: "rtl",
            "& .MuiPaginationItem-root": {
              borderRadius: 2,
            },
          }}
        />
      </Stack>
    </Box>
  );
}
