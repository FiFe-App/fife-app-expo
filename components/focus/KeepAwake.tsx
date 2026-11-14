import { useKeepAwake } from "expo-keep-awake";

/** Keeps the screen on while mounted — render it only while a timer runs. */
export default function KeepAwake() {
  useKeepAwake("fife-timer");
  return null;
}
