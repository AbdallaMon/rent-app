import React, { useRef, useState } from "react";
import { Box, Grid, IconButton, Paper, Toolbar } from "@mui/material";
import { useReactToPrint } from "react-to-print";
import PrintIcon from "@mui/icons-material/Print";
import DataCard from "@/components/ui/Cards/DataCard";
import FullScreenLoader from "@/components/Loaders/SpinnerLoader";
import CustomPagination from "@/components/CutsomPagination";

export default function DataGrid({
  columns,
  rows = [],
  page,
  total,
  setTotal,
  limit,
  setPage,
  setLimit,
  loading,
}) {
  const componentRef = useRef();
  const [printMode, setPrintMode] = useState(false);
  const totalPages = Math.ceil((total || 0) / (limit || 1));

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    pageStyle: "@media print { .MuiTablePagination-root { display: none; } }",
    onBeforeGetContent: () => {
      setPrintMode(true);
      return Promise.resolve();
    },
    onAfterPrint: () => setPrintMode(false),
  });

  const printableColumns = columns.filter((column) => column.printable);

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        borderRadius: 2,
      }}
    >
      {loading && <FullScreenLoader />}

      <Toolbar
        disableGutters
        sx={{
          mb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <IconButton onClick={handlePrint} aria-label="print">
            <PrintIcon />
          </IconButton>
        </Box>
        {/* مساحة لأي أدوات إضافية لاحقًا */}
        <Box />
      </Toolbar>

      <Box ref={componentRef}>
        <Grid container spacing={2}>
          {rows.map((row) => (
            <Grid key={row.id} item xs={12} md={6} xl={4}>
              <DataCard
                row={row}
                columns={printMode ? printableColumns : columns}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box sx={{ mt: 2 }}>
        <CustomPagination
          setLimit={setLimit}
          limit={limit}
          setPage={setPage}
          page={page}
          totalPages={totalPages}
          total={total}
          setTotal={setTotal}
        />
      </Box>
    </Paper>
  );
}
