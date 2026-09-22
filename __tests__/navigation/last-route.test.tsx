/**
 * Coming back to the screen you were on.
 *
 * Android reclaims a backgrounded app whenever it needs the memory, so what
 * looks like switching back from the camera is a cold start: splash, then the
 * beginning of the app. The kill cannot be prevented; landing back where the
 * user was is what makes it not matter.
 */
import { act } from "@testing-library/react-native";
import { Platform } from "react-native";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));

import {
  isFreshEnough,
  isRestorablePath,
  useLastRoute,
} from "@/hooks/useLastRoute";
import { setLastRoute } from "@/redux/reducers/appReducer";
import { login } from "@/redux/reducers/userReducer";
import {
  __resetRouter,
  __setPathname,
  router,
} from "@/test-utils/mocks/expo-router";
import {
  createTestStore,
  renderHookWithProviders,
} from "@/test-utils/renderWithProviders";

const setPlatform = (os: "ios" | "web") =>
  Object.defineProperty(Platform, "OS", { value: os, configurable: true });
const originalOS = Platform.OS;

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60 * 1000).toISOString();

/** Signed in, and last seen on `path` at `at`. */
const storeLastOn = (path: string, at = minutesAgo(5)) => {
  const store = createTestStore();
  store.dispatch(login("me"));
  store.dispatch(setLastRoute({ path, at }));
  return store;
};

beforeEach(() => {
  __resetRouter();
  setPlatform("ios");
  __setPathname("/");
});

afterAll(() => {
  Object.defineProperty(Platform, "OS", { value: originalOS, configurable: true });
});

describe("isRestorablePath", () => {
  it("accepts the places a user is actually reading", () => {
    expect(isRestorablePath("/chats")).toBe(true);
    expect(isRestorablePath("/biznisz/12")).toBe(true);
    expect(isRestorablePath("/biznisz/new")).toBe(true);
    expect(isRestorablePath("/user/abc")).toBe(true);
  });

  it("refuses the steps of signing in and registering", () => {
    // Dropping somebody back into the middle of one of these strands them.
    expect(isRestorablePath("/")).toBe(false);
    expect(isRestorablePath("/login")).toBe(false);
    expect(isRestorablePath("/csatlakozom/iranyelvek")).toBe(false);
    expect(isRestorablePath("/user/password-reset")).toBe(false);
    expect(isRestorablePath("/meghivo/abc")).toBe(false);
  });
});

describe("isFreshEnough", () => {
  it("counts an interrupted session, not last week's", () => {
    expect(isFreshEnough(minutesAgo(10))).toBe(true);
    expect(isFreshEnough(minutesAgo(60 * 25))).toBe(false);
    expect(isFreshEnough("not a date")).toBe(false);
  });
});

describe("useLastRoute", () => {
  it("goes back to the screen the app was killed on", async () => {
    await renderHookWithProviders(() => useLastRoute(), {
      store: storeLastOn("/chats"),
    });

    expect(router.replace).toHaveBeenCalledWith("/chats");
  });

  it("leaves a deep link alone", async () => {
    // The app was opened *on* a screen — a shared biznisz, a notification —
    // and that is where the user means to be.
    __setPathname("/biznisz/12");

    await renderHookWithProviders(() => useLastRoute(), {
      store: storeLastOn("/chats"),
    });

    expect(router.replace).not.toHaveBeenCalled();
  });

  it("starts fresh after a day away", async () => {
    await renderHookWithProviders(() => useLastRoute(), {
      store: storeLastOn("/chats", minutesAgo(60 * 30)),
    });

    expect(router.replace).not.toHaveBeenCalled();
  });

  it("does nothing for a signed-out visitor", async () => {
    const store = createTestStore();
    store.dispatch(setLastRoute({ path: "/chats", at: minutesAgo(5) }));

    await renderHookWithProviders(() => useLastRoute(), { store });

    expect(router.replace).not.toHaveBeenCalled();
  });

  it("leaves the web alone, where the address bar is the truth", async () => {
    setPlatform("web");

    await renderHookWithProviders(() => useLastRoute(), {
      store: storeLastOn("/chats"),
    });

    expect(router.replace).not.toHaveBeenCalled();
  });

  it("records where the user goes", async () => {
    __setPathname("/biznisz/12");
    const store = createTestStore();
    store.dispatch(login("me"));

    await renderHookWithProviders(() => useLastRoute(), { store });

    expect(store.getState().app.lastRoute?.path).toBe("/biznisz/12");
  });

  it("does not record the login screen over a real one", async () => {
    __setPathname("/login");
    const store = storeLastOn("/chats");

    await renderHookWithProviders(() => useLastRoute(), { store });
    await act(async () => {});

    expect(store.getState().app.lastRoute?.path).toBe("/chats");
  });
});
