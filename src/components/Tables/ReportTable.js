// components/ReportTable.js
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
} from "@mui/material";

const ReportTable = ({ headings, children, title }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {title}
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {headings.map((heading, index) => (
                <TableCell
                  key={index}
                  sx={{
                    backgroundColor: "#f0f0f0",
                    padding: "8px",
                    fontWeight: "bold",
                  }}
                >
                  {heading.arabic}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>{children}</TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ReportTable;
