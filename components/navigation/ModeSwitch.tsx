import { StyleSheet, View } from "react-native";
import { TouchableRipple } from "react-native-paper";
import { SvgXml } from "react-native-svg";

import { modeTokens, useAppTheme } from "@/assets/theme";
import { BorderRadius } from "@/constants/borderRadius";
import type { AppMode } from "@/lib/mode/appMode";
import { ThemedText } from "../ThemedText";
import { enModeIcon, miModeIcon } from "./modeIcons";

interface ModeSwitchProps {
  mode: AppMode;
  onSwitch: () => void;
}

/**
 * The Én / Mi pill in the middle of the bottom bar. One control, not two
 * buttons: tapping anywhere on it flips to the other side of the app, and the
 * highlighted half always tells which side the user is on now.
 */
export default function ModeSwitch({ mode, onSwitch }: ModeSwitchProps) {
  const theme = useAppTheme();
  const tone = theme.dark ? "dark" : "light";
  const activeBg = modeTokens[mode][tone].switchActive;
  // The pill itself is dark on both themes; the halves carry the colour.
  const pillBg = theme.dark ? "#000000" : "#1F1B16";
  const inactiveText = mode === "en" ? "#CFC4FF" : "#FDEDC8";
  const activeText = theme.dark ? "#FFFFFF" : "#1F1B16";

  const half = (side: AppMode, label: string, onSwitch: ()=>void) => {
    const active = side === mode;
    return (
      <TouchableRipple 
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        // Each half is its own button now, so each needs its own label: the
        // inactive one switches, the active one only says where you are.
        accessibilityLabel={
          active
            ? side === "en" ? "Én mód (aktív)" : "Mi mód (aktív)"
            : side === "mi" ? "Váltás Mi módra (közösség)" : "Váltás Én módra (privát)"
        }
        testID={`mode-switch-${side}`}
        borderless
          onPress={()=>{
            if (!active) onSwitch();}
          }
        style={[styles.half, active && { backgroundColor: activeBg }]}>
        <View style={styles.halfContent}>
          <SvgXml
            xml={side === "en" ? enModeIcon : miModeIcon}
            height={24}
            width={side === "en" ? 24 : 30}
          />
          <ThemedText
            type="bold"
            style={{
              color: active ? activeText : inactiveText,
              fontSize: 13,
              lineHeight: 16,
            }}
          >
            {label}
          </ThemedText>
        </View>
      </TouchableRipple>
    );
  };

  return (
    <>
    <View style={{width:20}}/>  
    {/* Reaches above the bar: screens keep MODE_SWITCH_CLEARANCE
        (constants/layout.ts) free under their content because of it. */}
    <View style={[styles.anchor,{bottom: 25}]} pointerEvents="box-none">
      <View
        style={[styles.pill, { backgroundColor: pillBg }]}
      >
        <View style={styles.row}>
          {half("en", "Én",onSwitch)}
          {half("mi", "Mi",onSwitch)}
        </View>
      </View>
    </View>
  
    </>);
}

const styles = StyleSheet.create({
  anchor: {
    position: "absolute",
    zIndex:10,
    left: 0,
    right: 0,
    alignItems: "center",
    shadowColor: "black",
    shadowOpacity: 0,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowRadius: 4,
    elevation: 3,
  },
  pill: {
    width: 124,
    height: 42,
    borderRadius: BorderRadius.full,
    padding: 4,
    alignSelf: "center",
    overflow: "hidden",
  },
  row: {
    flex: 1,
    gap: 4,
    flexDirection: "row",
  },
  half: {
    flex: 1,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  halfContent: {
    alignItems: "center",
    flexDirection:"row",
    gap: 2,
  },
});
