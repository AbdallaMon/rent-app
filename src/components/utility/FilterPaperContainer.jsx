"use client";
import { Paper, Box, Typography, useTheme, alpha, Button } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

export default function FilterPaperContainer({
  children,
  handleFilter,
  extraComponentRender,
}) {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        backgroundColor: alpha(theme.palette.primary.main, 0.02),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        borderRadius: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 2,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          {children}
        </LocalizationProvider>
        {handleFilter && (
          <Button
            variant="contained"
            onClick={handleFilter}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            تطبيق الفلاتر
          </Button>
        )}
        {extraComponentRender && extraComponentRender()}
      </Box>
    </Paper>
  );
}
