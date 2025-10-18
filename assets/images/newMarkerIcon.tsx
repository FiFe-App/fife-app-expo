import * as React from "react";
import Svg, { Circle, SvgProps } from "react-native-svg";
import { theme } from "@/assets/theme";
/* SVGR has dropped some elements not supported by react-native-svg: title */
const SvgComponent = (props: SvgProps) => {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
      <Circle cx={10} cy={10} r={10} fill={theme.colors.inverseSurface} />
      <Circle cx={10} cy={10} r={3} fill={theme.colors.elevation.level1} />
    </Svg>
  );
};
export default SvgComponent;
