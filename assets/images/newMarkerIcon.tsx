import * as React from "react";
import { useTheme } from "react-native-paper";
import Svg, { Circle, SvgProps } from "react-native-svg";
/* SVGR has dropped some elements not supported by react-native-svg: title */
const SvgComponent = (props: SvgProps) => {
  const theme = useTheme();
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
      <Circle cx={10} cy={10} r={10} fill={theme.colors.primaryContainer} />
      <Circle cx={10} cy={10} r={3} fill={theme.colors.onBackground} />
    </Svg>
  );
};
export default SvgComponent;
