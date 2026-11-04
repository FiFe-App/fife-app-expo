/**
 * Asking for the OS notification grant on a device that has never been asked —
 * a user signing in on a new phone with the evening reminder already on.
 */
jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  setNotificationHandler: jest.fn(),
}));
jest.mock("expo-device", () => ({ isDevice: true }));

import * as Notifications from "expo-notifications";

import { requestNotificationPermissionIfUnasked } from "@/lib/notifications/registerForPushNotifications";

const current = Notifications.getPermissionsAsync as jest.Mock;
const request = Notifications.requestPermissionsAsync as jest.Mock;

beforeEach(() => jest.clearAllMocks());

it("prompts on a device that has never been asked", async () => {
  current.mockResolvedValue({ status: "undetermined" });
  await requestNotificationPermissionIfUnasked();
  expect(request).toHaveBeenCalledTimes(1);
});

it("does not prompt again once the user said no", async () => {
  current.mockResolvedValue({ status: "denied" });
  await requestNotificationPermissionIfUnasked();
  expect(request).not.toHaveBeenCalled();
});

it("does not prompt when the grant is already there", async () => {
  current.mockResolvedValue({ status: "granted" });
  await requestNotificationPermissionIfUnasked();
  expect(request).not.toHaveBeenCalled();
});
