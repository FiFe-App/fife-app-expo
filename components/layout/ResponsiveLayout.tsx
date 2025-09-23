
import React, { ReactNode } from "react";
import { Dimensions, StyleSheet, ViewStyle } from "react-native";
import { ThemedView as View } from "@/components/ThemedView";
import { useMediaQuery } from "react-responsive";

export type Breakpoint = "mobile" | "tablet" | "desktop";

export const useBreakpoint = () => {
  const isMobile = Dimensions.get("window").width < 600; //useMediaQuery({ maxDeviceWidth: 599 });
  console.log("isMobile",isMobile);
  
  const isDesktop = !isMobile;//useMediaQuery({ maxDeviceWidth: 600 });
  const screenPadding = isDesktop ? 32 : 8;
  const current: Breakpoint = isDesktop ? "desktop" : "mobile";
  return { isMobile, isDesktop: !isMobile, current, screenPadding };
};

type Props = {
  header?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
  containerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
};

/**
 * ResponsiveLayout
 * - Mobile (<600): column, full-width content
 * - Tablet (600-1023): column, extra padding and centered content
 * - Desktop (>=1024): row with optional left/right sidebars
 */
export const ResponsiveLayout: React.FC<Props> = ({
  header,
  left,
  right,
  children,
  containerStyle,
  contentStyle,
}) => {
  const { isDesktop } = useBreakpoint();

  const containerRow = isDesktop;
  const maxWidth = isDesktop ? 1280 : 800;

  return (
    <View style={[styles.root, containerStyle]} type="default">
      {header}
      <View
        style={[styles.center, maxWidth ? { width: "100%", maxWidth } : null]}
      >
        <View style={[containerRow ? styles.row : styles.column, styles.gap16]}>
          {left && containerRow && <View style={styles.left}>{left}</View>}
          <View style={[styles.main, contentStyle]}>{children}</View>
          {right && containerRow && <View style={styles.right}>{right}</View>}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
  },
  center: {
    alignSelf: "center",
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  column: {
    flexDirection: "column",
  },
  gap16: {
    gap: 16,
  },
  left: {
    width: 280,
  },
  right: {
    width: 320,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
});

export default ResponsiveLayout;
