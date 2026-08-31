const typeToLabel = (type?: string): string => {
  if (type === "TEL") return "Az elérhetőség telefonszáma";
  if (type === "EMAIL") return "Az elérhetőség email-címe";
  if (type === "INSTAGRAM") return "Az elérhetőség instagram oldala";
  if (type === "FACEBOOK") return "Az elérhetőség facebook oldala";
  if (type === "PLACE") return "Az elérhetőség címe";
  if (type === "WEB") return "Az elérhetőség weboldala";
  if (type === "OTHER") return "Az elérhetőség egyéb adata";
  return "Válassz típust.";
};

export default typeToLabel;
