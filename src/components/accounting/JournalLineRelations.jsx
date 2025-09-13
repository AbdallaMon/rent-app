"use client";

import React, { useMemo } from "react";
import {
  Box,
  Stack,
  Chip,
  Tooltip,
  Typography,
  useTheme,
  alpha,
} from "@mui/material";
import {
  FiTool,
  FiHome,
  FiHash,
  FiFileText,
  FiCreditCard,
  FiUser,
  FiBookOpen,
  FiShield,
  FiBriefcase,
  FiTag,
} from "react-icons/fi";

const partyTypeAr = (t) => {
  if (!t) return "";
  const map = {
    OWNER: "مالك",
    RENTER: "مستأجر",
    TENANT: "مستأجر",
    SUPPLIER: "مورد",
    VENDOR: "مورد",
    CUSTOMER: "عميل",
    COMPANY: "شركة",
    OTHER: "آخر",
  };
  return map[t] || t;
};

// Enhanced chip color mapping based on relation type
const getChipVariant = (text) => {
  if (text.includes("الصيانة")) return { color: "warning", variant: "filled" };
  if (text.includes("العقار")) return { color: "primary", variant: "filled" };
  if (text.includes("الوحدة")) return { color: "secondary", variant: "filled" };
  if (text.includes("العقد")) return { color: "info", variant: "filled" };
  if (text.includes("دفعة")) return { color: "success", variant: "filled" };
  if (text.includes("الطرف")) return { color: "primary", variant: "outlined" };
  if (text.includes("حساب GL"))
    return { color: "secondary", variant: "outlined" };
  if (text.includes("وديعة")) return { color: "warning", variant: "outlined" };
  if (text.includes("حساب الشركة"))
    return { color: "info", variant: "outlined" };
  if (text.includes("وصف الطرف"))
    return { color: "default", variant: "outlined" };
  return { color: "default", variant: "outlined" };
};

