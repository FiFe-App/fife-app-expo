import React, { ReactNode } from "react";
import { StyleSheet, ViewStyle, useWindowDimensions } from "react-native";
import { Spacing } from "@/constants/spacing";
import { ThemedView as View } from "@/components/ThemedView";

export type Breakpoint = "mobile" | "tablet" | "desktop";

/**
 * From this width on the app trades the bottom bar for a sidebar
 * (components/navigation/SideNavigation.tsx) and lets screens use more room.
 */
export const WIDE_BREAKPOINT = 1024;

export const useBreakpoint = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const isDesktop = !isMobile;
  /** Sidebar instead of the bottom bar; screens may lay out in columns. */
  const isWide = width >= WIDE_BREAKPOINT;
  const screenPadding = isDesktop ? 32 : 8;
  const current: Breakpoint = isDesktop ? "desktop" : "mobile";
  return { isMobile, isDesktop, isWide, current, screenPadding };
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
    paddingHorizontal: Spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  column: {
    flexDirection: "column",
  },
  gap16: {
    gap: Spacing.lg,
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
