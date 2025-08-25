"use client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "@mui/material";

export default function ToastContainerLocal() {
  const theme = useTheme();

  return (
    <ToastContainer
      position="top-center"
      closeOnClick
      style={{
        width: "80%",
        maxWidth: 600,
        zIndex: 9999,
      }}
      toastStyle={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius,
      }}
      progressStyle={{
        background: theme.palette.primary.main,
      }}
    />
  );
}
