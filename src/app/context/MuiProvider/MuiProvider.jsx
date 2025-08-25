"use client";
import React from "react";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import rtlPlugin from "stylis-plugin-rtl";

/**
 * Single source of truth for colors
 */
export const colors = {
  // Brand / Primary (near green)
  primary: "#2A7A4D",
  primaryLight: "#5FB782",
  primaryDark: "#18593A",
  textOnPrimary: "#ffffff",

  // Secondary (muted olive / khaki)
  secondary: "#A68B2D",
  secondaryLight: "#D6BA67",
  secondaryDark: "#6B5A17",
  textOnSecondary: "#ffffff",

  // Supporting / Semantic
  info: "#1447e6",
  infoLight: "#5C7AFA",
  infoDark: "#0E33A4",

  success: "#2E7D32",
  successLight: "#60AD5E",
  successDark: "#1B5E20",

  warning: "#B7791F",
  warningLight: "#DFA45C",
  warningDark: "#7A5214",

  error: "#C23934",
  errorLight: "#E57368",
  errorDark: "#8E201E",

  // Text
  heading: "#1B2B20",
  textPrimary: "#1F2D27",
  textSecondary: "#4B5A53",
  textTertiary: "#839189",
  textMuted: "#9CA8A2",

  // Backgrounds
  body: "#f9f9f5",
  paperBg: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  bgPrimary: "#F5F7F2",
  bgSecondary: "#EEF4EF",
  bgTertiary: "#E6EFE8",

  // Borders & lines
  border: "#E1E8E3",
  borderDark: "#C9D5CE",

  // Action / states
  primaryAlt: "#E8F4EC",
  highlight: "#CFE8DA",

  // Shadows
  shadow: "rgba(14, 41, 29, 0.12)",
  shadowDark: "#0E291D",

  // Gradients
  primaryGradient:
    "linear-gradient(135deg, rgba(42,122,77,1) 0%, rgba(31,138,112,1) 100%)",
};

// ----- Utilities
const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

const generateMuiShadows = (baseShadowColor, darkShadowHex) => {
  const { r, g, b } = hexToRgb(darkShadowHex);
  const shadows = ["none"];
  shadows.push(`0px 1px 2px ${baseShadowColor}`);
  shadows.push(
    `0px 1px 3px ${baseShadowColor}, 0px 2px 5px ${baseShadowColor}`
  );
  shadows.push(
    `0px 2px 4px ${baseShadowColor}, 0px 4px 8px ${baseShadowColor}`
  );
  shadows.push(
    `0px 3px 5px ${baseShadowColor}, 0px 6px 10px ${baseShadowColor}`
  );
  for (let i = 5; i <= 24; i++) {
    const yOffset = Math.floor(i * 0.7);
    const blur = Math.floor(i * 1.6);
    const spread = Math.floor(i * 0.2);
    const opacity = 0.06 + i * 0.012;
    shadows.push(
      `0px ${yOffset}px ${blur}px ${spread}px rgba(${r}, ${g}, ${b}, ${opacity.toFixed(
        2
      )})`
    );
  }
  return shadows;
};

