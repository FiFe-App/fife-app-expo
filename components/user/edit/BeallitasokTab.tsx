import { ThemedText } from "@/components/ThemedText";
import {
  AI_ENHANCE_DESCRIPTION,
  AI_ENHANCE_LABEL,
} from "@/constants/aiEnhance";
import { useNotificationPrefs } from "@/hooks/useNotificationPrefs";
import { addSnack } from "@/redux/reducers/infoReducer";
import { clearBuziness, clearBuzinessSearchParams } from "@/redux/reducers/buzinessReducer";
import { clearDrafts } from "@/redux/reducers/chatReducer";
import { clearEmotionLogs } from "@/redux/reducers/emotionLogsReducer";
import { clearTutorialState } from "@/redux/reducers/tutorialReducer";
import { logout, setThemePreference } from "@/redux/reducers/userReducer";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/store.type";
import { supabase } from "@/lib/supabase/supabase";
import { router } from "expo-router";
import { useState } from "react";
import { Platform, TouchableWithoutFeedback, View, Text } from "react-native";
import {
  Button,
  Dialog,
  Divider,
  HelperText,
  Menu,
  Portal,
  Switch,
  TextInput,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { Spacing } from "@/constants/spacing";
import { useAppTheme } from "@/assets/theme";
import { emotionAvailable } from "@/constants/emotionTiming";

export default function BeallitasokTab() {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const { userData, themePreference }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  const { prefs, setPref, hydrated: prefsHydrated } = useNotificationPrefs();

  const [themeMenuVisible, setThemeMenuVisible] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteProfile = () => {
    setConfirmEmail("");
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);

      const expected = (userData?.email || "").trim().toLowerCase();
      const entered = confirmEmail.trim().toLowerCase();
      if (!expected || entered !== expected) {
        setDeleteLoading(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        console.error("No active session");
        setDeleteLoading(false);
        dispatch(
          addSnack({ title: "Nincs aktív bejelentkezés. Kérlek jelentkezz be újra." })
        );
        return;
      }

      const { data, error } = await supabase.functions.invoke("delete-user", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Error deleting user:", error);
        setDeleteLoading(false);
        dispatch(
          addSnack({ title: "Hiba történt a profil törlése során. Kérlek próbáld újra később." })
        );
        return;
      }

      console.log("User deleted successfully", data);
      setShowDeleteDialog(false);

      await supabase.auth.signOut();
      dispatch(logout());
      dispatch(clearBuziness());
      dispatch(clearTutorialState());
      dispatch(clearBuzinessSearchParams());
      dispatch(clearEmotionLogs());
      dispatch(clearDrafts());
      router.navigate("/user/deleted-account");
    } catch (error) {
      console.error("Unexpected error:", error);
      dispatch(addSnack({ title: "Váratlan hiba történt. Kérlek próbáld újra később." }));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <View>
      <View style={{ padding: Spacing.sm }}>
        <Menu
          visible={themeMenuVisible}
          onDismiss={() => setThemeMenuVisible(false)}
          anchor={
            <TouchableWithoutFeedback
              onPress={() => setThemeMenuVisible(true)}
              accessible={true}
              accessibilityLabel="Téma kiválasztása"
            >
              <View>
                <TextInput
                  mode="outlined"
                  label="Téma"
                  value={
                    themePreference === "auto"
                      ? "Automatikus"
                      : themePreference === "dark"
                        ? "Sötét"
                        : "Világos"
                  }
                  right={<TextInput.Icon icon="chevron-down" />}
                  editable={false}
                  pointerEvents="none"
                />
              </View>
            </TouchableWithoutFeedback>
          }
        >
          <Menu.Item
            onPress={() => {
              dispatch(setThemePreference("auto"));
              setThemeMenuVisible(false);
            }}
            title="Automatikus"
            leadingIcon={themePreference === "auto" ? "check" : undefined}
          />
          <Menu.Item
            onPress={() => {
              dispatch(setThemePreference("light"));
              setThemeMenuVisible(false);
            }}
            title="Világos"
            leadingIcon={themePreference === "light" ? "check" : undefined}
          />
          <Menu.Item
            onPress={() => {
              dispatch(setThemePreference("dark"));
              setThemeMenuVisible(false);
            }}
            title="Sötét"
            leadingIcon={themePreference === "dark" ? "check" : undefined}
          />
        </Menu>
      </View>
      <Divider />
      <View style={{ paddingVertical: Spacing.lg, gap: Spacing.md }}>
        <ThemedText variant="bodyLarge" type="bold">Értesítések</ThemedText>

        {emotionAvailable && Platform.OS !== "web" && (
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <ThemedText>Hangulatnapló</ThemedText>
              <ThemedText type="label">Minden este megkérdezem, milyen napod volt és naptárban követheted a jegyzeteidet, hangulatodat.</ThemedText>
            </View>
            <Switch
              value={prefs.emotionDailyPrompt}
              onValueChange={(v) => { setPref("emotionDailyPrompt", v); }}
            />
          </View>
        )}
        <Divider />
        {Platform.OS !== "web" && (
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <ThemedText>Push értesítések</ThemedText>
              <ThemedText type="label">Ajánlások, kommentek és üzenetek a telefonodon</ThemedText>
            </View>
            <Switch
              value={prefs.notifyPush}
              onValueChange={(v) => { setPref("notifyPush", v); }}
            />
          </View>
        )}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <ThemedText>Email értesítések</ThemedText>
            <ThemedText type="label">Ajánlások, kommentek és üzenetek {userData?.email} címedre</ThemedText>
          </View>
          <Switch
            value={prefs.notifyEmail}
            onValueChange={(v) => { setPref("notifyEmail", v); }}
          />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <ThemedText>Kérek hírlevelet</ThemedText>
            <ThemedText type="label">Újdonságok és tippek emailben</ThemedText>
          </View>
          <Switch
            value={prefs.newsletter}
            onValueChange={(v) => { setPref("newsletter", v); }}
          />
        </View>
      </View>
      <Divider />
      <View style={{ paddingVertical: Spacing.lg, gap: Spacing.md }}>
        <ThemedText variant="bodyLarge" type="bold">Mesterséges intelligencia</ThemedText>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <ThemedText>{AI_ENHANCE_LABEL}</ThemedText>
            <ThemedText type="label">{AI_ENHANCE_DESCRIPTION}</ThemedText>
          </View>
          <Switch
            value={prefs.aiEnhance}
            disabled={!prefsHydrated}
            onValueChange={(v) => { setPref("aiEnhance", v); }}
          />
        </View>
      </View>
      <Divider style={{ marginTop: 16, marginBottom: 16 }} />
      <View style={{ gap: 8, paddingBottom: 32 }}>
        <ThemedText variant="bodyLarge" type="bold">Veszélyes szekció</ThemedText>
        <HelperText type="error">
          A profil törlése végleges és nem visszavonható.
        </HelperText>
        <Button
          mode="outlined"
          icon="delete"
          textColor={theme.colors.error}
          style={{ borderColor: theme.colors.error }}
          onPress={handleDeleteProfile}
        >
          Profil végleges törlése
        </Button>
      </View>
      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Profil végleges törlése</Dialog.Title>
          <Dialog.Content>
            <ThemedText>
              Biztosan törölni szeretnéd a profilodat? Ez a művelet nem visszavonható.
            </ThemedText>
            <View style={{ height: 8 }} />
            <ThemedText>
              A megerősítéshez írd be az alábbi email címet: <Text style={{ fontWeight: "bold" }}>{userData?.email}</Text>
            </ThemedText>
            <View style={{ height: 8 }} />
            <TextInput
              label="Email"
              value={confirmEmail}
              onChangeText={setConfirmEmail}
              autoCapitalize="none"
              mode="outlined"
              autoCorrect={false}
              keyboardType="email-address"
              disabled={deleteLoading}
            />
            {confirmEmail.length > 0 &&
              confirmEmail.trim().toLowerCase() !== (userData?.email || "").trim().toLowerCase() && (
              <HelperText type="error">Nem egyezik az email címmel.</HelperText>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)} disabled={deleteLoading}>
              Mégse
            </Button>
            <Button
              mode="contained"
              style={{ paddingHorizontal: Spacing.sm }}
              buttonColor={theme.colors.error}
              textColor={theme.colors.onError}
              onPress={confirmDelete}
              disabled={
                deleteLoading ||
                !userData?.email ||
                confirmEmail.trim().toLowerCase() !== (userData?.email || "").trim().toLowerCase()
              }
              icon="delete"
              loading={deleteLoading}
            >
              Törlés
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
