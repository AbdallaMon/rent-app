// components/ReportTable.js
"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Divider,
  useTheme,
  alpha,
} from "@mui/material";

const ReportTable = ({ headings, children, title }) => {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: theme.palette.text.primary,
            letterSpacing: 0.2,
          }}
        >
          {title}
        </Typography>
      </Box>

      <TableContainer
        component={Paper}
        elevation={2}
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
          // sticky header needs a fixed height container
          maxHeight: 560,
        }}
      >
        <Table stickyHeader aria-label="report table" size="small">
          <TableHead>
            <TableRow
              sx={{
                "& th": {
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? alpha(theme.palette.primary.main, 0.22)
                      : alpha(theme.palette.primary.light, 0.35),
                  color:
                    theme.palette.mode === "dark"
                      ? theme.palette.primary.contrastText
                      : theme.palette.text.primary,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                  py: 1.25,
                  px: 1.5,
                },
              }}
            >
              {headings.map((heading, index) => (
                <TableCell key={index}>{heading.arabic}</TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody
            sx={{
              // zebra rows
              "& .MuiTableRow-root:nth-of-type(odd)": {
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? alpha(theme.palette.action.hover, 0.2)
                    : alpha(theme.palette.primary.main, 0.04),
              },
              // row hover
              "& .MuiTableRow-root:hover": {
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? alpha(theme.palette.primary.main, 0.18)
                    : alpha(theme.palette.primary.light, 0.22),
                transition: "background-color 140ms ease",
              },
              // cell padding & dividers
              "& .MuiTableCell-root": {
                borderBottom: `1px dashed ${alpha(theme.palette.divider, 0.6)}`,
                py: 1.1,
                px: 1.5,
                fontSize: 14,
              },
            }}
          >
            {children}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={{ mt: 2, opacity: 0.7 }} />
    </Box>
  );
};

export default ReportTable;
