const locationToCoords = (geometry: string): number[] => {
  var Buffer = require("@craftzdog/react-native-buffer").Buffer;
  var wkx = require("wkx");

  var wkbBuffer = new Buffer(geometry, "hex");
  var parsedGeometry = wkx.Geometry.parse(wkbBuffer);

  return parsedGeometry.toGeoJSON().coordinates;
};

export default locationToCoords;
