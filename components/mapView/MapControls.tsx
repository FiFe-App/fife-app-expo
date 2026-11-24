import { MODE_SWITCH_CLEARANCE } from "@/constants/layout";
import { Spacing } from "@/constants/spacing";
import type { ReactNode } from "react";
import { View } from "react-native";
import { FAB, IconButton } from "react-native-paper";

interface MapControlsProps {
  /** Whether the user's position is known (decides the icon of the locate button). */
  located: boolean;
  onLocate: () => void;
  onZoom: (by: number) => void;
  /** The list / map switch: it lives in the same column as the other buttons. */
  viewSwitch?: ReactNode;
}

/**
 * The buttons floating over a map, in ONE column at the top right: locate, zoom, and the
 * list / map switch. Keeping them together (and clear of the bottom) is what stops them from
 * landing on each other, on the Én/Mi switch of the bottom bar, or on the card of a picked pin.
 */
export const MapControls = ({ located, onLocate, onZoom, viewSwitch }: MapControlsProps) => (
  <View
    pointerEvents="box-none"
    style={{
      position: "absolute",
      top: Spacing.sm,
      right: Spacing.sm,
      alignItems: "flex-end",
      gap: Spacing.sm,
      zIndex: 10,
    }}
  >
    <FAB
      testID="map-locate"
      size="small"
      icon={located ? "map-marker" : "map-marker-question"}
      accessibilityLabel="Ugrás a pozíciómra"
      onPress={onLocate}
    />
    <View>
      <IconButton
        testID="map-zoom-in"
        icon="plus"
        style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, margin: 0 }}
        onPress={() => onZoom(1)}
        mode="contained"
      />
      <IconButton
        testID="map-zoom-out"
        icon="minus"
        style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, margin: 0 }}
        onPress={() => onZoom(-1)}
        mode="contained"
      />
    </View>
    {viewSwitch}
  </View>
);

/**
 * What sits at the bottom of a map: the card of the picked pin, or the "search around here"
 * button. It rests above the Én/Mi switch, which rises out of the bottom bar over the map.
 */
export const MapBottom = ({ children }: { children?: ReactNode }) => (
  <View
    pointerEvents="box-none"
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      bottom: MODE_SWITCH_CLEARANCE + Spacing.sm,
      paddingHorizontal: Spacing.sm,
      alignItems: "center",
      zIndex: 10,
    }}
  >
    {children}
  </View>
);
