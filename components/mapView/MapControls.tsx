import { MODE_SWITCH_CLEARANCE } from "@/constants/layout";
import { Spacing } from "@/constants/spacing";
import type { ReactNode } from "react";
import { View } from "react-native";
import MapButton from "./MapButton";

interface MapControlsProps {
  /** Whether the user's position is known (decides the icon of the locate button). */
  located: boolean;
  onLocate: () => void;
  onZoom: (by: number) => void;
}

/** Locate, zoom in, zoom out: one column of the same round buttons. */
export const MapControls = ({ located, onLocate, onZoom }: MapControlsProps) => (
  <View style={{ gap: Spacing.sm, alignItems: "flex-end" }}>
    <MapButton
      testID="map-locate"
      icon={located ? "crosshairs-gps" : "crosshairs-question"}
      accessibilityLabel="Ugrás a pozíciómra"
      onPress={onLocate}
    />
    <View>
      <MapButton
        testID="map-zoom-in"
        icon="plus"
        accessibilityLabel="Nagyítás"
        style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
        onPress={() => onZoom(1)}
      />
      <MapButton
        testID="map-zoom-out"
        icon="minus"
        accessibilityLabel="Kicsinyítés"
        style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
        onPress={() => onZoom(-1)}
      />
    </View>
  </View>
);

/**
 * The ONE absolutely positioned layer over the map: a column resting above the Én/Mi switch
 * (which rises out of the bottom bar over the map), holding — from the top — the map buttons at
 * the right and then the card of the picked pin or the "search around here" button. Because they
 * are rows of one column and not separately placed, they cannot land on one another, whatever
 * the height of the card is. The column is bounded by the map on both ends: a card taller than
 * the room left scrolls instead of covering the screen's header.
 */
export const MapOverlay = ({
  controls,
  children,
}: {
  controls: ReactNode;
  children?: ReactNode;
}) => (
  <View
    testID="map-overlay"
    pointerEvents="box-none"
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      bottom: MODE_SWITCH_CLEARANCE + Spacing.sm,
      // Bounded by the map: a tall card can never push the column up over the header rows
      // (the view switch, Szűrés); it shrinks and scrolls instead.
      top: Spacing.sm,
      justifyContent: "flex-end",
      paddingHorizontal: Spacing.sm,
      gap: Spacing.sm,
      zIndex: 10,
    }}
  >
    <View pointerEvents="box-none" style={{ alignItems: "flex-end", flexShrink: 0 }}>
      {controls}
    </View>
    <View pointerEvents="box-none" style={{ alignItems: "center", flexShrink: 1, minHeight: 0 }}>
      {children}
    </View>
  </View>
);
