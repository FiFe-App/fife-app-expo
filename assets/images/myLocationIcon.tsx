import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";
/* SVGR has dropped some elements not supported by react-native-svg: title */
const SvgComponent = (props: SvgProps) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" {...props}>
    <Path
      fill="#384fff"
      fillRule="nonzero"
      stroke="none"
      d="M12 2a.75.75 0 0 1 .743.648l.007.102v1.788a7.5 7.5 0 0 1 6.713 6.715l.037-.003h1.75a.75.75 0 0 1 .102 1.493l-.102.007-1.788-.001a7.5 7.5 0 0 1-6.715 6.714l.003.037v1.75a.75.75 0 0 1-1.493.102l-.007-.102.001-1.788a7.5 7.5 0 0 1-6.714-6.715l-.037.003H2.75a.75.75 0 0 1-.102-1.493l.102-.007h1.788a7.5 7.5 0 0 1 6.715-6.713L11.25 4.5V2.75A.75.75 0 0 1 12 2Zm0 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"
    />
  </Svg>
);
export default SvgComponent;
