"use client";
import React from "react";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import rtlPlugin from "stylis-plugin-rtl";
import { prefixer } from "stylis";

/**
 * Enhanced single source of truth for colors
 */
export const colors = {
  // Brand / Primary (enhanced green with your company accent)
  primary: "#2A7A4D",
  primaryLight: "#5FB782",
  primaryDark: "#18593A",
  textOnPrimary: "#ffffff",

  // Company Colors Integration
  companyGold: "#C6A50B", // Your company gold
  companyGray: "#727070", // Your company gray
  companyDark: "#303030", // Your company dark

  // Secondary (updated with company gold influence)
  secondary: "#C6A50B", // Using your company gold as secondary
  secondaryLight: "#E6C547",
  secondaryDark: "#9A8009",
  textOnSecondary: "#ffffff",

  // Modern Supporting / Semantic Colors
  info: "#0EA5E9", // Updated to modern blue
  infoLight: "#38BDF8",
  infoDark: "#0284C7",

  success: "#059669", // More modern green
  successLight: "#10B981",
  successDark: "#047857",

  warning: "#D97706", // More vibrant orange
  warningLight: "#F59E0B",
  warningDark: "#B45309",

  error: "#DC2626", // More modern red
  errorLight: "#EF4444",
  errorDark: "#B91C1C",

  // Enhanced Text Hierarchy
  heading: "#1F2937", // Darker, more modern
  textPrimary: "#374151",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  textMuted: "#D1D5DB",

  // Modern Background System
  body: "#FAFAFA", // Slightly warmer white
  paperBg: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  bgPrimary: "#F8FAFC", // Cooler background
  bgSecondary: "#F1F5F9",
  bgTertiary: "#E2E8F0",

  // Modern Borders & Surfaces
  border: "#E5E7EB",
  borderDark: "#D1D5DB",
  borderLight: "#F3F4F6",

  // Enhanced Action States
  primaryAlt: "#e8f4ec", // Softer green tint
  highlight: "#D1FAE5",
  companyGoldAlt: "#FEF3C7", // Gold tint for variety

  // Modern Glass Effects
  glass: "rgba(255, 255, 255, 0.25)",
  glassBorder: "rgba(255, 255, 255, 0.18)",

  // Enhanced Shadows with more depth
  shadow: "rgba(0, 0, 0, 0.1)",
  shadowMedium: "rgba(0, 0, 0, 0.15)",
  shadowDark: "rgba(0, 0, 0, 0.25)",
  shadowColored: "rgba(42, 122, 77, 0.15)", // Brand colored shadow

  // Modern Gradients
  primaryGradient: "linear-gradient(135deg, #2A7A4D 0%, #5FB782 100%)",
  goldGradient: "linear-gradient(135deg, #C6A50B 0%, #E6C547 100%)",
  modernGradient: "linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)",
  glassGradient:
    "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)",
};

// ----- Enhanced Utilities
const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

const generateModernShadows = () => {
  return [
    "none",
    "0px 1px 2px 0px rgba(0, 0, 0, 0.05)",
    "0px 1px 3px 0px rgba(0, 0, 0, 0.1), 0px 1px 2px 0px rgba(0, 0, 0, 0.06)",
    "0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)",
    "0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)",
    "0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)",
    "0px 25px 50px -12px rgba(0, 0, 0, 0.25)",
    // Add more modern shadows with subtle color tints
    ...Array.from({ length: 18 }, (_, i) => {
      const elevation = i + 7;
      const opacity = Math.min(0.15, 0.05 + elevation * 0.008);
      return `0px ${Math.floor(elevation * 0.5)}px ${Math.floor(elevation * 1.5)}px rgba(42, 122, 77, ${opacity.toFixed(3)})`;
    }),
  ];
};

