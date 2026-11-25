// Google Maps custom styles derived from the app's light/dark theme palettes.
// Light theme palette refs: background #FFFCF5, surface #ffedc8, surfaceVariant #FFF5E0,
//   secondary #DF442E, tertiary #644fab, onSurfaceVariant #4d4639
// Dark theme palette refs: background #1e1b16, surfaceVariant #3d3a33,
//   secondary #FF5C42, tertiary #9b7fff, onSurfaceVariant #cdc5b4

export const lightMapStyle = [
  // ── Base geometry ──────────────────────────────────────────────────────────
  { elementType: "geometry", stylers: [{ color: "#FFF5E0" }] },           // surfaceVariant warm cream
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#4d4639" }] },   // onSurfaceVariant
  { elementType: "labels.text.stroke", stylers: [{ color: "#FFFCF5" }] }, // background

  // ── Administrative ─────────────────────────────────────────────────────────
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#968e7e" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7e7667" }],
  },

  // ── POI ────────────────────────────────────────────────────────────────────
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#e8d5b5" }],                                       // warm tan
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#644fab" }],                                       // tertiary purple
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#c8e6c9" }],                                       // soft green
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#388e3c" }],
  },

  // ── Roads ──────────────────────────────────────────────────────────────────
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4d4639" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#ffdab5" }],                                       // warm peach
  },
  {
    featureType: "road.arterial",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7e7667" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#DF442E" }],                                       // secondary red
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#b03020" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#DF442E" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#968e7e" }],
  },

  // ── Transit ────────────────────────────────────────────────────────────────
  {
    featureType: "transit.line",
    elementType: "geometry",
    stylers: [{ color: "#d0c5b4" }],
  },
  {
    featureType: "transit.station",
    elementType: "geometry",
    stylers: [{ color: "#FADEBC" }],                                       // secondaryContainer
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#644fab" }],                                       // tertiary
  },

  // ── Water ──────────────────────────────────────────────────────────────────
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#90caf9" }],                                       // sky blue
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#1565c0" }],
  },
];

export const darkMapStyle = [
  // ── Base geometry ──────────────────────────────────────────────────────────
  { elementType: "geometry", stylers: [{ color: "#1e1b16" }] },           // background
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#cdc5b4" }] },   // onSurfaceVariant
  { elementType: "labels.text.stroke", stylers: [{ color: "#1e1b16" }] }, // background

  // ── Administrative ─────────────────────────────────────────────────────────
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#4d4639" }],
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [{ color: "#968e7e" }],
  },
  {
    featureType: "administrative.land_parcel",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#cdc5b4" }],
  },

  // ── POI ────────────────────────────────────────────────────────────────────
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#2d2a23" }],                                       // surface
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9b7fff" }],                                       // tertiary purple
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#1a2e1a" }],                                       // dark green
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4caf50" }],
  },

  // ── Roads ──────────────────────────────────────────────────────────────────
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#3d3a33" }],                                       // surfaceVariant
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#cdc5b4" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#56442A" }],                                       // secondaryContainer dark
  },
  {
    featureType: "road.arterial",
    elementType: "labels.text.fill",
    stylers: [{ color: "#FADEBC" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#FF5C42" }],                                       // secondary
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#c03020" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#1e1b16" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#FF5C42" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#968e7e" }],
  },

  // ── Transit ────────────────────────────────────────────────────────────────
  {
    featureType: "transit",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9b7fff" }],                                       // tertiary
  },
  {
    featureType: "transit.line",
    elementType: "geometry",
    stylers: [{ color: "#4d4639" }],
  },
  {
    featureType: "transit.station",
    elementType: "geometry",
    stylers: [{ color: "#2d2a23" }],                                       // surface
  },

  // ── Water ──────────────────────────────────────────────────────────────────
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0d2744" }],                                       // deep navy
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4fc3f7" }],                                       // light blue
  },
];


// ── Mi side (the lavender community side, see modeTokens.mi in assets/theme.ts) ─────────────────
interface MapPalette {
  base: string;       // land
  background: string; // label halo
  text: string;
  textMuted: string;
  accent: string;     // POI / station labels
  poi: string;
  park: string;
  road: string;
  arterial: string;
  highway: string;
  highwayStroke: string;
  transit: string;
  water: string;
  waterText: string;
}

const buildMapStyle = (p: MapPalette) => [
  { elementType: "geometry", stylers: [{ color: p.base }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: p.text }] },
  { elementType: "labels.text.stroke", stylers: [{ color: p.background }] },
  { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: p.textMuted }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: p.textMuted }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: p.poi }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: p.accent }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: p.park }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: p.road }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: p.arterial }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: p.highway }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: p.text }] },
  { featureType: "road.highway", elementType: "labels.text.stroke", stylers: [{ color: p.highwayStroke }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: p.textMuted }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: p.transit }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: p.poi }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: p.accent }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: p.water }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: p.waterText }] },
];

/** Lavender map: the Mi tokens (background #faf8ff, surfaceVariant #EFEAFF, accent #4B2FB8). */
export const miLightMapStyle = buildMapStyle({
  base: "#EFEAFF",
  background: "#faf8ff",
  text: "#2A1F5C",
  textMuted: "#6E62A6",
  accent: "#4B2FB8",
  poi: "#E4DCFF",
  park: "#D8E6DC",
  road: "#FFFFFF",
  arterial: "#F6F2FF",
  highway: "#CFC4F2",
  highwayStroke: "#E4DCFF",
  transit: "#CFC4F2",
  water: "#B9C8F5",
  waterText: "#3A4A9E",
});

/** Deep purple map: the dark Mi tokens (background #1C1830, surface #2A2447, accent #CFC4FF). */
export const miDarkMapStyle = buildMapStyle({
  base: "#1C1830",
  background: "#1C1830",
  text: "#CFC4FF",
  textMuted: "#9C90D0",
  accent: "#CFC4FF",
  poi: "#2A2447",
  park: "#203540",
  road: "#352E57",
  arterial: "#3F3766",
  highway: "#4A4270",
  highwayStroke: "#1C1830",
  transit: "#4A4270",
  water: "#120F24",
  waterText: "#8F9EE8",
});

/** The map style that goes with a side of the app and the light / dark theme. */
export const mapStyleFor = (mode: "en" | "mi", isDark: boolean) =>
  mode === "mi"
    ? isDark
      ? miDarkMapStyle
      : miLightMapStyle
    : isDark
      ? darkMapStyle
      : lightMapStyle;
