"use client";
import React from "react";
import { Chip } from "@mui/material";
import { alpha, useTheme, darken, lighten } from "@mui/material/styles";
import {
  FiCreditCard, // ASSET
  FiAlertTriangle, // LIABILITY
  FiBriefcase, // EQUITY
  FiTrendingUp, // REVENUE
  FiTrendingDown, // EXPENSE
} from "react-icons/fi";
import { accountType } from "../../config/Enums";

const TYPE_META = {
  ASSET: { color: "success", Icon: FiCreditCard },
  LIABILITY: { color: "warning", Icon: FiAlertTriangle },
  EQUITY: { color: "info", Icon: FiBriefcase },
  REVENUE: { color: "primary", Icon: FiTrendingUp },
  EXPENSE: { color: "error", Icon: FiTrendingDown },
};

export default function AccountTypeChip({
  type,
  labels = accountType,
  size = "small",
  variant = "soft", // "soft" | "solid"
  intensity = 2, // 1..3 (soft only): higher = more saturated
  elevated = false, // subtle shadow
}) {
  const theme = useTheme();
  const meta = TYPE_META[type] || { color: "default", Icon: null };
  const { color, Icon } = meta;
  const label = labels[type] || type;

  // Fallback for unknown types
  if (color === "default") {
    return <Chip label={label} size={size} />;
  }

  const palette = theme.palette[color];
  const main = palette.main;
  const dark = darken(main, 0.12);
  const light = lighten(main, 0.08);

  // stronger bg per intensity
  const levels = { 1: 0.12, 2: 0.2, 3: 0.28 };
  const bgA = levels[intensity] ?? 0.2;
  const borderA = Math.min(bgA + 0.18, 0.48);

  const softSx = {
    bgcolor: alpha(main, bgA),
    backgroundImage: `linear-gradient(135deg, ${alpha(light, bgA)}, ${alpha(
      dark,
      bgA + 0.06
    )})`,
    color: main,
    borderColor: alpha(main, borderA),
    borderRadius: "999px",
    fontWeight: 600,
    filter: "saturate(1.25)",
    ...(elevated && { boxShadow: `0 1px 2px ${alpha(dark, 0.2)}` }),
    "& .MuiChip-icon": { color: main },
  };

  const solidSx = {
    bgcolor: main,
    color: theme.palette.getContrastText(main),
    borderColor: alpha(dark, 0.4),
    borderRadius: "999px",
    fontWeight: 600,
    filter: "saturate(1.25)",
    ...(elevated && { boxShadow: `0 1px 2px ${alpha(dark, 0.3)}` }),
    "& .MuiChip-icon": { color: theme.palette.getContrastText(main) },
  };

  const chipProps =
    variant === "soft"
      ? { variant: "outlined", sx: softSx }
      : { variant: "filled", sx: solidSx };

  return (
    <Chip
      label={label}
      size={size}
      icon={Icon ? <Icon size={16} /> : undefined}
      {...chipProps}
    />
  );
}
