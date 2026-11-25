import { useAppTheme } from "@/assets/theme";
import { IconButton } from "react-native-paper";
import type { ComponentProps } from "react";

type MapButtonProps = Omit<ComponentProps<typeof IconButton>, "mode" | "containerColor" | "iconColor">;

/**
 * The round button of the search screen's map and of its list / map switch: one look for all of
 * them (the tonal colours of the side of the app, Én or Mi), so the switch above the map and the
 * buttons over it read as one family.
 */
export const MapButton = ({ style, size = 22, ...props }: MapButtonProps) => {
  const theme = useAppTheme();
  return (
    <IconButton
      mode="contained"
      size={size}
      containerColor={theme.colors.secondaryContainer}
      iconColor={theme.colors.onSecondaryContainer}
      style={[{ margin: 0, borderWidth: 1, borderColor: theme.colors.outlineVariant }, style]}
      {...props}
    />
  );
};

export default MapButton;
