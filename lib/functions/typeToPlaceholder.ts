const typeToPlaceholder = (type?: string): string => {
  if (type === "TEL") return "+36 20 12 34 567";
  if (type === "EMAIL") return "email@fife.hu";
  if (type === "INSTAGRAM") return "@fifewok23";
  if (type === "FACEBOOK") return "BemMozi";
  if (type === "PLACE") return "1097 Ady Endre út 2/b";
  if (type === "WEB") return "weboldalam.com";
  if (type === "OTHER") return "";
  return "";
};

export default typeToPlaceholder;
