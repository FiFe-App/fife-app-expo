import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

/**
 * Whether this device can lock the app at all: a native build on a phone that
 * has a screen lock (fingerprint, face, or just a PIN / pattern) set up. The
 * web has nothing to unlock with, so the app-zár does not exist there.
 */
export const deviceLockAvailable = async (): Promise<boolean> => {
  if (Platform.OS === "web") return false;
  try {
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    return level !== LocalAuthentication.SecurityLevel.NONE;
  } catch {
    return false;
  }
};

/**
 * Asks the OS to confirm it is the owner. Biometrics first; the phone's own
 * PIN / pattern / password is always offered as the fallback, so a phone with
 * no fingerprint enrolled still works ("ujjlenyomat vagy PIN").
 */
export const authenticateOwner = async (promptMessage: string): Promise<boolean> => {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: "Mégse",
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
};