export default function JournalLineRelations({
  line,
  maxWidth = "400px",
  showEmptyState = true,
  enableInteraction = true,
  compact = false,
}) {
  const theme = useTheme();

  const parts = useMemo(() => {
    const items = [];
    const added = new Set();
    const push = (icon, text, priority = 0) => {
      if (!text) return;
      const key = text.trim();
      if (key && !added.has(key)) {
        items.push({ icon, text: key, priority });
        added.add(key);
      }
    };

    // الصيانة (high priority)
    if (line?.maintenance || line?.maintenanceId) {
      const desc = line?.maintenance?.description?.trim();
      push(<FiTool />, `الصيانة: ${desc || `#${line?.maintenanceId}`}`, 3);
    }

    // العقار (high priority)
    const propertyName = line?.property?.name;
    if (propertyName) push(<FiHome />, `العقار: ${propertyName}`, 3);

    // الوحدة (unit أو rentAgreement.unit أو unitId) (high priority)
    const unitNumber =
      line?.unit?.number ||
      line?.rentAgreement?.unit?.number ||
      (line?.unitId ? `#${line.unitId}` : null);
    if (unitNumber) push(<FiHash />, `الوحدة: ${unitNumber}`, 3);

    // العقد (medium priority)
    if (line?.rentAgreement || line?.rentAgreementId) {
      const raLabel =
        line?.rentAgreement?.rentAgreementNumber ||
        (line?.rentAgreementId ? `#${line.rentAgreementId}` : null);
      if (raLabel) push(<FiFileText />, `العقد: ${raLabel}`, 2);
    }

    // الدفعة (medium priority)
    if (line?.payment || line?.paymentId) {
      const payId = line?.payment?.id || line?.paymentId;
      if (payId) push(<FiCreditCard />, `دفعة: #${payId}`, 2);
    }

    // الطرف (partyClient + partyType) (medium priority)
    if (line?.partyClient || line?.partyClientId || line?.partyType) {
      const name = line?.partyClient?.name?.trim();
      const idOnly = line?.partyClientId ? `#${line.partyClientId}` : "";
      const type = partyTypeAr(line?.partyType);
      const labelCore = name || idOnly || "";
      const label =
        type && labelCore
          ? `الطرف (${type}): ${labelCore}`
          : type
            ? `الطرف: ${type}`
            : labelCore
              ? `الطرف: ${labelCore}`
              : "";
      if (label) push(<FiUser />, label, 2);
    }

    // حساب الأستاذ (GL) (low priority)
    if (line?.glAccount || line?.glAccountId) {
      const code = line?.glAccount?.code;
      const name = line?.glAccount?.name;
      const base =
        code && name
          ? `${code} - ${name}`
          : code
            ? `${code}`
            : name
              ? `${name}`
              : line?.glAccountId
                ? `#${line.glAccountId}`
                : "";
      if (base) push(<FiBookOpen />, `حساب GL: ${base}`, 1);
    }

    // وديعة التأمين (low priority)
    if (line?.securityDeposit || line?.securityDepositId) {
      const depId = line?.securityDeposit?.id || line?.securityDepositId;
      if (depId) push(<FiShield />, `وديعة: #${depId}`, 1);
    }

    // حساب الشركة البنكي (low priority)
    if (line?.companyBankAccount || line?.companyBankAccountId) {
      const accName =
        line?.companyBankAccount?.name ||
        line?.companyBankAccount?.accountNumber ||
        (line?.companyBankAccountId ? `#${line.companyBankAccountId}` : "");
      if (accName) push(<FiBriefcase />, `حساب الشركة: ${accName}`, 1);
    }

    // وصف الطرف المقابل (label حر) (low priority)
    if (line?.counterpartyLabel) {
      push(<FiTag />, `وصف الطرف: ${String(line.counterpartyLabel).trim()}`, 1);
    }

    // Sort by priority (high to low) then alphabetically
    return items.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.text.localeCompare(b.text, "ar");
    });
  }, [line]);

  if (!parts.length && showEmptyState) {
    return (
      <Box sx={{ maxWidth }}>
        <Chip
          size={compact ? "small" : "medium"}
          label="لا توجد علاقات"
          variant="outlined"
          sx={{
            color: theme.palette.text.secondary,
            borderColor: alpha(theme.palette.divider, 0.5),
            backgroundColor: alpha(theme.palette.action.hover, 0.02),
            cursor: "default",
            "&:hover": enableInteraction
              ? {
                  backgroundColor: alpha(theme.palette.action.hover, 0.04),
                }
              : {},
          }}
        />
      </Box>
    );
  }

  if (!parts.length) return null;

  return (
    <Box sx={{ maxWidth }}>
      <Stack
        direction="row"
        useFlexGap
        flexWrap="wrap"
        sx={{
          gap: compact ? 0.75 : 1,
          alignItems: "center",
        }}
      >
        {parts.map((part, idx) => {
          const { color, variant } = getChipVariant(part.text);
          const isLongText = part.text.length > 30;

          return (
            <Tooltip
              key={idx}
              title={part.text}
              arrow
              placement="top"
              enterDelay={500}
              leaveDelay={200}
              componentsProps={{
                tooltip: {
                  sx: {
                    backgroundColor: theme.palette.grey[800],
                    color: theme.palette.common.white,
                    fontSize: theme.typography.caption.fontSize,
                    fontWeight: theme.typography.fontWeightMedium,
                    direction: "rtl",
                    maxWidth: 300,
                    "& .MuiTooltip-arrow": {
                      color: theme.palette.grey[800],
                    },
                  },
                },
              }}
            >
              <Chip
                size={compact ? "small" : "medium"}
                variant={variant}
                color={color}
                icon={
                  <Box
                    component="span"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      fontSize: compact ? "0.75rem" : "0.875rem",
                    }}
                  >
                    {part.icon}
                  </Box>
                }
                label={
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{
                      fontSize: compact ? "0.6875rem" : "0.75rem",
                      fontWeight: theme.typography.fontWeightMedium,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: isLongText ? "150px" : "none",
                    }}
                  >
                    {part.text}
                  </Typography>
                }
                sx={{
                  direction: "rtl",
                  cursor: enableInteraction ? "pointer" : "default",
                  transition: theme.transitions.create(
                    ["background-color", "box-shadow", "transform"],
                    {
                      duration: theme.transitions.duration.short,
                    }
                  ),
                  ".MuiChip-icon": {
                    mr: 0,
                    ml: 0.5,
                  },
                  maxWidth: "100%",
                  "&:hover": enableInteraction
                    ? {
                        transform: "translateY(-1px)",
                        boxShadow: theme.shadows[2],
                      }
                    : {},
                  "&:active": enableInteraction
                    ? {
                        transform: "translateY(0)",
                      }
                    : {},
                }}
              />
            </Tooltip>
          );
        })}
      </Stack>
    </Box>
  );
}
