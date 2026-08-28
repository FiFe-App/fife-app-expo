import { createTheme, type MantineColorsTuple } from "@mantine/core";

const coral: MantineColorsTuple = [
  "#fff1ee",
  "#ffdcd5",
  "#ffc0b3",
  "#ff9d87",
  "#ff7f63",
  "#ff6b4c",
  "#ff5c42",
  "#e64f38",
  "#cc432f",
  "#b23726",
];

export const theme = createTheme({
  primaryColor: "coral",
  colors: { coral },
  defaultRadius: "md",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
});
