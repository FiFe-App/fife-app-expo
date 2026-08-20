import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") return true;

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
