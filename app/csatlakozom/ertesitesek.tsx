import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { setNotificationPrefs } from "@/redux/reducers/userReducer";
import { RootState } from "@/redux/store";
import { Platform, View } from "react-native";
import { Icon, Switch } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

export default function Ertesitesek() {
  const dispatch = useDispatch();
  const prefs = useSelector(
    (state: RootState) => state.user.notificationPrefs,
  ) ?? { notifyPush: false, notifyEmail: false, newsletter: false };

  return (
    <ThemedView style={{ flex: 1, padding: 8, paddingTop: 36 }}>
      <View style={{ justifyContent: "center" }}>
        <ThemedText type="title" style={{ marginBottom: 16 }}>
          Értesítések
        </ThemedText>
        <ThemedText type="subtitle" style={{ marginBottom: 24 }}>
          Szólunk, ha valaki ajánlja a bizniszedet, megbízhatónak jelöl, vagy
          kommentet ír. Te döntöd el, hogyan értesülj róla!
        </ThemedText>
      </View>
      <View style={{ gap: 20 }}>
        {Platform.OS !== "web" && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Icon source="bell-ring" size={24} />
              <View style={{ flex: 1 }}>
                <ThemedText>Push értesítések</ThemedText>
                <ThemedText type="label">
                  Értesítések a telefonodon
                </ThemedText>
              </View>
            </View>
            <Switch
              value={prefs.notifyPush}
              onValueChange={(v) => {
                dispatch(
                  setNotificationPrefs({ ...prefs, notifyPush: v }),
                );
              }}
            />
          </View>
        )}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Icon source="email-outline" size={24} />
            <View style={{ flex: 1 }}>
              <ThemedText>Email értesítések</ThemedText>
              <ThemedText type="label">
                Értesítések emailben
              </ThemedText>
            </View>
          </View>
          <Switch
            value={prefs.notifyEmail}
            onValueChange={(v) => {
              dispatch(
                setNotificationPrefs({ ...prefs, notifyEmail: v }),
              );
            }}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Icon source="newspaper-variant-outline" size={24} />
            <View style={{ flex: 1 }}>
              <ThemedText>Kérek hírlevelet</ThemedText>
              <ThemedText type="label">
                Újdonságok és tippek emailben
              </ThemedText>
            </View>
          </View>
          <Switch
            value={prefs.newsletter}
            onValueChange={(v) => {
              dispatch(
                setNotificationPrefs({ ...prefs, newsletter: v }),
              );
            }}
          />
        </View>
      </View>
    </ThemedView>
  );
}
