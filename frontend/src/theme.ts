export const theme = {
  colors: {
    // Core surfaces (light)
    surface: "#FFFFFF",
    surfaceAlt: "#F3F4F6",
    inputBg: "#F2F2F2",

    // Text
    textPrimary: "#1E293B",
    textSecondary: "#64748B",
    white: "#FFFFFF",

    // Brand / Accent
    accent: "#007ACC",
    accentHover: "#0090FF",

    // Status
    success: "#60B349",
    error: "#F44747",
    warning: "#CC9900",
    info: "#00BFFF",
  },
  shadows: {
    primary: "0 4px 14px 0 rgba(0, 122, 204, 0.3)",
    primaryHover: "0 8px 25px 0 rgba(0, 122, 204, 0.4)",
    danger: "0 4px 14px 0 rgba(244, 71, 71, 0.3)",
    dangerHover: "0 8px 25px 0 rgba(244, 71, 71, 0.4)",
  },
} as const;

export type AppTheme = typeof theme;
