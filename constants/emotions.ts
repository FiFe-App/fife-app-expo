export const EMOTIONS = [
  { rate: 1, icon: "emoticon-cry-outline",     label: "Szomorú",   color: "#E53935" },
  { rate: 2, icon: "emoticon-sad-outline",     label: "Lehangolt", color: "#FB8C00" },
  { rate: 3, icon: "emoticon-neutral-outline", label: "Semleges",  color: "#FDD835" },
  { rate: 4, icon: "emoticon-happy-outline",   label: "Jó",        color: "#7CB342" },
  { rate: 5, icon: "emoticon-excited-outline", label: "Boldog",    color: "#43A047" },
] as const;

export const emotionByRate = (rate: number) =>
  EMOTIONS.find((e) => e.rate === rate);
