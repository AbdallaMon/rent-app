"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { useReactToPrint } from "react-to-print";
import PrintIcon from "@mui/icons-material/Print";
import FullScreenLoader from "@/components/Loaders/SpinnerLoader";
import CustomPagination from "@/components/CutsomPagination";

export default function CustomTable({
  columns = [],
  rows = [],
  page,
  totalPages,
  limit,
  setPage,
  setLimit,
  loading,
  total,
  setTotal,
  disablePagination = false,
}) {
  const componentRef = useRef(null);
  const [printMode, setPrintMode] = useState(false);

  // Build initial column visibility (default printable unless printable === false)
  const buildInitialVisibility = (cols) =>
    cols.reduce((acc, c) => {
      if (c?.field) acc[c.field] = c.printable !== false;
      return acc;
    }, {});

  const [selectedColumns, setSelectedColumns] = useState(
    buildInitialVisibility(columns)
  );

  // Keep visibility state in sync if columns prop changes
  useEffect(() => {
    setSelectedColumns((prev) => {
      const base = buildInitialVisibility(columns);
      // preserve previous choices where fields still exist
      for (const k of Object.keys(base)) {
        if (k in prev) base[k] = prev[k];
      }
      return base;
    });
  }, [columns]);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    pageStyle: `
      @media print {
        .MuiTablePagination-root { display: none; }
        @page { size: auto; margin: 10mm; }
        body { -webkit-print-color-adjust: exact; }
        .MuiTableContainer-root { max-height: none !important; }
      }
    `,
    onBeforeGetContent: () => {
      setPrintMode(true);
      return Promise.resolve();
    },
    onAfterPrint: () => setPrintMode(false),
  });

  const handleColumnToggle = (field) => {
    setSelectedColumns((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const actionsCol = useMemo(
    () => columns.find((c) => c.field === "actions"),
    [columns]
  );

  const printableColumns = useMemo(
    () =>
      columns.filter(
        (c) => c?.field && selectedColumns[c.field] && c.field !== "actions"
      ),
    [columns, selectedColumns]
  );

  const columnsToRender = useMemo(() => {
    if (printMode) return printableColumns;
    // include actions at the end if present
    return actionsCol ? [...printableColumns, actionsCol] : printableColumns;
  }, [printMode, printableColumns, actionsCol]);

  const hasRows = rows && rows.length > 0;

  return (
    <Paper
      elevation={3}
      sx={{
        maxWidth: 1600,
        mx: "auto",
        my: 4,
        p: { xs: 1.5, sm: 3 },
        boxShadow: "0px 3px 6px rgba(0,0,0,0.1)",
        borderRadius: 2,
      }}
    >
      {loading && <FullScreenLoader />}

      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
          mb: 2,
          p: 0,
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
          sx={{ alignItems: "center" }}
        >
          {columns
            .filter((c) => c.field && c.field !== "actions")
            .map((column) => (
              <FormControlLabel
                key={column.field}
                control={
                  <Checkbox
                    checked={!!selectedColumns[column.field]}
                    onChange={() => handleColumnToggle(column.field)}
                    color="primary"
                  />
                }
                label={column.headerName}
                sx={{ m: 0 }}
              />
            ))}
        </Stack>

        <Box>
          <Tooltip title="Print">
            <IconButton onClick={handlePrint} sx={{ mr: 0.5 }}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      <TableContainer
        ref={componentRef}
        sx={{ maxHeight: 800, overflowY: "auto" }}
      >
        <Table stickyHeader aria-label="data table" sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              {columnsToRender.map((column) => (
                <TableCell
                  key={column.field}
                  sx={{
                    backgroundColor: "primary.main",
                    color: "primary.contrastText",
                    fontWeight: "bold",
                    borderBottom: "2px solid #e0e0e0",
                  }}
                >
                  {column.headerName}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {!hasRows ? (
              <TableRow>
                <TableCell colSpan={columnsToRender.length}>
                  <Typography
                    variant="body2"
                    sx={{ py: 3, textAlign: "center", color: "text.secondary" }}
                  >
                    No data to display.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id ?? JSON.stringify(row)}
                  sx={{
                    "&:nth-of-type(odd)": { backgroundColor: "action.hover" },
                  }}
                >
                  {columnsToRender.map((column) => (
                    <TableCell
                      key={column.field}
                      sx={{ borderBottom: "1px solid #e0e0e0" }}
                    >
                      {typeof column.renderCell === "function"
                        ? column.renderCell({ row })
                        : column.type === "size"
                          ? (row[column.field] ?? []).length
                          : row[column.field]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {!disablePagination && (
        <CustomPagination
          setLimit={setLimit}
          limit={limit}
          setPage={setPage}
          page={page}
          totalPages={totalPages}
          total={total}
          setTotal={setTotal}
        />
      )}
    </Paper>
  );
}
