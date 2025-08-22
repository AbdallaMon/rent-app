import React from 'react';
import { CircularProgress, Box } from '@mui/material';

const CircularLoading = ({ size = 40, thickness = 4, color = 'inherit' }) => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="700px" // Adjust as needed
    >
      <CircularProgress
        size={size}
        thickness={thickness}
        color={color}
      />
    </Box>
  );
};

export default CircularLoading; 
