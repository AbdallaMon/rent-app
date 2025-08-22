import React from "react";
import { CircularProgress } from "@mui/material";

const FullScreenLoader = () => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-40 flex items-center justify-center z-50">
      <CircularProgress />
    </div>
  );
};

export default FullScreenLoader;
