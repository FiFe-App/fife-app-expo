const toDistanceText = (km: number) => {
  let text = Math.round(km) + " km";
  if (km < 2) {
    text = Math.round(km * 1000) + " m";
  }
  return text;
};
export default toDistanceText;
