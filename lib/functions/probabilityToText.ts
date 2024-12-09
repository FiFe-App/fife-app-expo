const probabilityToText: (probaility: number) => string = (probaility) => {
  const texts = [
    "Biztos, hogy nem megy",
    "Talán elmegy",
    "Nem biztos, hogy megy",
    "Valószínűleg elmegy",
    "Biztos, hogy megy",
  ];

  return texts[Math.round(probaility / 2 - 1)] || "";
};

export default probabilityToText;
