const locationToCoords = (geometry: string): number[] => {
  const Buffer = require("@craftzdog/react-native-buffer").Buffer;
  const wkx = require("wkx");

  const wkbBuffer = new Buffer(geometry, "hex");
  const parsedGeometry = wkx.Geometry.parse(wkbBuffer);

  return parsedGeometry.toGeoJSON().coordinates;
};

export default locationToCoords;
