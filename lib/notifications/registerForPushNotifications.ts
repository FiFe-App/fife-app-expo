import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // shouldShowAlert is deprecated and split in two; together they are what it
    // used to mean — a heads-up banner plus an entry in the notification list.
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Whether the OS grant is already in place, without prompting for it.
 *
 * Asking belongs to the moment the user turns a preference on, not to every app
 * start — so anything that only needs to know (scheduling the daily reminder)
 * asks this rather than ensureNotificationPermission.
 */
export async function hasNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}

/**
 * Ask for the OS notification permission, if it isn't granted already.
 *
 * One grant covers both remote push and locally scheduled notifications
 * (the daily emotion reminder), so this is separate from token
 * registration: the reminder needs the permission but no Expo token.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  if (!Device.isDevice) {
    console.log("Notifications require a physical device");
    return false;
  }

  if (await hasNotificationPermission()) return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  const granted = await ensureNotificationPermission();
  if (!granted) return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId,
  });
  return tokenData.data;
}
