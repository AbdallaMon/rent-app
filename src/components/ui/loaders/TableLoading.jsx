"use client";
import React from "react";
import { Box, CircularProgress, Typography, useTheme } from "@mui/material";

export function TableLoading({ loadingMessage }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 50,
        bgcolor: theme.palette.background.paper + "99", // paper background with transparency
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          alignItems: "center",
        }}
      >
        <CircularProgress color="primary" />
        <Typography variant="h6" color="text.primary">
          {loadingMessage}
        </Typography>
      </Box>
    </Box>
  );
}