// ----- Theme (palette reads only from `colors`)
export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: colors.primary,
      light: colors.primaryLight,
      dark: colors.primaryDark,
      contrastText: colors.textOnPrimary,
    },
    secondary: {
      main: colors.secondary,
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
    // custom hook: read like theme.palette.gradient.primary
    gradient: {
      primary: colors.primaryGradient,
    },
    action: {
      hover: colors.primaryAlt,
      selected: colors.highlight,
      disabled: colors.textMuted,
      disabledBackground: colors.bgTertiary,
      focus: colors.primaryAlt,
    },
  },
  zIndex: {
    modal: 1300,
    snackbar: 1500,
    tooltip: 1600,
    appBar: 1100,
    drawer: 1200,
  },
  typography: {
    fontFamily: ["Noto Kufi Arabic", "system-ui", "sans-serif"].join(","),
    h1: {
      color: colors.heading,
      fontWeight: 700,
      fontSize: "2.5rem",
      lineHeight: 1.2,
    },
    h2: {
      color: colors.heading,
      fontWeight: 600,
      fontSize: "2rem",
      lineHeight: 1.3,
    },
    h3: {
      color: colors.heading,
      fontWeight: 600,
      fontSize: "1.5rem",
      lineHeight: 1.4,
    },
    h4: { color: colors.heading, fontWeight: 500, fontSize: "1.25rem" },
    h5: { color: colors.textPrimary, fontWeight: 500, fontSize: "1.1rem" },
    h6: { color: colors.textPrimary, fontWeight: 500, fontSize: "1rem" },
    body1: { color: colors.textPrimary, fontSize: "1rem", lineHeight: 1.6 },
    body2: {
      color: colors.textSecondary,
      fontSize: "0.875rem",
      lineHeight: 1.5,
    },
    caption: { color: colors.textTertiary, fontSize: "0.75rem" },
    overline: {
      color: colors.textMuted,
      fontSize: "0.625rem",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
    },
  },
  breakpoints: {
    values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536, xxl: 1920 },
  },
  shape: { borderRadius: 10 },
  shadows: generateMuiShadows(colors.shadow, colors.shadowDark),

  components: {
    MuiContainer: { defaultProps: { maxWidth: "xxl" } },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundColor: colors.paperBg, backgroundImage: "none" },
        elevation1: { backgroundColor: colors.surfaceElevated },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: colors.paperBg,
          borderRadius: 14,
          boxShadow: `0 2px 8px ${colors.shadow}`,
        },
      },
    },

    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: "none",
          fontWeight: 600,
          letterSpacing: 0.2,
          transition:
            "transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease",
          "&:active": { transform: "translateY(1px)" },
          "&.Mui-disabled": {
            color: colors.textMuted,
          },
          // focus ring (keyboard)
          "&:focus-visible": {
            outline: `3px solid ${colors.primaryAlt}`,
            outlineOffset: "2px",
          },
        },

        // CONTAINED
        containedPrimary: {
          color: colors.textOnPrimary,
          background: colors.primary, // solid by default (gradient on hover)
          boxShadow: `0 2px 4px ${colors.shadow}`,
          "&:hover": {
            background: colors.primaryGradient,
            boxShadow: `0 6px 14px ${colors.shadow}`,
          },
          "&:active": {
            background: colors.primaryDark,
          },
          "&.Mui-disabled": {
            backgroundColor: colors.bgTertiary,
          },
        },
        containedSecondary: {
          color: colors.textOnSecondary,
          background: colors.secondary,
          boxShadow: `0 2px 4px ${colors.shadow}`,
          "&:hover": {
            background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.secondaryLight} 100%)`,
            boxShadow: `0 6px 14px ${colors.shadow}`,
          },
          "&:active": { background: colors.secondaryDark },
          "&.Mui-disabled": { backgroundColor: colors.bgTertiary },
        },

        // OUTLINED
        outlinedPrimary: {
          color: colors.primary,
          borderColor: colors.borderDark,
          backgroundColor: "transparent",
          "&:hover": {
            borderColor: colors.primary,
            backgroundColor: colors.primaryAlt,
          },
          "&:active": {
            borderColor: colors.primaryDark,
            backgroundColor: colors.highlight,
          },
        },
        outlinedSecondary: {
          color: colors.secondary,
          borderColor: colors.borderDark,
          "&:hover": {
            borderColor: colors.secondary,
            backgroundColor: colors.bgSecondary,
          },
          "&:active": {
            borderColor: colors.secondaryDark,
            backgroundColor: colors.bgTertiary,
          },
        },

        // TEXT
        textPrimary: {
          color: colors.primary,
          "&:hover": { backgroundColor: colors.primaryAlt },
          "&:active": { backgroundColor: colors.highlight },
        },
        textSecondary: {
          color: colors.secondary,
          "&:hover": { backgroundColor: colors.bgSecondary },
          "&:active": { backgroundColor: colors.bgTertiary },
        },
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: colors.bgSecondary,
            "& fieldset": { borderColor: colors.border },
            "&:hover fieldset": { borderColor: colors.borderDark },
            "&.Mui-focused fieldset": { borderColor: colors.primary },
          },
        },
      },
    },
    MuiSvgIcon: { styleOverrides: { root: { color: colors.textSecondary } } },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: colors.paperBg,
          color: colors.textPrimary,
          boxShadow: `0 1px 3px ${colors.shadow}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.bgPrimary,
          borderRight: `1px solid ${colors.border}`,
        },
      },
    },
    MuiDivider: { styleOverrides: { root: { borderColor: colors.border } } },
    MuiChip: {
      styleOverrides: {
        root: { backgroundColor: colors.bgTertiary, color: colors.textPrimary },
        colorPrimary: {
          backgroundColor: colors.primaryAlt,
          color: colors.primary,
        },
      },
    },
  },
});

const cacheRtl = createCache({ key: "muirtl", stylisPlugins: [rtlPlugin] });

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
