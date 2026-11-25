/** "neutral": not started or over; "work": a focus block; "rest": any break. */
export type TimerTone = "neutral" | "work" | "rest";

export interface TonePalette {
  background: string;
  timer: string;
  /** Captions and the breathing cue. */
  muted: string;
  /** The disc or breathing circle behind the image. */
  accent: string;
  /** Outlined buttons, empty round dots. */
  outline: string;
  /** Filled buttons. */
  fill: string;
  onFill: string;
  text: string;
}

// From the design canvas: warm = working, cool pastel blue = resting, the
// app's cream = not started / done. Timer colours keep 3:1 against their
// background (large text), captions 4.5:1.
const LIGHT: Record<TimerTone, TonePalette> = {
  neutral: {
    background: "#fff5e0", timer: "#6f6656", muted: "#5c5446", accent: "#9fd8f5",
    outline: "#9fd8f5", fill: "#1e1b16", onFill: "#fff5e0", text: "#1e1b16",
  },
  work: {
    background: "#fdebd0", timer: "#c23c27", muted: "#6e5536", accent: "#f7cf9d",
    outline: "#c9a27a", fill: "#c23c27", onFill: "#fff5e0", text: "#4f3a22",
  },
  rest: {
    background: "#eaf5fb", timer: "#2f7fb3", muted: "#4f6470", accent: "#9fd8f5",
    outline: "#9cc6de", fill: "#2f7fb3", onFill: "#ffffff", text: "#2c4a5b",
  },
};

const DARK: Record<TimerTone, TonePalette> = {
  neutral: {
    background: "#1e1b16", timer: "#d9cdb8", muted: "#c9bda8", accent: "#5fa8d3",
    outline: "#5fa8d3", fill: "#f7f0e7", onFill: "#1e1b16", text: "#f7f0e7",
  },
  work: {
    background: "#3a3024", timer: "#ff8a73", muted: "#d9c3a5", accent: "#6b5130",
    outline: "#8c7457", fill: "#ff8a73", onFill: "#1e1b16", text: "#f7f0e7",
  },
  rest: {
    background: "#1a2730", timer: "#8fcbef", muted: "#b5c8d3", accent: "#5fa8d3",
    outline: "#4f7a93", fill: "#8fcbef", onFill: "#1a2730", text: "#e3eef4",
  },
};

export const getTimerPalette = (dark: boolean) => (dark ? DARK : LIGHT);
