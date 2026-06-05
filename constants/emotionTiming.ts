import { ImageSourcePropType } from "react-native";
// Until this hour (e.g. 10 = 10:00 AM): yesterday's card is shown ("Milyen napod volt tegnap?")
export const EMOTION_MAX_TIME_FOR_YESTERDAY = 10;

// From this hour (e.g. 14 = 14:00 PM): today's card is shown ("Milyen napod volt?")
export const EMOTION_MIN_TIME_FOR_TODAY = 10;

// After midnight, until this hour (e.g. 3 = 03:00 AM): yesterday's card still shown for night owls
export const EMOTION_MAX_TIME_FOR_TODAY = 3;

export type Emotion = {
  emoji: string;
  label: string;
  // Replace with require('@/assets/images/smileys/<name>.png') when ready
  image?: ImageSourcePropType;
};

/*export const SMILEYS: Emotion[] = [
  { emoji: "😢", label: "Nagyon rossz", image: require("@/assets/gifs/red.gif") },
  { emoji: "😞", label: "Rossz", image: require("@/assets/gifs/brown.gif") },
  { emoji: "😐", label: "Semleges", image: require("@/assets/gifs/brown.gif") },
  { emoji: "🙂", label: "Jó", image: require("@/assets/gifs/purple.gif") },
  { emoji: "😄", label: "Nagyszerű", image: require("@/assets/gifs/green.gif") },
];*/
export const SMILEYS: Emotion[] = [
  { emoji: "😢", label: "Nagyon rossz" },
  { emoji: "😞", label: "Rossz" },
  { emoji: "😐", label: "Semleges" },
  { emoji: "🙂", label: "Jó" },
  { emoji: "😄", label: "Nagyszerű" },
];