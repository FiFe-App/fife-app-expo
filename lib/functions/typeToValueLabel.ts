const typeToValueLabel = (type?: string): string => {
  if (type === "TEL") return "Telefonszámod";
  if (type === "EMAIL") return "Email-címed";
  if (type === "INSTAGRAM") return "Instagram felhasználóneved";
  if (type === "FACEBOOK") return "Facebook azonosító";
  if (type === "PLACE") return "Teljes cím";
  if (type === "WEB") return "Weboldal címe";
  if (type === "OTHER") return "Bármilyen más adat";
  return "Válassz típust.";
};

export default typeToValueLabel;
