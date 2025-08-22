"use client";
import React, {useRef, useState} from "react";
import {
    Checkbox,
    FormControlLabel,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Toolbar,
    Tooltip,
} from "@mui/material";
import {useReactToPrint} from "react-to-print";
import PrintIcon from "@mui/icons-material/Print";
import FullScreenLoader from "@/components/Loaders/SpinnerLoader";
import CustomPagination from "@/components/CutsomPagination";

export default function CustomTable({
                                        columns,
                                        rows = [], // Default to an empty array
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
    const componentRef = useRef();
    const [printMode, setPrintMode] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState(
          columns.reduce((acc, column) => {
              acc[column.field] = column.printable !== false; // Default to printable unless specified otherwise
              return acc;
          }, {}),
    );


    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        pageStyle: `
      @media print {
        .MuiTablePagination-root { 
          display: none; 
        }
        @page {
          size: auto;  /* auto is the current printer page size */
          margin: 10mm;  /* this affects the margin in the printer settings */
        }
        body {
          -webkit-print-color-adjust: exact;
        }
        .MuiTableContainer-root {
          max-height: none !important;
        }
      }
    `,
        onBeforeGetContent: () => {
            setPrintMode(true);
            return Promise.resolve();
        },
        onAfterPrint: () => setPrintMode(false),
    });

    const handleColumnToggle = (field) => {
        setSelectedColumns((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    const printableColumns = columns.filter(
          (column) => selectedColumns[column.field] && column.field !== "actions",
    );
    const columnsToRender = printMode
          ? printableColumns
          : [...printableColumns, columns.find(column => column.field === 'actions')].filter(Boolean);


    return (
          <Paper
                elevation={3}
                sx={{
                    maxWidth: 1600,
                    mx: "auto",
                    my: 4,
                    p: {
                        xs: 1,
                        sm: 3,
                    },
                    boxShadow: "0px 3px 6px rgba(0,0,0,0.1)",
                    borderRadius: "8px",
                }}
          >
              {loading && <FullScreenLoader/>}

              <Toolbar
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 2,
                    }}
              >
                  <div>
                      {columns
                            .filter((column) => column.field !== "actions")
                            .map((column) => (
                                  <FormControlLabel
                                        key={column.field}
                                        control={
                                            <Checkbox
                                                  checked={selectedColumns[column.field]}
                                                  onChange={() => handleColumnToggle(column.field)}
                                                  color="primary"
                                            />
                                        }
                                        label={column.headerName}
                                        sx={{mr: 1}}
                                  />
                            ))}
                  </div>
                  <div>
                      <Tooltip title="Print">
                          <IconButton onClick={handlePrint} sx={{mr: 1}}>
                              <PrintIcon/>
                          </IconButton>
                      </Tooltip>
                  </div>
              </Toolbar>
              <TableContainer
                    ref={componentRef}
                    sx={{
                        maxHeight: 800,
                        overflowY: "auto",
                    }}
              >
                  <Table
                        stickyHeader
                        aria-label="custom table"
                        sx={{
                            minWidth: 650,
                        }}
                  >
                      <TableHead>
                          <TableRow>
                              {(printMode ? printableColumns : columnsToRender).map((column) => (
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
                          {rows.map((row) => (
                                <TableRow
                                      key={row.id}
                                      sx={{
                                          "&:nth-of-type(odd)": {
                                              backgroundColor: "action.hover",
                                          },
                                      }}
                                >
                                    {(printMode ? printableColumns : columnsToRender).map((column) => (
                                          <TableCell
                                                key={column.field}
                                                sx={{
                                                    borderBottom: "1px solid #e0e0e0",
                                                }}
                                          >
                                              {column.renderCell
                                                    ? column.renderCell({row})
                                                    : column.type === "size"
                                                          ? row[column.field].length
                                                          : row[column.field]}
                                          </TableCell>
                                    ))}
                                </TableRow>
                          ))}
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
