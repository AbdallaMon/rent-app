import { CircularProgress, Typography } from "@mui/material";
import React from "react";

export function TableLoading({ loadingMessage }) {
  return (
    <div
      className={
        "absolute left-0 top-0 w-full h-full flex justify-center items-center z-50 bg-[#ffffff59]"
      }
    >
      <div className={"flex gap-2 flex-col items-center"}>
        <CircularProgress />
        <Typography variant="h5" gutterBottom>
          {loadingMessage}
        </Typography>
      </div>
    </div>
  );
}
