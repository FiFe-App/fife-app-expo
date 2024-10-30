const toDistanceText = (km: number) => {
  let text = Math.round(km * 10) / 10 + " km";
  if (km < 2) {
    //text = Math.round(km * 1000) + " m";
  }
  return text;
};
export default toDistanceText;
