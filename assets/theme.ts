import { Dimensions } from "react-native";
import {
  configureFonts,
  MD3LightTheme as DefaultTheme,
  MD3Theme,
} from "react-native-paper";
import { MD3Type } from "react-native-paper/lib/typescript/types";

const isDesktop = Dimensions.get("window").width > 600;
const fontConfig: Record<string, Partial<MD3Type>> = {
  default: {
    fontFamily: "RedHatText",
    fontWeight: "400",
    letterSpacing: 0.5,
    lineHeight: 22,
    fontSize: isDesktop ? 18 : 12,
  },
  displayLarge: {
    fontFamily: "Piazzolla-ExtraBold",
    fontWeight: "bold",
    lineHeight: isDesktop ? 58 : 45,
    fontSize: isDesktop ? 50 : 45,
  },
  displayMedium: {
    fontFamily: "Piazzolla-ExtraBold",
    fontWeight: "bold",
    lineHeight: isDesktop ? 55 : 38,
    fontSize: isDesktop ? 45 : 30,
  },
  displaySmall: {
    fontFamily: "Piazzolla-ExtraBold",
    fontWeight: "bold",
    fontSize: isDesktop ? 40 : 26,
    lineHeight: isDesktop ? 48 : 32,
  },
  headlineSmall: {
    fontFamily: "Piazzolla",
    fontSize: isDesktop ? 24 : 20,
    lineHeight: isDesktop ? 28 : 24,
    fontWeight: "400",
    letterSpacing: 0,
  },

  headlineMedium: {
    fontFamily: "Piazzolla",
    fontWeight: "300",
    letterSpacing: 0,
    fontSize: isDesktop ? 30 : 24,
  },

  headlineLarge: {
    fontFamily: "Piazzolla",
    fontSize: isDesktop ? 32 : 28,
    fontWeight: "400",
    letterSpacing: 0,
    lineHeight: 40,
  },
  titleSmall: {
    fontFamily: "Piazzolla-ExtraBold",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.1,
    lineHeight: 20,
  },

  titleMedium: {
    fontFamily: "Piazzolla-ExtraBold",
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.15,
    lineHeight: 24,
  },

  titleLarge: {
    fontFamily: "Piazzolla-ExtraBold",
    fontSize: 22,
    fontWeight: "300",
    letterSpacing: 0,
    lineHeight: 28,
  },
  labelSmall: {
    fontFamily: "RedHatText",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.5,
    lineHeight: 16,
  },

  labelMedium: {
    fontFamily: "RedHatText",
    fontSize: isDesktop ? 14 : 12,
    fontWeight: "500",
    letterSpacing: 0.5,
    lineHeight: isDesktop ? 18 : 16,
  },

  labelLarge: {
    fontFamily: "RedHatText",
    fontWeight: "bold",
    letterSpacing: 0.1,
    fontSize: isDesktop ? 18 : 16,
    lineHeight: isDesktop ? 22 : 20,
  },
  bodySmall: {
    fontFamily: "RedHatText",
    fontWeight: "400",
    letterSpacing: 0.4,
    fontSize: isDesktop ? 14 : 10,
    lineHeight: isDesktop ? 20 : 18,
  },

  bodyMedium: {
    fontFamily: "RedHatText",
    fontWeight: "300",
    letterSpacing: 0.25,
    fontSize: isDesktop ? 20 : 17,
    lineHeight: isDesktop ? 26 : 24,
  },

  bodyLarge: {
    fontFamily: "RedHatText",
    fontWeight: "300",
    letterSpacing: 0.15,
    fontSize: isDesktop ? 26 : 20,
    lineHeight: isDesktop ? 32 : 28,
  },
};

export const theme: MD3Theme = {
  ...DefaultTheme,
  ...{
    colors: {
      ...DefaultTheme.colors,
      primary: "#000",
      onPrimary: "#fff",
      primaryContainer: "#000000",
      onPrimaryContainer: "#fff",
      secondary: "#DF442E",
      onSecondary: "#ffffff",
      secondaryContainer: "#FADEBC",
      onSecondaryContainer: "#56442A",
      tertiary: "#644fab",
      onTertiary: "#ffffffff",
      tertiaryContainer: "#e7deff",
      onTertiaryContainer: "#463D66",
      error: "#ba1a1a",
      onError: "#ffffff",
      errorContainer: "#ffdad6",
      onErrorContainer: "#410002",
      background: "#FFFCF5",
      onBackground: "#1e1b16",
      surface: "#ffedc8ff",
      onSurface: "#1e1b16",
      surfaceVariant: "#FFF5E0",
      onSurfaceVariant: "#4d4639",
      outline: "#7e7667",
      outlineVariant: "#d0c5b4",
      shadow: "#000000",
      scrim: "#000000",
      inverseSurface: "#33302a",
      inverseOnSurface: "#f7f0e7",
      inversePrimary: "#f0c048",
      elevation: {
        level0: "transparent",
        level1: "#ffffffff",
        level2: "#fffcf3ff",
        level3: "#fffbefff",
        level4: "#fffaedff",
        level5: "#fff8e8ff",
      },
      surfaceDisabled: "rgba(30, 27, 22, 0.12)",
      onSurfaceDisabled: "rgba(30, 27, 22, 0.38)",
      backdrop: "rgba(54, 48, 36, 0.4)",
    },
  },

  fonts: configureFonts({ config: fontConfig }),
};
