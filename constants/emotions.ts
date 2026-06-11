export const EMOTIONS = [
  { rate: 1, image: require("@/assets/images/emotions/emotion-1.png"), label: "Szomorú",   color: "#FF5F36" },
  { rate: 2, image: require("@/assets/images/emotions/emotion-2.png"), label: "Lehangolt", color: "#FFC74F" },
  { rate: 3, image: require("@/assets/images/emotions/emotion-3.png"), label: "Semleges",  color: "#FFECB3" },
  { rate: 4, image: require("@/assets/images/emotions/emotion-4.png"), label: "Jó",        color: "#CDDCA3" },
  { rate: 5, image: require("@/assets/images/emotions/emotion-5.png"), label: "Boldog",    color: "#11AB68" },
] as const;

export const emotionByRate = (rate: number) =>
  EMOTIONS.find((e) => e.rate === rate);
