import React from "react";
import { Button, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

/**
 * زر إجراءات سريعة (MUI فقط)
 * props:
 * - title: نص الزر
 * - icon: كومبوننت أيقونة (مثل react-icons)
 * - color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray'
 * - onClick
 * - disabled
 * - sx: ستايل إضافي من MUI
 */
const QuickActionButton = ({
  title,
  icon: Icon,
  color = "blue",
  onClick,
  disabled = false,
  sx = {},
}) => {
  // لو عندك ثيم مخصص، تقدر تربط الألوان بالـ palette
  const palette = {
    blue: { main: "#1d4ed8" }, // tailwind blue-700 تقريباً
    green: { main: "#15803d" }, // green-700
    purple: { main: "#6d28d9" }, // purple-700
    orange: { main: "#c2410c" }, // orange-700
    red: { main: "#b91c1c" }, // red-700
    gray: { main: "#374151" }, // gray-700
  };

  const c = palette[color] || palette.blue;

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant="text"
      disableElevation
      sx={{
        // شكل “soft” بديل لـ bg-50/100 مع hover
        bgcolor: alpha(c.main, 0.06),
        color: c.main,
        borderRadius: 2,
        p: 2,
        textAlign: "center",
        transition: "background-color 120ms ease",
        "&:hover": {
          bgcolor: alpha(c.main, 0.12),
        },
        "&.Mui-disabled": {
          opacity: 0.5,
          cursor: "not-allowed",
        },
        ...sx,
      }}
    >
      <Stack alignItems="center" spacing={1}>
        {Icon && (
          <Icon
            // نفس فكرة text-*-600 مع مسافة تحت بسيطة
            style={{ color: c.main, marginBottom: 4, width: 22, height: 22 }}
          />
        )}
        <Typography variant="body2" fontWeight={600} sx={{ color: c.main }}>
          {title}
        </Typography>
      </Stack>
    </Button>
  );
};

export default QuickActionButton;
