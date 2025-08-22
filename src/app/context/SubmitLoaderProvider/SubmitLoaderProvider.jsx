"use client";
import React, { createContext, useContext, useState } from "react";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { Box, Button } from "@mui/material";

const SubmitContext = createContext();

export const SubmitLoaderProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("success");

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
    setMessage("");
  };

  return (
    <SubmitContext.Provider
      value={{
        loading,
        setLoading,
        open,
        setOpen,
        message,
        setMessage,
        setSeverity,
      }}
    >
      {children}
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.tooltip + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={severity}
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 5,
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <span>{message}</span>
          </Box>
        </Alert>
      </Snackbar>
    </SubmitContext.Provider>
  );
};

export const useSubmitLoader = () => useContext(SubmitContext);
