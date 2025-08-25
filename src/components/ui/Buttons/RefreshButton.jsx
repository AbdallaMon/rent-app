import React from "react";
import { Button, CircularProgress } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

/**
 * مكون زر التحديث (MUI فقط)
 * للاستخدام في صفحات الداشبورد
 */
const RefreshButton = ({
  onRefresh,
  loading = false,
  size = "medium", // small | medium | large
  variant = "primary", // primary | secondary | success | warning | danger
  disabled = false,
  children = "تحديث",
}) => {
  const colorMap = {
    primary: "primary",
    secondary: "inherit",
    success: "success",
    warning: "warning",
    danger: "error",
  };

  return (
    <Button
      onClick={onRefresh}
      disabled={loading || disabled}
      variant="contained"
      color={colorMap[variant] || "primary"}
      size={size}
      sx={{
        borderRadius: 2,
        fontWeight: 500,
        textTransform: "none",
        minWidth: 100,
      }}
      startIcon={
        loading ? (
          <CircularProgress size={16} color="inherit" />
        ) : (
          <RefreshIcon fontSize="small" />
        )
      }
    >
      {loading ? "جاري التحديث..." : children}
    </Button>
  );
};

export default RefreshButton;
