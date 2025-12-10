// Helper: Haversine formula for distance in km
function getDistanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371; // Earth radius in km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function getRegionNameForCircle(
  results: google.maps.GeocoderResult[],
  center: { lat: number; lng: number },
  radius: number // in km
): string | null {
  // Helper to check if circle is fully inside bounds
  function boundsContainCircle(bounds: any) {
    // Accepts either {north, south, east, west} or {northeast, southwest}
    let ne, sw, nw, se;
    if (
      typeof bounds.north === "number" &&
      typeof bounds.south === "number" &&
      typeof bounds.east === "number" &&
      typeof bounds.west === "number"
    ) {
      ne = { lat: bounds.north, lng: bounds.east };
      sw = { lat: bounds.south, lng: bounds.west };
      nw = { lat: bounds.north, lng: bounds.west };
      se = { lat: bounds.south, lng: bounds.east };
    } else if (bounds.northeast && bounds.southwest) {
      ne = bounds.northeast;
      sw = bounds.southwest;
      nw = { lat: bounds.northeast.lat, lng: bounds.southwest.lng };
      se = { lat: bounds.southwest.lat, lng: bounds.northeast.lng };
    } else {
      return false;
    }
    // Find min distance from center to any edge
    const distances = [ne, sw, nw, se].map(corner => getDistanceKm(center, corner));
    // Circle is inside bounds if all corners are at least radius away from center
    return distances.every(d => d >= radius);
  }

  // Priority order for region types
  const regionTypes = [
    "neighborhood",
    "sublocality",
    "sublocality_level_1",
    "locality",
    "administrative_area_level_2",
    "administrative_area_level_1",
    "country"
  ];

  for (const type of regionTypes) {
    for (const result of results) {
      // If bounds exist, check if circle fits
      if (result.geometry.bounds && !boundsContainCircle(result.geometry.bounds)) continue;
      for (const comp of result.address_components) {
        if (comp.types.includes(type)) {
          return comp.long_name;
        }
      }
    }
  }

  // Fallback: return locality or formatted address
  for (const result of results) {
    for (const comp of result.address_components) {
      if (comp.types.includes("locality")) {
        return comp.long_name;
      }
    }
    if (result.formatted_address) return result.formatted_address;
  }

  return null;
}