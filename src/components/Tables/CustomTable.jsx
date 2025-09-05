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
  TableFooter,
  Toolbar,
  Tooltip,
  Typography,
  Button,
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
  footerRow,
  edit,
  openEditModal,
}) {
  const componentRef = useRef(null);
  const [printMode, setPrintMode] = useState(false);
  if (edit) {
    const lastCol = columns[columns.length - 1];
    if (lastCol.field === "actions") {
      const oldRenderCell = lastCol.renderCell;
      columns[columns.length - 1] = {
        ...columns[columns.length - 1],
        renderCell: (params) => {
          return (
            <>
              {oldRenderCell()}
              <Button
                variant="contained"
                color="secondary"
                onClick={() => {
                  openEditModal(params.row);
                }}
              >
                تحديث
              </Button>
            </>
          );
        },
      };
    } else {
      columns.push({
        field: "actions",
        headerName: "تحديث",
        width: 200,
        printable: true,
        cardWidth: 48,
        renderCell: (params) => {
          return (
            <>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => {
                  openEditModal(params.row);
                }}
              >
                تحديث
              </Button>
            </>
          );
        },
      });
    }
  }
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
    return actionsCol ? [...printableColumns, actionsCol] : printableColumns;
  }, [printMode, printableColumns, actionsCol]);

  const hasRows = rows && rows.length > 0;
  const isActions = (field) => field === "actions";
  const totalCols = columnsToRender.length;

  // Normalize footer items to fit the table width
  const normalizedFooterItems = useMemo(() => {
    if (!footerRow || !Array.isArray(footerRow) || !totalCols) return null;

    const items = footerRow.map((it) => ({
      label: it?.label ?? "",
      value: it?.value ?? "",
      colSpan: Math.max(1, parseInt(it?.colSpan ?? 1, 10) || 1),
    }));

    const sum = items.reduce((s, it) => s + it.colSpan, 0);

    // If sum less than total columns, add a filler to consume the rest
    if (sum < totalCols) {
      items.unshift({ label: "", value: "", colSpan: totalCols - sum });
    }
    // If sum greater than total columns, clamp the last item
    if (items.reduce((s, it) => s + it.colSpan, 0) > totalCols) {
      let acc = 0;
      for (let i = 0; i < items.length; i++) {
        if (i === items.length - 1) {
          items[i].colSpan = Math.max(1, totalCols - acc);
        } else {
          acc += items[i].colSpan;
        }
      }
    }
    return items;
  }, [footerRow, totalCols]);

  const cellPaddingX = 1.5;

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
        disableGutters
        sx={{
          mb: 1.5,
          gap: 1.5,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <Paper
          variant="outlined"
          sx={(t) => ({
            px: 1,
            py: 0.5,
            borderRadius: 2,
            maxWidth: "100%",
            bgcolor:
              t.palette.mode === "light"
                ? t.palette.grey[50]
                : t.palette.background.default,
          })}
        >
          <Stack
            direction="row"
            spacing={0.5}
            useFlexGap
            flexWrap="wrap"
            sx={{ alignItems: "center", p: 0.5 }}
          >
            {columns
              .filter((c) => c.field && c.field !== "actions")
              .map((column) => (
                <FormControlLabel
                  key={column.field}
                  control={
                    <Checkbox
                      size="small"
                      checked={!!selectedColumns[column.field]}
                      onChange={() => handleColumnToggle(column.field)}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" color="text.secondary">
                      {column.headerName}
                    </Typography>
                  }
                  sx={{
                    m: 0,
                    px: 1,
                    borderRadius: 2,
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                />
              ))}
          </Stack>
        </Paper>

        <Box>
          <Tooltip title="Print">
            <IconButton
              onClick={handlePrint}
              color="primary"
              sx={{
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
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
                  sx={(theme) => ({
                    background: `linear-gradient(180deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                    color: theme.palette.primary.contrastText,
                    fontWeight: 700,
                    letterSpacing: 0.3,
                    borderBottom: 0,
                    position: "sticky",
                    top: 0,
                    zIndex: isActions(column.field) ? 3 : 1,
                    ...(isActions(column.field)
                      ? {
                          right: 0,
                          position: "sticky",
                          boxShadow: `-8px 0 12px -8px rgba(0,0,0,0.15)`,
                        }
                      : {}),
                    "&:first-of-type": { borderTopLeftRadius: 8 },
                    "&:last-of-type": { borderTopRightRadius: 8 },
                    px: cellPaddingX,
                    py: 1.25,
                  })}
                  title={column.headerName}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {column.headerName}
                  </Typography>
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
                      sx={{
                        borderBottom: "1px solid #e0e0e0",
                        fontSize: "1rem",
                        fontWeight: 400,
                        color: "text.primary",
                      }}
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

          {normalizedFooterItems && (
            <TableFooter>
              <TableRow>
                {normalizedFooterItems.map((item, idx) => (
                  <TableCell
                    key={`footer-${idx}`}
                    colSpan={item.colSpan}
                    sx={(t) => ({
                      borderTop: `2px solid ${t.palette.divider}`,
                      backgroundColor:
                        t.palette.mode === "light"
                          ? t.palette.grey[50]
                          : t.palette.background.paper,
                      fontWeight: 600,
                      py: 1.25,
                    })}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                        minHeight: 32,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {item.label}
                      </Typography>
                      <Typography variant="body1" color="text.primary">
                        {item.value}
                      </Typography>
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          )}
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