// ----- Enhanced Modern Theme
export const theme = createTheme({
  direction: "rtl",

  palette: {
    mode: "light",
    primary: {
      main: colors.primary,
      light: colors.primaryLight,
      dark: colors.primaryDark,
      contrastText: colors.textOnPrimary,
    },
    secondary: {
      main: colors.secondary, // Now using company gold
      light: colors.secondaryLight,
      dark: colors.secondaryDark,
      contrastText: colors.textOnSecondary,
    },
    error: {
      main: colors.error,
      light: colors.errorLight,
      dark: colors.errorDark,
      contrastText: "#fff",
    },
    warning: {
      main: colors.warning,
      light: colors.warningLight,
      dark: colors.warningDark,
      contrastText: "#fff",
    },
    info: {
      main: colors.info,
      light: colors.infoLight,
      dark: colors.infoDark,
      contrastText: "#fff",
    },
    success: {
      main: colors.success,
      light: colors.successLight,
      dark: colors.successDark,
      contrastText: "#fff",
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
      disabled: colors.textMuted,
    },
    divider: colors.border,
    background: {
      default: colors.body,
      paper: colors.paperBg,
    },
    common: {
      white: "#ffffff",
      black: colors.heading,
    },
    // Enhanced custom palette extensions
    gradient: {
      primary: colors.primaryGradient,
      secondary: colors.goldGradient,
      modern: colors.modernGradient,
      glass: colors.glassGradient,
    },
    company: {
      gold: colors.companyGold,
      gray: colors.companyGray,
      dark: colors.companyDark,
      goldAlt: colors.companyGoldAlt,
    },
    glass: {
      background: colors.glass,
      border: colors.glassBorder,
    },
    action: {
      hover: colors.primaryAlt,
      selected: colors.highlight,
      disabled: colors.textMuted,
      disabledBackground: colors.bgTertiary,
      focus: colors.primaryAlt,
    },
  },

  // Enhanced typography with modern font stack
  typography: {
    fontFamily: [
      "Inter", // Modern, highly legible
      "Noto Kufi Arabic",
      "system-ui",
      "-apple-system",
      "BlinkMacSystemFont",
      "sans-serif",
    ].join(","),

    // Modern typography scale
    h1: {
      color: colors.heading,
      fontWeight: 800, // Bolder for impact
      fontSize: "clamp(2rem, 4vw, 3.5rem)", // Responsive sizing
      lineHeight: 1.15,
      letterSpacing: "-0.025em", // Tighter for large text
    },
    h2: {
      color: colors.heading,
      fontWeight: 700,
      fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
      lineHeight: 1.2,
      letterSpacing: "-0.015em",
    },
    h3: {
      color: colors.heading,
      fontWeight: 600,
      fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
      lineHeight: 1.25,
    },
    h4: {
      color: colors.heading,
      fontWeight: 600,
      fontSize: "1.5rem",
      lineHeight: 1.3,
    },
    h5: {
      color: colors.textPrimary,
      fontWeight: 600,
      fontSize: "1.25rem",
      lineHeight: 1.4,
    },
    h6: {
      color: colors.textPrimary,
      fontWeight: 500,
      fontSize: "1.125rem",
      lineHeight: 1.4,
    },
    body1: {
      color: colors.textPrimary,
      fontSize: "1rem",
      lineHeight: 1.7, // More readable
      letterSpacing: "0.005em",
    },
    body2: {
      color: colors.textSecondary,
      fontSize: "0.875rem",
      lineHeight: 1.6,
    },
    caption: {
      color: colors.textTertiary,
      fontSize: "0.75rem",
      lineHeight: 1.5,
    },
    overline: {
      color: colors.companyGray, // Using company color
      fontSize: "0.75rem",
      fontWeight: 700, // Bolder
      textTransform: "uppercase",
      letterSpacing: "0.15em", // More spacing
    },
  },

  // Enhanced spacing and shapes
  spacing: 8,
  shape: {
    borderRadius: 12, // More modern rounded corners
  },

  // Modern shadow system
  shadows: generateModernShadows(),

  // Enhanced components with modern touches
  components: {
    MuiContainer: {
      defaultProps: { maxWidth: "xxl" },
      styleOverrides: {
        root: {
          paddingLeft: 24,
          paddingRight: 24,
          "@media (min-width: 600px)": {
            paddingLeft: 32,
            paddingRight: 32,
          },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: colors.paperBg,
          backgroundImage: "none",
          borderRadius: 16, // More rounded
        },
        elevation1: {
          backgroundColor: colors.surfaceElevated,
          boxShadow:
            "0px 1px 3px rgba(0, 0, 0, 0.08), 0px 4px 12px rgba(42, 122, 77, 0.04)",
        },
        elevation2: {
          boxShadow:
            "0px 4px 12px rgba(0, 0, 0, 0.08), 0px 8px 24px rgba(42, 122, 77, 0.06)",
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: colors.paperBg,
          borderRadius: 20, // Even more rounded for cards
          border: `1px solid ${colors.borderLight}`,
          boxShadow:
            "0px 4px 16px rgba(0, 0, 0, 0.06), 0px 8px 32px rgba(42, 122, 77, 0.04)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow:
              "0px 8px 24px rgba(0, 0, 0, 0.1), 0px 16px 48px rgba(42, 122, 77, 0.08)",
          },
        },
      },
    },

    MuiButton: {
      defaultProps: {
        disableElevation: false,
      },
      styleOverrides: {
        root: {
          borderRadius: 50,
          textTransform: "none",
          fontWeight: 600,
          letterSpacing: "0.01em",
          padding: "10px 24px",
          minHeight: 44, // Better touch targets
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",

          "&:active": {
            transform: "scale(0.98)",
          },
          "&.Mui-disabled": {
            color: colors.textMuted,
          },
          "&:focus-visible": {
            outline: `2px solid ${colors.primary}`,
            outlineOffset: "2px",
          },
        },

        // Enhanced contained styles
        containedPrimary: {
          background: colors.primaryGradient,
          boxShadow: `0 4px 14px ${colors.shadowColored}`,
          "&:hover": {
            background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primary} 100%)`,
            boxShadow: `0 8px 24px ${colors.shadowColored}`,
            transform: "translateY(-1px)",
          },
          "&:active": {
            transform: "scale(0.98) translateY(0px)",
          },
        },

        containedSecondary: {
          background: colors.goldGradient,
          boxShadow: `0 4px 14px rgba(198, 165, 11, 0.3)`,
          "&:hover": {
            background: `linear-gradient(135deg, ${colors.secondaryDark} 0%, ${colors.secondary} 100%)`,
            boxShadow: `0 8px 24px rgba(198, 165, 11, 0.4)`,
            transform: "translateY(-1px)",
          },
        },

        // Enhanced outlined styles with modern borders
        outlinedPrimary: {
          borderWidth: 2,
          borderColor: colors.primary,
          color: colors.primary,
          backgroundColor: "transparent",
          "&:hover": {
            borderColor: colors.primaryDark,
            backgroundColor: colors.primaryAlt,
            transform: "translateY(-1px)",
            boxShadow: `0 4px 12px ${colors.shadowColored}`,
          },
        },

        // Glass morphism style variant (you can add this as a custom variant)
        text: {
          padding: "8px 16px",
          "&.glass-effect": {
            background: colors.glassGradient,
            backdropFilter: "blur(20px)",
            border: `1px solid ${colors.glassBorder}`,
            borderRadius: 16,
          },
        },
      },
    },

    // Enhanced TextField with modern styling
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
            backgroundColor: colors.bgPrimary,
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",

            "& fieldset": {
              borderColor: colors.border,
              borderWidth: 1.5,
            },
            "&:hover fieldset": {
              borderColor: colors.primary,
              borderWidth: 2,
            },
            "&.Mui-focused": {
              backgroundColor: colors.paperBg,
              transform: "scale(1.02)",
              "& fieldset": {
                borderColor: colors.primary,
                borderWidth: 2,
                boxShadow: `0 0 0 3px ${colors.primaryAlt}`,
              },
            },
          },
        },
      },
    },

    // Modern AppBar with glassmorphism
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${colors.border}`,
          color: colors.textPrimary,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
        },
      },
    },

    // Enhanced Chip with modern styling
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: colors.bgTertiary,
          color: colors.textPrimary,
          borderRadius: 20,
          fontWeight: 500,
          "&.MuiChip-clickable:hover": {
            transform: "scale(1.05)",
          },
        },
        colorPrimary: {
          backgroundColor: colors.primaryAlt,
          color: colors.primary,
          border: `1px solid ${colors.primary}20`,
        },
        colorSecondary: {
          backgroundColor: colors.companyGoldAlt,
          color: colors.companyGold,
          border: `1px solid ${colors.companyGold}20`,
        },
      },
    },

    // Modern Drawer
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          borderRight: `1px solid ${colors.border}`,
          borderRadius: "0 24px 24px 0",
        },
      },
    },
  },
});

const cacheRtl = createCache({
  prepend: true,
  key: "muirtl",
  stylisPlugins: [prefixer, rtlPlugin],
});

export default function MUIContextProvider({ children }) {
  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
