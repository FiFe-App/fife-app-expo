const typeToValueLabel = (type?: string): string => {
  if (type === "TEL") return "Telefonszámod";
  if (type === "EMAIL") return "Email-címed";
  if (type === "INSTAGRAM") return "Instagram felhasználóneved";
  if (type === "FACEBOOK") return "Facebook azonosítód";
  if (type === "PLACE") return "Teljes címed";
  if (type === "WEB") return "Weboldalad";
  if (type === "OTHER") return "Bármilyen más adatod";
  return "Válassz típust.";
};

export default typeToValueLabel;
