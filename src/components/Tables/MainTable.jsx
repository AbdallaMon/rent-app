import React, { useMemo, useRef } from "react";
import { Box, Button, Stack } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import {
  DataGrid,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarExport,
} from "@mui/x-data-grid";
import { paginationOptions } from "@/config/constants";
import { useReactToPrint } from "react-to-print";

export default function MainTable({
  columns,
  rows = [],
  page, // 1-based
  totalPages, // بديل لو مش متاح totalRows
  totalRows, // مفضل: إجمالي السجلات من السيرفر
  limit,
  setPage,
  setLimit,
  loading,
}) {
  const paginationModel = useMemo(
    () => ({ page: Math.max(0, (page ?? 1) - 1), pageSize: limit ?? 10 }),
    [page, limit]
  );

  const handlePaginationChange = (model) => {
    setPage?.(model.page + 1);
    setLimit?.(model.pageSize);
  };

  const printRef = useRef(null);

  const computedRowCount =
    typeof totalRows === "number"
      ? totalRows
      : (totalPages ?? 0) * (limit ?? 10);

  return (
    <Box
      ref={printRef}
      sx={{
        maxHeight: "70vh",
        width: "100%",
        mr: "auto",
        mt: 6,
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        rowCount={computedRowCount}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={handlePaginationChange}
        initialState={{
          pagination: { paginationModel: { pageSize: limit ?? 10 } },
        }}
        pageSizeOptions={paginationOptions}
        disableRowSelectionOnClick
        disableColumnMenu
        slots={{
          toolbar: () => <CustomToolbar printRef={printRef} />,
        }}
        printOptions={{
          hideFooter: true,
          hideToolbar: true,
          hideFooterPagination: true,
          hideHeaderFilterMenus: true,
        }}
        sx={{
          "& .MuiDataGrid-cell": {
            borderRight: "1px solid #e0e0e0",
          },
          "& .MuiDataGrid-columnSeparator": {
            visibility: "visible",
            "&.MuiDataGrid-iconSeparator": { color: "#e0e0e0" },
          },
          "& .MuiDataGrid-row": {
            borderBottom: "1px solid #e0e0e0",
          },
          "& .MuiDataGrid-columnHeaders": {
            color: "#ffffff",
          },
        }}
      />
    </Box>
  );
}

function CustomToolbar({ printRef }) {
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  return (
    <GridToolbarContainer>
      <Stack direction="row" spacing={1} alignItems="center">
        <GridToolbarColumnsButton />
        <GridToolbarDensitySelector />
        <GridToolbarExport
          csvOptions={{
            fileName: "my_data_export",
            delimiter: ";",
          }}
          printOptions={{
            disableToolbarButton: false,
          }}
        />
        <Button
          onClick={handlePrint}
          startIcon={<PrintIcon />}
          variant="outlined"
          size="small"
          sx={{ ml: 1 }}
        >
          طباعة الجدول
        </Button>
      </Stack>
    </GridToolbarContainer>
  );
}
