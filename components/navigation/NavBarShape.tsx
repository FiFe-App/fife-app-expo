import { memo } from "react";
import { StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";

/** Geometry of the floating bar, taken from the design reference (390pt frame). */
export const NAV_DOCK_WIDTH = 140;
/** How far the Én/Mi dock rises above the top edge of the bar. */
export const NAV_DOCK_RISE = 51;
/** The dock's inner corners ("fillets") that melt it into the bar. */
const FILLET_X = 18;
const FILLET_Y = 13;
const BAR_RADIUS = 30;

/**
 * Builds the one silhouette of bar + dock as a single closed path, so the join
 * between them is a smooth curve instead of two overlapping shapes. It is
 * computed from the real measured size rather than scaled from a fixed
 * viewBox, which keeps the corners and fillets crisp at any width.
 */
export const navBarPath = (width: number, height: number) => {
  const rise = NAV_DOCK_RISE;
  const barBottom = height;
  const r = Math.min(BAR_RADIUS, (height - rise) / 2, width / 2);
  const cx = width / 2;
  const dockHalf = Math.min(NAV_DOCK_WIDTH, width - 2 * (r + FILLET_X)) / 2;
  const dockL = cx - dockHalf;
  const dockR = cx + dockHalf;
  const dockR_ = rise / 2; // the dock's top is a full semicircle-ish cap
  const filletTop = rise - FILLET_Y;

  // Cubic control offsets of the fillet, as fractions of its box.
  const a = 0.5556 * FILLET_X;
  const b = 0.9444 * FILLET_X;
  const c = 0.3846 * FILLET_Y;

  return [
    `M ${r} ${rise}`,
    `H ${dockL - FILLET_X}`,
    `C ${dockL - FILLET_X + a} ${rise} ${dockL - FILLET_X + b} ${rise - c} ${dockL} ${filletTop}`,
    `V ${dockR_}`,
    `A ${dockR_} ${dockR_} 0 0 1 ${dockL + dockR_} 0`,
    `H ${dockR - dockR_}`,
    `A ${dockR_} ${dockR_} 0 0 1 ${dockR} ${dockR_}`,
    `V ${filletTop}`,
    `C ${dockR + FILLET_X - b} ${rise - c} ${dockR + FILLET_X - a} ${rise} ${dockR + FILLET_X} ${rise}`,
    `H ${width - r}`,
    `A ${r} ${r} 0 0 1 ${width} ${rise + r}`,
    `V ${barBottom - r}`,
    `A ${r} ${r} 0 0 1 ${width - r} ${barBottom}`,
    `H ${r}`,
    `A ${r} ${r} 0 0 1 0 ${barBottom - r}`,
    `V ${rise + r}`,
    `A ${r} ${r} 0 0 1 ${r} ${rise}`,
    "Z",
  ].join(" ");
};

interface NavBarShapeProps {
  width: number;
  height: number;
  color: string;
}

/** Purely decorative backdrop of the bottom bar; never takes touches. */
function NavBarShape({ width, height, color }: NavBarShapeProps) {
  if (width <= 0 || height <= NAV_DOCK_RISE) return null;
  return (
    <Svg
      width={width}
      height={height}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Path d={navBarPath(width, height)} fill={color} />
    </Svg>
  );
}

export default memo(NavBarShape);
