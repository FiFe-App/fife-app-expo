import { Link } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import { useState } from "react";
import { Platform, TouchableWithoutFeedback, View } from "react-native";
import { Button, Divider, Icon, Menu, Switch, TextInput, TouchableRipple } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

import { useAppTheme } from "@/assets/theme";
import ReminderStatusLine from "@/components/notifications/ReminderStatusLine";
import { ThemedText } from "@/components/ThemedText";
import { BorderRadius } from "@/constants/borderRadius";
import { emotionAvailable } from "@/constants/emotionTiming";
import { LEGAL_DOCUMENTS } from "@/constants/legal";
import { Spacing } from "@/constants/spacing";
import { useLogout } from "@/hooks/useLogout";
import { useNotificationPrefs } from "@/hooks/useNotificationPrefs";
import { authenticateOwner, deviceLockAvailable } from "@/lib/appLock";
import { setAppLockEnabled } from "@/redux/reducers/appReducer";
import { showDialog } from "@/redux/reducers/infoReducer";
import { setThemePreference } from "@/redux/reducers/userReducer";
import { RootState } from "@/redux/store";

const rowStyle = { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: Spacing.md } as const;

/**
 * The Én side's settings: what belongs to this phone and to the user's own
 * habits — the evening question, push notifications, the app-zár, the theme —
 * plus the legal documents and signing out. Everything tied to the community
 * account lives on Profil › Beállítások (components/user/edit/BeallitasokTab).
 */
export default function EnSettings() {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const signOut = useLogout();
  const themePreference = useSelector((state: RootState) => state.user.themePreference);
  const appLockEnabled = useSelector((state: RootState) => !!state.app.appLockEnabled);
  const { prefs, setPref } = useNotificationPrefs();
  const [appLockBusy, setAppLockBusy] = useState(false);
  const [themeMenuVisible, setThemeMenuVisible] = useState(false);
  const native = Platform.OS !== "web";

  // Both ways need the owner to prove it: switching on checks the lock really
  // opens on this phone, switching off stops somebody else from just doing so.
  const toggleAppLock = async (next: boolean) => {
    if (appLockBusy) return;
    setAppLockBusy(true);
    try {
      if (next && !(await deviceLockAvailable())) {
        dispatch(showDialog({
          title: "Nincs képernyőzár a telefonodon",
          text: "Az app-zárhoz előbb állíts be ujjlenyomatot, arcfelismerést vagy PIN-kódot a telefonod beállításaiban.",
          submitText: "Rendben",
          onSubmit: () => {},
        }));
        return;
      }
      const ok = await authenticateOwner(next ? "App-zár bekapcsolása" : "App-zár kikapcsolása");
      if (ok) dispatch(setAppLockEnabled(next));
    } finally {
      setAppLockBusy(false);
    }
  };

  const themeLabel =
    themePreference === "auto" ? "Automatikus" : themePreference === "dark" ? "Sötét" : "Világos";

  return (
    <View>
      <View style={{ paddingVertical: Spacing.lg, gap: Spacing.md }}>
        <ThemedText variant="bodyLarge" type="bold">Szokások és védelem</ThemedText>

        {emotionAvailable && native && (
          <View style={rowStyle}>
            <View style={{ flex: 1 }}>
              <ThemedText>Hangulatnapló esti kérdés</ThemedText>
              <ThemedText type="label">Minden este megkérdezem, milyen napod volt, és naptárban követheted a hangulatodat.</ThemedText>
            </View>
            <Switch
              accessibilityLabel="Hangulatnapló esti kérdés"
              value={prefs.emotionDailyPrompt}
              onValueChange={(v) => { setPref("emotionDailyPrompt", v); }}
            />
          </View>
        )}
        {/* Only while it is supposed to be on: the switch saying "on" and the
            phone staying quiet is the whole problem this line exists for. */}
        {emotionAvailable && native && prefs.emotionDailyPrompt && <ReminderStatusLine />}

        {native && (
          <View style={rowStyle}>
            <View style={{ flex: 1 }}>
              <ThemedText>Push értesítések</ThemedText>
              <ThemedText type="label">Ajánlások, kommentek és üzenetek a telefonodon</ThemedText>
            </View>
            <Switch
              accessibilityLabel="Push értesítések"
              value={prefs.notifyPush}
              onValueChange={(v) => { setPref("notifyPush", v); }}
            />
          </View>
        )}

        {native && (
          <View style={rowStyle}>
            <View style={{ flex: 1 }}>
              <ThemedText>App-zár</ThemedText>
              <ThemedText type="label">Ujjlenyomat, arc vagy PIN az Én módba lépéskor — a Mi mód (üzenetek, keresés) zár nélkül használható. Ez a beállítás csak ezen a telefonon él.</ThemedText>
            </View>
            <Switch
              accessibilityLabel="App-zár"
              value={appLockEnabled}
              disabled={appLockBusy}
              onValueChange={toggleAppLock}
            />
          </View>
        )}

        <Menu
          visible={themeMenuVisible}
          onDismiss={() => setThemeMenuVisible(false)}
          anchor={
            <TouchableWithoutFeedback
              onPress={() => setThemeMenuVisible(true)}
              accessible
              accessibilityLabel="Téma kiválasztása"
            >
              <View>
                <TextInput
                  mode="outlined"
                  label="Téma"
                  value={themeLabel}
                  right={<TextInput.Icon icon="chevron-down" />}
                  editable={false}
                  pointerEvents="none"
                />
              </View>
            </TouchableWithoutFeedback>
          }
        >
          {(["auto", "light", "dark"] as const).map((value) => (
            <Menu.Item
              key={value}
              onPress={() => {
                dispatch(setThemePreference(value));
                setThemeMenuVisible(false);
              }}
              title={value === "auto" ? "Automatikus" : value === "dark" ? "Sötét" : "Világos"}
              leadingIcon={themePreference === value ? "check" : undefined}
            />
          ))}
        </Menu>
      </View>


      <Divider />
      <View style={{ paddingVertical: Spacing.lg, gap: Spacing.md }}>
        <Link href="/user/edit?tab=beallitasok" asChild>
          <TouchableRipple
            accessibilityRole="link"
            style={{ borderRadius: BorderRadius.lg, backgroundColor: theme.colors.tertiaryContainer }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md, padding: Spacing.lg }}>
              <View style={{ flex: 1 }}>
                <ThemedText type="defaultSemiBold">Profilod, e-mail és közösségi beállítások</ThemedText>
                <ThemedText type="label">a Mi oldalon</ThemedText>
              </View>
              <Icon source="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
            </View>
          </TouchableRipple>
        </Link>
        <Button mode="outlined" icon="exit-run" onPress={signOut}>
          Kijelentkezés
        </Button>
      </View>
      
      <Divider />
      <View style={{ paddingVertical: Spacing.lg, gap: Spacing.xs }}>
        <ThemedText variant="bodyLarge" type="bold">Jogi dokumentumok</ThemedText>
        {LEGAL_DOCUMENTS.map((document) => (
          <TouchableRipple key={document.url} onPress={() => openBrowserAsync(document.url)}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingVertical: Spacing.sm }}>
              <ThemedText style={{ flex: 1 }}>{document.label}</ThemedText>
              <Icon source="open-in-new" size={16} color={theme.colors.onSurfaceVariant} />
            </View>
          </TouchableRipple>
        ))}
      </View>
    </View>
  );
}
