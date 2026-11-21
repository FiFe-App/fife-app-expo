import { useAppTheme } from "@/assets/theme";
import MapSelector from "@/components/MapSelector/MapSelector";
import style from "@/components/styles";
import { ThemedView } from "@/components/ThemedView";
import {
  AI_ENHANCE_DESCRIPTION,
  AI_ENHANCE_ICON,
} from "@/constants/aiEnhance";
import { BorderRadius } from "@/constants/borderRadius";
import { useNotificationPrefs } from "@/hooks/useNotificationPrefs";
import { RootState } from "@/redux/store";
import { CircleType } from "@/redux/store.type";
import { useState } from "react";
import { View } from "react-native";
import { List, Modal, Portal, Switch } from "react-native-paper";
import { useSelector } from "react-redux";

interface BuzinessFilterModalProps {
  visible: boolean;
  onDismiss: () => void;
  /** The user confirmed the place (or cleared it) and the free-only switch. */
  onApply: (searchCircle: CircleType | undefined, ingyen: boolean) => void;
}

/**
 * "Finomítás" for bizniszek: where to look and free-only. Used by the biznisz results page and
 * by the search screen, so both refine the same search parameters.
 */
export const BuzinessFilterModal = ({ visible, onDismiss, onApply }: BuzinessFilterModalProps) => {
  const theme = useAppTheme();
  const searchParams = useSelector((state: RootState) => state.buziness.searchParams);
  const searchCircle = searchParams?.searchCircle;
  const [ingyenLocal, setIngyenLocal] = useState(searchParams?.ingyen || false);
  const { prefs, setPref, hydrated: prefsHydrated } = useNotificationPrefs();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        style={{ alignItems: "center" }}
        contentContainerStyle={[{ width: "90%", height: "90%", borderRadius: BorderRadius.md }]}
      >
        <ThemedView style={style.containerStyle}>
          <MapSelector
            data={searchCircle}
            setData={(sC) => {
              const newCircle = sC && "location" in sC && "radius" in sC ? sC : undefined;
              onApply(newCircle, ingyenLocal);
            }}
            markerOnly
            searchEnabled
            setOpen={(open) => {
              if (!open) onDismiss();
            }}
          >
            {/* MapSelector renders a single child, so both rows live in one wrapper. */}
            <View>
              <List.Item
                title="Csak ingyenes bizniszek"
                description="Ingyenes vagy önkéntes bizniszeket mutass"
                titleStyle={{ fontFamily: "Piazzolla-ExtraBold" }}
                left={(props) => <List.Icon {...props} color={theme.colors.primary} icon="charity" />}
                right={() => (
                  <Switch
                    color={theme.colors.nature}
                    value={ingyenLocal}
                    onValueChange={setIngyenLocal}
                  />
                )}
              />
              {/* Unlike the filter above, this one is not part of the search parameters: it is
                  the global user_settings.ai_enhance flag, written straight away and read
                  server-side by the search function. It takes effect on the next search. */}
              <List.Item
                title={"AI Keresés"}
                description={`${AI_ENHANCE_DESCRIPTION}`}
                descriptionNumberOfLines={4}
                titleStyle={{ fontFamily: "Piazzolla-ExtraBold" }}
                left={(props) => <List.Icon {...props} color={theme.colors.primary} icon={AI_ENHANCE_ICON} />}
                right={() => (
                  <Switch
                    value={prefs.aiEnhance}
                    disabled={!prefsHydrated}
                    onValueChange={(v) => {
                      setPref("aiEnhance", v);
                    }}
                  />
                )}
              />
            </View>
          </MapSelector>
        </ThemedView>
      </Modal>
    </Portal>
  );
};

export default BuzinessFilterModal;
