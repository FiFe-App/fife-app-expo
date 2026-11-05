import { useCallback, useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { Button } from "react-native-paper";
import { useDispatch } from "react-redux";

import { ThemedText } from "@/components/ThemedText";
import { Spacing } from "@/constants/spacing";
import {
  getReminderDiagnostics,
  sendReminderTestNotification,
  type ReminderDiagnostics,
} from "@/lib/notifications/scheduleDailyEmotionReminder";
import { addSnack } from "@/redux/reducers/infoReducer";

/**
 * What is really going on with the evening reminder, under its own switch.
 *
 * "The switch is on and nothing arrives" has several causes that look identical
 * from the outside: the OS permission was never granted or was revoked, the
 * user muted this one notification channel by hand, the phone dropped the
 * alarm. None of them are visible to the person they are happening to, and none
 * of them can be told apart from a bug report either — hence the test button,
 * which answers in ten seconds whether a local notification reaches this phone
 * at all.
 */
const formatTime = (date: Date) =>
  `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;

export default function ReminderStatusLine() {
  const dispatch = useDispatch();
  const [state, setState] = useState<ReminderDiagnostics | null>(null);
  const [testing, setTesting] = useState(false);

  const refresh = useCallback(() => {
    getReminderDiagnostics()
      .then(setState)
      .catch(() => setState(null));
  }, []);

  useEffect(refresh, [refresh]);

  if (Platform.OS === "web" || !state) return null;

  const problem = !state.permissionGranted
    ? "Az értesítések le vannak tiltva a telefon beállításaiban, így az emlékeztető nem tud megérkezni."
    : state.channelMuted
      ? "Ennek az értesítésnek a csatornája ki van kapcsolva a telefon beállításaiban."
      : !state.scheduled
        ? "Az emlékeztető most nincs beütemezve. Nyisd meg újra az appot, vagy kapcsold ki-be a fenti gombot."
        : null;

  const handleTest = async () => {
    setTesting(true);
    const result = await sendReminderTestNotification();
    setTesting(false);
    refresh();
    dispatch(
      addSnack({
        title:
          result === "scheduled"
            ? "10 másodperc múlva küldünk egy teszt értesítést."
            : result === "no-permission"
              ? "Nem sikerült: az értesítések le vannak tiltva a telefonodon."
              : "Nem sikerült elküldeni a teszt értesítést.",
      }),
    );
  };

  return (
    <View style={{ gap: Spacing.xs, paddingLeft: Spacing.xs }}>
      <ThemedText type="label">
        {problem ??
          `Beütemezve, a következő kérdés ${formatTime(state.nextAt)} körül érkezik.`}
      </ThemedText>
      <View style={{ flexDirection: "row" }}>
        <Button
          mode="text"
          compact
          loading={testing}
          disabled={testing}
          onPress={handleTest}
        >
          Teszt értesítés
        </Button>
      </View>
    </View>
  );
}
