import {
  DarkTheme,
  DefaultTheme,
  type Theme,
} from "expo-router/react-navigation";

export const THEME = {
  light: {
    background: "hsl(0 0% 100%)",
    foreground: "hsl(0 0% 3.9%)",
    card: "hsl(0 0% 100%)",
    cardForeground: "hsl(0 0% 3.9%)",
    popover: "hsl(0 0% 100%)",
    popoverForeground: "hsl(0 0% 3.9%)",
    primary: "#1a85ff",
    primaryForeground: "hsl(0 0% 100%)",
    secondary: "hsl(0 0% 96.1%)",
    secondaryForeground: "hsl(0 0% 9%)",
    muted: "hsl(0 0% 96.1%)",
    mutedForeground: "hsl(0 0% 45.1%)",
    accent: "hsl(0 0% 96.1%)",
    accentForeground: "hsl(0 0% 9%)",
    destructive: "#f54739",
    border: "hsl(0 0% 89.8%)",
    input: "hsl(0 0% 89.8%)",
    ring: "#1a85ff",
    radius: "0.625rem",
  },
  dark: {
    background: "hsl(220 22% 6%)",
    foreground: "hsl(40 20% 93%)",
    card: "hsl(220 21% 9%)",
    cardForeground: "hsl(40 20% 93%)",
    popover: "hsl(220 21% 9%)",
    popoverForeground: "hsl(40 20% 93%)",
    primary: "#1a85ff",
    primaryForeground: "hsl(220 22% 6%)",
    secondary: "hsl(220 16% 15%)",
    secondaryForeground: "hsl(40 20% 93%)",
    muted: "hsl(220 15% 17%)",
    mutedForeground: "hsl(220 6% 58%)",
    accent: "hsl(220 16% 15%)",
    accentForeground: "hsl(40 20% 93%)",
    destructive: "#f54739",
    border: "hsl(220 12% 19%)",
    input: "hsl(220 12% 19%)",
    ring: "#1a85ff",
    radius: "0.625rem",
  },
};

export const NAV_THEME: Record<"light" | "dark", Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};

// Raw hex values for use where NativeWind className can't reach
// (e.g. LinearGradient colors, icon `color` props, placeholderTextColor).
// Keep in sync with the `brand` palette in tailwind.config.js.

export const AI_GRADIENT: [string, string] = ["#0E9C79", "#1D6FAE"];
export const AI_GRADIENT_REVERSE: [string, string] = ["#1D6FAE", "#0E9C79"];
export const RECORDING_GRADIENT: [string, string] = ["#FF6B4A", "#FF3D71"];

export const COLORS = {
  teal: "#0E9C79",
  blue: "#1D6FAE",
  coral: "#FF6B4A",
  pink: "#FF3D71",
  brandBlue: "#1A85FF",
  placeholder: "#8A8D96",
  textMuted: "#5C5F68",
};
