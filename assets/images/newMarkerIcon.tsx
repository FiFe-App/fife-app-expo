import * as React from "react";
import Svg, { Circle, SvgProps } from "react-native-svg";
import { useAppTheme } from "@/assets/theme";
/* SVGR has dropped some elements not supported by react-native-svg: title */
const SvgComponent = (props: SvgProps) => {
  // The colours follow the side of the app (Én / Mi) and the light / dark theme.
  const theme = useAppTheme();
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props} onPress={props.onPress}>
      <Circle cx={10} cy={10} r={10} fill={theme.colors.secondaryContainer} />
      <Circle cx={10} cy={10} r={3} fill={theme.colors.onSecondaryContainer} />
    </Svg>
  );
};
export default SvgComponent;
